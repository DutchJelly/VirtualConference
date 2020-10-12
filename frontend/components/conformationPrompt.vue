<template>
  <main class="conformation-window">
    <div class="message">
      <span class="user">{{user}}</span> wants to start a conversation with you
    </div>
    <div class="buttons">
      <button id="accept" @click.prevent="onAccept(user);">Accept</button>
      <button id="decline" @click.prevent="onDecline(user);">Decline</button>
    </div>
  </main>
</template>

<script>

export default {
  name: 'ConformationPrompt',
  props: {
    user: String,
    onAccept: Function,
    onDecline: Function,
  },

  data() {
    return {
    
    };
  },
  methods: {
    
  },
};
</script>

<style scoped>

.conformation-window{
  @apply p-5 bg-gray-800 rounded flex flex-col items-center;
}

.conformation-window .message{
  @apply text-xl;
  color: white;
}

.message .user{
  color: greenyellow;
}

.conformation-window .buttons {
  @apply w-full mt-5 flex flex-row;
}

.buttons button{
  @apply border-white p-4 rounded shadow-xs;
  margin: 10px;
  flex: 1;
}

#accept{
  background-color: rgb(78, 255, 47);
}

#decline{
  background-color: rgb(195, 66, 66);
}

body{
  background-color: black;
}

.login-page{
  @apply w-full min-h-screen flex flex-col items-center justify-center;
  background: black url("../static/login_background.svg") no-repeat center center fixed;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
  transform: scale(1.02);
}

.banner{
  @apply text-4xl text-white bg-gray-700 w-full text-center p-5 bg-opacity-75;
  position: absolute;
  top: 0px;
}

@media only screen and (max-width: 450px) {
  .banner{
    @apply text-2xl;
  }
}

.login-prompt {

  /* @apply w-11/12 max-w-lg bg-white shadow-lg rounded flex flex-col items-center py-6; */
  
  width: 500px;
  max-width: 90%;
  margin: 2rem;
}

.login-prompt-item{
  position: relative;
  height: 60px;
  width: 100%;
  @apply mb-4 ;
}

.login-prompt-item input {
  @apply rounded block border-2 border-transparent border-gray-800 text-xl p-4;
  height: 100%;
  width: 100%;
  background-color: rgba(0,0,0,0.35);
  color: white;
  padding-left: 70px;
  
}

.login-prompt-item .icon-container {
  height: 65%;
  width: 70px;
  position: absolute;
  bottom: 17.5%; /* (100-height)/2*/
  pointer-events: none;



  @apply flex flex-row justify-center items-center;
}

.login-prompt-item .icon{
  height: 100%;
}

.login-prompt input:hover {
  outline: none;
  @apply border-gray-700;
}
.login-prompt input:focus {
  outline: none;
  @apply border-gray-500;
}

.login-button {
  outline: none;
  @apply shadow bg-green-600 mt-3 text-xl text-white p-2 w-full rounded border-2 border-transparent;
  height: 60px;
}
.login-button:hover,
.login-button:focus {
  @apply  bg-green-500;
}
</style>