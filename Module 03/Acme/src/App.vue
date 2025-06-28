<script setup>
import Home from './components/Home.vue'
import Expenses from './components/Expenses.vue'
import Profile from './components/Profile.vue'
</script>

<template>
    <header>
        <ul class="navigation">
            <li class="logo">
                <a href="/">
                    <img src="./assets/images/acme-financial-management.png" alt="ACME Financial Management Logo" />
                </a>
            </li>
            <li><a href="/">Home</a></li>
            <li><a href="/expenses">Expenses</a></li>
            <li class="spacer"></li>
            <li v-if="user"><a href="/logout">Logout</a></li>
            <li class="profile"><img src="./assets/images/profile.png" alt="Profile Picture" /></li>
        </ul>
    </header>

    <main class="content">
        <Home />
    </main>
</template>

<style scoped>
li.logo {
    text-align: left;
}

li.logo img {
    height: 50px;
}

li.spacer {
  flex-grow: 1;
}

.navigation {
  width: 100%;
  padding-inline-start: 125px;
  padding-inline-end: 125px;
  position: absolute;
  top: 0;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: flex-end;
  list-style: none;
  margin: 0;
  background: #333c4d;
}

.navigation a {
    text-decoration: none;
    display: block;
    padding: 1em;
    color: white;
}

.navigation li.profile {
    padding-top: 5px;
    padding-right: 5px;
    margin-right: 10px;
}

.navigation li.profile img {
    height: 40px;
    border-radius: 20px;
}
</style>