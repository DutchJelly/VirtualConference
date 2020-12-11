<template>
  <main class="register-page">
    <div class="banner">Virtual Conference App</div>
    <form class="register-prompt">

    <div class="register-prompt-item">
      <input
        v-model="registerForm.newEmail"
        type="text"
        placeholder="Email"
        name="newEmail"
      />
      <div class="icon-container">
        <img class="icon" src="../static/icons/user.svg" alt="" srcset="">
      </div>
    </div>

    <div class="register-prompt-item">
      <input
        v-model="registerForm.newUsername"
        type="text"
        placeholder="Username"
        name="newUsername"
      />
      <div class="icon-container">
        <img class="icon" src="../static/icons/user.svg" alt="" srcset="">
      </div>
    </div>

    <div class="register-prompt-item">
      <input
        @change="onFileChange"
        type="file"
        name="newPicture"
      />
      <div class="icon-container">
        <img class="icon" :src="image" >
      </div>
    </div>

    <div class="register-prompt-item">
      <input
        v-model="registerForm.newPassword"
        type="password"
        placeholder="Password"
        name="newPassword"
      />
      <div class="icon-container">
        <img src="../static/icons/password.svg" alt="" srcset="" class="icon">
      </div>
    </div>

    <div class="register-prompt-item">
      <input
        v-model="registerForm.checkNewPassword"
        type="password"
        placeholder="Confirm password"
        name="checkNewPassword"
      />
      <div class="icon-container">
        <img src="../static/icons/password.svg" alt="" srcset="" class="icon">
      </div>
    </div>

    <button class="register-button" @click.prevent="signup">Register</button>

    <nuxt-link :to="{name: 'index'}" class="login-button" tag="button">Back to login</nuxt-link>

    <div class="error-message" :class="error || !match || succes ? 'opacity-100' : 'opacity-0'">
      {{ error }} {{ succes }}
      <div v-if="!match">passwords do not match</div>
    </div>
    </form>
  </main>
</template>

<script>

export default {

  data () {
    return {
      image: "",
      registerForm: {
        newUsername: "",
        newPassword: "",
        newEmail: "",
        checkNewPassword: ""
      },
    };
  },
  computed: {
    error: function() {
      return this.$store.state.errorMsg
    },
    succes: function() {
      return this.$store.state.succesMsg
    },
    match() {
      return (this.registerForm.newPassword == this.registerForm.checkNewPassword)
    }
  },
  watch: {
    error(oldVal, newVal) {
        if (newVal != oldVal)setTimeout(() => this.$store.commit('errorMsg', null), 2000)
    },
    succes(oldVal, newVal) {
        if (newVal != oldVal)setTimeout(() => this.$store.commit('succesMsg', null), 4000)
    }
  },
  methods: {
      signup() {
          if (this.registerForm.newPassword == this.registerForm.checkNewPassword ) {
              this.$store.dispatch({
                  type: 'signup',
                  username: this.registerForm.newUsername,
                  password: this.registerForm.newPassword,
                  image: "not an image",
                  email: this.registerForm.newEmail
              })
              this.registerForm.newUsername = ""
              this.registerForm.newPassword = ""
              this.image = ""
              this.registerForm.newEmail = ""
              this.registerForm.checkNewPassword = ""
          } else {
            this.$store.commit('errorMsg', "passwords do not match")
          }
      },
      onFileChange(e) {
        var files = e.target.files || e.dataTransfer.files;
        if (!files.length)
          return;
        this.createImage(files[0]);
      },
      createImage(file) {
        var image = new Image();
        var reader = new FileReader();
        var vm = this;

        reader.onload = (e) => {
          vm.image = e.target.result;
        };
        reader.readAsDataURL(file);
      }
  }
};
</script>

<style scoped>

body{
  background-color: black;
}

.register-page{
  @apply w-full min-h-screen flex flex-col items-center justify-center;
  background: black url("../static/login_background.svg") no-repeat center center fixed;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
  transform: scale(1.02);
}

.banner{
  @apply text-4xl text-white bg-gray-700 w-full text-center p-5 bg-opacity-75;
  position: absolute;
  top: 0px;
}

@media only screen and (max-width: 450px) {
  .banner{
    @apply text-2xl;
  }
}

.register-prompt {
  /* @apply w-11/12 max-w-lg bg-white shadow-lg rounded flex flex-col items-center py-6; */

  width: 500px;
  max-width: 90%;
  margin: 2rem;
}

.register-prompt-item{
  position: relative;
  height: 60px;
  width: 100%;
  @apply mb-4 ;
}

.register-prompt-item input {
  @apply rounded block border-2 border-transparent border-gray-800 text-xl p-4;
  height: 100%;
  width: 100%;
  background-color: rgba(0,0,0,0.35);
  color: white;
  padding-left: 70px;

}

.register-prompt-item .icon-container {
  height: 65%;
  width: 70px;
  position: absolute;
  bottom: 17.5%; /* (100-height)/2*/
  pointer-events: none;

  @apply flex flex-row justify-center items-center;
}

.register-prompt-item .icon{
  height: 100%;
}

.register-prompt input:hover {
  outline: none;
  @apply border-gray-700;
}
.register-prompt input:focus {
  outline: none;
  @apply border-gray-500;
}

.register-button {
  outline: none;
  @apply shadow bg-green-600 mt-3 text-xl text-white p-2 w-full rounded border-2 border-transparent;
  height: 60px;
}
.register-button:hover,
.register-button:focus {
  @apply  bg-green-500;
}

.login-button {
  outline: none;
  @apply shadow bg-green-700 mt-3 text-xl text-white p-2 w-full rounded border-2 border-transparent;
  height: 60px;
}
.login-button:hover,
.login-button:focus {
  @apply  bg-green-600;
}
</style>
