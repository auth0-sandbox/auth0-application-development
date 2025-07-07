// server.js - Auth0 Application Development Module 03 Lab
// Backend for Frontend API
//

import cors from 'cors'
import dotenv from "dotenv"
import express from 'express'
import session from 'express-session'
import logger from 'morgan'
import path, { dirname, normalize } from 'path'
import { fileURLToPath } from 'url'

console.log(process.cwd())

dotenv.config()

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

app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.json({ status: err.status, message: err.message })
})

app.listen(process.env.PORT, () => console.log(`Backend for Frontend API started, use ctrl/cmd-click to follow this link: ${process.env.BASE_URL}`))