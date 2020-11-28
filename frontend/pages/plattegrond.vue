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
                    element.addEventListener('click', function(event) {
                        alert(element.id + " " + element.getAttribute("inkscape:label"))
                    })
                }
            });
        });
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
