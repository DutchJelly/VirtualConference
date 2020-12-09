export default function ({ store, redirect }) {
    console.log(store);
    //TODO the getters of the store aren't defined?
    //TODO the user object isn't saved?
    console.log(`user ${store.isLoggedIn ? 'is' : 'isn\'t'} logged in`);
    if (!store.state.token) 
        return redirect('/');
}