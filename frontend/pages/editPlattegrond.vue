<template>
    <div class="main">
        <iframe id="ifr" src="YANC21-floorplan.svg">
        </iframe>
        <div class="overigeRuimte">
            
        </div>
    </div>
</template>

<script>
export default {
    mounted() {
        console.log("into")
        this.$nextTick(() => {
            console.log("through let")
            let iframe = document.getElementById('ifr')
            let layers = iframe.contentDocument.querySelectorAll('g')
            console.log(layers)
            layers.forEach(element => {
                console.log(element)
            });
            console.log(layers)
            // console.log(document.querySelectorAll("g").children)
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
.overigeRuimte {
    width: 100%;
    height: 50;
}
</style>
