<template>
    <main class="sidebar-content">
        <ul v-for="item in items" :key="item.user">
            <div v-if="item.user.toLowerCase().includes(contains.toLowerCase())">
                <button class="user" @click.prevent="onUserClick(item)">
                    {{ item.user }}
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
        onUserClick: Function,
    },
}
</script>

<style scoped>
.sidebar-content{
  
}
</style>