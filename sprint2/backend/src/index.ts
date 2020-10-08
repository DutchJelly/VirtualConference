import { initDatabase } from "./entity"
import {app, apiPort, socketPort, server} from "./routes"
import "reflect-metadata"

async function main() {
    await initDatabase()
    app.listen(apiPort, () => console.log(`[API] Listening on localhost:${apiPort}`))
    server.listen(socketPort, () => { console.log(`[SocketIO] Listening on localhost:${socketPort}`)});
}

main()
