<template>
  <main class="sidebar-container">
    <div class="sidebar-header">Users</div>
    <UserList
      :items="items"
      :contains="message"
      class="sidebar-content"
    ></UserList>
    <div class="sidebar-search-bar">
      <input v-model="message" type="text" placeholder="Search for users" />
    </div>
  </main>
</template>

<script>
export default {
  name: "SideBar",
  props: {
    roomName: String,
    items: Array,
  },
  data() {
    return {
      message: "",
    };
  },
};
</script>

<style scoped>
.sidebar {
  @apply ml-1 text-center;
  background-color: #181c21;
  min-width: 300px;
}
.sidebar-header {
  @apply text-5xl text-white mx-1 my-10 flex flex-col items-center justify-center;
}
.sidebar-content {
  @apply px-2 text-white text-xl;
  height: 70%;
  width: 80%;
  text-align: left;
  color: white;
  margin: 0 auto;
}
.sidebar-search-bar input {
  @apply px-2 py-2 my-5 border-t-2 border-gray-800;
  width: 80%;
}
</style>