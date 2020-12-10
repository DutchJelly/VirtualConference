export default function ({ store, redirect }) {
    
    if(!store.getters.getUser && store.getters.getToken)
        store.dispatch('refreshLogin').then(() => {
            if(!store.getters.getUser) return redirect('/');
        });   
}