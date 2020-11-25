import {ConnectionOptions, createConnection} from "typeorm"
import { User } from "./User"
import { Calls } from "./Calls"
import { Rooms } from "./Rooms"


export async function initDatabase() {
    const options: ConnectionOptions = {
		name: 'default',
		type: 'sqlite',
        database: `./virtualconference.sqlite`,
        entities: [ User, Calls, Rooms ],
        logging: false,
		synchronize: true
	}
	await createConnection(options)
	
	if (process.env.NODE_ENV === 'development') {
		const user = await User.findOne("example@example.com")
		if(!user){
			await User.create({email: 'example@example.com', username: 'test', image: 'test', password: '123456789'}).save();
		}
		console.warn('Development mode active, test user with username=example@example.com password=123456789 available')
	}
}