import axios from 'axios'
import { reactive } from 'vue'

const bffUrl = import.meta.env.VITE_BFF_URL || 'http://localhost:37500/bff'
console.log('BFF URL:', bffUrl)

// Initialize LocalStorage with a default user object if it does not exist

let user = reactive(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : { name: null, picture: '' })

function clearUser() {
    localStorage.removeItem('user')
    user = { name: null, picture: '' }
}

async function getProfile() {
    try {
        const response = await axios.get(`${bffUrl}/acme/profile`)
        return response.data
    } catch (error) {
        throw (error.response && error.response.status === 401) ? (clearUser(), 401) : 500
    }
}

async function resetProfileMfa() {
    try {
        await axios.delete(`${bffUrl}/acme/profile/resetmfa`)
        location.reload()
    } catch (error) {
        throw (error.response && error.response.status === 401) ? (clearUser(), 401) : 500
    }
}

async function setProfileOptInMfa(optIn) {
    try {
        await axios.patch(`${bffUrl}/acme/profile/optinmfa`, { optin_mfa: optIn })
        location.reload()
    } catch (error) {
        throw (error.response && error.response.status === 401) ? (clearUser(), 401) : 500
    }
}

function getPostLoginRedirect() {
    const postLoginRedirect = localStorage.getItem('postLoginRedirect')
    if (postLoginRedirect) {
        localStorage.removeItem('postLoginRedirect')
    }
    return postLoginRedirect || '/'
}

async function getReports() {
    try {
        const response = await axios.get(`${bffUrl}/expenses/reports`)
        return response.data
    } catch (error) {
        throw (error.response && error.response.status === 401) ? (clearUser(), 401) : 500
    }
}

async function getTotals() {
    try {
        const response = await axios.get(`${bffUrl}/expenses/totals`)
        return response.data
    } catch (error) {
        throw (error.response && error.response.status === 401) ? (clearUser(), 401) : 500
    }
}

async function getUserinfo() {
    try {
        const response = await axios.get(`${bffUrl}/acme/userinfo`)
        return response.data
    } catch (error) {
        throw (error.response && error.response.status === 401) ? (clearUser(), 401) : 500
    }
}

function login(postLoginRedirect) {
    // This trips you up: if the user does not successfully authenticate, they never come back to the app!
    localStorage.setItem('postLoginRedirect', postLoginRedirect)
    window.location.href = `${bffUrl}/acme/login?redirect_uri=${encodeURIComponent(import.meta.env.VITE_APP_BASE_URL)}&app_id=${import.meta.env.VITE_APP_ID`
}

function logout() {
    clearUser()
    window.location.href = `${bffUrl}/acme/logout?post_logout_redirect_uri=${encodeURIComponent(import.meta.env.VITE_APP_BASE_URL)}`
}

function setUser(userProperties) {
    localStorage.setItem('user', JSON.stringify(userProperties))
    user.name = userProperties.name
    user.picture = userProperties.picture
}

export { getProfile, getPostLoginRedirect, getReports, getTotals, getUserinfo, login, logout, resetProfileMfa, setProfileOptInMfa, setUser, user }