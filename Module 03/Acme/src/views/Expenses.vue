<script setup>
import { getExpenses, getUser, login } from '../services/index.js'
var expenses = null;
var user = getUser();

try {
    expenses = await getExpenses()
    console.log('Expenses retrieved:', expenses)
} catch (error) {
    console.log('Error retrieving expenses:', error)
    if (error == 401) {
        login('/expenses')
    }
}
</script>

<template>
    <h1>Expense Report</h1>
    <div>
        <p>Hello <span v-if="user"><a href="/profile">{{ user.name }}</a></span>,</p>
    </div>
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
</template>