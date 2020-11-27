import axios from 'axios'

export const state = () => ({
    loggedIn: false,
    errorMsg: null
});
  
export const mutations = {
    authenticated(state) {
        state.loggedIn = true
        state.errorMsg = null
    },
    errorMsg(state, e) {
        state.errorMsg = e
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
                this.$router.push({name:'kamerview', query: {username}})
            })//TODO change this to a simple path only, this is not secure
            .catch(({ response }) => {
                commit('errorMsg', response.data.error)
            })
    },
    signup({ commit }, { username, password }) {
        axios
            .post("http://localhost:5000/create_user", {
                data: {
                    username,
                    password
                },
            })
            .then(
                commit('errorMsg', null)
            )
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