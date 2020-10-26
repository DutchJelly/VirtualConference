<template>
    <div>
       <div class="user" v-for="(user,index) in users" :key="user">
           <div :class="user.user.toLowerCase().includes(contains.toLowerCase()) ? '' : 'not-included'">
                <button class="userIcon" @click.prevent="onUserClick(user)">
                   <div class="popupBox">
                        <span>
                            Gebruikersnaam: {{ user.user }}
                            indexnr: {{positionList[index]}}
                        </span>
                    </div>
                </button>
            </div>
        </div>
       {{positionList}}
    </div>
</template>



<script>
export default {
    props: {
        users: Array, //username, id, image
        groups: Array, //Array<User>
        onUserClick: Function,
        contains: String
    },

    data(){
        return{


        }
    },
    computed: {
        positionList: {
            get: function() {
                var list = [];
                for (let index = 0; index < this.users.length; index++) {
                    list.push(index);
                }
                return list;
            },
            set: function(newPosition, index) {
                
            }
        }
    },
    methods: {

    }
}
</script>

<style scoped>
.userIcon{
    margin-bottom: 1%;
    width: 4%;
    padding-top: 4%;
    background-color: black;
    border-radius: 100%;
}
.not-included .userIcon{
    opacity: 30%;
}

.userIcon .popupBox{
  @apply bg-gray-400 rounded;
  width: 200px;
  position: relative;
  left: 55px;
  top: 2px;
  visibility: hidden;
}

.userIcon:hover .popupBox{
  visibility: visible;
}

</style>