<template>
    <main class="control-room">
        <div class="control-screen">
            This is the "control room", on this page you can view all users
            in their corresponding rooms and you can select the sozi file which will be used for the conference.
            <file-selector v-model="file" class="file-button"></file-selector>
            <div v-if="file">
                <div v-if="file.name.includes('.sozi.html')">
                    The selected file is: {{file.name}}
                </div>
                <div v-else-if="file.name.includes('.svg')">
                    The file you selected is an svg, please upload the file to sozi to select the frames which will be used as floors.
                </div>
                <div v-else>
                    The conference uses sozi so the file needs to end with ".sozi.html"
                </div>
            </div>
        </div>
        <Sidebar class="sidebar">
        </Sidebar>
    </main>
</template>

<script>
import sidebar from '../components/sidebar.vue'
import FileSelector from '../components/fileSelector.vue'
export default {
    components: { 
        sidebar,
        FileSelector 
    },

    data() {
        return {
            file: null
        }
    } 

}
</script>

<style>

.control-room {
  @apply w-full min-h-screen flex flex-col items-center justify-center;
  background: black url("../static/login_background.svg") no-repeat center
    center fixed;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
  transform: scale(1.02);
  color: white;
}

.control-screen{
    position: fixed;
    left: 2%;
    width: 78%;
    height: 94%;
    background-color:#181c21;
}

.sidebar{
    position: fixed;
    right: 2%;
    height: 94%;
    width: 16%;
}

.file-button .select-button{
    position: relative;
    width: 16%;
}

</style>