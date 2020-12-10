export default function ({ store, redirect }) {
    if(!store.getters.getUser && store.getters.getToken)
        store.dispatch('refreshLogin', {cb: (user) => {
            console.log(user);
            if(user) return redirect('/plattegrond');
        }});
}