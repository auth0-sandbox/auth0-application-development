<script setup>
import { reactive } from 'vue'
import { getUserinfo, login, user } from '../services/index.js'

var userinfo = null

try {
    userinfo = await getUserinfo()
} catch (error) {
    if (error == 401) {
        login('/userinfo')
    }
}
</script>

<template>
    <div v-if="user && user.name">
        <h1>/userinfo from Auth0</h1>
        <div>
            <p>Hello <a href="/userinfo">{{ user.name }}</a>,</p>
        </div>
        <div v-if="userinfo == null">
            <p>Internal error retreiving user information</p>
        </div>
        <div v-else>
<pre>
{{ JSON.stringify(userinfo, null, 4) }}
</pre>
        </div>
    </div>
</template>

<style scoped></style>