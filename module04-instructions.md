![Lab Banner](./.assets/images/application-development-banner.png)

# Lab 4: Management API

[**Table of Contents**](./appdev-workspace.md)

## Dependencies

* This lab uses the same *certificates/localhost-cert-key.pem* and
*certificates/localhost-cert.pem* files
from Module 02 to serve https from the backend API.
* It uses the same *certificates/privatekey.pem* and *certificates/publickey.pem* from Module 03 to
authenticate with Private Key JWT to the authorization server.

## Synopsis

There are two forms of management API access in the Auth0 tenant.
The first is a token restricted to a fixed set of limited permissions granted to the authenticated user.
This token is provided on authentication, but only if another API audience is *not* requested.
Auth0 does not allow multiple audiences to be requested simultaneously.
Because third-party cookies are virtually gone from browsers, the only way to get two access tokens is to
make two requests to the authorization server.
The browser has to visit the authorization server twice, SSO should keep the authentication to one time, but then
two callbacks have to be handled.

The second form is to make a client credentials request and get a machine-to-machine access token.
If the BFF does this, then the BFF is responsible for acting as a gateway and enforcing restrictions on what it will
allow the front-end to do in the management API.
This is more complicated, but it also allows for the management API to be used when no user is authenticated.
That functionality is exactly what is required for things like portal-side customer self-registration, etc.

The goal is the add a page to the front-end application that retrieves the full user profile from the
management API, and offers a checkbox that changes the value of the user *app_metadata.optin_mfa* property at Auth0.
*app_metadata* may not be altered with user privileges, it must be handled with an M2M client.
This page and required functionality has already been added to the Acme front-end application:

<div style="text-align: center"><img src="./.assets/images/application-profile-page.png" /></div>

## Part 1: Link the application integration to the Management API

1. In the Auth0 tenant locate the settings for the *ACME Financial Management* application:
    *Applications &rarr; Applications, Acme Financial Management, Settings*.

1. Scroll down the page and click *Advanced Settings*.
    Select *Client Credentials* if it is not already selected, and click the *Save* button at
    the bottom of the page:

    <div style="text-align: center"><img src="./.assets/images/auth0-app-client-credentials.png" /></div>

    This enables the BFF to use one client ID to both act on the user's behalf and get an access token
    for the backend API, and act on its own behalf and get an M2M client token for APIs it uses.
    In this case that will be the Auth0 Management API.

    The BFF could use a different application configuration for this hybrid scenario.
    Separating access would increase the work in the BFF to juggle separate client credentials,
    and as this is all handled in a "confidential client" in a controlled server environment
    the security gain is negligible.    

1. At the top of the page move from *Settings* to *APIs* and enable the *Auth0 Management API*:

    <div style="text-align: center"><img src="./.assets/images/auth0-app-enable-mapi.png" /></div>

    This section of the application integration is only used for APIs the application will establish
    a machine-to-machine connection with on its own behalf.
    It has no bearing on issuing access tokens to act on the user's behalf through the Authorization Code
    Grant flow.

1. Expand the *Auth0 Management API* section with the dropdown button at the right.
    The Management API has a significant number of permissions defined.
    Use the *Filter Permissions* search box to find and enable *read:users*, *update:users*, and
    *update:users_app_metadata*.
    Click the *Update* button when these are selected:

    <div style="text-align: center"><img src="./.assets/images/auth0-app-mapi-permissions.png" /></div>

## Part 2: Change the BFF to act as a machine-to-machine (M2M) application

The first change to the BFF is to add a method in TokenManager to request M2M access tokens.
The refresh process for an M2M token is different; when a token expires simply request a new one.

1. Right-click the "Module 04/BFF/src/OpenidClientTokenManager.js" file and open it to the side.

1. In this method if the token is already present and good, it is returned.
    If the token is not present, or expired, a new token will be requested and returned.
    The same method manages multiple tokens and indexes them by audience.
    Add the method to the end of the TokenManager class:
    ```js
    async getClientAccessToken(audience, scope) {
        let decoded = null
        if (this.clientAccessTokens[audience]) {
            decoded = jwt.decode(this.clientAccessTokens[audience], { complete: true })
        }
        if (!this.clientAccessTokens[audience] || Date.now() >= decoded.payload.exp * 1000) {
            const tokenSet = await client.clientCredentialsGrant(this.issuerConfig, {
                audience: audience,
                scope: scope
            })
            this.clientAccessTokens[audience] = tokenSet.access_token
        }
        return this.clientAccessTokens[audience]
    }
    ```

1. The *clientAccessTokens* property referenced by the method must be created in the constructor,
    so add this statement to the constructor:
    ```js
    this.clientAccessTokens = {}
    ```

1. Find and open the "Module 04/BFF/src/server.js" file.
    It should open on the right editor panel because that has the focus, but you can always
    drag it to that panel if it opens on the left.

1. Locate the Express registration of the error middleware:
    ```js
    app.use((err, req, res, next) => {
        res.status(err.status || 500)
        res.json({ status: err.status, message: err.message })
    })
    ```

1. Insert this function just above the error middleware registration.
    It provides the proxy between the front-end application and the management API:
    ```js
    app.get('/acme/profile', async (req, res) => {
        try {
            const managementApiToken = await tokenManager.getClientAccessToken(process.env.MANAGEMENT_API_AUDIENCE, process.env.MANAGEMENT_API_SCOPE)
            const idToken = await tokenManager.getIdTokenDecoded(req.session)
            const managementClient = new ManagementClient({ domain: process.env.DOMAIN, token: managementApiToken })
            const response = await managementClient.users.get({ id: idToken?.payload?.sub })
            res.status(200).set({ 'Content-Type': 'application/json'}).send(JSON.stringify(response.data))
        }
        catch (error) {
            res.status(error == 401 ? 401 : 500).send(error == 401 ? 'Authentication required' : 'Internal server error')
        }
    })
    ```

    First, get the token to access the management API.
    Second, get the authenticated user ID token to retrieve the *sub* claim, the user ID at Auth0.
    Third, use the Auth0 NodeJS library to create a ManagementClient instance and then use the client to ask the
    management API for the user profile and return it.

1. Right-click on "Module 04/BFF" and open a terminal window at that folder, and add the Auth0 library to the BFF:
    ```bash
    $ npm install auth0
    ```

1. In the server.js file add an import at the top to get the ManagementClient class:
    ```js
    import { ManagementClient } from 'auth0'
    ```

1. In the Run/Debug panel select the run configuration "Module 4: Launch All" and launch the three applications.

1. Locate the "CALL STACK" area in the Run/Debug Panel.

1. Click on the *vite* application and look at the *Debug Console* in the lower panel.

1. Find the line where the application prints it is started and provides the link (your link may be different).
    Follow the link to launch the Acme application in the browser:
    ```
    The Acme Financial Management application has started, use ctrl/cmd-click to follow this link: http://localhost:37500
    ```

1. Log in as the user from before.

1. Click on the *Profile* link to visit the profile page, it will display the full user profile.
    Do not click the checkbox, that has not been implemented yet!
    If you do click it, the application will have an error.

1. Log out of the Acme application.

1. Terminate all three applications in Run/Debug.

## Part 3: Modify the user app_metadata at Auth0

Now to implement changing the *app_metadata* for the user.

1. In the server.js file right after the function previously added, put this function to
    use the management API to change *app_metadata*:
    ```js
    app.put('/acme/profile/optinmfa', async (req, res) => {
        if (req.body?.optin_mfa !== true && req.body?.optin_mfa !== false) {
            return res.status(400).send('Bad request')
        }
        try {
            const managementApiToken = await tokenManager.getClientAccessToken(process.env.MANAGEMENT_API_AUDIENCE, process.env.MANAGEMENT_API_SCOPE)
            const idToken = await tokenManager.getIdTokenDecoded(req.session)
            const managementClient = new ManagementClient({ domain: process.env.DOMAIN, token: managementApiToken })
            await managementClient.users.update({ id: idToken?.payload?.sub }, { app_metadata: {optin_mfa: req.body.optin_mfa }})
            res.status(204).send()
        }
        catch (error) {
            res.status(error == 401 ? 401 : 500).send(error == 401 ? 'Authentication required' : 'Internal server error')
        }
    })
    ```

1. As above launch the "Module 4: Launch All" run configuration, locate the URL for the Acme front-end application
    and visit it.

1. Log in as the user from before.

1. Changing the checkbox will change the *app_metadata* in the profile, which may be seen as the profile refreshes.

1. Log out of the Acme application.

1. Terminate all three applications in Run/Debug.

## Part 4: A word about asynchronous timing

Everything worked up to this point, but there will be an issue if the getClientAccessToken is used at the top level of server.js
before the main thread is released.
Even though the async call in the init method in the TokenManager has long-since completed,
the issuer property will not be set until the main process thread relinquished to the JavaScript event loop.

Top-level awaits do work in server.js, so the order of things needs to be shuffled just a bit.

1. In OpenidClientTokenManager.js locate the constructor.

1. Remove the parameters, and the call to *init*:
    ```js
    constructor () {
        this.clientAccessTokens = {}
    }

1. Find the *init* methods, and replace it completely with a static *getTokenManager* method that looks like this:
    ```
    static async getTokenManager(issuer, clientId, clientSecretOrPemKey) {
        let tokenManager = new TokenManager()
        if (clientSecretOrPemKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
            tokenManager.issuerConfig = await client.discovery(new URL(issuer), clientId, null, client.PrivateKeyJwt(await importPKCS8(clientSecretOrPemKey, 'RS256')))
        } else {
            tokenManager.issuerConfig = await client.discovery(new URL(issuer), clientId, clientSecretOrPemKey)
        }
        return tokenManager
    }
    ```

1. In server.js locate the line instantiating the TokenManager:
    ```js
    const tokenManager = new TokenManager(process.env.ISSUER, process.env.CLIENT_ID, privateKey)
    ```

1. Replace that line with a blocking call to the asynchronous static *getTokenManager* method:
    ```js
    const tokenManager = await TokenManager.getTokenManager(process.env.ISSUER, process.env.CLIENT_ID, privateKey)
    ```

    The *await* makes sure the issuer has been set in the TokenManager before the program continues.
    Now if *getClientToken* is used at the top-level of the program the issuer it needs is available.


1. As above launch the "Module 4: Launch All" run configuration, locate the URL for the Acme front-end application
    and visit it.

1. Log in as a user and check that everything works.

1. Log out of the Acme application.

1. Terminate all three applications in Run/Debug.

1. Close all the open files in the right editor panel.

1. Close any open terminals.

<br>![Stop](./.assets/images/stop.png)
Congratulations, you have completed this lab!

When your instructor says you are ready to start the next Lab,
Close all the editor windows in the right-side panel, and then follow this
link to the lab instructions: [**Module 5 Lab**](./module05-instructions.md).

[**Table of Contents**](./appdev-workspace.md)