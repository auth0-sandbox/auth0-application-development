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
    <p>Hello
        <span v-if="user"><a href="/profile">{{ user.name }}</a></span><span v-else>Anonymous</span>,
        <p v-if="user">
            <p>
                So far, this app has been used to manage:
                <span v-if="total == null">Internal error retreiving expenses</span>
                <ul v-else>
                    <li><strong>{{ count }}</strong> expenses</li>
                    <li><strong>{{ total }}</strong> dollars</li>
                </ul>
            </p>
        </p>
        <p v-else>Please sign on to see your personal expenses.</p>
    </p>
</template>

<style scoped>
</style>