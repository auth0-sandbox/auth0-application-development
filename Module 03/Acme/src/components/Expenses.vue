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
    <p>Hello
        <span v-if="user"><a href="/profile">{{ user.name }}</a></span><span v-else>Anonymous</span>,
    <p v-if="expenses == null">Internal error retreiving expenses</p>
    <p v-else v-if="expenses.length == 0">You have no expenses.</p>
    <p v-else>
        You have recorded the following expenses:
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
    </p>
    </p>
</template>

<style scoped></style>