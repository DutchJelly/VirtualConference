import { initDatabase } from "./entity"
import {app, port} from "./routes"
import "reflect-metadata"

async function main() {
    await initDatabase()
    app.listen(port, () => console.log(`Listening on localhost:${port}`))
}

main()
