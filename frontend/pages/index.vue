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
          <img class="icon" src="../static/icons/user.svg" alt="" srcset="">
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
          <img src="../static/icons/password.svg" alt="" srcset="" class="icon">
        </div>
      </div>

      <button class="login-button" @click.prevent="login">login</button>
	  <button class="login-button" @click.prevent="logout">logout</button>
		<button class="login-button" @click.prevent="debug">debug</button>

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
		sessionKey: ""
      },
      error: null,
	};	
  },
  created: function(){
  
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
	  
  
	  const response = await this.$axios.post("http://localhost:5000/login", {
        data: {
          username: this.loginForm.username,
		  password: this.loginForm.password
        }
	  })
	//   console.log("TEST")
	//   console.log(response);
	//   console.log(response.data.sessionKey)
	  this.sessionKey = response.data.sessionKey
	//   console.log(this.sessionKey)
	//   console.log("TEST")
      // console.log({ response });
    //   window.location.href = `/jitsi?username=${this.loginForm.username}`;
      // this.$router.push("/overview");
	},
	async logout() {
		console.log("LOGOUT")
	
      if (this.timeout) clearTimeout(this.timeout);
      this.error = null;
      if (!this.sessionKey) {
        this.error = `No session key`;
        this.handleTempError();
        return;
	  }	 
	  console.log("logout1") 
		// req.setRequestHeader('Authorization','Basic' + this.sessionKey);
		console.log("logout2") 
	  const response = await this.$axios.post("http://localhost:5000/logout", {
        data: {
          sessionKey: this.sessionKey,
		},
		headers: {
			authorization: this.sessionKey
		}
	  })
	  console.log("logout3") 
	  this.sessionKey = "";
	},
	async debug() {
		const response = await this.$axios.get("http://localhost:5000/allUsers")
		console.log(response.data)
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

body{
  background-color: black;
}

.login-page{
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

.login-prompt {

  /* @apply w-11/12 max-w-lg bg-white shadow-lg rounded flex flex-col items-center py-6; */
  
  width: 500px;
  max-width: 90%;
  margin: 2rem;
}

.login-prompt-item{
  position: relative;
  height: 60px;
  width: 100%;
  @apply mb-4 ;
}

.login-prompt-item input {
  @apply rounded block border-2 border-transparent border-gray-800 text-xl p-4;
  height: 100%;
  width: 100%;
  background-color: rgba(0,0,0,0.35);
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

.login-prompt-item .icon{
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
  @apply shadow bg-green-600 mt-3 text-xl text-white p-2 w-full rounded border-2 border-transparent;
  height: 60px;
}
.login-button:hover,
.login-button:focus {
  @apply  bg-green-500;
}
</style>