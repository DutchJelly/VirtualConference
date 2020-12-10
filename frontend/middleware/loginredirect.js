export default function ({ store, redirect }) {
    if(!store.getters.getUser && store.getters.getToken)
        store.dispatch('refreshLogin').then((user) => {
            console.log('finished...');
            console.log(user);
            console.log(store.state.user);
            if(store.getters.getUser) return redirect('/plattegrond');
        });
}