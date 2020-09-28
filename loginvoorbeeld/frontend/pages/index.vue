<template>
  <main class="login-page">
    <div class="banner">Virtual Conference</div>

    <form class="login-prompt">
      <label>
        Username
        <input
          v-model="loginForm.username"
          type="text"
          placeholder="Username"
          name="currentUsername"
        />
      </label>

      <label>
        Password
        <input
          v-model="loginForm.password"
          type="password"
          placeholder="Password"
          name="currentPassword"
        />
      </label>

      <button class="login-button" @click.prevent="login">Login</button>

      <div class="error-message" :class="error ? 'opacity-100' : 'opacity-0'">
        {{ error }}
      </div>
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
      error: null,
    };
  },
  methods: {
    async login() {
      if (this.timeout) clearTimeout(this.timeout);
      this.error = null;
      if (!this.loginForm.username) {
        this.error = `Please fill in a username`;
        this.handleTempError();
        return;
      }
      if (!this.loginForm.password) {
        this.error = `Please fill in your password`;
        this.handleTempError();
        return;
      }
      const response = await this.$axios("http://localhost:5000");
      console.log({ response });
      // this.$router.push("/overview");
    },
    handleTempError() {
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.error = null;
      }, 5000);
    },
  },
};
</script>

<style scoped>
.login-page {
  @apply min-h-screen w-full flex flex-col items-center;
}

.banner {
  @apply select-none bg-gradient-to-br from-teal-400 via-purple-500 to-blue-600 tracking-tight
  h-48 w-full flex items-center justify-center text-5xl text-white font-hairline;
}

.login-prompt {
  @apply w-11/12 max-w-lg bg-white shadow-lg -mt-6 rounded flex flex-col items-center py-6;
}

.login-prompt label input {
  @apply rounded block shadow border-2 border-transparent border-indigo-100 p-2;
}

.login-prompt label input:hover,
.login-prompt label input:focus {
  outline: none;
  @apply border-indigo-200;
}

.login-button {
  outline: none;
  @apply shadow bg-indigo-700 mt-3 text-white p-2 w-32 rounded border-2 border-transparent;
}
.login-button:hover {
  @apply bg-indigo-600;
}
.login-button:focus {
  @apply border-orange-600;
}

.error-message {
  @apply shadow h-8 mt-4 p-2 bg-red-300 text-red-800 text-sm flex 
  items-center rounded transition-opacity duration-300 w-48 justify-center;
}
</style>