<template>
  <div class="main">
      <h1>{{message}}</h1>
      <ul><li v-for="(item, index) in users" :key="index"><button class="user" @click.prevent="requestConversation(item)">{{item}}</button></li></ul>
      <ConformationPrompt v-if="pendingRequest" user="test" />
  </div>
</template>

<script>
// import Vue from 'vue'
// import VueSocketIO from 'vue-socket.io'

import ConformationPrompt from '../components/conformation_prompt'
import Vue from 'vue'
import moment from 'moment'
import io from 'socket.io-client'


export default {
    name: 'Jitsi',
    data(){
        return{
            username: this.$route.fullPath.substr(this.$route.fullPath.lastIndexOf('?')+1) || null,
            message: "",
            users: [],
            pendingRequest: false
        }
    },
    async mounted(){

        try{
            var response = await this.$axios(`http://localhost:5000/testlogin/${this.username}`);
            this.users = response.data.online;
            Vue.prototype.$moment = moment;
            Vue.prototype.$socket = io(`http://localhost:4001`);
            this.$socket.emit('register', ({data: {username: this.username}}))

        }catch{
            this.message = `login failed for ${this.username}`
        }

        this.$socket.on('requestConversation', (data) => {
            this.pendingRequest = true;
        });
        

        
    },
    components: {
        ConformationPrompt
    },
    methods: {
        requestConversation: async function(withWho){
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