<template>
    <div class="main">
        <h1>{{user}}</h1>
        <iframe id="ifr" src="YANC21-floorplan.sozi.html">
        </iframe>
    </div>
</template>

<script>
/**
 * See the map of the conference.
 */
import { mapState } from 'vuex'

export default {
    middleware: 'auth',
    mounted() {
        this.$nextTick(() => {
            let iframe = document.getElementById('ifr')
            let layers = iframe.contentDocument.querySelectorAll('g')
            layers.forEach((element) => {
                if(element.getAttribute("inkscape:label")) {
                    element.addEventListener("click", () => {
                        console.log("into function")
                        console.log(this.$store.getters.getToken)
                        console.log(element.id)
                        this.$store.dispatch({
                            type: 'joinRoom',
                            sessionKey: this.$store.getters.getToken,
                            roomId: element.id
                        })
                    })
                }
                
            });
        });
    },
    computed: {   
        ...mapState({
            user: 'user'
        })
    },
    beforeRouteLeave (to, from, next){
        alert('leaving mapview page');
    },
    methods: {
        joinRoom(){
            
        }
    }
}
</script>
<style>
.main {
    width:100%;
    height:100%;
}
iframe {
    height:100%;
    width: 100%;
}
</style>
