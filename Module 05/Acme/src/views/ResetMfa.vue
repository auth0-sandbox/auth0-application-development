<script setup>
import { useRouter } from 'vue-router'
import { resetMfa, user } from '../services/index.js'

const router = useRouter()

if (user && user.name) {
    resetMfa()
}

router.push('/profile')
</script>

<template>
</template>