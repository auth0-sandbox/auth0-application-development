<script setup>
import { reactive } from 'vue'
import { getProfile, login, resetProfileMfa, setProfileOptInMfa, user } from '../services/index.js'

let waiting = true
let profile = null

if (user && user.name) {
    try {
        profile = await getProfile()
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
    <h1>User Profile from Auth0</h1>
    <div>
        <p>Hello <span v-if="user && user.name"><a href="/userinfo">{{ user.name }}</a></span><span v-else>{{ 'Anonymous' }}</span>,</p>
    </div>
    <div v-if="waiting">
        <div class="centered-image-container">
            <img class="spinner" src="@/assets/images/spinner.gif" alt="Loading..." />
        </div>
    </div>
    <div v-if="user && user.name">
        <div v-if="profile == null">
            <p>Internal error retreiving user information</p>
        </div>
        <div v-else>
            <input type="checkbox" id="optInMfa" v-model="profile.app_metadata.optin_mfa" @change="setProfileOptInMfa(profile.app_metadata.optin_mfa)" />
            <label for="optInMfa">&nbsp;Opt-in to MFA</label>
<pre>
{{ JSON.stringify(profile, null, 4) }}
</pre>
        </div>
    </div>
    <div v-else>
        <p>Please sign on to see your Auth0 profile.</p>
    </div>
</template>