<template>
    <div ref="userspace">
        <!-- I temporarely removed the group size because it's really difficult to implement with the current position mapping -->
        <div class="group" v-for="group in groups" :key="'g' + group.id" :id="`g${group.id}`"
            :style="`width: ${iconSize}%; padding-bottom: ${iconSize}%;`"
            @click.prevent="onGroupClick(group)"> 
            <div class="popupBox" :style="`top: 20px; left: 110%`">
                <span>
                    In groep {{group.id}} zitten: {{group.members}}
                </span>
            </div>
        </div>
        <div class="user" v-for="user in users" :key="'u' + user.id" :id="`u${user.id}`" 
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
    mounted(){

        window.addEventListener('resize', this.handleResize)

        //We can only read the size of the element by using this Vue.nextTick callback.
        this.$nextTick(() => {
            this.refreshPixelSizeReferences();
            this.mapPositions();
            this.positionAll();
            this.positioned = true;
        });
    },

    data(){
        return{
            positioned: false,
            positionMapping: new Map(),
            usersCopy: [...this.users], //We need this because we also want watch to work if we push to the user prop from outside the component.
        }
    },

    props: {
        users: Array, //username, id, image, group id
        onUserClick: Function,
        filter: String,
        groups: Array, //Array of all groups with their respective members.
        gridCols: Number, //Grid contains squares, so no need for rows prop.
        gridSpacing: Number, //Spacing in %
    },
    
    watch: {
        //The entire positioning needs to be remapped to fit the new column amount.
        gridCols: function(newVal, oldVal){
            this.mapPositions();
        },

        users: function(newVal, oldVal){
            //Don't use oldVal because, if the users reference doesn't change, they both point to the same array.

            var joinedUsers = newVal.filter(user => !this.usersCopy.find(x => x.id === user.id));
            var leftUsers = this.usersCopy.filter(user => !newVal.find(x => x.id === user.id));

            //Check if there are no 2 of the same users in the array.
            var ambiguousUsers = newVal.filter(user => newVal.filter(user2 => user2.id === user.id).length >= 2);
            if(ambiguousUsers.length){
                throw new Error(`Error: ambiguous users found: ${ambiguousUsers.map(x => `id: ${x.id} user: ${x.user}`).join(', ')}`);
            }

            this.usersCopy = [...newVal]; //Keep track of the current values in users.

            console.log("joined: " + joinedUsers.length);
            console.log("left: " + leftUsers.length);

            leftUsers.forEach(user => this.positionMapping.delete('u' + user.id));

            if (!this.positionMapping.size && joinedUsers.length) {
                var randomUser = joinedUsers[Math.floor(Math.random() * joinedUsers.length)];
                this.positionMapping.set(`u${randomUser.id}`, {
                    x: Math.floor(this.gridCols/2), 
                    y: Math.floor(this.visibleRows/2),
                    minDistance: 2,
                });
            }

            joinedUsers.forEach(user => {
                if(!this.positionMapping.get(`u${user.id}`)){
                    
                    //If the user is in a group, set the position of the user to the position of the group
                    var group = this.getUserGroup(user.id);


                    if(group){
                        this.positionMapping.set(`u${user.id}`, this.positionMapping.get('g' + group.id));
                    }else{
                        var rSpotInfo = this.getRandomFreeSpot(2,5);
                        rSpotInfo.minDistance = 2;
                        this.positionMapping.set(`u${user.id}`, rSpotInfo);
                    }
                }
            });

            

            this.$nextTick(() => {
                this.positionAll();
            });
            
        }
    },

    computed: {
        /**
         * @return the size of icons in % of the page width
         */
        iconSize: function() {
            return (100/this.gridCols) - this.gridSpacing;
        }

    },

    methods: {
        
        handleResize(){
            //We need to do this for the y positioning, because we can't use percentages of the width for that.
            this.refreshPixelSizeReferences();
            this.positionAll();
        },

        /**
         * TODO cleanup... this function is too long and contains a bunch of repetitive blocks
         * 
         * Creates and sets all positions in positionMapping
         */
        mapPositions(){
            // First clear the old positioning.
            this.positionMapping = new Map();

            if (this.groups.length > 0) {
                // Position a random group in the center, as a starting point for min/max distance.
                var randomGroup = this.groups[Math.floor(Math.random() * this.groups.length)];
                this.positionMapping.set(`g${randomGroup.id}`, {
                    x: Math.floor(this.gridCols/2), 
                    y: Math.floor(this.visibleRows/2),
                    minDistance: 3,
                });
            }else {
                // Position a random user in the center, as a starting point for min/max distance.
                var randomUser = this.users[Math.floor(Math.random() * this.users.length)];
                this.positionMapping.set(`u${randomUser.id}`, {
                    x: Math.floor(this.gridCols/2), 
                    y: Math.floor(this.visibleRows/2),
                    minDistance: 2,
                });
            }
            
            // Position all the groups
            this.groups.forEach(group => {
                if(!this.positionMapping.get(`g${group.id}`)){
                    var rSpotInfo = this.getRandomFreeSpot(3,5);
                    rSpotInfo.minDistance = 3;
                    this.positionMapping.set(`g${group.id}`, rSpotInfo);
                }
            })

            // Position all the users that are not positioned yet.
            this.users.forEach(user => {
                if(!this.positionMapping.get(`u${user.id}`)){
                    
                    //If the user is in a group, set the position of the user to the position of the group
                    var group = this.getUserGroup(user.id);
                    if(group){
                        this.positionMapping.set(`u${user.id}`, this.positionMapping.get('g' + group.id));
                    }else{
                        var rSpotInfo = this.getRandomFreeSpot(2,5);
                        rSpotInfo.minDistance = 2;
                        this.positionMapping.set(`u${user.id}`, rSpotInfo);
                    }

                    
                }
            });
        },

        /**
         * @param {Number} userId
         * @returns {{members: Array<Number>, id: Number}} group that contains the user with id userId (or undefined) 
         */
        getUserGroup(userId){
            return this.groups.find(group => group.members.includes(userId));
        },

        /**
         * Find the exact width of the userspace element to be able to position the icons properly
         */
        refreshPixelSizeReferences(){
            this.screenWidth = this.$refs.userspace.clientWidth;
            this.screenHeight = this.$refs.userspace.clientHeight;
            this.squareSize = this.screenWidth/this.gridCols; //Size of grid squares including the spacing around them.
            
            //TODO: This value seems to never change... remove this line?
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
         * @returns {{x: Number, y: Number}} A random valid spot.
         */
        getRandomFreeSpot(minDistance, maxDistance){
            var tryVisible = this.containsFreeSpot(minDistance, maxDistance, this.visibleRows);
            var yLimit;
            //To find the max y we can also use max(lowest + maxDistance, this.visibleRows), but that'd allow
            //users to spread more toward the bottom of the page.

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
         * Position the users and groups like mapped in positionMapping.
         */
        positionAll(){
            this.groups.forEach(group => this.position('g' + group.id));
            this.users.forEach(user => this.position('u' + user.id));
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
    height: 0px;
    position: relative;
    z-index: 1;

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