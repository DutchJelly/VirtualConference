<template>
  <main class="register-page">
    <div class="banner">Virtual Conference App</div>
    <form class="register-prompt">

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

    <button class="register-button" @click.prevent="register">Register</button>

    <router-link :to="{name: 'index'}" class="login-button" tag="button">Back to login</router-link>

    <div class="error-message" :class="error ? 'opacity-100' : 'opacity-0'">
      {{ error }}
    </div>
    </form>
  </main>
</template>

<script>

export default {

  data () {
    return {
      registerForm: {
        Username: "",
        NewPassword: "",
        CheckNewPassword: ""
      },
      error: null
    };
  },

  methods: {
    async register () {
      if (this.timeout) { clearTimeout(this.timeout); }
      this.error = null;
      if (!this.registerForm.newUsername) {
        this.error = "Please fill in a username";
        this.handleTempError();
        return;
      } else if (!this.validNewUsername(this.registerForm.newUsername)) {
        this.error = "Please fill in a valid email";
        this.handleTempError();
        return;
      }

      if (!this.registerForm.newPassword) {
        this.error = "Please fill in your password";
        this.handleTempError();
        return;
      } else if (!(this.registerForm.newPassword.length > 7)) {
        this.error = "Your password must be at least 8 characters";
        this.handleTempError();
        return;
      }

      if (!this.registerForm.checkNewPassword) {
        this.error = "Please confirm your password";
        this.handleTempError();
        return;
      }
      if (this.registerForm.newPassword !== this.registerForm.checkNewPassword) {
        this.error = "Your passwords do not match";
        this.handleTempError();
        return;
      }
      let response;
      try {
        response = await this.$axios.post("http://localhost:5000/create_user", {
          data: {
            username: this.registerForm.newUsername,
            password: this.registerForm.newPassword
          }
        });
      } catch (error) {
        if (error.response.status == 400) {
          console.log(error.response.data.error);
          this.error = error.response.data.error;
          this.handleTempError();
          return;
        } else {
          console.log("an undefined error occured.");
          this.error = `an undefined error occured.`;
          this.handleTempError();
          return;
        }
      }
      
      console.log({ response });
      this.$router.push({name: 'index', query: { message: 'Your account has succesfully been created'}});
    },
    validNewUsername: function (newUsername) {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(newUsername);
    },
    handleTempError () {
      if (this.timeout) { clearTimeout(this.timeout); }
      this.timeout = setTimeout(() => {
        this.error = null;
      }, 5000);
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
