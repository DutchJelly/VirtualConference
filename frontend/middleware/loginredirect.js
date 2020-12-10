export default function ({ store, redirect }) {
    if(store.getters.getToken)
        store.dispatch('refreshLogin', {cb: (user) => {
            if(user) return redirect('/plattegrond');
        }});
}