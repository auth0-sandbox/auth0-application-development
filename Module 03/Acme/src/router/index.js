import { createRouter, createWebHistory } from 'vue-router'

import Expenses from '../views/Expenses.vue'
import Home from '../views/Home.vue'
import Profile from '../views/Profile.vue'

const routes = [
    { path: '/', component: Home },
    { path: '/expenses', component: Expenses },
    { path: '/profile', component: Profile }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router