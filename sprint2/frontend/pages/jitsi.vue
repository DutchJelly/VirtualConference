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

// import Vue from 'vue';
import moment from 'moment';


export default {
    name: 'Jitsi',
    data(){
        return{
            username: this.$route.query.username,
            message: "",
            users: [],
            pendingRequest: false,
            socket: null,
        };
    },
    async mounted(){
        var response = await this.$axios(
            `http://localhost:5000/testlogin/${this.username}`
        );

        this.socket = this.$nuxtSocket({
            name: "home",
        });
        //Incoming socket events:
        this.socket.on("requestConversation", (data) => {

        });
        this.socket.on("message", (data) => {
            console.log("Received this message from the server:", data);
        });

        //The server doesn't know what user is using this socket, tell the server.
        this.socket.emit("register", {username: this.username});

        this.users = response.data.online;
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