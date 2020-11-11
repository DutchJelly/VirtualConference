export const state = () => ({
    session: undefined
});
  
export const mutations = {
    set (state, newSession) {
        state.session = newSession;
    }
};