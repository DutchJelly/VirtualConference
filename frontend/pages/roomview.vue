<template>
    <div class="main kamerpage">
        <div class="kamer">
            <UserSpace 
                class="userspace" 
                :users="users"
                :groups="groups" 
                :gridCols=14
                :gridSpacing=1
                :onUserClick="openTypeConversationPrompt"
                :onGroupClick="joinConversation"
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
            :conversation="currentConversation"
            :onLeaveConversation="() => leaveConversation()"
        />

        <ConformationPrompt 
            class="absolute-center" 
            v-if="incomingRequests.length"
            :onAccept="() => requestResponse(true)"
            :onDecline="() => requestResponse(false)"
            :message="getCurrentRequestMessage()"
        />

        <TypeConversationPrompt 
            class="absolute-center" 
            v-if="ongoingTypeConversationPrompt"
            :onClosedConversation="() => sendDirectRequest('closed')"
            :onOpenConversation="() => sendDirectRequest('open')"
            :onPrivateConversation="() => sendDirectRequest('private')"
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

    //Make sure that the user leaves the room when the route changes (the nuxt router
    //will change pages with js, so the window.beforeunload won't work)
    async beforeRouteLeave (to, from, next){
        await this.leaveRoom();
        next();
    },

    //Make sure that when the user forcefully reloads or clicks away the page the user also 
    //leaves the room.
    async created() {
        window.addEventListener('beforeunload', async () => await this.leaveRoom());
    },
    async beforeDestroy() {
        //This is still untested and this might not even make a difference.
        window.removeEventListener('beforeunload', async () => await this.leaveRoom());
    },

    data() {
        return {
            //When this updates, the info box pops up automatically.
            info: "",

            //The socket that's connected to the backend.
            socket: null,

            //The room id, that is passed in the url.
            roomId: this.$route.query.roomId,

            //The users in the room (set in the mounted lifecycle, updated by socket events)
            users: [],
            //The groups in the room (set in the mounted lifecycle, updated by socket events)
            groups: [],
            //The code of the conversation. Currently this is not used.
            roomCode: null,

            //A conversation contains this data:
            // groupId: number,
            // roomCode: string,
            // memberIds: number[],
            // typeConversation: string
            currentConversation: null,
            
            //This array contains all incoming requests. These could be one of the 2 following types:
            //Direct requests contain this data:
            // id: number,
            // type: string,
            // senderId: number,
            // sentToId: number
            //Join requests contain this data:
            // id: number,
            // groupId: number,
            // senderId: number
            incomingRequests: [],

            //If a type prompt is open, this'll store the user id that is clicked. To be more precise, a prompt
            //will open when this is set.
            ongoingTypeConversationPrompt: null
        };
    },
    async mounted() {
        //Setup sockets and get user token.
        const sessionKey = this.$store.getters.getToken;
        this.setupSocket();

        //Join the room and set all data.
        try {
            const res = await this.$axios.post("http://localhost:5000/joinRoom", {
                sessionKey,
                roomId: this.roomId
            });
            if(res.data?.users)
                this.users = res.data.users;
            if(res.data?.groups)
                this.groups = res.data.groups;
        } catch(error) {
            showError(error, "(error) cannot join the room");
        }
    },
    methods: {
        //Register socket, and set all event handlers.
        setupSocket(){
            this.socket = this.$nuxtSocket({name: "home"});

            const sessionKey = this.$store.getters.getToken;
            //The server doesn't know what user is using this socket, tell the server.
            this.socket.emit("register", {sessionKey});

            //Handle anything that changes in your room.
            this.socket.on("roomupdate", (data) => {
                if(data.users)
                    this.users = data.users;
                else this.users = [];
                
                if(data.groups)
                    this.groups = data.groups;
                else this.groups = [];
            });

            //Handle requests for starting a new group.
            this.socket.on("directrequest", (data) => {
                if(!data || data.id === null || !data.type || data.senderId === null || data.sentToId === null) {
                    console.error("unexpected data type of received direct request");
                    return;
                }
                this.incomingRequests.push(data);
                this.info = `Received a direct request.`;
            });

            //Handle requests for joining the current user's existing group.
            this.socket.on("joinrequest", (data) => {
                if(!data || data.groupId === undefined) {
                    console.error("unexpected data type of received join request");
                    return;
                }
                this.incomingRequests.push(data);
                this.info = `Received a join request.`;
            });

            //Handle request declines.
            this.socket.on("requestdeclined", (data) => {
                if(!data || !data.message) return;
                this.info = `${data.message}`;
            });

            //Handle request accepting.
            this.socket.on("requestaccepted", (data) => {
                if(!data || !data.groupId || !data.roomCode || !data.memberIds || !data.typeConversation) return;
                this.currentConversation = data;
            });
        },
        
        //Get a user in the room by id, undefined if not found.
        getUserById(id){
            return this.users.find(x => x.id === id);
        },

        //Gets the request message of the first incoming request. This could either be a join request or a direct request, so the
        //message will change accordingly.
        getCurrentRequestMessage(){
            if(!this.incomingRequests.length) 
                return null;

            const request = this.incomingRequests[0];
            const user = this.getUserById(request.senderId);
            if(!user) console.error("cannot find user that sent a request");
            if(request.groupId !== undefined) { 
                return `User ${user?.username} (${user?.email}) wants to join your conversation. Do you accept?`;
            }
            return `User ${user?.username} (${user?.email}) wants to start a ${request.type} conversation with you. Do you accept?`;
        },

        //Open a prompt where the type is asked. This prompt opens when setting ongoingTypeConversationPrompt.
        openTypeConversationPrompt(withWho) {
            if(withWho?.id === this.$store.getters.getUser.id) {
                this.info = "You cannot start a conversation with yourself.";
                return;
            }

            if(this.ongoingTypeConversationPrompt) {
                this.info = "You already have a prompt open.";
                return;
            }
            this.ongoingTypeConversationPrompt = withWho;
        },

        //Respond to the first request with true or false. If silent is set to true, it'll not show info messages. 
        async requestResponse (res, silent) {
            if(!this.incomingRequests?.length){
                console.error("Invalid state: trying to respond to a non-existing request.");
                return;
            }
            const request = this.incomingRequests.shift();
            const sessionKey = this.$store.getters.getToken;
            try {
                const response = await this.$axios.post("http://localhost:5000/conversationrequestresponse", {
                    sessionKey,
                    requestId: request.id,
                    response: res
                });
                if(!res){
                    if(!silent)
                        this.info = response.data.message;
                    return;
                }
                if(!silent)
                    this.info = "You accepted a request.";
                    await Promise.all(this.incomingRequests.map(async x => await this.requestResponse(false, true)));
                this.currentConversation = response.data;

            } catch(error) {
                this.showError(error, "Could not respond to request.");
            }
        },

        //Send a personal request to the user with type.
        async sendDirectRequest(type) {
            const withWho = this.ongoingTypeConversationPrompt;
            this.ongoingTypeConversationPrompt = null;

            const sessionKey = this.$store.getters.getToken;

            try {
                const response = await this.$axios.post("http://localhost:5000/requestconversation", {
                    sessionKey,
                    userId: withWho.id,
                    conversationType: type 
                });
                this.info = response.data.message;
            } catch(error) {
                this.showError(error, "failed sending direct request");
            }
        },

        //Ask to or join an existing group conversation depending on the type.
        async joinConversation(group) {
            const sessionKey = this.$store.getters.getToken;

            if(group.typeConversation === "private"){
                this.info = "That conversation is private, which means that you cannot join.";
                return;
            }
            
            try {
                const response = await this.$axios.post("http://localhost:5000/joinconversation", {
                    sessionKey,
                    groupId: group.groupId
                });

                if(!response.data){
                    console.error("The join conversation api call returned no data.");
                    return;
                }


                if(response.data.message){
                    this.info = response.data.message;
                    return;
                }

                this.info = "You successfully joined the group.";
                this.currentConversation = response.data;

            } catch(error) {
                this.showError(error, "Cannot join the conversation.");
            }
        },

        //Leave the conversation.
        async leaveConversation() {
            const sessionKey = this.$store.getters.getToken;
            try {
                await this.$axios.post("http://localhost:5000/leaveconversation", {
                    sessionKey,
                    groupId: this.groupId,
                });
                this.currentConversation = null;
                this.info = "You left your conversation.";
            } catch(error) {
                this.showError(error, "Cannot leave your conversation, because of an error.");
            }
        },

        //Error handler of errors from the backend. It's expecting a generic error or loginErrors.
        showError(error, fallback){
            if(error.response?.data){
                if(error.response.data.error)
                    this.info = error.response.data.error;
                else if(error.response.data.loginError)
                    this.info = error.response.data.loginError;
                console.error(this.info);
                return;
            }
            this.info = fallback;
            console.error(error.response);
        },
        
        //Leave the room.
        async leaveRoom() {
            await this.$axios.post("http://localhost:5000/leaveRoom", {
                sessionKey: this.$store.getters.getToken,
                roomId: this.roomId
            });
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
