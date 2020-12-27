<template>
    <main class="sidebar-content">
        <ul v-for="item in items" :key="item.username">
            <div v-if="item.username.toLowerCase().includes(contains.toLowerCase())">
                <button class="user">
                    <div v-if="currentUserId == item.id">{{ item.username }} (this is you)</div>
                    <div v-else>{{ item.username }} </div>
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
    computed: {
        currentUserId: function() {
            var currentUser = this.$store.getters.getUser
            if(currentUser == undefined) return -1;
            else return this.$store.getters.getUser.id;
        },
    },

}
</script>
