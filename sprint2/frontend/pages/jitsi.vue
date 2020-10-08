<template>
  <div class="main">
      <h1>{{message}}</h1>
      <ul><li v-for="(item, index) in users" :key="index"><button class="user" @click.prevent="sendConversationRequest(item)">{{item}}</button></li></ul>
      <ConformationPrompt v-if="pendingRequest" user="test" />
  </div>
</template>

<script>
// import Vue from 'vue'
// import VueSocketIO from 'vue-socket.io'

import ConformationPrompt from '../components/conformation_prompt'

export default {
    name: 'Jitsi',
    components: {
        ConformationPrompt
    },
    data(){
        return{
            username: this.$route.fullPath.substr(this.$route.fullPath.lastIndexOf('?')+1) || null,
            message: "",
            users: [],
            pendingRequest: false
        }
    },
    beforeMount(){
        this.socket = this.$nuxtSocket({
            channel: '/index'
        })
        this.socket.on('requestConversation', (msg, cb) => {
            alert("hello");
        })
    },
    async mounted(){
        try{
            var response = await this.$axios(`http://localhost:5000/testlogin/${this.username}`);
            this.users = response.data.online;
            await this.socket.emit('register', {
                data: {username: this.username}
            }, (resp) => { })
        }catch(exception){
            // alert(exception);
            this.message = `login failed for ${this.username}`
        }
    },
    sockets: {
        connect() {
            alert("socket was connected");
        },
        requestConversation(data){
            alert(data);
            this.message = "ermm"
            this.pendingRequest = true;
        }
    },
    
    methods: {
        sendConversationRequest: async function(withWho){
            console.log("hello world");
            if(this.username === withWho){
                this.message = "you cannot click on yourself";
                return;
            }
            this.message = "";
            await this.$axios(`http://localhost:5000/requestconversation/${this.username}/${withWho}`);
        }
    }
   
};
</script>

<style>
</style>