<template>
  <main class="conference-window">
      <a :href="'http://meet.jit.si/' + options.roomName">click to go to the room</a>  
      <div class="meet-container">
        <div id="meet" ref="meet">
        </div>
      </div>
      
    <script type="application/javascript" defer src="https://meet.jit.si/external_api.js"></script>
  </main>
</template>

<script>

export default {
    name: 'Conference',
    props: {
        user: String,
        withWho: String, 
        room: String,
    },
    watch: {
        room: function(newValue, oldValue){
            if(this.api) this.api.dispose();

            this.options.roomName = newValue;
            this.api = new JitsiMeetExternalAPI(this.domain, this.options);
        }
    },

    data() {
        return {
            domain: 'meet.jit.si',
            options: {
                roomName: '',
                width: 700,
                height: 700,
                parentNode: undefined
            },
            api: undefined,
        };
    },
    mounted(){
        this.options.parentNode = this.$el.querySelector("#meet")
    },
    methods: {
        
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