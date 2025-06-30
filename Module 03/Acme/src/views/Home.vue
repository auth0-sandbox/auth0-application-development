<script setup>
defineProps({
    msg: {
        type: String,
        required: true,
    },
})
</script>

<template>
    <h1>Home Page</h1>
    <div>
        <p>Hello <span v-if="user"><a href="/profile">{{ user.name }}</a></span><span v-else>Anonymous</span>,</p>
    </div>
    <div v-if="user">
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

<style scoped></style>