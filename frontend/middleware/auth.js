/**
 * Redirect back to login if the user isn't logged in anymore.
 * @author DutchJelly
 */
export default async function ({ store, redirect }) {    
    if(store.getters.getToken){
        if(!await store.dispatch('refreshLogin'))
            return await redirect('/');
    }
    else if(!store.getters.getToken) 
        return await redirect('/');
}