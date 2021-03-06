<template>
    <div class="meet-container" v-if="conversation">
        <div id="leaveRoom" ref="leaveRoom" v-if="joinedRoom === true">
            <button class="leaveButton" style="vertical-align:middle" v-on:click="onLeaveRoom" @click.prevent="onLeaveConversation()">
                <span>Leave
                </span>
            </button>
        </div>
        <div id="closeRoom" ref="closeRoom" v-if="closeRoom === true">
            <button class="closeButton" style="vertical-align:middle" v-on:click="onCloseRoom" @click.prevent="onLeaveConversation()">
                <span>Close
                </span>
            </button>
        </div>
        <div id="meet" ref="meet">
            <vue-jitsi-meet
                ref="jitsiRef"
                domain="meet.jit.si"
                :options="jitsiOptions"
            ></vue-jitsi-meet>
        </div>
    </div>
</template>
 
<script>
import moment from 'moment';
import { JitsiMeet } from '@mycure/vue-jitsi-meet';
export default {
    name: 'Conference',
    components: {
        VueJitsiMeet: JitsiMeet
    },
    data: function() {
        return {
            joinedRoom: false,
            closeRoom: true,
        };
    },
    props: {
        conversation: {
            groupId: Number,
            roomCode: String,
            memberIds: [],
            typeConversation: String
        },
        isModerator: Boolean,
        onLeaveConversation: Function,
    },
    computed: {
        jitsiOptions() {
            //If the user is a moderator.
            if(this.isModerator === true){
                return {
                    roomName: this.conversation?.roomCode,
                    width: 700,
                    height: 700,
                    noSSL: false,
                    userInfo: {
                        displayName: this.$store.getters.getUser?.username,
                    },
                    configOverwrite: {
                        enableNoisyMicDetection: false
                    },
                    interfaceConfigOverwrite: {
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        SHOW_CHROME_EXTENSION_BANNER: false,
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting', 'fullscreen',
                            'fodeviceselection', 'profile', 'chat', 'recording',
                            'livestreaming', 'etherpad', 'sharedvideo', 'settings',
                            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
                        ],
                    },
                    onload: this.onIFrameLoad
                };
            } else { //If the user is not a moderator.
                return {
                    roomName: this.conversation?.roomCode,
                    width: 700,
                    height: 700,
                    noSSL: false,
                    userInfo: {
                        displayName: this.$store.getters.getUser?.username,
                    },
                    configOverwrite: {
                        enableNoisyMicDetection: false
                    },
                    interfaceConfigOverwrite: {
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        SHOW_CHROME_EXTENSION_BANNER: false,
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'fullscreen',
                            'fodeviceselection', 'profile', 'chat',
                            'etherpad', 'settings', 'raisehand',
                            'filmstrip', 'feedback', 'shortcuts',
                            'tileview', 'videobackgroundblur', 'download', 'help'
                        ],
                    },
                    onload: this.onIFrameLoad
                };
            }
        },
    },
    methods: {
        onIFrameLoad() {
            this.closeRoom = true;
            //Event listener when a user joined the video conference.
            this.$refs.jitsiRef.addEventListener('videoConferenceJoined', this.onVideoConferenceJoined);
        },
        //When the user joined the video conference.
        onVideoConferenceJoined: function(error) {
            this.joinedRoom = true;
            this.closeRoom = false;
        },
        //When the user clicks on the button with 'Leave'.
        onLeaveRoom: function() {
            let self = this;
            try {
                this.joinedRoom = false;
                this.$refs.jitsiRef.removeJitsiWidget();
            } catch(error) {
                console.log(error);
            }
        },
        //When the user clicks on the button with 'Close'.
        onCloseRoom: function() {
            let self = this;
            try {
                this.closeRoom = false;
                this.$refs.jitsiRef.removeJitsiWidget();
            } catch(error) {
                console.log(error);
            }
        }, 
    },
};
</script>

<style>

.meet-container {
    z-index: 2;
}

.leaveButton {
  display: inline-block;
  border-radius: 4px;
  background-color: #393c3f;
  border: none;
  color: #FFFFFF;
  text-align: center;
  font-size: 12px;
  padding: 15px;
  width: 100px;
  transition: all 0.5s;
  cursor: pointer;
  margin: 5px;
}

.leaveButton span {
  cursor: pointer;
  display: inline-block;
  position: relative;
  transition: 0.5s;
}

.leaveButton span:after {
  content: '\00bb';
  position: absolute;
  opacity: 0;
  top: 0;
  right: -10px;
  transition: 0.5s;
}

.leaveButton:hover span {
  padding-right: 25px;
}

.leaveButton:hover span:after {
  opacity: 1;
  right: 0;
}

.closeButton {
  display: inline-block;
  border-radius: 4px;
  background-color: #122a42;
  border: none;
  color: #FFFFFF;
  text-align: center;
  font-size: 12px;
  padding: 15px;
  width: 100px;
  transition: all 0.5s;
  cursor: pointer;
  margin: 5px;
}

.closeButton span {
  cursor: pointer;
  display: inline-block;
  position: relative;
  transition: 0.5s;
}

.closeButton span:after {
  content: '\00bb';
  position: absolute;
  opacity: 0;
  top: 0;
  right: -10px;
  transition: 0.5s;
}

.closeButton:hover span {
  padding-right: 25px;
}

.closeButton:hover span:after {
  opacity: 1;
  right: 0;
}

#meet{
    width: 700px;
    height: 700px;
    overflow: hidden;
}
</style>
