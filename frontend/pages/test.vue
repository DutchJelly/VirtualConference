<template>
    <UserSpace class="userspace" :users="users" :groups="groups"/>
</template>

<script>


export default {
    name: 'Test',
    data(){
        return{
            users: [{
                id: 1
            },{
                id: 2
            },{
                id: 3
            },{
                id: 4
            },{
                id: 5
            },{
                id: 6
            },{
                id: 7
            },{
                id: 8
            },{
                id: 9
            },{
                id: 10
            },{
                id: 11
            },{
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
