// app.js - Auth0 Application Development Module 02 Lab
// Backend for Frontend API
//

import { ManagementClient } from 'auth0'
import cors from 'cors'
import dotenv from "dotenv"
import express from 'express'
import session from 'express-session'
import fs from 'fs'
import logger from 'morgan'
import path, { dirname, normalize } from 'path'
import { fileURLToPath } from 'url'
import TokenManager from './OpenidClientTokenManager.js'

console.log(process.cwd())

dotenv.config()
const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, 'utf8')
const tokenManager = await TokenManager.getTokenManager(process.env.ISSUER, process.env.CLIENT_ID, privateKey)

if (!process.env.BASE_URL) {
    process.env.BASE_URL = !process.env.CODESPACE_NAME
        ? `http://localhost:${process.env.PORT}`
        : `https://${process.env.CODESPACE_NAME}-${process.env.PORT}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
}

const app = express()

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

// Allow cross-origin requests.
app.use(cors({ origin: '*', methods: 'GET', preflightContinue: false, optionsSuccessStatus: 204 }))

// Static files served from here.
app.use(express.static(path.join(__dirname, "public")))

app.get('/', (req, res) => {
    res.render("home", { protocol: req.protocol, host: req.get('host') })
})

app.get('/publickey.pem', (req, res) => {
    if (fs.existsSync(process.env.PUBLIC_KEY_PATH) === false) {
        res.status(404).send('Public key not found')
    } else {
        const publicKey = fs.readFileSync(process.env.PUBLIC_KEY_PATH, 'utf8')
        res.setHeader('Content-Type', 'application/x-pem-file')
        res.send(publicKey)
    }
})

app.get("/user", async (req, res) => {
    res.render("user", {
        name: req.query.name,
        picture: req.query.picture,
        id_token: await tokenManager.getIdToken(req.session),
        access_token: await tokenManager.getAccessToken(req.session),
        refresh_token: await tokenManager.getRefreshToken(req.session)
    })
})

// API endpoints begin here.

app.get('/acme/login', async (req, res) => {
    if (!req.query?.redirect_uri) {
        return res.status(400).send('Bad request')
    }
    // Save the redirect_uri in the session so we can return to it after authentication. It is uncessary to check redirect_uri
    // like OAuth2: if the redirect goes to another application the session here in the BFF does not line up for that application.
    req.session.redirectUri = req.query.redirect_uri
    res.redirect(tokenManager.getAuthenticationUrl(`${process.env.BASE_URL}/callback`, process.env.BACKEND_AUDIENCE, process.env.BACKEND_SCOPE))
})

app.get('/callback', express.urlencoded({ extended: true }), async (req, res) => {
    if (!req.query?.code) {
        return res.status(400).send('Bad request')
    }
    try {
        await tokenManager.exchangeAuthorizationCode(`${req.protocol}://${req.get('host')}/${req.originalUrl}`, req.session)
        const idToken = await tokenManager.getIdTokenDecoded(req.session)
        // Return the user to the app with ?name=&picture=
        const redirect_uri = `${req.session.redirectUri}?name=${encodeURIComponent(idToken?.payload?.name)}&picture=${encodeURIComponent(idToken?.payload?.picture)}`
        res.redirect(redirect_uri)
    } catch (error) {
        console.error('Error during callback:', error)
        res.status(500).send('Internal server error')
    }
})

app.get('/acme/logout', async (req, res) => {
    if (!req.query?.post_logout_redirect_uri) {
        return res.status(400).send('Bad request')
    }
    const redirectUri = await tokenManager.getLogoutUrl(`${process.env.BASE_URL}/postlogout`, req.session)
    if (redirectUri) {
        req.session.post_logout_redirect_uri = req.query.post_logout_redirect_uri
    } else {
        redirectUri = post_logout_redirect_uri
    }
    res.redirect(redirectUri)
})

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

app.get('/expenses/totals', async (req, res) => {
    try {
        const apiUrl = new URL(`${process.env.BACKEND_URL}/expenses/${(await tokenManager.getIdTokenDecoded(req.session))?.sub}/totals`)
        const response = await tokenManager.fetchProtectedResource(req.session, apiUrl, 'GET')
        res.status(200).set({ 'Content-Type': 'application/json' }).send(await response.text())
    }
    catch (error) {
        res.status(error == 401 ? 401 : 500).send(error == 401 ? 'Authentication required' : 'Internal server error')
    }
})

app.get('/expenses/reports', async (req, res) => {
    try {
        const apiUrl = new URL(`${process.env.BACKEND_URL}/expenses/${(await tokenManager.getIdTokenDecoded(req.session))?.sub}/reports`)
        const response = await tokenManager.fetchProtectedResource(req.session, apiUrl, 'GET')
        res.status(200).set({ 'Content-Type': 'application/json' }).send(await response.text())
    }
    catch (error) {
        res.status(error == 401 ? 401 : 500).send(error == 401 ? 'Authentication required' : 'Internal server error')
    }
})

app.get('/acme/userinfo', async (req, res) => {
    try {
        const apiUrl = new URL(`${process.env.ISSUER}userinfo`)
        const response = await tokenManager.fetchProtectedResource(req.session, apiUrl, 'GET')
        res.status(200).set({ 'Content-Type': 'application/json' }).send(await response.text())
    }
    catch (error) {
        res.status(error == 401 ? 401 : 500).send(error == 401 ? 'Authentication required' : 'Internal server error')
    }
})

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

app.put('/acme/profile/resetmfa', async (req, res) => {
    try {
        const managementApiToken = await tokenManager.getClientAccessToken(process.env.MANAGEMENT_API_AUDIENCE, process.env.MANAGEMENT_API_SCOPE)
        const idToken = await tokenManager.getIdTokenDecoded(req.session)
        const managementClient = new ManagementClient({ domain: process.env.DOMAIN, token: managementApiToken })
        const response = await managementClient.users.deleteAllAuthenticators({ id: idToken?.payload?.sub })
        res.status(204).send()
    }
    catch (error) {
        res.status(error == 401 ? 401 : 500).send(error == 401 ? 'Authentication required' : 'Internal server error')
    }
})

app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.json({ status: err.status, message: err.message })
})

app.listen(process.env.PORT, () => console.log(`Backend for Frontend API started, use ctrl/cmd-click to follow this link: ${process.env.BASE_URL}`))