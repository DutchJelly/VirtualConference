<template>
  <div class="main">
      <h1>Jitsi</h1>
      <ConformationPrompt user="test" />
  </div>
</template>

<script>
// import Vue from 'vue'
// import VueSocketIO from 'vue-socket.io'

import ConformationPrompt from '../components/conformation_prompt'
import Vue from 'vue'
import VueSocketIO from 'vue-socket.io'


export default {
    name: 'Jitsi',

    mounted(){
        
        Vue.use(new VueSocketIO({
            debug: true,
            connection: 'localhost:5000',
            vuex: {
                store: this.$store,
                actionPrefix: 'SOCKET_',
                mutationPrefix: 'SOCKET_'
            },
        }))

        // this.$socket.onConnect((x) => console.log("hello world"));

        this.$socket.on('connect', socketId => {
            console.log("connected");
        });

        this.$socket.on('test', socketId => {
            console.log("test!!");
        })

    },
    components: {
        ConformationPrompt
    }
};
</script>

<style>
</style>