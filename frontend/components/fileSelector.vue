<template>
    <label class="file-select">
        <!-- Credits to:https://www.digitalocean.com/community/tutorials/vuejs-file-select-component  -->
        <div class="select-button">
            <span v-if="file">Selected File: {{file.name}}</span>
            <span v-else>Select File</span>
        </div>
        
        <input type="file" @change="handleFileChange"/>
    </label>
</template>

<script>
export default {
    props: {
        file: Object
    },

    methods: {
        handleFileChange(e) {
            this.$emit('input', e.target.files[0])
        }
    }
}
</script>

<style scoped>
.file-select > .select-button {
  padding: 1rem;

  color: white;
  background-color: #2EA169;

  border-radius: .3rem;

  text-align: center;
  font-weight: bold;
}

.file-select > input[type="file"] {
  display: none;
}
</style>