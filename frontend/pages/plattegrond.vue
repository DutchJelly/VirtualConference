<template>
    <div class="main">
        <iframe id="ifr" src="YANC21-floorplan.sozi.html">
        </iframe>
    </div>
</template>

<script>
export default {
    middleware: 'auth',
    mounted() {
        this.$nextTick(() => {
            let that = this
            let iframe = document.getElementById('ifr')
            let layers = iframe.contentDocument.querySelectorAll('g')
            layers.forEach(function(element) {
                if(element.getAttribute("inkscape:label")) {
                    element.addEventListener("click", function() {
                        console.log("into function")
                        console.log(window.localStorage.getItem('token'))
                        console.log(element.id)
                        that.$store.dispatch({
                            type: 'joinRoom',
                            sessionKey: window.localStorage.getItem('token'),
                            roomId: element.id
                        })
                    })
                }
            });
            console.log("user: ");
            console.log(this.$store.getters.getUser);
        });
    },
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
