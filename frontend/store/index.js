import axios from 'axios'
import { resolve } from 'path';

export const state = () => ({
    token: localStorage.getItem('token') || null,
    user: null,
    errorMsg: null,
    succesMsg: null
});
  
export const mutations = {
    authenticate(state, token, user) {
        state.token = token;
        state.user = user;
    },
    setToken(state, token) {
        state.token = token;
    },
    setUser(state, user) {
        state.user = user;
    },
    setError(state, e) {
        state.errorMsg = e;
        state.succesMsg = null;
    },
    setMessage(state, e) {
        state.succesMsg = e;
        state.errorMsg = null;
    }
};

export const actions = {
    login({ commit }, { email, password }) {
        axios.post("http://localhost:5000/login", {
            email: email,
            password: password
        })
        .then(res => {
            localStorage.setItem('token', res.data.sessionKey);
            commit('authenticate', res.data.sessionKey, res.data);
            
            this.$router.push({path: "/plattegrond"});
        })
        .catch(() => {
            commit('setError', "Cannot login.");
        })
    },
    refreshLogin({ commit, state, dispatch }) {
        const token = state.token;
        if(!token) return;

        axios.post("http://localhost:5000/userObject", {
            sessionKey: token
        })
        .then(res => {
            if(!res.data?.id) {
                commit("setError", "Something went wrong with requesting your user data.");
                dispatch("logout");
                return;
            }
            commit('setUser', res.data);
            return;
        })
        .catch((err) => {
            console.error(err);
            commit("setError", "Your login could not be refreshed.");
            dispatch("logout");
        });
    },
    signup({ commit }, { username, password, image, email }) {
        axios.post("http://localhost:5000/register", {
            username: username,
            password: password,
            image: image,
            email: email
        })
        .then(res => {
            commit('setMessage', `${res.data.message}`)
            this.$router.push("/"); //TODO check if this is right, it was .push({path: "/"})
        })
        .catch(({ response }) => {
            if(response.data.error.isEmail) {
                commit('setError', response.data.error.isEmail)
            } else if(typeof response.data.error.length === 'string' || response.data.error.length instanceof String) {
                commit('setError', response.data.error.length)
            } else {
                commit('setError', response.data.error)
            }
        })
    },
    logout ({ commit }) {
        console.warn("logging out")
        localStorage.removeItem('token')
        commit('authenticate', null, null);
        this.$router.push({ path: "/"})
    }
};

export const getters = {
    getToken: state => state.token,
    getUser: state => state.user,
    authErrorMsg: state => state.errorMsg,
    authSuccessMsg: state => state.succesMsg,
    
}
