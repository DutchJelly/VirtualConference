<template>
  <div class="main">
    
    <ConformationPrompt 
        class="absolute-center" 
        v-if="conversationRequest.pending"
        :onAccept="conversations().acceptRequest"
        :onDecline="conversations().declineRequest"
        :user="conversationRequest.user" 
    />

    <TimedInfoMessageBox v-if="info" :message="info" time="5"/>
    <ul>
        <li v-for="(item, index) in users" :key="index">
            <button class="user" @click.prevent="conversations().sendRequest(item)"> 
                {{item}} 
            </button>
        </li>
    </ul>
      
  </div>
</template>

<script>
import moment from 'moment';


export default {
    name: 'Jitsi',
    data(){
        return{
            username: this.$route.query.username,
            info: "",
            users: [],
            socket: null,
            conversationRequest: {
                pending: false,
                user: "none",
                pendingUsers: []
            }
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
            if(!data || !data.user) return;

            if(this.conversationRequest.pending){
                if(!this.conversationRequest.pendingUsers.includes(this.conversationRequest.user)){
                    this.conversationRequest.pendingUsers.push(data.user);
                    this.info = `You received an conversation request from ${data.user}.`;
                }
                return;
            }
            this.conversationRequest.user = data.user;
            this.conversationRequest.pending = true;
            this.info = `You received an conversation request from ${data.user}.`;
        });

        //Temporary way to handle users 'loggin on'
        this.socket.on("testlogin", (data) => {
            if(!data || !data.online) return;

            this.users = data.online;
        });

        //The server doesn't know what user is using this socket, tell the server.
        this.socket.emit("register", {username: this.username});

        this.users = response.data.online;
    },
    methods: {

        //Nested functions are not possible. This is the next best thing.
        conversations: function(){
            var self = this;
            
            //Return all functions as json.
            return{
                sendRequest: async function(withWho){
                    console.log("hello world");
                    if(self.username === withWho){
                        self.message = "you cannot click on yourself";
                        return;
                    }
                    self.message = "";
                    await self.$axios(`http://localhost:5000/requestconversation/${self.username}/${withWho}`);
                },
                acceptRequest: function(withWho){
                    self.socket.emit("acceptJitsiRequest", {user: self.username, withWho});
                    self.conversationRequest.pending = false;
                    self.conversationRequest.user = "none";

                    //Automatically decline all other requests that were sent after the accepted one.
                    self.conversationRequest.pendingQueue.forEach(element => {
                        this.declineRequest(element);
                    });
                    self.conversationRequest.pendingQueue = [];
                },
                declineRequest: function(withWho){
                    self.socket.emit("declineJitsiRequest", {user: self.username, withWho});
                    if(self.conversationRequest.pendingQueue.length){
                        self.conversationRequest.user = pendingQueue[0];
                        pendingQueue.shift();
                        return;
                    }
                    self.conversationRequest.pending = false;
                    self.conversationRequest.user = "none";
                }
            }
        }
    }
};
</script>

<style>
.absolute-center{
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%)
}

</style>