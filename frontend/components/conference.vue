<template>
    <div class="meet-container" v-if="open_conference === true">
        <div id="leave_room" ref="leave_room" v-if="joined_room === true">
            <button class="leave_button" style="vertical-align:middle" v-on:click="onLeaveRoom">
                <span>Leave
                </span>
            </button>
        </div>
        <div id="close_room" ref="close_room" v-if="close_room === true">
            <button class="close_button" style="vertical-align:middle" v-on:click="onCloseRoom">
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
            joined_room: false,
            close_room: true,
        };
    },
    props: {
        user: String,
        withWho: String, 
        room: String,
        open_conference: Boolean,
        typeConversation: String,
    },
    computed: {
        jitsiOptions() {
            if(this.isModerator === true){
                return {
                    roomName: this.room,
                    width: 700,
                    height: 700,
                    noSSL: false,
                    userInfo: {
                        email: function() {
                            return this.user + '@email.com'
                        },
                        displayName: this.user,
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
                            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
                        ],
                    },
                    onload: this.onIFrameLoad
                };
            } else {
                return {
                    roomName: this.room,
                    width: 700,
                    height: 700,
                    noSSL: false,
                    userInfo: {
                        email: function() {
                            return this.user + '@email.com'
                        },
                        displayName: this.user,
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
                            'fodeviceselection', 'profile', 'chat',
                            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                            'tileview', 'videobackgroundblur', 'download', 'help', 'security'
                        ],
                    },
                    onload: this.onIFrameLoad
                };
            }
        },
        isModerator() {
            if(this.user === "A") return true
            else return false    
        },
    },
    methods: {
        onIFrameLoad() {
            //this.$refs.jitsiRef.addEventListener('participantJoined', this.onParticipantJoined);
            this.$refs.jitsiRef.addEventListener('videoConferenceJoined', this.onVideoConferenceJoined);
            this.$refs.jitsiRef.addEventListener('participantKickedOut', this.onParticipantKickedOut);
            //this.$refs.jitsiRef.addEventListener('participantLeft', this.onParticipantLeft);
            
            //this.$refs.jitsiRef.executeCommand('displayName', 'The display name');
        },
        onVideoConferenceJoined: function(e) {
            this.joined_room = true;
            this.close_room = false;
        },
        onParticipantKickedOut(e) {
            // do stuff
        },
        onLeaveRoom: async function() {
            let self = this;
            this.open_conference = false;
            this.$refs.jitsiRef.removeJitsiWidget();
            await self.$axios(`http://localhost:5000/leaveconversation/${this.$route.query.username}`);
        }, 
        onCloseRoom: async function() {
            let self = this;
            this.open_conference = false;
            this.$refs.jitsiRef.removeJitsiWidget();
            await self.$axios(`http://localhost:5000/leaveconversation/${this.$route.query.username}`);
        },     
    },
};
</script>

<style>
.leave_button {
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

.leave_button span {
  cursor: pointer;
  display: inline-block;
  position: relative;
  transition: 0.5s;
}

.leave_button span:after {
  content: '\00bb';
  position: absolute;
  opacity: 0;
  top: 0;
  right: -10px;
  transition: 0.5s;
}

.leave_button:hover span {
  padding-right: 25px;
}

.leave_button:hover span:after {
  opacity: 1;
  right: 0;
}

.close_button {
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

.close_button span {
  cursor: pointer;
  display: inline-block;
  position: relative;
  transition: 0.5s;
}

.close_button span:after {
  content: '\00bb';
  position: absolute;
  opacity: 0;
  top: 0;
  right: -10px;
  transition: 0.5s;
}

.close_button:hover span {
  padding-right: 25px;
}

.close_button:hover span:after {
  opacity: 1;
  right: 0;
}

#meet{
    width: 700px;
    height: 700px;
    overflow: hidden;
}
</style>