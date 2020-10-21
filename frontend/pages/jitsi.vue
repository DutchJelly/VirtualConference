<template>
    <div class="main kamerpage">
        <div class="kamer">
            <TimedInfoMessageBox v-if="info" :message="info" time="5"/>
            <UserIcon 
                :items="users" 
                :onUserClick="conversations().sendRequest"
            />
        </div>
        <Sidebar roomName="templateRoom01" :items="users"/>
        
        <Conference
            class="absolute-center"
            :user="this.username"
            :withWho="conversation.user"
            :room="conversation.room"
            :open_conference="active_conference"
            :typeConversation="this.conversation.type"
            :role="user.role"
        />

        <ConformationPrompt 
            class="absolute-center" 
            v-if="conversationRequest.pending === true"
            :onAccept="conversations().acceptRequest"
            :onDecline="conversations().declineRequest"
            :user="conversationRequest.user" 
            :typeConversation="this.conversation.type"
        />

        <TypeConversationPrompt 
            class="absolute-center" 
            v-if="conversationRequest.active === true"
            :onClosedCoversation="closedConversation"
            :onOpenConversation="openConversation"
            :onPrivateConversation="privateConversation" 
        />          
    </div>
</template>

<script>
import moment from 'moment';
import TypeConversationPrompt from '../components/typeCoversationPrompt.vue';

export default {
    name: 'Jitsi',
    components: {
        TypeConversationPrompt,
    },
    data(){
        return{
            username: this.$route.query.username,
            info: "", //when updating info the timed message box will automatically update
            users: [],
            socket: null,
            active_conference: false,
            typeConversationUser: "",
            user_role: "participant",

            conversation: {
                room: "",
                user: "",
                type: "",
            },
            
            conversationRequest: {
                pending: false,
                active: false,
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

        this.socket.on("typeConversation", (data) => {
            if(!data || !data.withwho) return;

            if(data.type === "private"){
                this.info = `${data.withwho} is already in a private conversation, you cannot join`;
            }
            else if(data.type === "open"){
                this.info = "It is an open conversation, you can join";
                this.typeConversationUser = data.withwho;
                this.conversation.type = data.type;
                this.joinOpenConversation();
            }
            else if(data.type === "closed"){
                this.info = "It is a closed conversation, you are asking permission to join";
                this.conversation.type = data.type;
                this.typeConversationUser = data.withwho;
                this.joinClosedConversation();
            }
            else if(data.type === "none"){
                this.conversationRequest.active = true;
                this.typeConversationUser = data.withwho;
                this.info = `You can chose which type conversation you want to start with ${data.withwho}`;
            }
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
            this.conversation.type = data.type;
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

        this.socket.on("requestAcceptedTo", (data) => {
            this.conversation.user = data.user;
            this.conversation.room = data.room;
            this.active_conference = true;
            this.info = `${data.user} accepted your conversation request`;
        });

        this.socket.on("requestAcceptedFrom", (data) => {
            this.conversation.user = data.withwho;
            this.conversation.room = data.room;
            this.active_conference = true;
            this.info = `You accepted conversation request from ${data.withwho}`;
        });

        this.socket.on("joinOpenConversation", (data) => {
            this.conversation.user = data.user;
            this.conversation.room = data.room;
            this.active_conference = true;
            this.info = `You joined open conversation`;
        })

        this.socket.on("requestDeclined", (data) => {
            this.info = `${data.user} declined your conversation request`;
        });

        this.socket.on("leaveCoversation", (data) => {
            this.info = `${data.user} leaves conversation`;
            if(data.user === this.username){
                this.active_conference = false;
            }
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
                    };
                    self.message = "";
                    await self.$axios(`http://localhost:5000/typeconversation/${self.username}/${withWho.user}`);
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
                }       
            }
        },
        closedConversation: async function(){
            this.conversation.type = "closed";
            this.conversationRequest.active = false;
            await this.$axios(`http://localhost:5000/requestconversation/${this.username}/${this.typeConversationUser}/${this.conversation.type}`);
        },
        openConversation: async function(){
            this.conversation.type = "open";
            this.conversationRequest.active = false;
            await this.$axios(`http://localhost:5000/requestconversation/${this.username}/${this.typeConversationUser}/${this.conversation.type}`);
        },
        privateConversation: async function(){
            this.conversation.type = "private";
            this.conversationRequest.active = false;
            await this.$axios(`http://localhost:5000/requestconversation/${this.username}/${this.typeConversationUser}/${this.conversation.type}`);
        },
        joinOpenConversation: async function(){
            await this.$axios(`http://localhost:5000/joinopenconversation/${this.username}/${this.typeConversationUser}`);
        },
        joinClosedConversation: async function(){
            var response = undefined;
            response = await this.$axios(`http://localhost:5000/requestconversation/${this.username}/${this.typeConversationUser}/${this.conversation.type}`);

            this.conversationRequest.pending = false;
            this.conversationRequest.user = "none";

            this.conversation.user = withWho;
            this.conversation.room = response.data.room;

            //Automatically decline all other requests that were sent after the accepted one.

            for(var pendingUser in this.conversationRequest.pendingUsers){
                this.declineRequest(pendingUser);
            }
            // self.conversationRequest.pendingUsers.forEach(element => {
            //     this.declineRequest(element);
            // });
            this.conversationRequest.pendingUsers = [];
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