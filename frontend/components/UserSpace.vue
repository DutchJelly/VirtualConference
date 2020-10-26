<template>
    <div>
       <div class="user" v-for="(user,index) in users" :key="user" 
            :style="`width: ${iconSize}%; padding-top: ${iconSize}%;`"
            v-show="user.user.toLowerCase().includes(contains.toLowerCase())"
            @click.prevent="onUserClick(user)">

            <div class="popupBox" :style="`top: -${iconSize*1.5}%; left: ${iconSize}%`">
                <span>
                    Gebruikersnaam: {{ user.user }}
                    indexnr: {{positionList[index]}}
                </span>
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
        contains: String,
        gridCols: Number, //Grid contains squares, so no need for rows prop.
        gridSpacing: Number, //Spacing in %
    },
    mounted(){
        //Set the styling to match the count of rows and columns


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
        },

        /**
         * @returns the size of icons in % of the page width
         */
        iconSize: function() {
            return (100/this.gridCols) - this.gridSpacing;
        },
    },
    methods: {

    }
}
</script>

<style scoped>

.user{
    background-color: black;
    border-radius: 100%;
    position: relative;
    height: 0px;
}

.not-included .user{
    opacity: 30%;
}

.user .popupBox{
  @apply bg-gray-400 rounded;
  width: 200px;
  position: relative;
  left: 55px;
  visibility: hidden;
}

.user:hover .popupBox{
  visibility: visible;
}

</style>