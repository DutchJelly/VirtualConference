<template>
    <div ref="userspace">
        <div class="group" v-for="(group,index) in groups" :key="index"
            :style="`width: ${groupSize(group.members)*iconSize}%; padding-bottom: ${groupSize(group.members)*iconSize}%;`"
        > 
            <div class="popupBox" :style="`top: 20px; left: 110%`">
                <span>
                    In groep {{index}} zitten: {{group.members}}
                </span>
            </div>
        </div>
       <div class="user" v-for="user in users" :key="user.id" :id="`user${user.id}`" 
            :style="`width: ${iconSize}%; padding-bottom: ${iconSize}%;`"
            v-show="(!filter || user.user.toLowerCase().includes(filter.toLowerCase()) && positioned)"
            @click.prevent="onUserClick(user)">

            <!-- This break the formatting if it overflows on the right of the page -->
            <div class="popupBox" :style="`top: 20px; left: 110%`">
                <span>
                    Gebruikersnaam: {{ user.user }}
                </span>
            </div>
        </div>
    </div>
</template>



<script>
export default {

    //TODO make everything work with pixels instead of percentages. Or we can handle page resizing instead.

    props: {
        users: Array, //username, id, image, group id
        onUserClick: Function,
        filter: String,
        groups: Array, //Array of all groups with their respective members.
        gridCols: Number, //Grid contains squares, so no need for rows prop.
        gridSpacing: Number, //Spacing in %
    },
    mounted(){
        //We can only read the size of the element by using this Vue.nextTick callback.
        this.$nextTick(() => {
            //Set the styling to match the count of rows and columns
            this.refreshPixelSizeReferences();

            //Position a random user in the center, as a starting point.
            var randomUser = this.users[Math.floor(Math.random() * this.users.length)];
            this.positionMapping.set(randomUser.id, {x: this.gridCols/2, y: this.gridRows/2});
            window.console.log(this.positionMapping.get(randomUser.id));
            this.positionUser(randomUser.id);

            // Position all the users that are not positioned yet.
            this.users.forEach(user => {
                if(!this.positionMapping.get(user.id)){
                    this.positionMapping.set(user.id, this.getRandomFreeSpot(2,5));
                }
                this.positionUser(user.id);
            });

            this.positioned = true;
        })
        
        
    },

    

    data(){
        return{
            positioned: false,
            positionMapping: new Map(),
        }
    },
    computed: {
        /**
         * @returns the size of icons in % of the page width
         */
        iconSize: function() {
            return (100/this.gridCols) - this.gridSpacing;
        },
    },
    methods: {

        //We work with percentages, which means that its hard to work with positioning. To counter this, we 
        //find the exact pixel sizes of the grid here.
        refreshPixelSizeReferences(){
            this.screenWidth = this.$refs.userspace.clientWidth;
            this.screenHeight = this.$refs.userspace.clientHeight;
            this.squareSize = this.screenWidth/this.gridCols; + this.screenWidth*(this.gridSpacing/100);
            //The amount of rows is determined by the amount of squares that fit.
            
            this.gridRows = Math.floor(this.screenHeight/this.squareSize);

            console.log(`height: ${this.screenHeight}, width: ${this.screenWidth}, squareSize: ${this.squareSize}, grid rows: ${this.gridRows}`);
        },

        /**
         * Looks if the spot (x,y) is valid with the params provided.
         * @param {Number} x
         * @param {Number} y
         * @param {Number} minDistance
         * @param {Number} maxDistance
         * @returns {Boolean}
         */
        isValidSpot(x, y, minDistance, maxDistance){
            // Look if there are no elements in the positionmapping that are closer than minDistance to x,y.
            var values = Array.from(this.positionMapping.values());
            var validMinDistance = values.filter(pos => Math.abs(pos.x - x) + Math.abs(pos.y - y) < minDistance).length === 0;

            // Look if there is at least one element in positionmapping that's closer to x,y than maxDistance. 
            var validMaxDistance = values.filter(pos => Math.abs(pos.x - x) + Math.abs(pos.y - y) <= maxDistance).length >= 1;

            return validMinDistance && validMaxDistance;
        },

        /**
         * Looks if there is a spot available in the grid.
         * @param {Number} minDistance
         * @param {Number} maxDistance
         * @returns {Boolean}
         */
        containsFreeSpot(minDistance, maxDistance){
            // Loop through all spots in the grid to see if there's any valid spot.
            for(var i = 0; i < this.gridRows; i++){
                for(var j = 0; j < this.gridCols; j++){
                    if(this.isValidSpot(j, i, minDistance, maxDistance)) 
                        return true;
                }
            }
            return false;
        },

        /**
         * Iterates over random spots until it's a valid spot.
         * @param {Number} minDistance
         * @param {Number} maxDistance
         * @returns {x: Number, y: Number} A random valid spot.
         */
        getRandomFreeSpot(minDistance, maxDistance){
            if(!this.containsFreeSpot(minDistance, maxDistance))
                throw new Error("there's no spot for the user and we didn't implement a solution to this");
            
            var x, y;
            do{
                x = Math.floor(Math.random() * this.gridCols);
                y = Math.floor(Math.random() * this.gridRows);
            }while(!this.isValidSpot(x,y, minDistance, maxDistance));
            return {x, y}; //json object with {x: value, y: value}
        },

        /**
         * Position a user visually in the html from a position in memory.
         * @param {Number} userId id of the user that is being positioned
         */
        positionUser(userId){
            var position = this.positionMapping.get(userId);
            if(!position) 
                throw new Error(`Could not position user ${userId} because it's not properly present in the positionMapping`);

            console.log(`positioning user ${userId} to ${position.x},${position.y}`)

            //Selected user without vue refs because those were not allowing me to add styling.
            var htmlElement = document.querySelector(`#user${userId}`);
            htmlElement.style.top = position.y * this.squareSize + 'px';
            htmlElement.style.left = (position.x * this.iconSize + this.gridSpacing) + '%';
        },
        groupSize(group) {
            console.log("De grootte is: " + group.length);
            if (group.length < 9) return (group.length*0.05)+1;
            else {return 1.5;}
        }
    }
}
</script>

<style scoped>

.user{
    background-color: black;
    border-radius: 100%;
    position: absolute;
    height: 0px;

    /* this is not working :( */
    transition: all 400ms linear;
}

.not-included .user{
    opacity: 30%;
}

.user .popupBox{
  @apply bg-gray-400 rounded;
  width: 200px;
  position: relative;
  visibility: hidden;
  z-index: 1;
}

.user:hover .popupBox{
  visibility: visible;
}

.group{
    background-color: black;
    border-radius: 100%;
    position: absolute;
    height: 0px;

    /* this is not working :( */
    transition: all 400ms linear;
}

.group .popupBox{
  @apply bg-gray-400 rounded;
  width: 200px;
  position: relative;
  visibility: hidden;
  z-index: 1;
}

.group:hover .popupBox{
  visibility: visible;
}

</style>