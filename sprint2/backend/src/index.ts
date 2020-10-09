import { initDatabase } from "./entity"
import {apiPort, socketPort, httpServer, app} from "./routes"
import "reflect-metadata"

async function main() {
    await initDatabase()

    app.listen(apiPort, () => {
        console.log(`[API] Listening on localhots:${apiPort}`)
    })

    httpServer.listen(apiPort, () => {
        console.log(`[SocketIO] Listening on localhost:${socketPort}`)
    })
}

main()
