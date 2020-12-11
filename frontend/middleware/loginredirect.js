/**
 * Redirect from login page to home page if user is logged in, which is 
 * currently set to mapview.
 * @author DutchJelly
 */
export default function ({ store, redirect }) {
    if(store.getters.getToken)
        store.dispatch('refreshLogin', {cb: (user) => {
            if(user) return redirect('/mapview');
        }});
}