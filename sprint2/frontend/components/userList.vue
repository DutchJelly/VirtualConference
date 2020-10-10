<template>
    <main class="sidebar-content">
        <ul v-for="item in items" :key="item.user">
            <div v-if="item.user.toLowerCase().includes(contains.toLowerCase())">
                {{ item.user }}
            </div>
        </ul>
    </main>
</template>



<script>
export default {
    props: {
        items: Array,
        contains: String,
    },
}
</script>

<style scoped>
.sidebar-content{
  
}
</style>