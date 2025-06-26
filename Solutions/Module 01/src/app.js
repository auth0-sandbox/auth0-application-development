// app.js - Auth0 Application Development Module 01 Lab
//

import cookieParser from 'cookie-parser'
import dotenv from "dotenv"
import express from 'express'
import auth0Express from 'express-openid-connect'
import session from 'express-session'
import createError from 'http-errors'
import logger from 'morgan'
import path, { dirname, normalize } from 'path'
import { fileURLToPath } from 'url'

// Pull the functins from the express-openid-connect module ()
const { auth, requiresAuth } = auth0Express

// Migrate the .env file properties into process.env
dotenv.config()

// Calculate the app URL if not set externally
if (!process.env.BASE_URL) {
    process.env.BASE_URL = !process.env.CODESPACE_NAME
        ? `http://localhost:${process.env.PORT}`
        : `https://${process.env.CODESPACE_NAME}-${process.env.PORT}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
}

// Create Express
const app = express()

// Send back HTTP 301 redirect if the request is not to the app URL
app.use((req, res, next) =>
    process.env.BASE_URL.includes(req.headers.host) ? next() : res.status(301).redirect(process.env.BASE_URL)
)

// Assuming this file is in the src directory, find the project directory
const __filename = fileURLToPath(import.meta.url)
const __fileDirectory = dirname(__filename)
const __dirname = normalize(path.join(__fileDirectory, ".."))
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "pug")

app.use(logger("combined"))

// Accept both JSON and URL-encoded bodies, and parse cookies
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

// Serve the static files in the public directory
app.use(express.static(path.join(__dirname, "public")))

// Use sessions
app.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true,
    })
)

// Add the Auth0 cilent
app.use(
    auth({
        // issuerBaseURL: process.env.ISSUER_BASE_URL,
        baseURL: process.env.BASE_URL,
        // clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        // secret: process.env.SECRET,
        idpLogout: true,
        authRequired: false
    })
);

// Set up the middleware for the route paths
app.get("/", async (req, res) => {
    let locals = { user: req.oidc && req.oidc.user, total: null, count: null }
    if (locals.user) {
        locals.total = expenses.reduce((accum, expense) => accum + expense.value, 0)
        locals.count = expenses.length
    }
    res.render("home", locals)
})

// Show user information from the authentication and authorization
app.get("/user", requiresAuth(),  async (req, res) => {
    res.render("user", {
        user: req.oidc && req.oidc.user,
        id_token: req.oidc && req.oidc.idToken,
        access_token: req.oidc && req.oidc.accessToken,
        refresh_token: req.oidc && req.oidc.refreshToken,
    })
})

app.get("/expenses", requiresAuth(), async (req, res, next) => {
    res.render("expenses", {
        user: req.oidc && req.oidc.user,
        expenses,
    })
})

// Catch 404 and forward to error handler
app.use((req, res, next) => next(createError(404)))

// Error handler
app.use((err, req, res, next) => {
    res.locals.message = err.message
    res.locals.error = err
    res.status(err.status || 500)
    res.render("error", {
        user: req.oidc && req.oidc.user,
    })
})

app.listen(process.env.PORT, () => {
    console.log(`WEB APP: ${process.env.BASE_URL}`)
})

// Expenses
const expenses = [
    {
        date: new Date(),
        description: "Pizza for a Coding Dojo session.",
        value: 102,
    },
    {
        date: new Date(),
        description: "Coffee for a Coding Dojo session.",
        value: 42,
    },
]