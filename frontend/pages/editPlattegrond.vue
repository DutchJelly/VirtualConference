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
    // $("g").click(function() {
    //     alert($(this).attr("id"));        
    // });
    mounted() {
        console.log("into")
        this.$nextTick(() => {
            console.log(document.querySelectorAll("iframe"))
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
