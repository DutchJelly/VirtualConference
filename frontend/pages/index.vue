<template>
  <main class="login-page">
    <div class="banner">Virtual Conference App</div>
    <form class="login-prompt">
      <div class="login-prompt-item">
        <input
          v-model="loginForm.username"
          type="text"
          placeholder="Username"
          name="currentUsername"
        />
        <div class="icon-container">
          <img class="icon" src="../static/icons/user.svg" alt="" srcset="" />
        </div>
      </div>

      <div class="login-prompt-item">
        <input
          v-model="loginForm.password"
          type="password"
          placeholder="Password"
          name="currentPassword"
        />
        <div class="icon-container">
          <img
            src="../static/icons/password.svg"
            alt=""
            srcset=""
            class="icon"
          />
        </div>
      </div>

      <button class="login-button" @click.prevent="login">login</button>

      <router-link to="registreer" class="register-button" tag="button">
          Nog geen account? klik hier
      </router-link>
    </form>
  </main>
</template>

<script>

export default {
  data() {
    return {
      loginForm: {
        username: "",
        password: "",
      },
      message: "",
    };
  },

  created() {
    if (this.$route.query.message) {
      this.message = this.$route.query.message;
      this.handleTempMessage();
    }
  },
  methods: {
    login() {
				this.$store.dispatch({
            type: 'login',
            username: this.loginForm.username,
            password: this.loginForm.password
				})
				this.loginForm.username = ""
        this.loginForm.password = ""
    }
  }
};
</script>

<style scoped>
body {
  background-color: black;
}

.login-page {
  @apply w-full min-h-screen flex flex-col items-center justify-center;
  background: black url("../static/login_background.svg") no-repeat center
    center fixed;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
  transform: scale(1.02);
}

.banner {
  @apply text-4xl text-white bg-gray-700 w-full text-center p-5 bg-opacity-75;
  position: absolute;
  top: 0px;
}

@media only screen and (max-width: 450px) {
  .banner {
    @apply text-2xl;
  }
}

.login-prompt {
  /* @apply w-11/12 max-w-lg bg-white shadow-lg rounded flex flex-col items-center py-6; */

  width: 500px;
  max-width: 90%;
  margin: 2rem;
}

.login-prompt-item {
  position: relative;
  height: 60px;
  width: 100%;
  @apply mb-4;
}

.login-prompt-item input {
  @apply rounded block border-2 border-transparent border-gray-800 text-xl p-4;
  height: 100%;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.35);
  color: white;
  padding-left: 70px;
}

.login-prompt-item .icon-container {
  height: 65%;
  width: 70px;
  position: absolute;
  bottom: 17.5%; /* (100-height)/2*/
  pointer-events: none;

  @apply flex flex-row justify-center items-center;
}

.login-prompt-item .icon {
  height: 100%;
}

.login-prompt input:hover {
  outline: none;
  @apply border-gray-700;
}
.login-prompt input:focus {
  outline: none;
  @apply border-gray-500;
}

.login-button {
  outline: none;
  @apply shadow bg-green-700 mt-3 text-xl text-white p-2 w-full rounded border-2 border-transparent;
  height: 60px;
}
.login-button:hover,
.login-button:focus {
  @apply bg-green-600;
}

.register-button {
  outline: none;
  @apply shadow bg-green-700 mt-3 text-xl text-white p-2 w-full rounded border-2 border-transparent;
  height: 60px;
}
.register-button:hover,
.register-button:focus {
  @apply bg-green-600;
}
</style>
