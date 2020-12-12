<template>
    <main class="sidebar-content">
        <ul v-for="item in items" :key="item.username">
            <div v-if="item.username.toLowerCase().includes(contains.toLowerCase())">
                <button class="user">
                    {{ item.username }}
                </button>
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