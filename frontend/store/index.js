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
        console.log(state.errorMsg)
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
            .catch(({response}) => {
                commit('errorMsg', response.data.error)
            })
    },
    signup() {

    },
    logout () {

    }
};



function saveToken(token, cb) {
    localStorage.setItem('token', token)
    // succes
    cb('authenticated')
}