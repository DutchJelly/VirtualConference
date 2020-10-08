import { initDatabase } from "./entity"
import {apiPort, http} from "./routes"
import "reflect-metadata"

async function main() {
    await initDatabase()

    http.listen(apiPort, () => {
        console.log(`[API] Listening on localhost:${apiPort}`)
    })
}

main()
