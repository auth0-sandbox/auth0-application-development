<script setup>
import { useRouter } from 'vue-router'
import { logout, user } from '../services/index.js'

const router = useRouter()

if (user && user.name) {
    logout()
} else {
    router.push('/')
}
</script>

<template>
</template>