<script setup>
import Home from './views/Home.vue'
</script>

<template>
    <header>
        <nav>
            <ul class="navigation">
                <li class="logo">
                    <a href="/">
                        <img src="./assets/images/acme-financial-management.png" alt="ACME Financial Management Logo" />
                    </a>
                </li>
                <li><router-link to="/">Home</router-link></li>
                <li><router-link to="/expenses">Expenses</router-link></li>
                <li class="spacer"></li>
                <li v-if="user !== undefined"><router-link to="/logout">Logout</router-link></li>
                <li v-else"><router-link to="/login">Login</router-link></li>
                <li class="profile"><router-link to="/profile"><img src="./assets/images/profile.png" alt="Profile Picture" /></router-link></li>
            </ul>
        </nav>
    </header>>

    <main class="content">
        <router-view />
    </main>
</template>

<style scoped>
</style>