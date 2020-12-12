<template>
    <div class="main">
        <button class="logout" @click.prevent="logout">log out</button>
        <iframe id="ifr" src="YANC21-floorplan.sozi.html">
        </iframe>
        <div v-if="visible" class="information">
            <button class="information-button" @click="visible=false">X</button>
            Welcome to Virtual Conference! <br>
            Please click on a room to start or<br>
            click in the top right to change floors<br>
            You are currently hovering over Room: <br>
            {{roomNumber}}
        </div>
        <button v-if="!visible" class="help" @click="visible=true">i</button>
    </div>
</template>

<script>
/**
 * See the map of the conference.
 */
import { mapState } from 'vuex'
export default {
    middleware: 'auth',

    data() {
        return {
            roomNumber: "",
            visible: true,
        }
    },
    async mounted() {
        this.$nextTick(() => {
            let iframe = document.getElementById('ifr');
            iframe.onload = () => {
                let layers = iframe.contentDocument.querySelectorAll('g')
                layers.forEach((element) => {
                    if(element.getAttribute("inkscape:label")) {
                        element.addEventListener("click", () => {
                            this.$router.push({ path:"/roomview", query: element.id })
                        })
                        element.addEventListener("mouseover", () => {
                            this.roomNumber = element.getAttribute("inkscape:label")
                        })
                    }
                });
            }
        });
    },
    computed: {   
        ...mapState({
            user: 'user'
        })
    },
    beforeRouteLeave (to, from, next){
        alert('leaving mapview page');
        next();
    },
    methods: {
        logout(){
            this.$store.dispatch('logout')
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

.logout {
  outline: none;
  @apply shadow bg-green-700 mt-3 text-xl text-white p-2 rounded border-2 border-transparent;
  position: absolute;
  top: 90%;
  left: 1%;
  width: 200px;
  max-width: 10%;
  height: 60px;
}
.logout:hover,
.logout:focus {
  @apply bg-green-600;
}

.information{
   @apply shadow bg-green-700 mt-3 text-xl text-white p-2 rounded border-2 border-transparent;
    position: absolute;
    top: 2%;
    right: 2%;
}

.information-button{
    right: 1%;
    top: 1%;
    position: absolute;
}

.help{
    @apply shadow bg-green-700 mt-3 text-4xl text-white p-2 rounded-full h-20 w-20 border-2 border-transparent;
    position: absolute;
    top: 2%;
    right: 2%;
}

</style>
