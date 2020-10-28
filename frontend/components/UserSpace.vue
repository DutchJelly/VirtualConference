<template>
    <div ref="userspace">
        <div class="group" v-for="(group,index) in groups" :key="index" :id="`g${group.id}`"
            :style="`width: ${groupSize(group.members)*iconSize}%; padding-bottom: ${groupSize(group.members)*iconSize}%;`"
            @click.prevent="onGroupClick(group)"> 
            <div class="popupBox" :style="`top: 20px; left: 110%`">
                <span>
                    In groep {{index}} zitten: {{group.members}}
                </span>
            </div>
        </div>
        <div class="user" v-for="user in users" :key="user.id" :id="`u${user.id}`" 
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

        window.addEventListener('resize', this.handleResize)


        //We can only read the size of the element by using this Vue.nextTick callback.
        this.$nextTick(() => {

            //Set the styling to match the count of rows and columns
            this.refreshPixelSizeReferences();

            //Position a random user in the center, as a starting point.
            var randomUser = this.users[Math.floor(Math.random() * this.users.length)];
            this.positionMapping.set(`u${randomUser.id}`, {
                x: Math.floor(this.gridCols/2), 
                y: Math.floor(this.visibleRows/2),
                minDistance: 2,
            });
            this.position('u' + randomUser.id);

            // Position all the users that are not positioned yet.
            this.users.forEach(user => {
                if(!this.positionMapping.get(`u${user.id}`)){
                    var rSpotInfo = this.getRandomFreeSpot(2,5);
                    rSpotInfo.minDistance = 2;
                    this.positionMapping.set(`u${user.id}`, rSpotInfo);
                }
                this.position('u' + user.id);
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

        handleResize(){
            this.refreshPixelSizeReferences();

            this.users.forEach(user => this.position('u' + user.id));
        },

        //We work with percentages, which means that its hard to work with positioning. To counter this, we 
        //find the exact pixel sizes of the grid here.
        refreshPixelSizeReferences(){
            this.screenWidth = this.$refs.userspace.clientWidth;
            this.screenHeight = this.$refs.userspace.clientHeight;
            this.squareSize = this.screenWidth/this.gridCols; + this.screenWidth*(this.gridSpacing/100);
            //The amount of rows is determined by the amount of squares that fit.
            
            this.visibleRows = Math.floor(this.screenHeight/this.squareSize);

            console.log(`height: ${this.screenHeight}, width: ${this.screenWidth}, squareSize: ${this.squareSize}, visible rows: ${this.visibleRows}`);
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
            var validMinDistance = values.filter(pos => {
                var distance = Math.abs(pos.x - x) + Math.abs(pos.y - y);
                return distance < minDistance && distance < pos.minDistance;
            }).length === 0;

            // Look if there is at least one element in positionmapping that's closer to x,y than maxDistance. 
            var validMaxDistance = values.filter(pos => Math.abs(pos.x - x) + Math.abs(pos.y - y) <= maxDistance).length >= 1;

            return validMinDistance && validMaxDistance;
        },

        /**
         * Looks if there is a spot available in the grid that's in the view.
         * @param {Number} minDistance
         * @param {Number} maxDistance
         * @param {Number} rows the rows the function considers as valid spots
         * @returns {Boolean}
         */
        containsFreeSpot(minDistance, maxDistance, rows){
            // Loop through all spots in the grid to see if there's any valid spot.
            for(var i = 0; i < rows; i++){
                for(var j = 0; j < this.gridCols; j++){
                    if(this.isValidSpot(j, i, minDistance, maxDistance)) 
                        return true;
                }
            }
            return false;
        },

        /**
         * @returns {Number} the y value of the lowest positioned element on the page in positionMapping.
         */
        getLowestPosition(){
            var lowestPosition = 0;
            this.positionMapping.forEach((value, index, map) => {
                if(value.y > lowestPosition)
                    lowestPosition = value.y;
            });
            console.log(`lowest position: ${lowestPosition}`);
            return lowestPosition;
        },

        /**
         * Iterates over random spots until finding a valid spot.
         * @param {Number} minDistance
         * @param {Number} maxDistance
         * @returns {x: Number, y: Number} A random valid spot.
         */
        getRandomFreeSpot(minDistance, maxDistance){
            var tryVisible = this.containsFreeSpot(minDistance, maxDistance, this.visibleRows);
            var yLimit;

            //TODO this can probably be simplified a bunch if visibleRows changes when we place an element outside of the view.

            //We try to find spots in a visible area, and if that's not possible we'll just extend
            //the amount of rows we use (the yLimit).
            if(tryVisible) yLimit = this.visibleRows;
            else{
                var lowest = this.getLowestPosition();
                //Keep raising the y limit while there is no free spot.
                yLimit = lowest;
                while(!this.containsFreeSpot(minDistance, maxDistance, yLimit)){
                    //A safe guard for infinite looping.
                    if(yLimit >= lowest + maxDistance) throw new Error(`Can't find a free spot (yLim=${yLimit})`);
                    yLimit++;
                }
            }

            //Keep trying random combinations until (x,y) is a valid spot.
            var x, y;
            do{
                x = Math.floor(Math.random() * this.gridCols);
                y = Math.floor(Math.random() * yLimit);
            }while(!this.isValidSpot(x,y, minDistance, maxDistance));
            return {x, y}; //json object with {x: value, y: value}
        },

        /**
         * Position an element in positionMapping visually in the html.
         * @param {String} id id of the user that is being positioned
         */
        position(id){
            var position = this.positionMapping.get(id);
            if(!position) 
                throw new Error(`Could not position ${id} because it's not present in the positionMapping.`);
            if(Number.isNaN(position.x) || Number.isNaN(position.y))
                throw new Error(`Either x[${position.x}] or y${position.y} is NaN (probably divided by 0 somewhere)`);

            console.log(`positioning user ${id} to ${position.x},${position.y}`)

            //Selected user without vue refs because those were not allowing me to add styling.
            var htmlElement = document.querySelector(`#${id}`);
            var positionHeight = position.y * this.squareSize;
            htmlElement.style.marginTop = positionHeight + 'px';
            htmlElement.style.marginLeft = (position.x * this.iconSize + this.gridSpacing) + '%';

            //If something is absolutely positioned outside the height of the element, we need to make it larger.
            //TODO support making it smaller
            // if(positionHeight + this.iconSize >= this.screenHeight){
            //     this.$refs.userspace.style.height = (positionHeight + this.iconSize) + 'px';
            // }
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

.userspace{
    display: grid;
    overflow-y: auto;
}

.userspace > * {
    grid-area: 1/1;
}

.user{
    background-image: url("../static/small.jpg");
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    border-radius: 50%;
    /* position: absolute; */
    height: 0px;

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