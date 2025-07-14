<script setup>
import { getReports, login, user } from '../services/index.js'

let waiting = true
let expenses = null

if (user && user.name) {
    try {
        expenses = await getReports()
    } catch (error) {
        // User status resets in server.js to prevent a loop if not signed in
    } finally {
        waiting = false
    }
} else {
    waiting = false
}
</script>

<template>
    <h1>Expense Report</h1>
    <div>
        <p>Hello <span v-if="user && user.name"><a href="/userinfo">{{ user.name }}</a></span><span v-else>{{ 'Anonymous' }}</span>,</p>
    </div>
    <div v-if="waiting">
        <div class="centered-image-container">
            <img class="spinner" src="../assets/images/spinner.gif" alt="Loading..." />
        </div>
    </div>
    <div v-if="user && user.name">
        <div v-if="expenses == null">
            <p>Internal error retreiving expenses</p>
        </div>
        <div v-else v-if="expenses.length == 0">
            <p>You have no expenses.</p>
        </div>
        <div v-else>
            <p>You have recorded the following expenses:</p>
            <table border="1">
                <thead>
                    <tr>
                        <th v-for="(value, key) in expenses[0]" :key="key">
                            <strong>{{ key }}</strong>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="expense in expenses" :key="expense.id">
                        <td v-for="(value, key) in expense" :key="key">
                            {{ value }}
                        </td>
                    </tr>
                </tbody>
            </table>
            <p>Don't spend too much.</p>
        </div>
    </div>
    <div v-else>
        <p>Please sign on to see your expense report.</p>
    </div>
</template>