<template>
    <main class="iconShape">
        <ul v-for="item in items" :key="item.user">
            <div v-show="item.user.toLowerCase().includes(contains.toLowerCase())">
                <button class="user" @click.prevent="onUserClick(item)">
                    <div class="popupBox">
                        <span>
                            Gebruikersnaam: {{ item.user }}
                            Status: Beschikbaar
                        </span>
                    </div>
                </button>
            </div>
        </ul>
    </main>
</template>



<script>
export default {
    props: {
        items: Array,
        onUserClick: Function,
        contains: String
    },
}
</script>

<style scoped>
.user{
  width: 50px;
  height: 50px;
  -webkit-border-radius: 25px;
  -moz-border-radius: 25px;
  border-radius: 25px;
  background: red;
  postion: relative;
}

.user .popupBox{
  @apply bg-gray-400 rounded;
  width: 400%;
  position: relative;
  left: 55px;
  top: 2px;
  visibility: hidden;
}

.user:hover .popupBox{
  visibility: visible;
}

</style>