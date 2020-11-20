<template>
    <div class="main kamerpage">
        <div class="kamer">
            <UserSpace 
                class="userspace" 
                :users="users"
                :groups="groups" 
                :gridCols=6
                :gridSpacing=1
                :onUserClick="conversations().checkType"
                filter=""
                ref="userspace"
            />
            <Sidebar 
                class="sidebar" 
                roomName="templateRoom01" 
                :items="users"
            />
        </div>

        <TimedInfoMessageBox 
            v-if="info" 
            :message="info" 
            :time=3 
        />

        <Conference
            class="absolute-center"
            :user="this.username"
            :withWho="conversation.user"
            :room="conversation.room"
            :openConference="activeConference"
            :typeConversation="this.conversation.type"
            :isModerator="this.isModerator"
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
    data() {
        return {
            username: this.$route.query.username,
            info: "", //when updating info the timed message box will automatically update
            users: [],
            groups: [],
            socket: null,
            activeConference: false, //Showing conference window if activeConference is true.
            typeConversationUser: "", //The username which the current user is starting a conversation with.
            isModerator: false, //If the current user is a moderator.

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
            },

            value: "",
        };
    },
    async mounted() {
        let response = undefined;
        try {
            response = await this.$axios(`http://localhost:5000/testlogin/${this.username}`);
        } catch(error) {
            console.log(error);
        }

        this.socket = this.$nuxtSocket({name: "home"});

        //Checks which type conversation is running and which function and/or component should be active.
        this.socket.on("typeConversation", (data) => {
            if(!data || !data.withwho) return;

            if(data.type === "private") {
                this.info = `${data.withwho} is already in a private conversation, you cannot join`;
            } else if(data.type === "open") {
                this.info = "It is an open conversation, you can join";
                this.typeConversationUser = data.withwho;
                this.joinOpenConversation();
            } else if(data.type === "closed") {
                this.info = "It is a closed conversation, you are asking permission to join";
                this.typeConversationUser = data.withwho;
                this.joinClosedConversation();
            } else if(data.type === "none") {
                this.conversationRequest.active = true;
                this.typeConversationUser = data.withwho;
                this.info = `You can chose which type conversation you want to start with ${data.withwho}`;
            }
        });

        //Incoming socket events.
        this.socket.on("requestConversation", (data) => {
            if(!data || !data.user) return;

            if(this.conversationRequest.pending) {
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

        //Temporary way to handle users 'loggin on'.
        this.socket.on("testlogin", (data) => {
            if(!data || !data.online) return;
            
            this.users = [];
            for(let online of data.online) {
                //Users can't log in twice.
                this.users.push({user: online, id: online});
            }
        });

        //Showing conference window on the page of the user who send a request.
        this.socket.on("requestAcceptedTo", (data) => {
            this.conversation.user = data.user;
            this.conversation.room = data.room;
            this.activeConference = true;
            this.info = `${data.user} accepted your conversation request`;
        });

        //Showing conference window on the page of the user who accept a request.
        this.socket.on("requestAcceptedFrom", (data) => {
            this.conversation.user = data.withwho;
            this.conversation.room = data.room;
            this.activeConference = true;
            this.info = `You accepted conversation request from ${data.withwho}`;
        });

        //Showing conference window on the page of the user who joined an already existed open conversation.
        this.socket.on("joinOpenConversation", (data) => {
            this.conversation.user = data.user;
            this.conversation.room = data.room;
            this.activeConference = true;
            this.info = `You joined open conversation`;
        });

        //Showing message on the page of the user who's request is been declined.
        this.socket.on("requestDeclined", (data) => {
            this.info = `${data.user} declined your conversation request`;
        });

        //Removing conference on the page of the user who has leaved the conversation.
        this.socket.on("leaveConversation", (data) => {
            this.info = `${data.user} leaves conversation`;
            if(data.user === this.username){
                this.activeConference = false;
            }
        });

        //The server doesn't know what user is using this socket, tell the server.
        this.socket.emit("register", {username: this.username});

        for(let online of response.data.online){
            this.users.push({user: online, id: online});
        }
        this.groups = response.data.groups;
    },
    methods: {        
        handleChange(event) {
            const { value } = event.target;
            this.value = value;
        },

        //Nested functions are not possible. This is the next best thing.
        conversations: function() {
            //We have to save the 'this' in a variable because the context
            //is different for these nested functions.
            let self = this;
            
            //Return all functions as json.
            return {
                //Checks if withWho is already in a conversation. If the user is already in a conversation, checks which type conversation it is.
                checkType: async function(withWho) {
                    console.log("send request");
                    if(self.username === withWho.user) {
                        self.info = "you cannot invite yourself to a conversation";
                        return;
                    };
                    try {
                        await self.$axios(`http://localhost:5000/typeconversation/${self.username}/${withWho.user}`);
                    } catch(error) {
                        self.info = error;
                        console.log("error send request");
                    }
                },
                
                //The request which is send to the user from withWho is been accepted.
                acceptRequest: async function(withWho){
                    console.log("accept request");
                    let response = undefined;
                    try {
                        response = await self.$axios(`http://localhost:5000/acceptconversation/${self.username}/${withWho}`);

                        self.conversationRequest.pending = false;
                        self.conversationRequest.user = "none";

                        self.conversation.user = withWho;
                        self.conversation.room = response.data.room;

                        //Automatically decline all other requests that were sent after the accepted one.
                        for(let pendingUser in self.conversationRequest.pendingUsers){
                            this.declineRequest(pendingUser);
                        }
                        self.conversationRequest.pendingUsers = [];
                        
                    } catch(error) {
                        self.conversationRequest.pending = false;
                        self.conversationRequest.user = "none";
                        self.info = error;
                        console.log("error accept request");
                    }
                },

                //The request which is send to the user from withWho is been declined.
                declineRequest: async function(withWho) {
                    console.log("decline request");
                    let response = undefined;
                    try {
                        response = await self.$axios(`http://localhost:5000/declineconversation/${self.username}/${withWho}`);
                        if(self.conversationRequest.pendingUsers.length > 0){
                            self.conversationRequest.user = self.conversationRequest.pendingUsers[0];
                            self.conversationRequest.pendingUsers.shift();
                            return;
                        };
                        self.conversationRequest.pending = false;
                        self.conversationRequest.user = "none";
                    } catch(error) {
                        self.info = error;
                        console.log("error decline request");
                    }                  
                }       
            }
        },

        //Send a request to typeConversationUser from the current user to start a closed conversation.
        closedConversation: async function() {
            let self = this;
            console.log("closed conversation");
            try {
                self.conversation.type = "closed";
                self.conversationRequest.active = false;
                await self.$axios(`http://localhost:5000/requestconversation/${self.username}/${self.typeConversationUser}/${self.conversation.type}`);
            } catch(error) {
                self.info = error;
                console.log("error closed conversation");
            }
        },

        //Send a request to typeConversationUser from the current user to start a open conversation.
        openConversation: async function() {
            let self = this;
            console.log("open conversation");
            try {
                self.conversation.type = "open";
                self.conversationRequest.active = false;
                await self.$axios(`http://localhost:5000/requestconversation/${self.username}/${self.typeConversationUser}/${self.conversation.type}`);
            } catch(error) {
                self.info = error;
                console.log("error open conversation");
            }
        },

        //Send a request to typeConversationUser from the current user to start a private conversation.
        privateConversation: async function() {
            let self = this;
            console.log("private conversation");
            try {
                self.conversation.type = "private";
                self.conversationRequest.active = false;
                await self.$axios(`http://localhost:5000/requestconversation/${self.username}/${self.typeConversationUser}/${self.conversation.type}`);
            } catch(error) {
                self.info = error;
                console.log("error private conversation");
            }
        },

        //Join an open conversation with typeConversationUser.
        joinOpenConversation: async function() {
            let self = this;
            console.log("join open conversation");
            try {
                self.conversation.type = "open";
                await self.$axios(`http://localhost:5000/joinopenconversation/${self.username}/${self.typeConversationUser}`);
            } catch(error) {
                self.info = error;
                console.log("error join open conversation");
            }
        },

        //Join a closed conversation with typeConversationUser by sending a request to the typeConversationUser.
        joinClosedConversation: async function() {
            let self = this;
            console.log("join closed conversation");
            try {
                self.conversation.type = "closed";
                await self.$axios(`http://localhost:5000/requestconversation/${self.username}/${self.typeConversationUser}/${self.conversation.type}`);
            } catch(error) {
                self.info = error;
                console.log("error join closed conversation");
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
  width: 100%;
  height: 100%;
}

.kamer{
  @apply bg-white rounded shadow-lg p-5;
  height: 100%;
  width: 100%;
}

.userspace{
    min-height: 100%;
    grid-area: userspace;
}

.sidebar{
    grid-area: sidebar;
}

.kamer{
    display: grid;
    grid-template-columns: 8fr 2fr;
    grid-template-areas: "userspace sidebar";
    width: 100%;
    height: 100%;
}

</style>
