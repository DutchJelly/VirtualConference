import {Connection, ConnectionOptions, createConnection} from "typeorm"
import { User } from "./User"
import { Call } from "./Call"
import { Room } from "./Room"
import { RoomParticipant } from "./RoomParticipant"

let connection: Connection;

export async function initDatabase() {
    const options: ConnectionOptions = {
		name: 'default',
		type: 'sqlite',
        database: `./virtualconference.sqlite`,
        entities: [ User, Call, Room, RoomParticipant ],
        logging: false,
		synchronize: true
	}
	connection = await createConnection(options);
}

export async function closeDatabase() {
	if(!connection) return;
	await connection.close();
}