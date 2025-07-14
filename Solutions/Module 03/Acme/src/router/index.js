import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/Home.vue'
import Reports from '../views/Reports.vue'
import Userinfo from '../views/Userinfo.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: Home },
        { path: '/reports', component: Reports },
        { path: '/userinfo', component: Userinfo }
    ]
})

export default router