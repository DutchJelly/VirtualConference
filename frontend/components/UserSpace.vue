<template>
    <div ref="userspace">
        <!-- I temporarely removed the group size because it's really difficult to implement with the current position mapping -->
        <div 
            class="group" v-for="group in groups" :key="'g' + group.id" :id="`g${group.id}`"
            :style="`width: ${iconSize}%; padding-bottom: ${iconSize}%;`"
            v-show="!visibleGroup || visibleGroup === group"
            @click.prevent="onGroupClick(group)"
        > 
            <div class="group-text" :style="`font-size: ${squareSize/2}px; line-height: ${squareSize}px; top: -${squareSize/10}px;`">
                {{groupText(group)}}
            </div>
            
            <div class="popupBox" :style="`top: 20px; left: 110%`">
                <span>
                    In groep {{group.id}} zitten: {{group.members}}
                </span>
            </div>
            
        </div>

        <div 
            class="user" v-for="user in users" :key="'u' + user.id" :id="`u${user.id}`" 
            :style="`width: ${iconSize}%; padding-bottom: ${iconSize}%;`"
            v-show="(!filter || user.user.toLowerCase().includes(filter.toLowerCase()) && positioned) && (!visibleGroup || visibleGroup.members.includes(user.id))"
            @click.prevent="onUserClick(user)"
        >
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
    mounted() {
        window.addEventListener('resize', this.handleResize)

        //We can only read the size of the element by using this Vue.nextTick callback.
        this.$nextTick(() => {
            this.refreshPixelSizeReferences();
            this.positionMapping = new Map();
            this.mapPositions(this.users, this.groups);
            this.positionAll();
            this.positioned = true;
        });
    },

    data() {
        
        return {  
            positioned: false,
            visibleGroup: undefined,
            positionMapping: new Map(),
            usersCopy: [...this.users], //We need this because we also want watch to work if we push to the user prop from outside the component.
            groupsCopy: this.getGroupsArrayCopy(this.groups), //Use a function that also copies sub-member-arrays.
            squareSize: 0
        }
    },

    props: {
        users: Array, //username, id, image, group id
        onUserClick: Function,
        filter: String,
        groups: Array, //Array of all groups with their respective members.
        gridCols: Number, //Grid contains squares, so no need for rows prop.
        gridSpacing: Number //Spacing in %
    },
    
    watch: {
        //The entire positioning needs to be remapped to fit the new column amount.
        gridCols: function(newVal, oldVal) {
            this.positionMapping = new Map();
            this.mapPositions(this.users, this.groups);
        },

        users: function(newVal, oldVal) {
            //Don't use oldVal because, if the users reference doesn't change, they both point to the same array.

            let joinedUsers = newVal.filter(user => !this.usersCopy.find(x => x.id === user.id));
            let leftUsers = this.usersCopy.filter(user => !newVal.find(x => x.id === user.id));

            //Check if there are no 2 of the same users in the array.
            let ambiguousUsers = newVal.filter(user => newVal.filter(user2 => user2.id === user.id).length >= 2);
            if(ambiguousUsers.length) {
                throw new Error(`Error: ambiguous users found: ${ambiguousUsers.map(x => `id: ${x.id} user: ${x.user}`).join(', ')}`);
            }

            this.usersCopy = [...newVal]; //Keep track of the current values in users.

            console.log("joined: " + joinedUsers.length);
            console.log("left: " + leftUsers.length);

            leftUsers.forEach(user => this.positionMapping.delete('u' + user.id));

            this.ensurePivot(joinedUsers, []);
            this.mapUserPositions(joinedUsers);

            this.$nextTick(() => {
                this.positionAll();
            });
            
        },

        groups: function(newVal, oldVal){
            /**
             * Corner cases:
             * 1) users are added to group that don't exist
             * 2) all groups are removed, no users are outside of groups and 1 or more groups are added
             * 3) all groups are removed and there are no users outside of the group
             * 4) user gets removed from group
             * 5) user gets added to group
             * 6) user moves from group to group
             * 7) a group is created from existing users
             */
            //Users changed? on join: move user to group, on leave move user to own spot

            let newGroups = this.getIdDifference(newVal, this.groupsCopy);
            let removedGroups = this.getIdDifference(this.groupsCopy, newVal);

            //Map old version of group to new version of group
            let possiblyChangedGroupMapping = new Map();
            this.groupsCopy.forEach(group => {
                let otherVersion = newVal.find(x => x.id === group.id);
                if(otherVersion){
                    possiblyChangedGroupMapping.set(group, otherVersion);
                }
            });


            let nonPositionedMembers = [];

            //Remove all removed groups from the position mapping, and also register their users as non positioned.
            removedGroups.forEach(group => {
                this.positionMapping.delete('g' + group.id);
                group.members.forEach(memberId => {
                    let member = this.users.find(u => u.id === memberId);
                    if(member) {
                        nonPositionedMembers.push(member);
                        this.positionMapping.delete('u' + memberId);
                    }
                });
            });

            //Register all members of new groups as non positioned.
            newGroups.forEach(group => {
                group.members.forEach(memberId => {
                    let member = this.users.find(u => u.id === memberId);
                    if(member) {
                        nonPositionedMembers.push(member);
                        this.positionMapping.delete('u' + memberId);
                    }
                });
            });


            //Check for removed and added users from possibly changed groups
            possiblyChangedGroupMapping.forEach((newVersion, oldVersion) => {
                let changedMemberIds = [];
                let addedUsers = newVersion.members.filter(x => !oldVersion.members.includes(x));
                let removedUsers = oldVersion.members.filter(x => !newVersion.members.includes(x));
                if(addedUsers?.length) changedMemberIds.push(...addedUsers);
                if(removedUsers?.length) changedMemberIds.push(...removedUsers); 

                console.log(`for group ${newVersion.id} the changed list is [${changedMemberIds.join(', ')}] (length ${changedMemberIds.length})`);

                changedMemberIds.forEach(changedMemberId => {
                    let changedMember = this.users.find(u => u.id === changedMemberId);
                    if(changedMember && !nonPositionedMembers.includes(changedMember)){
                        nonPositionedMembers.push(changedMember);
                        this.positionMapping.delete('u' + changedMemberId);
                    }
                });
            });

            this.mapPositions(nonPositionedMembers, newGroups);

            this.groupsCopy = this.getGroupsArrayCopy(newVal);

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
        },

        

    },

    methods: {

        onGroupClick: function(group){
            if(this.visibleGroup === group || (this.visibleGroup && this.visibleGroup !== group)){
                
                // Move all the users back to the group.
                let members = this.getGroupMembers(this.visibleGroup);
                members.forEach(member => {
                    this.positionMapping.set('u' + member.id, this.positionMapping.get('g' + group.id));
                    this.positionAll();
                });

                //Return if we click the same group twice, no new group needs to be opened.
                if(this.visibleGroup === group){
                    this.visibleGroup = undefined;
                    return;
                }
            }

            //We need to fan out the users of group.
            //The idea is to 'flood' around the group position.
            this.visibleGroup = group; 
            this.mapFanOut(group);
            this.positionAll();
        },

        mapFanOut(group){
            let toPlace = [...this.getGroupMembers(group)];
            let sideLength = 1;
            //Walk over all the 'sides'
            let pos = this.positionMapping.get('g' + group.id);
            let x = pos.x;
            let y = pos.y;
            while(toPlace.length){
                //Jump to top left square, and walk around in clockwise direction.
                sideLength += 2;
                x--;
                y--;

                for(let i = 0; i < 4; i++){
                    let dy = 0, dx = 0;
                    if(i === 0) dx = 1;
                    if(i === 1) dy = 1;
                    if(i === 2) dx = -1;
                    if(i === 3) dy = -1;
                    for(let j = 0; j < sideLength-1; j++){
                        //Look if the point is valid.
                        if(x < this.gridCols && x >= 0 && y >= 0){
                            let user = toPlace.shift();
                            this.positionMapping.set('u' + user.id, {x, y: y, minDistance: 0});
                            if(!toPlace.length) return;
                        }
                        x += dx;
                        y += dy;
                    }
                    //Check one more point after adding dx and dy to x and y.
                    if(x < this.gridCols && x >= 0 && y >= 0){
                        let user = toPlace.shift();
                        this.positionMapping.set('u' + user.id, {x, y, minDistance: 0});
                        if(!toPlace.length) return;
                    }
                }
            }
        },

        groupText: function(group){
            if(!group?.members?.length) return "0";

            let memberCount = group.members.length;
            if(memberCount > 9) return "9+";

            return memberCount;
        },

        /**
         * 
         */
        mapPositions(users, groups) {
            this.ensurePivot(users, groups);

            // Position all the groups
            this.mapGroupPositions(this.groups);

            // Position all the users that are not positioned yet.
            this.mapUserPositions(this.users);
        },

        ensurePivot(users, groups){
            if(!this.positionMapping.size) {
                if(groups && groups.length){
                    //Set a random group's position to some pivot position.
                    let randomGroup = groups[Math.floor(Math.random() * groups.length)];
                    this.positionMapping.set('g' + randomGroup.id, {
                        x: Math.floor(this.gridCols/2), 
                        y: Math.floor(this.visibleRows/2),
                        minDistance: 3,
                    });
                }else if(users && users.length){ 

                    //Note that this can't be reached if there's any groups, so we don't have to check if the user
                    //is party of any groups.

                    //Set a random user's position as pivot if there are no groups left and if there are just stray users.
                    let randomUser = users[Math.floor(Math.random() * users.length)];
                    this.positionMapping.set('u' + randomUser.id, {
                        x: Math.floor(this.gridCols/2), 
                        y: Math.floor(this.visibleRows/2),
                        minDistance: 2,
                    });
                }
            }
        },

        mapGroupPositions(groups){
            groups.forEach(group => {
                if(!this.positionMapping.get('g' + group.id)) {
                    let rSpotInfo = this.getRandomFreeSpot(3,5);
                    rSpotInfo.minDistance = 3;
                    this.positionMapping.set('g' + group.id, rSpotInfo);
                }
            });
        },

        mapUserPositions(users){
            users.forEach(user => {
                if(!this.positionMapping.get(`u${user.id}`)) {
                    
                    //If the user is in a group, set the position of the user to the position of the group
                    let group = this.getUserGroup(user.id);
                    if(group) {
                        this.positionMapping.set(`u${user.id}`, this.positionMapping.get('g' + group.id));
                    } else {
                        let rSpotInfo = this.getRandomFreeSpot(2,5);
                        rSpotInfo.minDistance = 2;
                        this.positionMapping.set(`u${user.id}`, rSpotInfo);
                    }
                    
                }
            });
        },

        getGroupsArrayCopy(groups){
            let groupsCopy = [...groups];
            groupsCopy.forEach(x => {
                x.members = [...x.members];
            });
            return groupsCopy;
        },

        clickedGroup(groupId) {
            if(this.visibleGroup == groupId) {
                this.visibleGroup = -1;
            } else {
                this.visibleGroup = groupId;
            }
        },
        
        handleResize() {
            //We need to do this for the y positioning, because we can't use percentages of the width for that.
            this.refreshPixelSizeReferences();
            this.positionAll();
        },

        /**
         * @param {Number} userId
         * @returns {{members: Array<Number>, id: Number}} group that contains the user with id userId (or undefined) 
         */
        getUserGroup(userId) {
            return this.groups.find(group => group.members.includes(userId));
        },

        getGroupMembers(group){
            let members = [];
            group.members.forEach(memberId => {
                let member = this.users.find(u => u.id === memberId);
                if(member) {
                    members.push(member);
                }
            });
            return members;
        },

        /**
         * Compares a and b with their id, and subtracts all overlapping elements from a.
         * In english: get all elements of a that are not part of b.
         * @param {Array<{id: String}>} a
         * @param {Array<{id: String}>} b
         * @returns a - b
         */
        getIdDifference(a, b){
            return a.filter(x => !b.find(y => y.id === x.id));
        },

        /**
         * Find the exact width of the userspace element to be able to position the icons properly
         */
        refreshPixelSizeReferences() {
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
        isValidSpot(x, y, minDistance, maxDistance) {
            // Look if there are no elements in the positionmapping that are closer than minDistance to x,y.
            let values = Array.from(this.positionMapping.values());
            let validMinDistance = values.filter(pos => {
                let distance = Math.abs(pos.x - x) + Math.abs(pos.y - y);
                return distance < minDistance && distance < pos.minDistance;
            }).length === 0;

            // Look if there is at least one element in positionmapping that's closer to x,y than maxDistance. 
            let validMaxDistance = values.filter(pos => Math.abs(pos.x - x) + Math.abs(pos.y - y) <= maxDistance).length >= 1;

            return validMinDistance && validMaxDistance;
        },

        /**
         * Looks if there is a spot available in the grid that's in the view.
         * @param {Number} minDistance
         * @param {Number} maxDistance
         * @param {Number} rows the rows the function considers as valid spots
         * @returns {Boolean}
         */
        containsFreeSpot(minDistance, maxDistance, rows) {
            // Loop through all spots in the grid to see if there's any valid spot.
            for(let i = 0; i < rows; i++) {
                for(let j = 0; j < this.gridCols; j++) {
                    if(this.isValidSpot(j, i, minDistance, maxDistance)) 
                        return true;
                }
            }
            return false;
        },

        /**
         * @returns {Number} the y value of the lowest positioned element on the page in positionMapping.
         */
        getLowestPosition() {
            let lowestPosition = 0;
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
        getRandomFreeSpot(minDistance, maxDistance) {
            let tryVisible = this.containsFreeSpot(minDistance, maxDistance, this.visibleRows);
            let yLimit;
            //To find the max y we can also use max(lowest + maxDistance, this.visibleRows), but that'd allow
            //users to spread more toward the bottom of the page.

            //We try to find spots in a visible area, and if that's not possible we'll just extend
            //the amount of rows we use (the yLimit).
            if(tryVisible) {
                yLimit = this.visibleRows;
            } else {
                let lowest = this.getLowestPosition();
                //Keep raising the y limit while there is no free spot.
                yLimit = lowest;
                while (!this.containsFreeSpot(minDistance, maxDistance, yLimit)) {
                    //A safe guard for infinite looping.
                    if(yLimit >= lowest + maxDistance) throw new Error(`Can't find a free spot (yLim=${yLimit})`);
                    yLimit++;
                }
            }

            //Keep trying random combinations until (x,y) is a valid spot.
            let x, y;
            do {
                x = Math.floor(Math.random() * this.gridCols);
                y = Math.floor(Math.random() * yLimit);
            } while(!this.isValidSpot(x,y, minDistance, maxDistance));
            return {x, y}; //json object with {x: value, y: value}
        },

        /**
         * Position the users and groups like mapped in positionMapping.
         */
        positionAll() {
            this.groups.forEach(group => this.position('g' + group.id));
            this.users.forEach(user => this.position('u' + user.id));
        },
        /**
         * Position an element in positionMapping visually in the html.
         * @param {String} id id of the user that is being positioned
         */
        position(id) {
            let position = this.positionMapping.get(id);
            if(!position) 
                throw new Error(`Could not position ${id} because it's not present in the positionMapping.`);
            if(Number.isNaN(position.x) || Number.isNaN(position.y))
                throw new Error(`Either x[${position.x}] or y${position.y} is NaN (probably divided by 0 somewhere)`);

            // console.log(`positioning user ${id} to ${position.x},${position.y}`)

            //Selected user without vue refs because those were not allowing me to add styling.

            //This could also be done in the template, but this is just a bit more modulair.
            let htmlElement = document.querySelector(`#${id}`);
            let positionHeight = position.y * this.squareSize;
            htmlElement.style.marginTop = positionHeight + 'px';
            htmlElement.style.marginLeft = (position.x * this.iconSize + this.gridSpacing) + '%';
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
    top: 0;
    visibility: hidden;
    z-index: 3;
}

.group:hover .popupBox{
    visibility: visible;
}

.group-text{
    @apply text-white text-center;
    z-index: 2;
}
</style>