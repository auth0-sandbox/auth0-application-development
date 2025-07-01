<script setup>
import { getProfile, login } from '../services/bff.js'
var profile = null;

try {
    profile = await getProfile();
} catch (error) {
    if (error == 401) {
        login('/profile');
    }
}
</script>

<template>
    <h1>User Profile from Auth0</h1>
    <div v-if="profile == null">
        <p>Internal error retreiving profile</p>
    </div>
    <div v-else>
        <pre>
            {{ JSON.stringify(profile, null, 4) }}
        </pre>
    </div>

</template>

<style scoped></style>