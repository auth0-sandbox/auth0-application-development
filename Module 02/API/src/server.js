// app.js - Auth0 Application Development Module 02 Lab
// Backend API
//

import cors from 'cors'
import dotenv from "dotenv"
import express from 'express'
import fs from 'fs'
import logger from 'morgan'
import path, { dirname, normalize } from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

if (!process.env.BASE_URL) {
    process.env.BASE_URL = !process.env.CODESPACE_NAME
        ? `https://localhost:${process.env.PORT}`
        : `https://${process.env.CODESPACE_NAME}-${process.env.PORT}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
}

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __fileDirectory = dirname(__filename)
const __dirname = normalize(path.join(__fileDirectory, ".."))
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "pug")

app.use(logger("combined"))

app.use(cors({ origin: '*', methods: 'ET', preflightContinue: false, optionsSuccessStatus: 204 }))

app.use(express.static(path.join(__dirname, "public")))

app.get('/', (req, res) => {
    res.render("home", { })
})

app.get('/:userid/totals', (req, res) => {
    // Our fake data does not depend on a particular user id, but if there was a database with users
    // we would reference the variable 'userid' to get the key to find the user records.
    const total = expenses.reduce((accum, expense) => accum + expense.value, 0)
    res.send({ total, count: expenses.length })
})

app.get('/:userid/reports', (req, res) => {
    res.send(expenses)
})

app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.json({ status: err.status, message: err.message })
})

app.listen(process.env.PORT, () => console.log(`Backend API started, use ctrl/cmd-click to follow this link: ${process.env.BASE_URL}`))

const expressOptions = {
    key: fs.readFileSync(process.env.PRIVATE_KEY_PATH, 'utf8'),
    cert: fs.readFileSync(process.env.CERTIFICATE_PATH, 'utf8')
}

https.createServer(expressOptions, app)
    .listen(process.env.PORT_TLS, () => console.log(`Backend TLS Port: https://localhost:${process.env.PORT_TLS}`))

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