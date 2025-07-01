<script setup>
import { getTotals, getUser, login } from '../services/index.js'
var user = null
var count = null
var total = null
var user = getUser()
 
try {
    var totals = await getTotals()
    count = totals.count
    total = totals.total
} catch (error) {
    if (error == 401) {
        login('/')
    }
}
</script>

<template>
    <h1>Home Page</h1>
    <div>
        <p>Hello <span v-if="user && user.name !== 'Anonymous'"><a href="/profile">{{ user.name }}</a></span><span v-else>{{  user.name }}</span>,</p>
    </div>
    <div v-if="user.name !== 'Anonymous'">
        <p>So far, this app has been used to manage:</p>
        <div v-if="total == null">
            <p>Internal error retreiving expenses</p>
        </div>
        <div v-else>
            <ul>
                <li><strong>{{ count }}</strong> expenses</li>
                <li><strong>{{ total }}</strong> dollars</li>
            </ul>
        </div>
    </div>
    <div v-else>
        <p>Please sign on to see your personal expenses.</p>
    </div>
</template>