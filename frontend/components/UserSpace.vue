<template>
    <div>
       <div class="user" v-for="user in users" :key="user.id" />
    </div>
</template>



<script>
export default {
    props: {
        users: Array, //username, id, image
        groups: Array, //Array<User>
    },

    data(){
        return{


        }
    },

    methods: {
        
    }
}
</script>

<style scoped>
.user{
    margin-bottom: 1%;
    width: 4%;
    padding-top: 4%;
    background-color: black;
    border-radius: 100%;
}
</style>