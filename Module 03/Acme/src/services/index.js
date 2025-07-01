import axios from 'axios'

const bffUrl = import.meta.env.VITE_BFF_URL || 'http://localhost:39500'

async function getExpenses() {
    try {
        const response = await axios.get(`${bffUrl}/expenses`)
        return response.data
    } catch (error) {
        throw (error.response && error.response.status === 401) ? 401 : 0
    }
}

async function getProfile() {
    try {
        const response = await axios.get(`${bffUrl}/profile`)
        return response.data
    } catch (error) {
        throw (error.response && error.response.status === 401) ? 401 : 0
    }
}

async function getTotals() {
    try {
        const response = await axios.get(`${bffUrl}/expenses/totals`)
        return response.data
    } catch (error) {
        throw (error.response && error.response.status === 401) ? 401 : 0
    }
}

function login(redirect) {
    // This trips you up: if the user does not successfully authenticate, they never come back to the app!
    window.location.href = `${bffUrl}/login?redirect=${encodeURIComponent(redirect)}`
}

function logout(redirect) {
    window.location.href = `${bffUrl}/logout?redirect=${encodeURIComponent(redirect)}`
}

function getUser() {
    return localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : { name: 'Anonymous', picture: '' }
}

function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user))
}

export { getTotals, getExpenses, getProfile, getUser, login, logout, setUser }