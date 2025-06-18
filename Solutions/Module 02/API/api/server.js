// app.js - Auth0 Application Development Module 02 Lab
// Back-end API
//

import dotenv from "dotenv"
import express from 'express'
import cors from 'cors'
import { auth, requiredScopes } from 'express-oauth2-jwt-bearer'

dotenv.config()

if (!process.env.BASE_URL) {
    process.env.BASE_URL = !process.env.CODESPACE_NAME
        ? `http://localhost:${process.env.PORT}`
        : `https://${process.env.CODESPACE_NAME}-${process.env.PORT}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
}

const app = express()

app.use((req, res, next) =>
    process.env.BASE_URL.includes(req.headers.host) ? next() : res.status(301).redirect(process.env.BASE_URL)
)

app.use(cors({ origin: '*', methods: 'ET', preflightContinue: false, optionsSuccessStatus: 204 }))

app.get('/', (req, res) => {
    res.render("home", { })
})

// This middleware requires authorization for any middleware registered after it.
app.use(auth())

app.get('/total', requiredScopes('read:totals'), (req, res) => {
    const total = expenses.reduce((accum, expense) => accum + expense.value, 0)
    res.send({ total, count: expenses.length })
})

app.get('/reports', requiredScopes('read:reports'), (req, res) => {
    res.send(expenses)
})

app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.json({ status: err.status, message: err.message })
})

app.listen(PORT, () => console.log(`Back-end API started at: ${APP_URL}`))

const expenses = [
    {
        date: new Date(),
        description: 'Pizza for a Coding Dojo session.',
        value: 102,
    },
    {
        date: new Date(),
        description: 'Coffee for a Coding Dojo session.',
        value: 42,
    },
]
