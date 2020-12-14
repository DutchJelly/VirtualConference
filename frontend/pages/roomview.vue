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
    async beforeRouteLeave (to, from, next){
        await this.leaveRoom();
        next();
    },
    async created() {
        window.addEventListener('beforeunload', async () => await this.leaveRoom());
    },
    async beforeDestroy() {
        window.removeEventListener('beforeunload', async () => await this.leaveRoom());
    },

    data() {
        return {
            info: "", //when updating info the timed message box will automatically update
            socket: null,
            roomId: this.$route.query.roomId,
            
            users: [],
            groups: [],


            roomCode: null,
            //A conversation contains this data:
            // groupId: number,
            // roomCode: string,
            // memberIds: number[],
            // typeConversation: string
            currentConversation: null,
            
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

            //If a type prompt is open, this'll store the user id that is clicked.
            ongoingTypeConversationPrompt: null
        };
    },
    async mounted() {
        const sessionKey = this.$store.getters.getToken;
        this.setupSocket();
        try {
            const res = await this.$axios.post("http://localhost:5000/joinRoom", {
                sessionKey,
                roomId: this.roomId
            });
            if(res.data?.users)
                this.users = res.data.users;
            if(res.data?.groups)
                this.groups = res.data.groups;
            console.log('joined room with users:');
            console.log(this.users);
            console.log('and groups..');
            console.log(this.groups);
        } catch(error) {
            showError(error, "(error) cannot join the room");
        }
    },
    methods: {
        setupSocket(){
            this.socket = this.$nuxtSocket({name: "home"});

            const sessionKey = this.$store.getters.getToken;
            //The server doesn't know what user is using this socket, tell the server.
            this.socket.emit("register", {sessionKey});

            //Handle anything that changes in your room.
            this.socket.on("roomupdate", (data) => {

                console.log('recieved room update:');
                console.log(data);

                if(data.users)
                    this.users = data.users;
                else this.users = [];
                
                //TODO add info message for when a user leaves your group. Maybe automatically leave if the group is empty.
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
                
                //TODO make sure that the open window actually closes and reopens with a new conversation if one is open
                this.currentConversation = data;
            });
        },

        getUserById(id){
            return this.users.find(x => x.id === id);
        },

        getCurrentRequestMessage(){
            if(!this.incomingRequests.length) 
                return null;

            const request = this.incomingRequests[0];
            const user = this.getUserById(request.senderId);
            if(!user) console.error("cannot find user that sent a request");
            console.log(request);
            if(request.groupId !== undefined) { //it's a join request
                return `User ${user?.username} (${user?.email}) wants to join your conversation. Do you accept?`;
            }
            return `User ${user?.username} (${user?.email}) wants to start a ${request.type} conversation with you. Do you accept?`;
        },

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

        //The request which is send to the user from other user is been accepted or declined.
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

        //Send a request to the user
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

        //Join an existing group conversation
        async joinConversation(group) {
            const sessionKey = this.$store.getters.getToken;

            if(group.typeConversation === "private"){
                this.info = "That conversation is private, which means that you cannot join.";
                return;
            }

            console.log(group);
            
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
        //The user leaves the conversation
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
