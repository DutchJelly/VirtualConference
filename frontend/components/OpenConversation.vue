<template>
    <div class="main kamerpage">
        <div class="kamer">
            <UserSpace 
                class="userspace" 
                :users="users"
                :groups="groups" 
                :gridCols=6
                :gridSpacing=1
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
        />    
    </div>
</template>

<script>
import moment from 'moment';

export default {
    name: 'Jitsi',
    data() {
        return {
            username: this.$route.query.username,
            info: "", //when updating info the timed message box will automatically update
            users: [],
            groups: [],
            socket: null,
            activeConference: false, //Showing conference window if activeConference is true.
            isModerator: false, //If the current user is a moderator.

            conversation: {
                room: "",
                user: "",
                type: "",
            },

            value: "",
        };
    },
    async mounted() {
        let response = undefined;
        try {
            response = await this.$axios(`http://localhost:5000/testlogin/${this.username}`);
            //!!!Terugsturen naar de backend en daar gegevens uit de database halen welke kamernaam dit heeft en join het.
            await this.$axios(`http://localhost:5000/joinOpenConversationRoom/${this.username}`)
        } catch(error) {
            console.log(error);
        }

        this.socket = this.$nuxtSocket({name: "home"});

        //Temporary way to handle users 'loggin on'.
        this.socket.on("testlogin", (data) => {
            if(!data || !data.online) return;
            
            this.users = [];
            for(let online of data.online) {
                //Users can't log in twice.
                this.users.push({user: online, id: online});
            }
        });

        //Showing conference window on the page of the user who joined an already existed open conversation.
        this.socket.on("joinOpenConversation", (data) => {
            this.conversation.user = data.user;
            this.conversation.room = data.room;
            this.activeConference = true;
            this.info = `You joined open conversation`;
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
