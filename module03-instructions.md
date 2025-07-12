![Lab Banner](./.assets/images/application-development-banner.png)

# Lab 3: Securing Tokens

[**Table of Contents**](./appdev-workspace.md)

## Dependencies

* This lab uses the same *certificates/localhost-cert-key.pem* and
*certificates/localhost-cert.pem* files
from Module 02 to serve https from the backend API.

## Synopsis

Access tokens are *bearer tokens*, which means that without any additional constraints any application
which obtains a token may use it to gain the token privileges at the API.
There are some ways to mitigate this outside of the protocols, including limiting API access to particular
internal network addresses where applications are running.
In this lab the effort addresses making sure only a properly authenticated application can exchange
authorization codes for tokens, improving security over client secrets with private key JWT, and
exploring how a single-page application (SPA) or a native application can be integrated while
maintaining a high level of security.

## A word... Proof Key for Code Exchange (PKCE)

PKCE is a mechanism designed to ensure that the single-page or native applications that asks for
a token is the same application that receives the token.
This is accomplished by sending a hashed, random value (the *code challenge* or "h")
with the request, and then the original value used to create the challenge
(the *code verifier* or "v") when the tokens are retrieved.
In the authorization server if a new hash of the code verifier matches the code challenge (already hashed)
from the original request, it must be the same application because it passed the real code verifier.

For native applications this is fairly secure.
They use an embedded web browser to handle the authentication flow, and they do not leave memory,
so the code verifier is very difficult to compromise.
For SPAs this is not so secure; the code verifier has to be held in browser local storage while the user
goes to other pages in the flow.
Browser local storage is by definition not secure, check the Chrome and Firefox documentation!

## Backend for Frontend (BFF) architecture

Unfortunately, both native applications and SPAs are still subject to counterfeiting where a fake application
that looks legitimate tricks the user into accepting it, and then the fake obtains the access tokens.
Many times these tokens allow much more access than the application needs.
For example, full data sets are often filtered by the application to display just the required data,
but the fake has access to all the data.

PKCE does not prevent this.
Neither does Demonstrating Proof-of-Possesion (DPoP), which prevents replay attacks
(trying to send a captured request a second time) by assuring that only the application issued 
the token is able to send requests.

Newer application architecture design negates the need for PKCE with Backend-for-Frontend (BFF) APIs.
The BFF is a hybrid application and API.
As a user facing application the BFF is not visible, but the user does pass through it for authentication.
On the API side a BFF acts as a proxy between a user-interface application and the actual backend APIs.
The applications never see the tokens, the BFF controls what the application can ask for,
the BFF filters data requests to just what the application needs, and counterfeit applications
are a reduced problem because they are limited to the functionality the real application has available!

## Part 1: The front-end application

The Acme single-page, front-end application is built on the Vue framework.
Vite is used on the backend as the engine for build and delivery.

The application has already been built, here is a brief tour of how it works.
Pay close attention to the service module.
In step five the application has to handle
redirecting the user to the BFF application endpoint for the user to sign on,
In step six the API requests to the BFF are authorized with a session cookie, not a token:

1. Open the "Module 03/Acme/src/main.js" file.
This JavaScript file is what kicks the application off; it loads a router component and the main "App"
component, and tells vue to render it over the Document Object Model (DOM) entity with the ID "app".
    ```js
    import App from './App.vue'
    import router from './router'

    createApp(App).use(router).mount('#app')
    ```

1. Routing in a Vue app is used to change the view the user sees.
The router watches the browser address and changes the component when the address changes
Open the "src/router/index.js" file to see the components displayed for different paths:
    ```js
    const routes = [
    { path: '/', component: Home },
    { path: '/reports', component: Reports },
    { path: '/login', component: Login },
    { path: '/logout', component: Logout },
    { path: '/userinfo', component: Userinfo }
    ]
    ```

1. The *Home* component (src/views/Home.vue) is the default view.
The component has a *\<script setup>* that executes when the component first loads.
The *\<template>* is the HTML the component will display, with Vue conditional attributes in the tags:
    ```html
    <template>
    <h1>Home Page</h1>
    <div>
        <p>Hello <span v-if="user && user.name"><a href="/userinfo">{{ user.name }}</a></span><span v-else>{{ 'Anonymous' }}</span>,</p>
    </div>
    ```

1. The interesting part is in the script.
"user" is an object with name and picture properties; when the user authenticates the name changes from *null* to their name.
user comes from the service module.
On the *Home* page if the user is authenticated, then the asynchronous *getTotals()* from the service module is used to make a call to the BFF.
As all fallback if we think the user is authenticated, but the BFF does not think the same, then we initiate an authentication flow
with the *login()* function from the service module:
    ```js
    import { getTotals, login, user } from '../services/index.js'
    var count = null
    var total = null

    if (user && user.name) {
        try {
            var totals = await getTotals()
            count = totals.count
            total = totals.total
        } catch (error) {
            if (error == 401) {
                login('/')
            }
        }
    ```

1. So the service module from *src/services/index.js* is where the fun takes place.
    ```js
    function login(postLoginRedirect) {
        // This trips you up: if the user does not successfully authenticate, they never come back to the app!
        // Also, the user always comes back to /, Login.vue will get the previous page from getPostLoginRedirect().
        localStorage.setItem('postLoginRedirect', postLoginRedirect)
        const redirectUrl = `${import.meta.env.VITE_APP_BASE_URL}/login`
        window.location.href = `${bffUrl}/acme/login?redirect_uri=${encodeURIComponent(redirectUrl)}`
    }
    ```

    *login* accepts the path for the user to return to after authentication.
    This is parked in the *localStorage* persistent storage for the SPA.
    Remember that the SPA will unload when the browser window location is changed on the last line.
    Notice the location is the */acme/login* endpoint in the BFF; yes, the BFF is an API but at the same
    time does serve some endpoints reachable by the browser.
    The *redirect_uri* query string parameter is telling the BFF where to send the user back after authentication.

    Just to make sure we follow this: the flow is the user loads the SPA, clicks the link to login, redirects
    to the BFF, the BFF redirects the user to the identity provider (IdP), and if successful the IdP sends the
    user back to the BFF, and then the BFF sends the user back to this app.

    Note: just like any web application using OAuth2 for authentication, the user comes back only when
    authentication is successful.

1. The application never sees any tokens, just the successful return if the user authenticates.
*getTotals()* calls the BFF, but no tokens are involved.
These functions in the service module depend on the *session* for authorization at the BFF, just like a regular web app:
    ```js
    async function getTotals() {
        try {
            const response = await axios.get(`${bffUrl}/expenses/totals`)
            return response.data
        } catch (error) {
            throw (error.response && error.response.status === 401) ? 401 : 500
        }
    }
    ```

    So this removes any attacks against an API access token in a public client (works on the server side too).
    Even if the session cookie is compromised, the attacker could only do what the BFF allows the application to do.
    The authentication and tokens are on the BFF side because the BFF sent the user for authentication.
    It simply remembers which session lines up with which authenticated user.

1. Right-click the "Module 03/Acme" folder and select *Open in Integrated Terminal*.

1. Run *npm* to install the dependency packages:
    ```bash
    $ run npm install
    ```

NOTE:
* The browser will not send the session cookie cross-domain between http://localhost:37500 (the Acme FM app) and http://localhost:39500 (the BFF).
* One solution is to use https.
However, while it was easy in Module 2 to get the web application to accept the certificate from the backend API, this is a much more difficult problem for the browser.
It would require a shared certificate authority for GitHub Codespace or the Docker container
running locally.
This is *why* the BFF in our development environment does not offer https!
* The chosen solution is Vite.
Vite can proxy the API requests and handle the session cookie; for this reason the VITE_BFF_URL
in the Acme .env file is set to the Acme app URL: http://localhost:37500/bff.
The Acme app apparently sends the API requests to itself, but Vite intercepts that URL and proxies it to the BFF.
Check the vite.config.js for the proxy configuration.
* In production this would be replaced with public URLs and certificates
issued by public certificate authorities.

## Part 2: The backend API

The API is located in "Module 03/API".
The API is exactly the same as it was in the previous lab; same endpoints, same permissions.

1. Right-click the "Module 03/API" folder and select *Open in Integrated Terminal*.

1. Run *npm* to install the dependency packages:
    ```bash
    $ run npm install
    ```

1. Open the "Module 03/API/.env" file.
    Most of the values have been left intact for you from the last lab.
    Copy the ISSUER and JWKS_URI values you set in "Module 02/API/.env":
    ```js
    ISSUER=""
    JWKS_URL=""
    ```

## Part 3: The Backend-for-Frontend (BFF) API

Ok, so this works almost exactly as the web application did in the previous lab!
The user lands on a page requiring login.
The application sends the user to the IdP authorization server for authentication.
On successful authentication the authorization server sends back an *authorization code*, and
the application exchanges it for the ID and access tokens.

The *express-openid-connect* and the generic *auth0* SDKs do not support *Private Key JWT*
or *DPoP*. So the BFF depends on the *openid-client* SDK which is officially sponsored by Auth0.
There is a bit more work because it is not integrated with Express, we must do that.

1. The BFF is located in "Module 03/BFF".
    Right-click the folder and select *Open in Integrated Terminal*.

1. Run *npm* to install the dependency packages:
    ```bash
    $ run npm install
    ```

1. Use *npm* to install the *openid-client* package:
    ```bash
    $ npm install openid-client
    ```

1. Most of the BFF application looks similar to the Acme web application in the previous
    lab.
    Open the "Module 03/BFF/src/server.js" file to see where we are going with this:
    ```js
    // Set up the session with an exposed memory store for the callback function.
    const sessionStore = new session.MemoryStore()
    app.use(
        session({
            cookie: {
                httpOnly: true,
                sameSite: 'lax',
                secure: false
            },
            resave: false,
            saveUninitialized: true,
            secret: process.env.SECRET,
            store: sessionStore
        })
    )

    // Set up Pug (for the landing page with instructions).
    const __filename = fileURLToPath(import.meta.url)
    const __fileDirectory = dirname(__filename)
    const __dirname = normalize(path.join(__fileDirectory, ".."))
    app.set("views", path.join(__dirname, "views"))
    app.set("view engine", "pug")

    app.use(logger("combined"))
    ```

    Just like the application in the last lab there are imports to get the modules,
    *Express* is the foundation, sessions are configured, Pug is set up for the landing page, etc.
    Three endpoints are already registered: */, /user* and */privatekey.pem*.

1. The BFF is placed between the SPA and the backend API and provides the OAuth2 authentication functionality the Acme web application
    did, so we can use the same credentials.
    Open the "Module 03/BFF/.env" to set these.
    The static values have been left configured for you, but you need to set the *ISSUER, CLIENT_ID,* and *CLIENT_SECRET*.
    The easy way is to copy the values from "Module 02/BFF/.env":
    ```
    ISSUER=""
    CLIENT_ID=""
    CLIENT_SECRET=""
    BACKEND_AUDIENCE="http://acme-fm-backend-api"
    BACKEND_SCOPE="read:totals read:reports"
    BACKEND_URL="https://localhost:38500"
    SECRET="a long, randomly-generated string stored in env"
    ```

1. The calls to *openid-client* will be made from an adapter class *TokenManager* the BFF code will use.
    Open the "Module 03/BFF/src/OpenidClientTokenManager.js" file.
    A class definition works because *opoenid-client* requires initialization and the class constructor fits that requirement.
    ```js
    class TokenManager {
        constructor(issuer, clientId, clientSecret) {
            this.init(issuer, clientId, clientSecret)
        }
    ```

1. Add an import at the top of the file to load the client object from *openid-client*,
    and the import for *jwt* to decode ID and access tokens: 
    ```js
    import * as client from 'openid-client'
    import jwt from 'jsonwebtoken'
    ```

1. *openid-client* builds a configuration from the issuer, the client ID, and the credentials.
    The *client.discovery* is asynchronous, which is why the constructor passes it through.
    Add the asynchronous *init* method to wrap that call after the constructor and store the
    configuration in the class instance:
    ```js
    async init(issuer, clientId, clientSecret) {
        this.issuerConfig = await client.discovery(new URL(issuer), clientId, clientSecret)
    }
    ```

1. In the server.js file, add an import statement with the others at the top of the file to load the class definition:
    ```js
    import TokenManager from './OpenidClientTokenManager.js'
    ```

1. Locate the *dotenv.config()* call, and immediately after it create an instance of TokenManager, passing it the values from
    the environment:
    ```js
    const tokenManager = new TokenManager(process.env.ISSUER, process.env.CLIENT_ID, process.env.CLIENT_SECRTE)
    ```

1. Near the bottom of server.js before the launch of the API locate the comment:
    ```js
    // API endpoints begin here.
    ```

1. The Acme application will pass a callback URL where the user lands after authentication.
    Do not confuse this with the callback URL the authentication server will send the user back to (the BFF is in the middle).
    Add this code to register the endpoint for the SPA to use; the SPA callback is cached in the session
    the TokenManager is used to find build the URL for the authorization server call, and then the redirection happens:
    ```js
    app.get('/acme/login', async (req, res) => {
        if (!req.query?.redirect_uri) {
            return res.status(400).send('Bad request')
        }
        req.session.redirectUri = req.query.redirect_uri
        res.redirect(tokenManager.getAuthenticationUrl(`${process.env.BASE_URL}/callback`, process.env.BACKEND_AUDIENCE, process.env.BACKEND_SCOPE))
    })
    ```

    Notes:
    * The BFF needs a redirect URI to send the user back to the Acme application after a successful authentication.
    * This uses the *getAuthenticationUrl* method in the class to build the URL the user is sent to for authentication.

1. Add the *getAuthenticationUrl* method in *OpenidClientTokenManager.js*.
    It calls *client.buildAuthorizationUrl* with the audience and the required scopes:
    ```js
    getAuthenticationUrl(callbackUrl, audience, requiredScopes) {
        const url = client.buildAuthorizationUrl(this.issuerConfig,
            {
                redirect_uri: callbackUrl,
                scope: `openid profile email offline_access ${requiredScopes}`,
                audience: audience,
                response_type: 'code'
            })
        return url
    }
    ```

    Note: this class is decoupled from the BFF application;
    the method is told where the flow returns to, the audience of the API we want a token for, and the scopes (grants or permissions) the token must provide.

1. Half-way through the authentication!
    *openid-client* does not set up Express endpoints, we have to do that.
    Add this endpoint code to the *server.js* file:
    ```js
    app.get('/callback', express.urlencoded({ extended: true }), async (req, res) => {
        if (!req.query?.code) {
            return res.status(400).send('Bad request')
        }
    })
    ```

    OAuth2 defines that the authorization code is always returned as the *code* query string parameter, so this code checks to make
    sure it is there.

1. *openid-client* will handle the token exchange, but we need to get the code to the *TokenManager*.
    The call must be asynchronous, so set up this try...catch scenario to make the call and handle any errors that may be thrown:
    ```js
    app.get('/callback', express.urlencoded({ extended: true }), async (req, res) => {
        if (!req.query?.code) {
            return res.status(400).send('Bad request')
        }
        try {
            await tokenManager.exchangeAuthorizationCode(req, req.session)
        } catch (error) {
            res.status(500).send('Internal server error')
        }
    })
    ```

1. On a successful token exchange the contract with the Acme application requires sending back the username and picture URL.
    TokenManager will offer a way to retrieve that information with the *getIdTokenDecoded* method:
    ```js
    app.get('/callback', express.urlencoded({ extended: true }), async (req, res) => {
        if (!req.query?.code) {
            return res.status(400).send('Bad request')
        }
        try {
            await tokenManager.exchangeAuthorizationCode(`${req.protocol}://${req.get('host')}/${req.originalUrl}`, req.session)
            const idToken = await tokenManager.getIdTokenDecoded(req.session)
            const redirect_uri = `${req.session.redirectUri}?name=${encodeURIComponent(idToken?.payload?.name)}&picture=${encodeURIComponent(idToken?.payload?.picture)}`
            res.redirect(redirect_uri)
        } catch (error) {
            console.error('Error during callback:', error)
            res.status(500).send('Internal server error')
        }
    })
    ```

    Remember, the callback to the SPA was cached in the session to use for this.

1. In *OpenidClientTokenManager.js* implement the method for the token exchange,
    on failure the code in server.js will handle the exception:
    ```js
        const tokenSet = await client.authorizationCodeGrant(this.issuerConfig, new URL(callbackUrl))
        session.idToken = tokenSet.id_token
        session.accessToken = tokenSet.access_token
        session.refreshToken = tokenSet.refresh_token
    }
    ```
    
    The exchange requires the original callback URL, and the session is used to cache the tokens for the user.
    Remember, potentially thousands of SPA instances could be using this BFF all at the same time and the session
    is how we keep them all separated.

1. Now for the method in *OpenidClientManager.js* that returns a decoded ID token making the claims are available.
    Add the *getIdTokenDecoded* method to the end of the TokenManager class and return a decoded token:
    ```js
    async getIdTokenDecoded(session) {
        const idToken = await this.getIdToken(session)
        return idToken ? jwt.decode(idToken, { complete: true }) : null
    }
    ```

1. *getIdTokenDecoded* depends on *getIdToken* which will pull the ID token from the session, so add this method:
    ```js
    async getIdToken(session) {
        await this.checkAndRefreshTokens(session.idToken, session)
        return session.idToken
    }
    ```

1. *openid-client* has nothing that checks tokens for expiration and refreshes them, so
    add *checkAndRefeshTokens* to handle that if the token has expired:
    ```js
    async checkAndRefreshTokens(token, session) {
        if (token) {
            const decoded = jwt.decode(token, { complete: true })
            if (Date.now() >= decoded.payload.exp * 1000) {
                const tokenSet = await client.refreshTokenGrant(this.issuerConfig, session.refreshToken)
                session.idToken = tokenSet.id_token
                session.accessToken = tokenSet.access_token
                session.refreshToken = tokenSet.refresh_token
            }
        }
    }
    ```

    All this does is decode the token, check the expiration (a UTC timestamp in milliseconds), and store refreshed tokens in the session if necessary.

1. The BFF shows the three tokens in the /user endpoint.
    *getIdToken* is already defined, add *getAccessToken* and *getRefreshToken* to the TokenManager class for the BFF to use:
    ```js
    async getAccessToken(session) {
        await this.checkAndRefreshTokens(session.accessToken, session)
        return session.accessToken
    }

    getRefreshToken(session) {
        return session.refreshToken
    }
    ```

1. The flip-side of login is logout, and it works the same as login.
    If the user is not currently logged in, then redirecting the authorization server for
    logout will fail, so the following method that builds the URI
    will return null if that happens.
    Add this method to the TokenManager, it requires an endpoint matching the *postLogoutRedirectUri* at the BFF:
    ```js
    async getLogoutUrl(postLogoutRedirectUri, session) {
        let redirectUri = null
        const id_token = await this.getIdToken(session)
        if (id_token) {
            redirectUri = client.buildEndSessionUrl(this.issuerConfig, {
                post_logout_redirect_uri: new URL(postLogoutRedirectUri),
                id_token_hint: id_token
            })
        }
        return redirectUri
    }
    ```

1. In the server.js file we need to register an endpoint the SPA can use to trigger a logout.
    In the endpoint cache the callback URL, get the redirect URL with a callback endpoint
    in the BFF named */postlogout*, and send the user to the authorization server to logout.
    The TokenManager could return null if the user is not authenticated,
    in that case we just send the user directly back to the URI provided by the front end:
    ```js
    app.get('/acme/logout', async (req, res) => {
        if (!req.query?.post_logout_redirect_uri) {
            return res.status(400).send('Bad request')
        }
        const redirectUri = await tokenManager.getLogoutUrl(req.query.post_logout_redirect_uri, req.session)
        if (redirectUri) {
            req.session.post_logout_redirect_uri = req.query.post_logout_redirect_uri
        } else {
            redirectUri = post_logout_redirect_uri
        }
        res.redirect(redirectUri)
    })
    ```

1. Register the BFF */postlogout* endpoint for the authorization server to return to.
    In the endpoint destroy the session and then redirect the user back to the SPA provided URI:
    ```js
    app.get('/postlogout', (req, res) => {
        if (!req.session.post_logout_redirect_uri) {
            return res.status(400).send('Bad request')
        }
        const post_logout_redirect_uri = req.session.post_logout_redirect_uri
        try {
            req.session.destroy((err) => {
                // Clear the session and redirect to the logout URL.
                if (err) {
                    console.error('Error destroying session:', err)
                    res.status(500).send('Internal server error')
                } else {
                    res.redirect(post_logout_redirect_uri)
                }
            })
        } catch (error) {
            console.error('Error destroying sexsion', error)
            res.status(500).send('Internal server error')
        }
    })
    ```

    There are two possibilities for failure here: an error could be thrown trying to destroy the session because it is not real, or
    the destroy method in the session could return an error.

1. We need to make a change to the application configuration at Auth0.
    In the tenant dashboard go to *Applications &rarr; Applications*, select the *ACME Financial Management* application,
    and click on settings:

    <div style="text-align: center;"><img src="./.assets/images/auth0-app-settings.png" /></div>


1. Scroll down the page and change the *Allowed Logout URLs* to the /postlogout endpoint:
    ```
    http://localhost:39500/postlogout
    ```

1. Almost there!
    While we could bypass *openid-client* with a simple call to fetch, the library supports DPoP and that indicates
    we need to stick to the library.
    Add this method to the *TokenManager* class in *OpenidClientTokenManager.js* to proxy an API call:
    ```js
    async fetchProtectedResource(session, url, method, body, headers) {
        if (!session || !session.idToken || !session.accessToken || !session.refreshToken) {
            throw 401
        }
        const fullHeaders = new Headers({ 'Content-Type': 'application/json', 'Accept': 'application/json', ...headers })
        return await client.fetchProtectedResource(this.issuerConfig, await this.getAccessToken(session), url, method, body, fullHeaders)
    }
    ```

    Check first to make sure the user is actually logged in and has an access token before invoking the API call with *fetchProtectedResource*.
    The content type and accepted data type are initially set to JSON, but the spread operator will replace that with whatever is in *headers*
    if the properties exist there.

1. Back in the BFF *server.js* there are three endpoints required or the totals, reports, and userinfo.
    */userinfo* is handled by the authorization server, not the backend API and the URL is different (the same token works):
    ```js
    app.get('/expenses/totals', async (req, res) => {
        try {
            const apiUrl = new URL(`${process.env.BACKEND_URL}/expenses/${(await tokenManager.getIdTokenDecoded(req.session))?.sub}/totals`)
            const response = await tokenManager.fetchProtectedResource(req.session, apiUrl, 'GET')
            res.status(200).set({ 'Content-Type': 'application/json'}).send(await response.text())
        }
        catch (error) {
            res.status(error == 401 ? 401 : 500).send(error == 401 ? 'Authentication required' : 'Internal server error')
        }
    })

    app.get('/expenses/reports', async (req, res) => {
        try {
            const apiUrl = new URL(`${process.env.BACKEND_URL}/expenses/${(await tokenManager.getIdTokenDecoded(req.session))?.sub}/reports`)
            const response = await tokenManager.fetchProtectedResource(req.session, apiUrl, 'GET')
            res.status(200).set({ 'Content-Type': 'application/json'}).send(await response.text())
        }
        catch (error) {
            res.status(error == 401 ? 401 : 500).send(error == 401 ? 'Authentication required' : 'Internal server error')
        }
    })

    app.get('/acme/userinfo', async (req, res) => {
        try {
            const apiUrl = new URL(`${process.env.ISSUER}userinfo`)
            const response = await tokenManager.fetchProtectedResource(req.session, apiUrl, 'GET')
            res.status(200).set({ 'Content-Type': 'application/json'}).send(await response.text())
        }
        catch (error) {
            res.status(error == 401 ? 401 : 500).send(error == 401 ? 'Authentication required' : 'Internal server error')
        }
    })
    ```

1. Make sure the work you did in *server.js* and *OpenidClientTokenManager.js* is saved.

1. In Run/Debug select the "Module 3: Launch BFF API" and start the application.
    This was to get the URL the BFF is listening at, find it on the Debug Console.
    Copy the URL.

1. Open the file "Module 03/Acme/.env" and set the VITE_BFF_URL environment variable to the BFF URL you copied.
    This will help the SPA reach the BFF.

1. Stop the BFF API application.

1. In Run/Debug select the "Module 3: Launch All" and start the three applications: Acme, BFF, and backend API.
    You can click on the top-level entries in the *Call Stack* window to check the output from each application.

1. Click the *Login* link in the SPA.
    This should redirect the browser to the BFF, and you should see a login page unless the authorization server has a session for you,
    in which case single sign-on works and you get sent back to the BFF with the authorization code.
    The BFF should handle the token exchange, and send you back to the *Home* view in the SPA, which should display the totals.

1. Check *Expenses*, and click on the username or the avatar to look at the user info from the authorization server.

1. Log out of the SPA.

1. Terminate the three applications in Run/Debug.

## Part 4: Beyond client secrets with Private Key JWT

Secrets cannot be set in a public client, and passing them repeatedly from a confidential client
increases the chances to compromise them, even through an encrypted back-channel.
Forcing the traffic through a proxy server allows a "monster-in-the-middle" attack.

*Mutual TLS* (mTLS) and *Private Key JWT* both rely on the client to encrypt a challenge with a
private key to ensure their authenticity; that way the credentials are never sent with the request!
mTLS does it when the connection is established, Private Key JWT handles it during the token exchange.

1. Right-click on the "certificates" folder at the top of the project and use "Open in integrated terminal"
to launch a terminal window in that folder.

1. Use npm to add the *jose* keymanager package:
    ```bash
    $ npm install jose
    ```

1. Run the two *openssl* commands to generate a private/public key pair in the project *certificates* folder:
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

1. At the top of the BFF *server.js* add an import statement to get the *fs* filesystem object:
    ```js
    import fs from 'fs'
    ```

1. A few lines down locate the line where the TokenManager was instantiated:
    ```js
    onst tokenManager = new TokenManager(...
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

    This is all to decouple the private key from the TokenManager, it receives it but does not
    have any concern about where to find it.

1. In the *OpenidCLientTokenManager.js* file add an import statement for *jose* with the function we need to translate PEM keys:
    ```js
    import { importPKCS8 } from 'jose'
    ```

1. Locate the initialization function, the one
    called from the constructor:
    ```js
    sync init(issuer, clientId, clientSecretOrPemKey) {...
    ```

1. The key will be passed in instead of the secret, so change the last parameter in the function declaration
    and the body to *clientSecretOrPemKey*:
    ```js
    async init(issuer, clientId, clientSecretOrPemKey) {
        this.issuerConfig = await client.discovery(new URL(issuer), clientId, clientSecretOrPemKey)
    }
    ```

1. Rewrite the body to check if the parameter is a key.
    If it is, convert it from the PEM data to the CryptoKey object that openid-client requires:
    ```js
    if (clientSecretOrPemKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
        this.issuerConfig = await client.discovery(new URL(issuer), clientId, null, await importPKCS8(clientSecretOrPemKey, 'RS256'))
    } else {
        this.issuerConfig = await client.discovery(new URL(issuer), clientId, clientSecretOrPemKey)
    }
    ```

    Note: the secret becomes *null* in the call to *discovery*, and a fourth parameter is added to pass the CryptoKey.
    This function can now support either a secret or Private Key JWT.

1. Auth0 needs to know about the private key too, or it will not accept the authentication.
    If you are on your local computer, you have the *publickey.pem* file.
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

1. Click the *Login* link in the SPA.
    This should redirect the browser to the BFF, and you should see a login page unless the authorization server has a session for you,
    in which case single sign-on works and you get sent back to the BFF with the authorization code.
    The BFF should handle the token exchange, and send you back to the *Home* view in the SPA, which should display the totals.

1. Log out of the SPA.

1. Terminate the three applications in Run/Debug.

1. Close any open terminals.

<!-- https://auth0.com/blog/oauth2-security-enhancements/ -->

<br>![Stop](./.assets/images/stop.png)
Congratulations, you have completed this lab!

When your instructor says you are ready to start the next Lab,
Close all the editor windows in the right-side panel, and then follow this
link to the lab instructions: [**Module 4 Lab**](./module04-instructions.md).

[**Table of Contents**](./appdev-workspace.md)