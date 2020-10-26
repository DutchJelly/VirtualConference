<template>
    <UserSpace class="userspace" :users="users" :groups="groups" contains=""/>
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
                user: "Richard",
                id: 3
            },{
                user: "Richard",
                id: 4
            },{
                user: "Richard",
                id: 5
            },{
                user: "Richard",
                id: 6
            },{
                user: "Richard",
                id: 7
            },{
                user: "Richard",
                id: 8
            },{
                user: "Richard",
                id: 9
            },{
                user: "Richard",
                id: 10
            },{
                user: "Richard",
                id: 11
            },{
                user: "Richard",
                id: 12
            }],

            groups: [{
                members: [1,2,3]
            }, {
                members: [8,10,8,12]
            }]

        };
    },
    methods: {

    }
};
</script>

<style>
.userspace{
    height: 100%;
    width: 100%;
}
</style>
