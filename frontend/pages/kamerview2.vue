<template>
  <main class="kamerpage">
    <div class="kamer">
      <UserIcon v-bind:items="items"></UserIcon>
    </div>
    <Sidebar roomName="Meeting Rooms" v-bind:items="items"></Sidebar>
  </main>
</template>

<script>
export default {
  data () {
    return {
      items: [
        { user: "Richard" },
        { user: "Wouter" }
      ]
    }
  }
}
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
  @apply bg-white rounded shadow-lg p-5;
  height: 90%;
  width: 82%;
  left: 3%;
  position: fixed;
}

</style>
