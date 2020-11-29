<template>
    <div class="main">
        <iframe id="ifr" src="YANC21-floorplan.sozi.html">
        </iframe>
    </div>
</template>

<script>
export default {
    mounted() {
        this.$nextTick(() => {
            let iframe = document.getElementById('ifr')
            let layers = iframe.contentDocument.querySelectorAll('g')
            layers.forEach(element => {
                if(element.getAttribute("inkscape:label")) {
                    element.addEventListener("click", joinRoom)
                }
            });
        });
        function joinRoom(event) {
            console.log(window.localStorage.getItem('token'))
            this.$store.dispatch({
                type: 'joinRoom',
                sessionKey: window.localStorage.getItem('token'),
                roomId: this.id
            })
            console.log(this.id)
        }
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
