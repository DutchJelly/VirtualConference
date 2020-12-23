/**
 * Manage authorization of the user that's using the app.
 */

import axios from 'axios'

//The state of the login.
export const state = () => ({
    token: localStorage.getItem('token') || null,
    user: null,
    errorMsg: null,
    succesMsg: null
});

//Mutations for the login state.
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

//Actions that possibly commit mutations to the login state.
export const actions = {

    //Logs in a user with the specified email and password. Redirects to plattegrond.vue.
    async login({ commit }, { email, password }) {
        try{
            const res = await axios.post("http://localhost:5000/login", {
                email: email,
                password: password
            });
            localStorage.setItem('token', res.data.sessionKey);
            commit('authenticate', res.data.sessionKey, res.data);
            this.$router.push({path: "/mapview"});
            return res.data;
        } catch(err){
            commit('setError', "Cannot login.");
        }
    },

    //Refreshes the logged in user with the session key. cb gets called with the user object
    //if this action is successful. This action will commit the user if anything changed.
    //This action will also logout if the user doesn't exist anymore. If anything internal
    //error occurs, this'll be commited to the errorMsg.
    async refreshLogin({ commit, state, dispatch }) {
        const token = state.token;
        if(!token) return;

        try{
            const res = await axios.post("http://localhost:5000/userObject", {
                sessionKey: token
            });
            if(!res.data?.id) {
                commit("setError", "Something went wrong with requesting your user data.");
                dispatch("logout");
            } else {
                if(state.user !== res.data)
                    commit('setUser', res.data);
                return res.data;
            }
            return null;
        } catch(err){
            commit("setError", "Your login could not be refreshed.");
            dispatch("logout");
        }
    },

    //Will signup a user with the specified username, password, image and email.
    signup({ commit }, { username, password, image, email }) {
        return axios.post("http://localhost:5000/register", {
            username: username,
            password: password,
            image: image,
            email: email
        })
        .then(res => {
            commit('setMessage', `${res.data.message}`);
            this.$router.push({ path: "/"} );
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

    //Logs out the current user and redirects to login page, if any is logged in.
    logout ({ commit }) {
        localStorage.removeItem('token');
        commit('authenticate', null, null);
        this.$router.push({ path: "/"})
    }
};

//Getters of the state variables. This is a bit redundant.
export const getters = {
    getToken: state => state.token,
    getUser: state => state.user,
    authErrorMsg: state => state.errorMsg,
    authSuccessMsg: state => state.succesMsg,
}
