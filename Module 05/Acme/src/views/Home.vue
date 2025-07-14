<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostLoginRedirect, getTotals, setUser, user } from '../services/index.js'

let waiting = true
let totals = null
const router = useRouter()
const route = useRoute()

const setContenxt = async () => {
    if (user && user.name) {
        try {
            totals = await getTotals()
            waiting = false
        } catch (error) {
            // User status resets in server.js to prevent a loop if not signed in
        } finally {
            waiting = false
        }
    } else {
        waiting = false
    }
}

await router.isReady()
if (!route.query.name) {
    await setContenxt()
} else {
    setUser({ name: route.query.name, picture: route.query.picture })
    let postLoginRedirect = getPostLoginRedirect()
    if (route.path !== postLoginRedirect) {
        onMounted(async () => {
            await router.push(postLoginRedirect)
        })
    } else {
        await setContenxt()
    }
}

</script>

<template>
    <h1>Home Page</h1>
    <div>
        <p>Hello <span v-if="user && user.name"><a href="/userinfo">{{ user.name }}</a></span><span v-else>{{ 'Anonymous' }}</span>,</p>
    </div>
    <div v-if="waiting">
        <p>Loading...</p>
        <div class="centered-image-container">
            <img class="spinner" src="@/assets/images/spinner.gif" alt="Loading..." />
        </div>
    </div>
    <div v-if="user && user.name">
        <p>So far, this app has been used to manage:</p>
        <div v-if="totals == null">
            <p>Internal error retreiving expenses</p>
        </div>
        <div v-else>
            <ul>
                <li><strong>{{ totals.count }}</strong> expenses</li>
                <li><strong>{{ totals.total }}</strong> dollars</li>
            </ul>
        </div>
    </div>
    <div v-else>
        <p>Please sign on to see your personal expenses.</p>
    </div>
</template>