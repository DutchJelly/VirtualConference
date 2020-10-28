<template>
    <UserSpace 
        class="userspace" 
        :users="users"
        :groups="groups" 
        :gridCols=10
        :gridSpacing=1
        filter=""
        ref="userspace"
    />
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
    @apply my-10;
    min-height: 100%;
    width: 100%;
}
</style>
