<script setup>
import { useRoute, useRouter } from 'vue-router'
import { getPostLoginRedirect, login, setUser } from '../services/index.js'

const route = useRoute()
const router = useRouter()

if (route.query.name) {
    setUser({ name: route.query.name, picture: route.query.picture })
    router.push(getPostLoginRedirect())
} else {
    login('/')
}
</script>

<template>
</template>