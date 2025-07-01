<script setup>
import { logout } from '../services/bff.js'

logout(('/')
</script>

<template>
    <!-- Never rendered, logout will redirect the browser before we get here. -->
</template>

<style scoped></style>