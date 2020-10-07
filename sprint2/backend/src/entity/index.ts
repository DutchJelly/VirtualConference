import {ConnectionOptions, createConnection} from "typeorm"
import { User } from "./User"


export async function initDatabase() {
    const options: ConnectionOptions = {
        type: "sqlite",
        database: `./virtualconference.sqlite`,
        entities: [ User ],
        logging: true,
        synchronize: true
      }

    await createConnection(options)
}