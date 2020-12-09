<template>
  <main class="conformation-window">
    <div class="message">
      Which type conversation do you want?
    </div>
    <div class="buttons">
      <button id="closedCoversation" @click.prevent="onClosedConversation();">Closed</button>
      <button id="openConversation" @click.prevent="onOpenConversation();">Open</button>
      <button id="privateConversation" @click.prevent="onPrivateConversation();">Private</button>
    </div>
  </main>
</template>

<script>

export default {
  name: 'TypeConversationPrompt',
  props: {
    onClosedConversation: Function,
    onOpenConversation: Function,
    onPrivateConversation: Function,
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
  color: rgb(97, 156, 8);
}

.conformation-window .buttons {
  @apply w-full mt-5 flex flex-row;
}

.buttons button{
  @apply border-white p-4 rounded shadow-xs;
  margin: 10px;
  flex: 1;
}

#closedCoversation{
  background-color: rgb(57, 128, 168);
}

#openConversation{
  background-color: rgb(38, 148, 175);
}

#privateConversation{
  background-color: rgb(35, 139, 143);
}
</style>