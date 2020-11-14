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
            .then(res => saveToken(res.data.sessionKey, commit))
            .then(this.$router.push({name:'plattegrond'}))
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
                commit('errorMsg', response.data.error)
            })
    },
    logout () {

    }
};

function saveToken(token, cb) {
    localStorage.setItem('token', token)
    console.log("token saved")
    // succes
    cb('authenticated')
}