import { initDatabase } from "./entity"
import {apiPort, socketPort, server, app} from "./routes"
import "reflect-metadata"
import { Handler } from "express" // Importeer het type Handler
import { User } from "./entity/User"

async function main() {
    await initDatabase()
    app.listen(apiPort, () => console.log(`[API] Listening on localhost:${apiPort}`))
    server.listen(socketPort, () => { console.log(`[SocketIO] Listening on localhost:${socketPort}`)});
}

//credits naar Sjors Holstrop
declare global {
namespace Express {
		interface Request {
		user?: User;
		}
	}
}

// We maken een functie loginRequired
//Credits naar Sjors Holstrop
export const loginRequired: Handler = async (req, res, next) => {
    // Pak de token van de Authorization header van de request
    const sessionKey = req.headers.authorization
    if (!sessionKey)
        throw Error(`Session token missing in Authorization header`)
    // Er van uitgaande dat de column met tokens sessionToken heet:
    const authenticatedUser = await User.findOne({sessionKey})
    if (!authenticatedUser)
        throw Error(`User provided token did not match any existing tokens`)
    // We zetten de uit de database verkregen User op het request object, zodat die beschikbaar
    // is voor volgende Handler functies die de request afwerken:
    req.user = authenticatedUser;
    next();
}

main()
