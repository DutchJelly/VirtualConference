import axios from 'axios'
import { resolve } from 'path';

export const state = () => ({
    token: localStorage.getItem('token') || null,
    user: localStorage.getItem('user') || null,
    errorMsg: null,
    succesMsg: null
});
  
export const mutations = {
    authenticate(state, token, user) {
        state.token = token;
        state.user = user;
        state.errorMsg = null
        state.succesMsg = null
    },
    unauthenticate(state) {
        state.token = null;
        state.user = null;
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
    login({ commit }, { email, password }) {
        axios
            .post("http://localhost:5000/login", {
                email: email,
                password: password
            })
            .then(res => {
                console.log('saving user:');
                console.log(res.data);
                localStorage.setItem('token', res.data.sessionKey);
                commit('authenticate', res.data.sessionKey, res.data);
                
                this.$router.push({ path: "/plattegrond"});
                resolve(res);
            })
            .catch(({ response }) => {
                commit('errorMsg', response.data.error);
                resolve(response);
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
                resolve(res);
            })
            .catch(({ response }) => {
                if(response.data.error.isEmail) {
                    commit('errorMsg', response.data.error.isEmail)
                } else if(typeof response.data.error.length === 'string' || response.data.error.length instanceof String) {
                    commit('errorMsg', response.data.error.length)
                } else {
                    commit('errorMsg', response.data.error)
                }
                resolve(response);
            })
    },
    joinRoom({ commit }, { sessionKey, roomId } ) {
        axios
            .post("http://localhost:5000/joinRoom", {
                sessionKey: sessionKey,
                roomId: roomId
            })
            .then(res => {
                console.log(res.data)
                this.$router.push({ name: "kamerview", query: res.body })
                resolve(res);
            })
            .catch(({ response }) => {
                if(response.error){
                    commit('errorMsg', response.error)
                } else {
                    commit('errorMsg', "a problem occured please try to login again")
                }
                this.$router.push({ path: "/"})
                resolve(response);
            })
    },
    logout () {
        localStorage.removeItem('token')
        commit('unauthenticate');
        this.$router.push({ path: "/"})
    }
};

export const getters = {
    isLoggedIn: state => !!state.token,
    authErrorMsg: state => state.errorMsg,
    authSuccessMsg: state => state.succesMsg,
    getUser: state => state.user
}
