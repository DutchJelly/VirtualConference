<template>
  <main class="info-container">
    <div :class="'timed-info-message ' + (!show ? 'hide' : '')">
      <span class="info-label">Info: </span>
      {{this.currentMessage}}
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
      //If the timer of another message is still 
      //running, we add the message to a queue.
      if(this.timeout != null) {
        this.nonShown.push(newVal);
        return;
      } 

      //When getting a new prop value we are adjusting the state to show it.
      this.currentMessage = newVal;
      this.show = true;

      //Start a timer for making the message dissapear again.
      this.startTimer();
    }
  },
  methods: {
    startTimer: function(){
      //Don't start another timer if one is running already.
      if(this.timeout != null) return;

      this.timeout = setTimeout(() => {
        //At the end of the timeout, we set the timeout to null again.
        this.timeout = null;

        //If there's some element in the list of non shown messages, we
        //show that and start another timer.
        if(this.nonShown.length > 0){
          this.currentMessage = this.nonShown[0];
          this.nonShown.shift();
          this.startTimer();
        }
        
        //If there's no other message to show, we simply hide the element again.
        else{
          this.show = false;
        }
      }, this.time*1000);
    }
  },
  mounted(){
    //Ensure that the props message gets added to the state when the component
    //is created.
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