![Lab Banner](./.assets/images/application-development-banner.png)

# Lab 3: Securing Tokens

[**Table of Contents**](./appdev-workspace.md)

## Dependencies

* The Auth0 ACME Financial Management client configuration from Module 01
* The Auth0 ACME FM Backend API configuration from Module 02
* *certificates/localhost-cert-key.pem* and *certificates/localhost-cert.pem* created in Module 02
* The certificate authority file path in the .env file at the top of the project, created in Module 02
* If you relaunch this lab in a new GitHub Codespace update the callback URLs in the Auth0 client configuration

## Synopsis

This lab converts the architecture to a front-end Vue framework app that provides the user interface,
the same API from Module 02, and a backend-for-front-end (BFF) between the two.

In this architecture:
1. The BFF starts the authorization flow and receives the tokens, not the UI
1. The BFF handles the business logic instead of the UI, filtering data from the backend API
1. The UI relies on a session to contact the BFF and never has the tokens

The Acme Vue front-end is already complete.
The BFF is mostly built, it requires completion of the login flow and proxies for the backend API calls.
The API does not change from Module 02.

## Part 1: The front-end application

The Acme front-end is built on Vue, a single-page application framework that manages "routes" in the address bar, 
displays "views" when the route changes, makes a call to the BFF, and merges data with the view.
In this environment "vite" is used to build and deliver the application to the browser.

The application is already built, feel free to check it out in "Module 03/Acme".

1. Right-click the "Module 03/Acme" folder and select *Open in Integrated Terminal*.

1. Run *npm* to install the dependency packages:
    ```bash
    $ npm install
    ```

## Part 2: The backend API

The API does not change from Module 02.

1. Right-click the "Module 03/API" folder and select *Open in Integrated Terminal*.

1. Run *npm* to install the dependency packages:
    ```bash
    $ npm install
    ```

1. Open the "Module 03/API/.env" file.
    Most of the values have been left intact for you from the last lab.
    The easy way to complete this is to copy the ISSUER and JWKS_URI values you set in "Module 02/API/.env":
    ```js
    ISSUER=""
    JWKS_URL=""
    ```

    HINT: These values were assigned in the [Module 02 instructions], Part 3, steps 7-14.

1. The API also needs the *certificates/localhost-cert-key.pem* and *certificates/localhost-cert.pem* files
    that were created in Module 02.
    If you need to recreate these, look at the [Module 02 instructions](./module02-instructions.md), part 3, steps 1-6.

## Part 3: The Backend-for-Frontend (BFF) API

The goal is to use Private Key JWT with the token exchange to improve client security with a challenge
instead of a secret passing across the network.
The BFF is a hybrid application: it acts as a web application for authorization, as an API proxy for client API calls,
and as a machine-to-machine application to talk to the Auth0 Management API.

It leverages the *openid-client* NodeJS package to handle the token exchange.
The *openid-client* interface is built into a JavaScript class *TokenManager*, so multiple clients may be instantiated simultaneously.

1. The BFF is located in "Module 03/BFF".
    Right-click the folder and select *Open in Integrated Terminal*.

1. Run *npm* to install the dependency packages:
    ```bash
    $ npm install
    ```

1. Right-click the "Module 03/BFF/.env" file and open it to the side.

1. Copy the *CLIENT_ID, CLIENT_SECRET*, and *ISSUER_BASE_URL* variables from "Module 01/Acme/.env", or if Module 02 was not complete
    look to the steps in the [Module 02 instructions](./module02-instructions.md), part X, steps Y.

1. Save and close the .env file.

1. Right-click the "Module 03/BFF/src/OpenidClientTokenManager.js" file and open it to the right.

1. Locate the following code at the bottom of the file; the closing brace is the bottom of the
    *TokenManager* class:
    ```js
    }

    export default TokenManager
    ```

1. Add this method (function) to the *TokenManager* class above the closing brace:
    ```js
    async fetchProtectedResource(session, url, method, body, headers) {
        if (!session || !session.idToken || !session.accessToken || !session.refreshToken) {
            throw 401
        }
        const fullHeaders = new Headers({ 'Content-Type': 'application/json', 'Accept': 'application/json', ...headers })
        return await client.fetchProtectedResource(this.issuerConfig, await this.getAccessToken(session), new URL(url), method, body, fullHeaders)
    }
    ```

    NOTE: this method handles making a call to an API endpoint.
    It handles checking if the user has a session, and the *openid-client* implementation of *fetchProtectedResource*
    is capable of handling Demonstrating Proof of Possesion (DPoP) to protect the request from playback
    There is no button, Auth0 support has to turn on DPoP.

1. Save the file.

1. Open the "Module 03/BFF/src/server.js" file.

1. At the top add an import for the *TokenManager*:
    ```js
    import TokenManager from './OpenidClientTokenManager.js'
    ```

1. Locate the call to *dotenv.config()*:
    ```js
    dotenv.config()
    ```

1. Immediately after it call the static method *getTokenManager* in *TokenManager* class to create the
    *TokenManager* to use:
    ```js
    const tokenManager = await TokenManager.getTokenManager(process.env.ISSUER_BASE_URL, process.env.CLIENT_ID, process.env.CLIENT_SECRET)
    ```

    NOTE: This call to a static method that returns a TokenManager is used instead of *new* with the class constructor because
    the call to discover the issuer parameters is asynchronous and constructors may not be asynchronous.

1. Add the */acme/login* endpoint to the BFF:
    ```js
    app.get('/acme/login', async (req, res) => {
        if (!req.query?.redirect_uri) {
            return res.status(400).send('Bad request')
        }
        req.session.redirectUri = req.query.redirect_uri
        res.redirect(tokenManager.getAuthenticationUrl(
            `${process.env.BASE_URL}/callback`,
            process.env.BACKEND_AUDIENCE, process.env.BACKEND_SCOPE))
    })
    ```

    NOTE: The Vue application will redirect the user to this endpoint to start authorization.
    With this endpoint the BFF is acting like a web application.
    The Vue application sends a URL for the user to land back at, this function caches that until the authorization callback.
    There is a double callback: application &rarr; BFF &rarr; authorization server &rarr; BFF /acme callback &rarr; application callback.

1. A successful Authorization Code Grant callback needs to trigger a token exchange.
    Add this code below the code we just added to handle the Auth0 callback and route the code to the TokenManager method:
    ```js
    app.get('/callback', express.urlencoded({ extended: true }), async (req, res) => {
        if (!req.query?.code) {
            return res.status(400).send('Bad request')
        }
        try {
            await tokenManager.exchangeAuthorizationCode(
                `${req.protocol}://${req.get('host')}/${req.originalUrl}`,
                req.session)
            const idToken = await tokenManager.getIdTokenDecoded(req.session)
            const redirect_uri = `${req.session.redirectUri}?name=${encodeURIComponent(idToken?.payload?.name)}&picture=${encodeURIComponent(idToken?.payload?.picture)}`
            res.redirect(redirect_uri)
        } catch (error) {
            console.error('Error during callback:', error)
            res.status(500).send('Internal server error')
        }
    })
    ```

    NOTE: On the successful callback the name and picture are sent back to the Vue application as query string parameters.

1. Add the proxy endpoint between the Vue request and the API for the totals:
    ```js
    app.get('/expenses/totals', async (req, res) => {
        const idToken = await tokenManager.getIdTokenDecoded(req.session)
        const apiUrl = `${process.env.BACKEND_URL}/expenses/${idToken?.payload.sub}/totals`
        tokenManagerFetch(req, res, apiUrl)
    })
    ```

1. Add the proxy endpoint between the Vue request and the API for the expenses:
    ```js
    app.get('/expenses/reports', async (req, res) => {
        const idToken = await tokenManager.getIdTokenDecoded(req.session)
        const apiUrl = `${process.env.BACKEND_URL}/expenses/${idToken?.payload.sub}/reports`
        tokenManagerFetch(req, res, apiUrl)
    })
    ```

1. Auth0 puts two audiences in the access token, the second it to get to /userinfo.
    Add this code below the previous endpoint registration to proxy a call to the Auth0 authorization server:
    ```js
    app.get('/acme/userinfo', async (req, res) => {
        const apiUrl = `${process.env.ISSUER_BASE_URL}${process.env.ISSUER_BASE_URL.endsWith('/') ? '' : '/'}userinfo`
        tokenManagerFetch(req, res, apiUrl)
    })
    ````

1. All three endpoints depend on *tokenManagerFetch* which wraps the call to
    *fetchProtectedResource* in the *TokenManager*.
    Add this code for the function:
    ```js
    async function tokenManagerFetch(req, res, apiUrl) {
        try {
            const response = await tokenManager.fetchProtectedResource(
                req.session,
                apiUrl,
                'GET')
            res.status(200).set({ 'Content-Type': 'application/json' })
                .send(await response.text())
        }
        catch (error) {
            res.status(error == 401 ? 401 : 500)
                .send(error == 401
                ? 'Authentication required' : 'Internal server error')
        }
    }
    ```

    NOTE: There are two possibilities for failure here: an error could be thrown trying to destroy the session because it is not real, or
    the destroy method in the session could return an error.

1. Make sure the work you did in *server.js* and *OpenidClientTokenManager.js* is saved.

## Part 4: Launch the application

1. Logout is the mirror of login.
    The code is already in server.js, but the callback URL needs to be changed in the Auth0 tenant.
    In the tenant dashboard go to *Applications &rarr; Applications*, select the *ACME Financial Management* application,
    and click on settings:

    <div style="text-align: center;"><img src="./.assets/images/auth0-app-settings.png" /></div>

1. Scroll down the page and change the *Allowed Logout URLs* to the /postlogout endpoint:
    ```
    http://localhost:39500/postlogout
    ```

1. In Run/Debug select the "Module 3: Launch BFF API" and start the application.
    This is only running to get the URL the BFF is listening at, find it on the DEBUG CONSOLE.
    Copy the URL.

1. Open the file "Module 03/Acme/.env" and set the VITE_BFF_URL environment variable to the BFF URL you copied.
    This will help the SPA reach the BFF.

1. Stop the BFF API application.

1. In Run/Debug select the "Module 3: Launch All" run configuration
    and start the three applications: Acme, BFF, and backend API.
    You can click on the top-level entries in the *Call Stack* window to check the output from each application,
    or use the dropdown list at the top of the *DEBUG CONSOLE* panel to select each application.

1. Click the *Login* link in the SPA.
    This should redirect the browser to the BFF, and you should see a login page unless the authorization server has a session for you,
    in which case single sign-on works, and you get sent back to the BFF with the authorization code.
    The BFF should handle the token exchange, and send you back to the *Home* view in the SPA, which should display the totals.

1. Check *Expenses*, and click on the username or the avatar to look at the user info from the authorization server.

1. Log out of the SPA.

1. Terminate the three applications in Run/Debug.

## Part 5: Beyond client secrets with Private Key JWT

1. Right-click on the "certificates" folder at the top of the project and use "Open in integrated terminal"
to launch a terminal window in that folder.

1. Use npm to add the *jose* keymanager package:
    ```bash
    $ npm install jose
    ```

1. Run these two *openssl* commands to generate a private/public key pair in the project *certificates* folder:
    ```bash
    $ openssl genrsa -out ../../certificates/privatekey.pem 2048
    $ openssl rsa -in ../../certificates/privatekey.pem -pubout -out ../../certificates/publickey.pem
    ```

1. In the *Explorer* check the *certificates* folders at the top level of the project to make sure the files were created.

1. Open the "Module 03/BFF/.env" file.
    Add these two variables to externalize the location of the key files to the project *certificates* folder:
    ```
    PRIVATE_KEY_PATH="../../certificates/privatekey.pem"
    PUBLIC_KEY_PATH="../../certificates/publickey.pem"
    ```

1. A few lines down from the import statements locate the line where the TokenManager was instantiated:
    ```js
    const tokenManager = new TokenManager(...
    ```

1. Just before this line add a new statement to open and read the private key file:
    ```js
    const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, 'utf8')
    ```

1. On the next line change the instantiation of the TokenManager, replacing the CLIENT_SECRET
    parameter with the private key:
    ```js
    const tokenManager = new TokenManager(process.env.ISSUER, process.env.CLIENT_ID, privateKey)
    ```

    NOTE: this is all to decouple the private key from the TokenManager, it receives it but does not
    have any concern about where to find it.

1. In the *OpenidCLientTokenManager.js* file add an import statement for *jose* with the function we need to translate PEM keys:
    ```js
    import { importPKCS8 } from 'jose'
    ```

1. Locate the *getTokenManager* function that creates a new *TokenManager*:
    ```js
    async init(issuer, clientId, clientSecretOrPemKey) {...
    ```

1. The key will be passed in instead of the secret, so rename the last parameter in the function declaration
    to support either one as *clientSecretOrPemKey*:
    ```js
    async init(issuer, clientId, clientSecretOrPemKey) {
        let tokenManager = new TokenManager()
        tokenManager.issuerConfig = await client.discovery(new URL(issuer), clientId, clientSecret)
        return tokenManager
    }
    ```

1. Rewrite the *client.discovery* statement in the middle to check if the parameter is a key and handle it
    differently.
    If it is a key, convert it from the PEM data to the CryptoKey object that openid-client requires:
    ```js
    if (clientSecretOrPemKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
        this.issuerConfig = await client.discovery(new URL(issuer), clientId, null, await importPKCS8(clientSecretOrPemKey, 'RS256'))
    } else {
        this.issuerConfig = await client.discovery(new URL(issuer), clientId, clientSecretOrPemKey)
    }
    ```

    NOTE: the secret becomes *null* in the call to *discovery*, and a fourth parameter is added to pass the CryptoKey.
    This function can now support either a secret or Private Key JWT.

1. Auth0 needs to know about the private key too, or it will not accept the authentication.
    If you are on your local computer, you have the *publickey.pem* file in the project *credentials* folder.
    If you are using a GitHub Codespace:
    * Use the "Module 3; Launch BFF API" run configuration to launch the BFF.
    * On the home page click the "/publickey.pem" link to download the public key file to your local computer.
    * Stop the BFF API.

1. In the Auth0 tenant, use *Applications &rarr; Applications* to show the application configurations,
    click on the *ACME Financial Management* Application, and select the *Credentials* tab:

    <div style="text-align: center;"><img src="./.assets/images/auth0-app-credentials.png"

1. Click the *Private Key JWT* button, and in the popup credentials window select *Public Key*,
    give the name ACME Financial Management, and use the button to upload the public key file:

    <div style="text-align: center;"><img src="./.assets/images/auth0-app-credentials-add.png"

1. Set the *Expiration date* to *Never* and click the *Add Credential* button to save it.

1. In Run/Debug select the "Module 3: Launch All" and start the three applications: Acme, BFF, and backend API.
    You can click on the top-level entries in the *Call Stack* window to check the output from each application.

1. Locate the link for the Acme front-end application on the *DEBUG CONSOLE* for the *vite* application and open it.

1. Click the *Login* link.
    Everything will work as before but the Private Key JWT is used to authenticate the BFF client to Auth0.

1. Sign out of the Acme application.

1. Terminate the three applications in Run/Debug.

1. Close any editor windows in the right-hand panel.

1. Close any open terminals.

<!-- https://auth0.com/blog/oauth2-security-enhancements/ -->

<br>![Stop](./.assets/images/stop.png)
Congratulations, you have completed this lab!

When your instructor says you are ready to start the next Lab follow this
link to the lab instructions: [**Module 4 Lab**](./module04-instructions.md).

[**Table of Contents**](./appdev-workspace.md)