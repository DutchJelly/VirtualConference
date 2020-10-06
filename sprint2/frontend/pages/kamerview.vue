<template>
  <main class="kamerpage">
    <div class="kamer">
      filler
    </div>
    <div class="sidebar">
      <div class="sidebar-header">
        TemplateRoom 01
      </div>
      <div class="sidebar-items">
        <div class="sidebar-content">
          <ul id="templateUserList">
            <li v-for="item in items" :key="item.user">
              {{ item.user }}
            </li>
          </ul>
        </div>
        <div class="sidebar-search-bar">
          <input type="text" placeholder="Search for users">
        </div>
      </div>
    </div>

  </main>
</template>

<script>
export default {
  data() {
    return { 
      items: [
        { user: 'Richard' },
        { user: 'Wouter' }
      ]
    }
  }
};
</script>

<style>

.kamerpage{
  @apply w-full min-h-screen flex flex-col items-center justify-center;
  background: black url("../static/login_background.svg") no-repeat center center fixed;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
  transform: scale(1.02);
}

.kamer{
  @apply bg-gray;
}

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