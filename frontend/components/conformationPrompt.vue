<template>
  <main class="conformation-window">
    <div class="message">
      <span class="requestinguser">{{user}}</span> wants to start a <span class="type">{{typeConversation}}</span> conversation with you
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
    typeConversation: String,
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

.message .requestinguser{
  color: rgb(97, 156, 8);
}

.message .type{
  color: rgb(7, 132, 204);
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
  background-color: rgb(97, 139, 89);
}

#decline{
  background-color: rgb(185, 64, 64);
}
</style>