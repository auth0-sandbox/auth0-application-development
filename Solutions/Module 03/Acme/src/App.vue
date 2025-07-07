<script setup>
import { user } from './services/index.js'
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
                <li><router-link to="/reports">Expenses</router-link></li>
                <li class="spacer"></li>
                <template v-if="user && user.name">
                    <li><router-link to="/logout">Logout</router-link></li>
                    <li class="profile"><router-link to="/userinfo"><img :src="user.picture"
                                alt="Profile Picture" /></router-link></li>
                </template>
                <template v-else>
                    <li><router-link to="/login">Login</router-link></li>
                    <li class="profile"><img src="./assets/images/profile.png" alt="Profile Picture" /></li>
                </template>
            </ul>
        </nav>
    </header>

    <main class="content">
        <Suspense>
            <router-view />
        </Suspense>
    </main>
</template>

<style scoped></style>