import axios from 'axios'

export const state = () => ({
    loggedIn: false,
    errorMsg: null,
    succesMsg: null
});
  
export const mutations = {
    authenticated(state) {
        state.loggedIn = true
        state.errorMsg = null
        state.succesMsg = null
    },
    errorMsg(state, e) {
        state.errorMsg = e
        state.succesMsg = null
    },
    succesMsg(state, e) {
        state.succesMsg = e
        state.errorMsg = null
    }
};

export const actions = {
    login({ commit }, { username, password }) {
        axios
            .post("http://localhost:5000/login", {
                data: {
                    username,
                    password
                },
            })
            .then(res => {saveToken(res.data.sessionKey, commit)
                window.location.replace('/plattegrond')
                //this.$router.push({name:'plattegrond', query: {username}})
            })//TODO change this to a simple path only, this is not secure
            .catch(({ response }) => {
                commit('errorMsg', response.data.error)
            })
    },
    signup({ commit }, { username, password, image, email }) {
        axios
            .post("http://localhost:5000/register", {
                username: username,
                password: password,
                image: image,
                email: email
            })
            .then(res => {
                commit('succesMsg', `${res.data.message}`)
                this.$router.push({ path: "/"})
            })
            .catch(({ response }) => {
                if(response.data.error.isEmail) {
                    commit('errorMsg', response.data.error.isEmail)
                } else if(typeof response.data.error.length === 'string' || response.data.error.length instanceof String) {
                    commit('errorMsg', response.data.error.length)
                } else {
                    commit('errorMsg', response.data.error)
                }
            })
    },
    logout () {

    }
};

function saveToken(token, cb) {
    localStorage.setItem('token', token)
    // succes
    cb('authenticated')
}