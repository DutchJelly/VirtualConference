<template>
  <main class="info-container">
    <div :class="'timed-info-message ' + (!show ? 'hide' : '')">
      <span class="info-label">Info: </span>
      {{this.message}}
    </div>
  </main>
</template>

<script>

export default {
  name: 'TimedInfoMessageBox',
  props: {
    message: String,
    time: Number
  },
  data() {
    return {
      show: true,
      timeout: null,
      nonShown: [], //queue of elements that are not shown yet
      currentMessage: ""
    };
  },
  watch: {
    //Function that fires when message prop changes
    message: function(newVal, oldVal) {

      if(this.timeout != null) {
        this.nonShown.push(newVal);
        return;
      } 
      this.currentMessage = newVal;
      this.show = true;
      this.startTimer();
    }
  },
  methods: {
    startTimer: function(){
      if(this.timeout != null) return;

      this.timeout = setTimeout(() => {
        //if the timeout ends and there's an element not shown, start a new one.
        this.timeout = null;
        if(this.nonShown.length){
          this.currentMessage = this.nonShown[0];
          this.nonShown.shift();
          this.startTimer();
        }else{
          this.show = false;
        }
      }, this.time*1000);
    }
  },
  mounted(){
    if(this.message){
      this.currentMessage = this.message;
      this.startTimer();
    }
  }
};
</script>

<style scoped>

.info-container{

  position: absolute;
  overflow-y: hidden;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 0)
}

.timed-info-message{
    @apply p-2 bg-gray-300 border-gray-800 block rounded shadow-xl text-xl transition-transform ease-in-out duration-200;
}

.info-label{
    @apply font-bold;
}

.hide{
  transform: translateY(100px);
}

</style>