<script setup>
import { reactive } from 'vue'
import { getProfile, login, setProfileOptInMfa, user } from '../services/index.js'

var profile = null

try {
    profile = await getProfile()
} catch (error) {
    if (error == 401) {
        login('/profile')
    }
}
</script>

<template>
    <div v-if="user && user.name">
        <h1>User Profile from Auth0</h1>
        <div>
            <p>Hello <a href="/userinfo">{{ user.name }}</a>,</p>
        </div>
        <div v-if="profile == null">
            <p>Internal error retreiving user information</p>
        </div>
        <div v-else>
            <input type="checkbox" id="optInMfa" v-model="profile.app_metadata.optin_mfa" @change="setProfileOptInMfa(profile.app_metadata.optin_mfa)" />
            <br><a href="/resetmfa">Reset MFA</a>
            <label for="optInMfa">&nbsp;Opt-in to MFA</label>
<pre>
{{ JSON.stringify(profile, null, 4) }}
</pre>
        </div>
    </div>
</template>