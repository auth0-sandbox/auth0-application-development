// app.js - Auth0 Application Development Module 02 Lab
// Backend for Frontend API
//

import cors from 'cors'
import dotenv from "dotenv"
import express from 'express'
import jwt from 'jsonwebtoken'
import logger from 'morgan'
import { Issuer } from 'openid-client'
import path, { dirname, normalize } from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

if (!process.env.BASE_URL) {
    process.env.BASE_URL = !process.env.CODESPACE_NAME
        ? `http://localhost:${process.env.PORT}`
        : `https://${process.env.CODESPACE_NAME}-${process.env.PORT}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
}

const app = express()

const issuer = await Issuer.discover(`https://${process.env.DOMAIN}/`)

const client = new issuer.Client({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uris: [`${process.env.BASE_URL}/callback`],
      response_types: ['code']
    })

let openidConfig = await openidClient.discovery(`https://${process.env.DOMAIN}`, process.env.CLIENT_ID, process.env.CLIENT_SECRET)

const __filename = fileURLToPath(import.meta.url)
const __fileDirectory = dirname(__filename)
const __dirname = normalize(path.join(__fileDirectory, ".."))
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "pug")

app.use(logger("combined"))

app.use(cors({ origin: '*', methods: 'ET', preflightContinue: false, optionsSuccessStatus: 204 }))

app.use(express.static(path.join(__dirname, "public")))

app.get('/', (req, res) => {
    res.render("home", {})
})

app.post('/callback', express.urlencoded({ extended: true }), async (req, res) => {
    const { code } = req.body
    if (!code) {
        return res.status(400).send('Missing code parameter')
    }

    const tokenSet = await client.callback(`${process.env.BASE_URL}/callback`, { code: code, })

    // Save the token with the user session to use later.
    req.session.tokenSet = tokenSet

    console.log('Access Token:', tokenSet.access_token)
    console.log('ID Token:', tokenSet.id_token)

    // Return the user to the app with ?name=&picture=
    res.redirect(`${req.body.state}?name=${encodeURIComponent(tokenSet.claims().name)}&picture=${encodeURIComponent(tokenSet.claims().picture)}`)
})

app.get('/login', async (req, res) => {
    const url = client.authorizationUrl({ scope: 'openid profile email read:totals read:reports', audience: process.env.AUDIENCE, state: req.query.redirect_url })
    res.redirect(url)
})

app.get('/profile', async (req, res) => {
    try {
        req.auth = { sub: 'auth0|684c417378bc64b837ab0c08' }
        const managementClient = await getManagementClient()
        const response = await managementClient.users.get({ id: req.auth.sub })
        res.status(response.status).send(response.data || response.statusText)
    }
    catch (error) {
        console.error('Error retrieving profile:', error)
        res.status(500).send('Error retrieving profile')
    }
})

app.get('/totals', async (req, res) => {
    try {
        const apiUrl = `${process.env.BACKEND_URL}/${req.auth.sub}/totals`
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${await getBackendToken()}`
            }
        }
        const response = await fetch(apiUrl, config)
        res.status(response.status).send(await response.text())
    }
    catch (error) {
        res.status(500).send('Error retrieving totals')
    }
})

app.get('/reports', async (req, res) => {
    try {
        const apiUrl = `${process.env.BACKEND_URL}/${req.auth.sub}/reports`
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${await getBackendToken()}`
            }
        }
        const response = await fetch(apiUrl, config)
        res.status(response.status).send(await response.text())
    }
    catch (error) {
        res.status(500).send('Error retrieving report')
    }
})

app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.json({ status: err.status, message: err.message })
})

app.listen(process.env.PORT, () => console.log(`Backend for Frontend API started at: ${process.env.BASE_URL}`))

async function getManagementClient() {
    if (!getManagementClient.managementClient) {
        // The ManagementClient will manage expired tokens, only the object is necessary.
        getManagementClient.managementClient = new ManagementClient({
            domain: process.env.DOMAIN,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET
        })
    }
    return getManagementClient.managementClient
}

async function getBackendToken() {
    if (getBackendToken.backendToken) {
        const decoded = jwt.decode(getBackendToken.backendToken, { complete: true })
        if (Date.now() >= decoded.payload.exp * 1000) {
            // Force a token retrieval if the current token is expired.
            getBackendToken.backendToken = null
        }
    }
    if (!getBackendToken.backendToken) {
        if (!getBackendToken.authenticationClient) {
            getBackendToken.authenticationClient = new AuthenticationClient({
                domain: process.env.DOMAIN,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET
            })
        }
        try {
            const tokenResponse = await getBackendToken.authenticationClient.oauth.clientCredentialsGrant({
                audience: process.env.BACKEND_AUDIENCE,
                scope: process.env.BACKEND_SCOPE
            })
            getBackendToken.backendToken = tokenResponse.data.access_token
        }
        catch (error) {
            console.error('Failed to retrieve backend token.')
        }
    }
    return getBackendToken.backendToken
}