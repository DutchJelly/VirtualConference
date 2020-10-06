<template>
  <main class="kamerpage">

    <div class="sidebar">
      <div class="sidebar-header">
        test
      </div>
      <div class="sidebar-items">
        <div class="sidebar-content">
          Richard
          Wouter
        </div>
        <div class="sidebar-search-bar">
          type to find something
        </div>
      </div>
    </div>

  </main>
</template>

<script>
export default {};
</script>

<style>

.kamerpage{
  @apply w-full min-h-screen flex flex-col items-center justify-center;
  background: black url("../static/login_background.svg") no-repeat center center fixed;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
  transform: scale(1.02);
}

.sidebar{
  @apply bg-white rounded shadow-lg;
  height: 90%;
  width: 10%;
  min-width: 150px;
  position: fixed;
  right: 3%;
}


.sidebar-header{
  @apply px-1;
}

.sidebar-items{
  
}

.sidebar-content{
  @apply px-1;
  position: relative;
}

.sidebar-search-bar{
  @apply px-1;
  position: relative;
}

</style>