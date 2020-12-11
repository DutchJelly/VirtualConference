<template>
    <div class="main kamerpage">
        <div class="kamer">
            <UserSpace 
                class="userspace" 
                :users="users"
                :groups="groups" 
                :gridCols=6
                :gridSpacing=1
                :onUserClick="conversations().startConversation"
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
            :room="conversation.room"
            :openConference="activeConference"
            :typeConversation="this.conversation.type"
            :isModerator="this.isModerator"
            :onLeaveConference="leaveConversation()"
        />

        <ConformationPrompt 
            class="absolute-center" 
            v-if="conversationRequest.pending === true"
            :onAccept="() => conversations().requestResponse(true)"
            :onDecline="() => conversations().requestResponse(false)"
            :user="conversationRequest.user" 
            :typeConversation="this.conversation.type"
        />

        <TypeConversationPrompt 
            class="absolute-center" 
            v-if="conversationRequest.active === true"
            :onClosedConversation="() => sendRequest('closed')"
            :onOpenConversation="() => sendRequest('open')"
            :onPrivateConversation="() => sendRequest('private')" 
        />          
    </div>
</template>

<script>
import moment from 'moment';
import { mapState } from 'vuex';
import TypeConversationPrompt from '../components/typeCoversationPrompt.vue';

export default {
    middleware: 'auth',
    components: {
        TypeConversationPrompt,
    },
    computed: {
        ...mapState({
            user: 'user'
        })
    },
    beforeRouteLeave (to, from, next){
        //TODO make sure that the backend knows that the user left
        console.warn('leaving roomview page');
    },

    data() {
        return {
            info: "", //when updating info the timed message box will automatically update
            room: {
                roomId: this.$route.query.room,
                users: [],
                groups: [],
            },

            socket: null,
            activeConference: false, //Showing conference window if activeConference is true.
            //TODO: ergens moet de moderator gecheckt worden

            groupId: undefined,
            sentToId: undefined,
            requestId: undefined,

            conversation: {
                groupId: "",
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
        const sessionKey = this.$store.getters.getToken;
        setupSocket();
        try {
            const res = await this.$axios.post("http://localhost:5000/roomObject", {
                sessionKey,
                roomId: room.roomId
            });
            this.room = res;
        } catch(error) {
            this.info = "(error) cannot request room data";
        }
    },
    methods: {
        setupSocket(){
            this.socket = this.$nuxtSocket({name: "home"});

            const sessionKey = this.$store.getters.getToken;
            //The server doesn't know what user is using this socket, tell the server.
            this.socket.emit("register", {sessionKey});



            //TODO: snap nog niet helemaal wat we met deze gegevens moeten doen
            this.socket.on("directrequest", (data) => {
                if(!data || !data.id || !data.type || !data.senderId || !data.sentToId) return;

                if(this.userId === data.sentToId){
                    this.conversationRequest.user = data.senderId;
                    if(this.conversationRequest.pending) {
                        if(!this.conversationRequest.pendingUsers.includes(this.conversationRequest.user)){
                            this.conversationRequest.pendingUsers.push();
                            this.info = `You received an conversation request from ${requestSentToId}.`;
                        }
                        return;
                    }
                    this.conversation.type = data.type;
                    this.requestId = data.id;
                    this.conversationRequest.pending = true;
                    this.info = `You received an conversation request from ${requestSentToId}.`;
                }
            });

            //Showing message on the page of the user who's request is been declined.
            this.socket.on("requestDeclined", (data) => {
                if(!data || !data.message) return;
                this.info = `${data.message}`;
            });

            //TODO: weet niet of dit klopt
            //If the request is accepted, show the conference window
            this.socket.on("requestaccepted", (data) => {
                if(!data || !data.groupId || !data.roomCode || !data.memberIds || !data.typeConversation) return;
                
                for(let member in data.memberIds){
                    if(member === this.userId && !this.activeConference){
                        this.conversation.room = data.roomCode;
                        this.conversation.type = data.typeConversation;
                        this.groupId = data.groupId;
                        this.activeConference = true;
                    }
                }
            });

            //TODO: de backend was nog niet klaar
            //deze emit wordt nog niet gedaan
            //maar staat wel in de API layout
            //snap niet helemaal wat hier moet gebeuren
            this.socket.on("groupMemberUpdate", (data) => {
                if(!data || !data.groupId || !data.memberIds) return;
                for(let member in data.memberIds){
                    if(member === this.userId){
                        self.info = "A new member joined or leaved the conversation";
                    }
                }
            });

            //TODO: snap nog niet helemaal wat hier moet gebeuren
            //Wordt niet in de API layout gespecificieerd
            this.socket.on("joinrequest", (data) => {
                if(!data || !data.groupId || !data.memberIds) return;
                
                if(this.userId === data.senderId){

                }
            });

            //TODO: de backend was nog niet klaar
            //Staat in de API layout, maar niet in de backend
            this.socket.on("conversationrequest", (data) => {
                //TODO: nog iets doen met data.requestId, data.User.userId, data.User.userName, data.conversationType
            });
        },

        handleChange(event) {
            const { value } = event.target;
            this.value = value;
        },

        //Nested functions are not possible. This is the next best thing.
        conversations() {
            return {
            //Return all functions as json.
                //The user try to start a conversation with an another user (withWho)
                startConversation: (withWho) => {
                    console.log("start conversation");
                    //TODO: moet nog veranderen naar user.id
                    this.sentToId = withWho.user;
                    if(this.userId === this.sentToId) {
                        this.info = "you cannot invite yourself to a conversation";
                        return;
                    };
                    this.conversationRequest.active = true;
                },

                //The request which is send to the user from other user is been accepted or declined.
                requestResponse: async (res) => {
                    let sessionKey = window.localStorage.getItem('token');
                    console.log(`sessionkey: ${sessionKey}`);
                    console.log("accept request");
                    let response = undefined;
                    try {
                        response = await this.$axios("http://localhost:5000/conversationrequestresponse", {
                            sessionKey,
                            requestId: this.requestId,
                            response: res
                        });

                        if (res === true){
                            this.conversation.room = response.data.roomCode;

                            //Automatically decline all other requests that were sent after the accepted one.
                            for(let pendingUser in this.conversationRequest.pendingUsers) this.declineRequest(pendingUser);
                            this.conversationRequest.pendingUsers = [];

                            //TODO: nog iets doen met de callData
                        } else {
                            this.info = response.data.message;
                            if(this.conversationRequest.pendingUsers.length > 0){
                                this.conversationRequest.user = this.conversationRequest.pendingUsers[0];
                                this.conversationRequest.pendingUsers.shift();
                            };
                        }
                        this.conversationRequest.pending = false;
                        this.conversationRequest.user = "none";

                    } catch(error) {
                        this.conversationRequest.pending = false;
                        this.conversationRequest.user = "none";
                        this.info = error;
                        console.log("error request");
                    }
                }
            }
        },
        //Send a request to the user
        async sendRequest(type) {
            const sessionKey = state.user.sessionKey;
            console.log(`sessionkey: ${sessionKey}`);

            let response = undefined;
            console.log("request");
            try {
                this.conversation.type = type;
                this.conversationRequest.active = false;
                response = await this.$axios("http://localhost:5000/requestconversation", {
                    sessionKey,
                    userId: this.sentToId,
                    conversationType: type 
                });
                this.info = response.data.message;
            } catch(error) {
                this.info = error;
                console.log("error request");
            }
        },
        //Join an existing group conversation
        //TODO: voor de backend is nog geen test geschreven
        async joinConversation(group) {
            const sessionKey = state.user.sessionKey;
            console.log(`sessionkey: ${sessionKey}`);
            let response = undefined;
            console.log("join conversation");
            try {
                response = await this.$axios("http://localhost:5000/joinconversation", {
                    sessionKey,
                    groupId: group.group.id
                });
                //TODO: nog iets doen met response.data.memberIds
                //TODO: checken of het klopt
                if(!response || !response.data){
                    this.info = "response data is not defined";
                    return;
                }
                if(!response.data.message){
                    if(!response.data.groupId || !response.data.roomCode ||
                    !response.data.memberIds || !response.data.typeConversation) return;

                    if(response.data.typeConversation === "open"){
                        this.groupId = response.data.groupId;
                        this.conversation.room = response.data.roomCode;
                        this.activeConference = true;
                    }
                } else {
                    this.info = response.data.message;
                }
            } catch(error) {
                this.info = error;
                console.log("error join conversation");
            }
        },
        //The user leaves the conversation
        async leaveConversation() {
            let sessionKey = window.localStorage.getItem('token');
            console.log(`sessionkey: ${sessionKey}`);
            try {
                await self.$axios("http://localhost:5000/leaveconversation", {
                    sessionKey,
                    groupId: this.groupId,
                });
                this.activeConference = false;
            } catch(error) {
                self.info = error;
                console.log("error leave conversation");
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
