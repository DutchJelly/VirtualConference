<template>
    <main class="sidebar">
        <div class="sidebar-header">{{roomName}}</div>
        <UserList v-bind:items="items" v-bind:contains="message" class="sidebar-content"></UserList>
        <div class="sidebar-search-bar">
            <input v-model='message' type="text" placeholder="Search for users">
        </div>
    </main>
</template>

<script>


export default {
    name: 'SideBar',
    props: {
        roomName: String,
        items: Array,
    },

    data() {
        return { 
            message:"",
        }
    }
}
</script>

<style scoped>

.sidebar{
  @apply bg-white rounded shadow-lg;
  height: 90%;
  width: 10%;
  min-width: 150px;
  position: fixed;
  right: 3%;
}


.sidebar-header{
  @apply text-xl px-1 py-1 flex flex-col items-center justify-center;
}

.sidebar-items{
  
}

.sidebar-content{
  @apply px-1;
  height: 90%;
  position: relative;
}

.sidebar-search-bar input{
  @apply px-1 border-t-2 border-gray-800;
  position: absolute;
  left: 1%;
  bottom: 0.2%;
  width: 98%;
}
</style>