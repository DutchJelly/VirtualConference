<template>
    <div class="testcontainer">
        <UserSpace 
            class="userspace" 
            :users="users"
            :groups="groups" 
            :gridCols=10
            :gridSpacing=1
            filter=""
            ref="userspace"
        />
        <div class="testsuite">
            <button @click.prevent="userTest1">User test 1</button>
            <button @click.prevent="userTest2">User test 2</button>
            <button @click.prevent="userTest3">User test 3</button>
            <button @click.prevent="groupTest1">Group test 1</button>
            <button @click.prevent="groupTest2">Group test 2</button>
            <div class="testresult">{{testresult}}</div>
        </div>
    </div>
    
    
</template>

<script>


export default {
    name: 'Test',
    data(){
        return{
            users: [{
                user: "Richard",
                id: 1
            },{
                user: "Richard",
                id: 2
            },{
                user: "Jelle",
                id: 3
            },{
                user: "Richard",
                id: 4
            },{
                user: "Richard",
                id: 5
            }],

            groups: [{
                id: 0,
                members: [1,2]
            }, {
                id: 1,
                members: [8,10,8,12]
            }],

            testresult: ""

        };
    },
    methods: {
        userTest1(){
            var copy = [...this.users];
            copy.push({user: "JelleTest", id: 0});
            this.users = copy;
            this.testresult = "You should see a user called JelleTest added to the list if it was not already there. An error should be thrown if you click 1 or 3 again.";
        },
        userTest2(){
            this.users = [{
                user: "jelle2",
                id: 9
            }, {
                user: "richard2",
                id: 10
            }];
            this.groups = [{
                id: 0,
                members: [1,2]
            }, {
                id: 1,
                members: [8,10,8,12]
            }];

            this.testresult = "You should see 2 groups and 1 user.";
        },
        userTest3(){
            //This doens't modify the reference, which makes it tricky!
            this.users.push({user: "JelleTest", id: 0});
            this.testresult = "You should see a user called JelleTest added to the list if it was not already there. An error should be thrown if you click 1 or 3 again.";
        },
        groupTest1(){
            this.users = [{
                user: "Richard",
                id: 1
            },{
                user: "Richard",
                id: 2
            },{
                user: "Jelle",
                id: 3
            },{
                user: "Richard",
                id: 4
            },{
                user: "User 8",
                id: 8
            }];

            this.groups = [{
                id: 0,
                members: [1,2]
            }, {
                id: 1,
                members: [8,10,12]
            }];

            this.testresult = "Test in progress...";

            setTimeout(() => {
                this.groups = [{
                    id: 0,
                    members: [1,2,8]
                }, {
                    id: 1,
                    members: [10,12]
                }];
                this.testresult = "User 8 should have moved to group 0."
            }, 1000);
        },

        groupTest2(){
            this.users = [{
                user: "Richard",
                id: 1
            },{
                user: "Richard",
                id: 2
            },{
                user: "Jelle",
                id: 3
            },{
                user: "Richard",
                id: 4
            },{
                user: "Richard",
                id: 8
            }];

            this.groups = [];

            this.testresult = "Test in progress...";

            setTimeout(() => {
                this.groups = [{
                    id: 0,
                    members: [1,2,3,4,8]
                }];
                this.testresult = "All users should have moved into a new group."
            }, 1000);
        },
    }
};
</script>

<style>
.userspace{
    min-height: 100%;
    grid-area: userspace;
}

.testsuite{
    grid-area: testsuite;
    background-color: black;
    display: flex;
    flex-direction: column;
}

.testsuite > button {
    background-color: lightgreen;
    margin: 10px;
    padding: 10px;
    font-weight: bold;
}

.testresult{
    @apply text-white font-bold my-10 mx-10;
}

.testcontainer{
    display: grid;
    grid-template-columns: 8fr 2fr;
    grid-template-areas: "userspace testsuite";
    width: 100%;
    height: 100%;
}

</style>
