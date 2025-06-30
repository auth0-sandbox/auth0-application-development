<script setup>
defineProps({
    msg: {
        type: String,
        required: true,
    },
})
</script>

<template>
    <h1>Expense Report</h1>
    <div>
        <p>Hello <span v-if="user"><a href="/profile">{{ user.name }}</a></span><span v-else>Anonymous</span>,</p>
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
            <tr>
                <th v-for="(value, key) in expenses[0]" :key="key">
                    <strong>{{ key }}</strong>
                </th>
            </tr>
            <tr v-for="expense in expenses" :key="expense.id">
                <td v-for="(value, key) in expense" :key="key">
                    {{ value }}
                </td>
            </tr>
        </table>
        <p>Don't spend too much.</p>
    </div>
</template>

<style scoped></style>