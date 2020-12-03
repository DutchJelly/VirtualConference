export default function ({ store, redirect }) {
    console.log(`user ${store.isLoggedIn ? 'is' : 'isn\'t'} logged in`);
    if (store.state.token) {
        //TODO when this happens, make sure that the user object is retreived from the server
        console.log('user is already logged in: ');
        console.log(store.state.user.username);
        return redirect('/plattegrond');
    }
        
}