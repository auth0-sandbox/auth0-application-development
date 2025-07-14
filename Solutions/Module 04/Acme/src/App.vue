<script setup>
import { useRoute } from 'vue-router'
import { login, logout, user } from './services/index.js'

const route = useRoute()
</script>

<template>
    <header>
        <nav>
            <ul class="navigation">
                <li class="logo">
                    <a href="/">
                        <img src="@/assets/images/acme-financial-management.png" alt="ACME Financial Management Logo" />
                    </a>
                </li>
                <li><router-link to="/">Home</router-link></li>
                <li><router-link to="/reports">Expenses</router-link></li>
                <li><router-link to="/userinfo">Userinfo</router-link></li>
                <li><router-link to="/profile">Profile</router-link></li>
                <li class="spacer"></li>
                <template v-if="user && user.name">
                    <li><span class="link" @click="logout()">Logout</span></li>
                    <li class="profile"><router-link to="/userinfo"><img :src="user.picture"
                                alt="Profile Picture" /></router-link></li>
                </template>
                <template v-else>
                    <li><span class="link" @click="login(route.path)">Login</span></li>
                    <li class="profile"><img src="@/assets/images/profile.png" alt="Profile Picture" /></li>
                </template>
            </ul>
        </nav>
    </header>

    <main class="content">
        <Suspense>
            <router-view :key="$route.fullPath" />
        </Suspense>
    </main>
</template>

<style scoped></style>