<template>
    <div class="meet-container">
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
    data: function(){
        return{
            participantName: "",
        };
    },
    props: {
        user: String,
        withWho: String, 
        room: String,
    },
    computed: {
        jitsiOptions () {
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
                    SHOW_CHROME_EXTENSION_BANNER: false
                },
                onload: this.onIFrameLoad
            };
        },
    },
    methods: {
        onIFrameLoad () {
            this.$refs.jitsiRef.addEventListener('participantJoined', this.onParticipantJoined);
            this.$refs.jitsiRef.addEventListener('participantKickedOut', this.onParticipantKickedOut);
            this.$refs.jitsiRef.addEventListener('participantLeft', this.onParticipantLeft);
            //this.$refs.jitsiRef.executeCommand('displayName', 'The display name');
        },
        onParticipantJoined: function(e) {
            // do stuff
            //this.participantName = e.displayName;
            alert(e.displayName + " is joined");
        },
        onParticipantKickedOut (e) {
            // do stuff
            this.participantName = this.$refs.jitsiRef.getDisplayName(participantId);
        },
        onParticipantLeft: async function(e) {
            // do stuff
            this.participantName = this.$refs.jitsiRef.getDisplayName(e.id);
            alert(this.participantName + "a participant is left");
            var response = undefined;
            //response = await this.$axios(`http://localhost:5000/leaveconversation/${participantName}`);
        },
    },
};
</script>

<style>
.meet-container{
    background-color: black;
    width: 700px;
    height: 700px;
    overflow: hidden;
}
#meet{
    background-color: black;
    width: 700px;
    height: 700px;
    overflow: hidden;
}
</style>