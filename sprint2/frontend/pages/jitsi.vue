<template>
  <div class="main kamerpage">
    

    <TimedInfoMessageBox v-if="info" :message="info" time="2"/>
    <div class="kamer">
      <UserIcon :onUserClick="conversations().sendRequest" :items="users"></UserIcon>
    </div>
    <Sidebar roomName="templateRoom01" :items="users"></Sidebar>

    <Conference
        class="absolute-center"
        v-show="conversation.room !== ''"
        :user="this.username"
        :withWho="conversation.user"
        :room="conversation.room"
    />

    <ConformationPrompt 
        class="absolute-center" 
        v-show="conversationRequest.pending"
        :onAccept="conversations().acceptRequest"
        :onDecline="conversations().declineRequest"
        :user="conversationRequest.user" 
    />
      
  </div>
</template>

<script>
import moment from 'moment';


export default {
    name: 'Jitsi',
    data(){
        return{
            username: this.$route.query.username,
            info: "", //when updating info the timed message box will automatically update
            users: [
                
            ],
            socket: null,

            conversation: {
                room: "",
                user: "",
            },
            
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
            
            this.users = [];
            for(var online of data.online){
                this.users.push({user: online});
            }
        });

        this.socket.on("requestAccepted", (data) => {
            this.info = `${data.user} accepted your conversation request`;
            this.conversation.user = data.user;
            this.conversation.room = data.room;
        });

        this.socket.on("requestDeclined", (data) => {
            this.info = `${data.user} declined your conversation request`;
        });

        //The server doesn't know what user is using this socket, tell the server.
        this.socket.emit("register", {username: this.username});

        for(var online of response.data.online){
            this.users.push({user: online});
        }
    },
    methods: {

        //Nested functions are not possible. This is the next best thing.
        conversations: function(){
            //We have to save the 'this' in a variable because the context
            //is different for these nested functions.
            var self = this;
            
            //Return all functions as json.
            return{
                sendRequest: async function(withWho){
                    console.log("hello world");
                    if(self.username === withWho.user){
                        self.info = "you cannot invite yourself to a conversation";
                        return;
                    }
                    self.message = "";
                    await self.$axios(`http://localhost:5000/requestconversation/${self.username}/${withWho.user}`);
                },
                
                acceptRequest: async function(withWho){
                    var response = undefined;
                    try{
                        response = await self.$axios(`http://localhost:5000/acceptconversation/${self.username}/${withWho}`);

                        self.conversationRequest.pending = false;
                        self.conversationRequest.user = "none";

                        self.conversation.user = withWho;
                        self.conversation.room = response.data.room;

                        //Automatically decline all other requests that were sent after the accepted one.

                        for(var pendingUser in self.conversationRequest.pendingUsers){
                            this.declineRequest(pendingUser);
                        }
                        // self.conversationRequest.pendingUsers.forEach(element => {
                        //     this.declineRequest(element);
                        // });
                        self.conversationRequest.pendingUsers = [];
                        
                    }catch(error){
                        self.conversationRequest.pending = false;
                        self.conversationRequest.user = "none";
                        self.info = error;
                        // self.info = "something went wrong with accepting the request";
                    }
                },
                declineRequest: async function(withWho){
                    var response = undefined;
                    response = await self.$axios(`http://localhost:5000/declineconversation/${self.username}/${withWho}`);
                    if(self.conversationRequest.pendingUsers.length > 0){
                        self.conversationRequest.user = self.conversationRequest.pendingUsers[0];
                        self.conversationRequest.pendingUsers.shift();
                        return;
                    }
                    self.conversationRequest.pending = false;
                    self.conversationRequest.user = "none";
                    // try{
                        
                    // }catch(error){
                    //     if(response && response.data.message){
                    //         self.info = response.data.message;
                    //     }else{
                    //         self.info = "something went wrong";
                    //     }
                    // }
                    
                },
                
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