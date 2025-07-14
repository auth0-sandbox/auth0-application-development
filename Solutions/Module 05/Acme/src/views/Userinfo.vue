<script setup>
import { getUserinfo, login, user } from '../services/index.js'

let waiting = true
let userinfo = null

if (user && user.name) {
    try {
        userinfo = await getUserinfo()
    } catch (error) {
        // User status resets in server.js to prevent a loop if not signed in
    } finally {
        waiting = false
    }
} else {
    waiting = false
}
</script>

<template>
    <h1>User Information (/userinfo) from Auth0</h1>
    <div>
        <p>Hello <span v-if="user && user.name"><a href="/userinfo">{{ user.name }}</a></span><span v-else>{{ 'Anonymous' }}</span>,</p>
    </div>
    <div v-if="waiting">
        <div class="centered-image-container">
            <img class="spinner" src="@/assets/images/spinner.gif" alt="Loading..." />
        </div>
    </div>
    <div v-if="user && user.name">
        <div v-if="userinfo == null">
            <p>Internal error retreiving user information</p>
        </div>
        <div v-else>
<pre>
{{ JSON.stringify(userinfo, null, 4) }}
</pre>
        </div>
    </div>
    <div v-else>
        <p>Please sign on to see your user information from Auth0.</p>
    </div>
</template>

<style scoped></style>