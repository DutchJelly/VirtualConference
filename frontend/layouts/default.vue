<template>
<div class="main-container" ref="main">
    <Nuxt ref="nuxt" />
</div>

  
</template>

<style>
.main-container {
  @apply bg-gray-200 min-h-screen h-screen w-full flex flex-col items-center;
  overflow-x: hidden;
  overflow-y: hidden;
}
</style>


<script>


export default {
    mounted(){
    }
  
}
</script>
