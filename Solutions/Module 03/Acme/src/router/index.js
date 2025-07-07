import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Logout from '../views/Logout.vue'
import Reports from '../views/Reports.vue'
import Userinfo from '../views/Userinfo.vue'

const routes = [
    { path: '/', component: Home },
    { path: '/reports', component: Reports },
    { path: '/login', component: Login },
    { path: '/logout', component: Logout },
    { path: '/userinfo', component: Userinfo }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router