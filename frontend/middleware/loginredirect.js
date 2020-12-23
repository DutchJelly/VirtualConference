/**
 * Redirect from login page to home page if user is logged in, which is 
 * currently set to mapview.
 */
export default async function ({ store, redirect }) {
    if(store.getters.getToken)
        if(await store.dispatch('refreshLogin')) return redirect('/mapview');
}