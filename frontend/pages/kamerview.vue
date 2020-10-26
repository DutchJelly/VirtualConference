<template>
  <main class="kamerpage">
    <UserSpace 
      v-bind:users="items"
      v-bind:contains="value"
    />
    <Sidebar 
      roomName="templateRoom01"
      v-bind:items="items"
      v-on:inputChange="handleChange"></Sidebar>
  </main>
</template>

<script>
export default {
  data () {
    return {
      items: [
        { user: "Richard" },
        { user: "Wouter" },
        { user: "Joost" },
        { user: "Damian" }
      ],
      value: ''

    }
  },
  methods: {
    handleChange(event) {
      const { value } = event.target;
      this.value = value;
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

.plattegrond-button {
  outline: none;
  @apply shadow bg-blue-700 mt-3 text-xl text-white p-2 w-full rounded border-2 border-transparent;
  height: 60px;
  width: 25%;
}

.plattegrond-button:hover,
.plattegrond-button:focus {
  @apply  bg-blue-600;
}

</style>
