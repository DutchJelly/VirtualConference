import axios from 'axios'

export const state = () => ({
    loggedIn: false,
    errorMsg: null
});
  
export const mutations = {
    authenticated(state) {
        console.log("into authenticated")
        state.loggedIn = true
        errorMsg = null
    },
    errorMsg(state, e) {
        state.errorMsg = e
        console.log(state.errorMsg)
    }
};

export const actions = {
    login({ commit }, { username, password }) {
        console.log("iets")
        axios
            .post("http://localhost:5000/login", {
                data: {
                    username,
                    password
                }
            })
            .then(res => saveToken(res.data.sessionKey, commit))
            .catch(({ response }) => {
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
    console.log("saveToken")
    console.log(token)
    console.log(cb)
    // succes
    cb('authenticated')
    console.log("out authenticated")
}