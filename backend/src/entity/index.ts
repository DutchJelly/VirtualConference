import {ConnectionOptions, createConnection} from "typeorm"
import { textSpanContainsPosition } from "typescript"
import { User } from "./User"
import { Calls } from "./Calls"
import { Rooms } from "./Rooms"


export async function initDatabase() {
    const options: ConnectionOptions = {
        type: "sqlite",
        database: `./virtualconference.sqlite`,
        entities: [ User, Calls, Rooms ],
        logging: true,
		synchronize: true
		
	  }


	await createConnection(options)
	
	if (process.env.NODE_ENV === 'development') {
		const users = await User.findOne("test@test.com")
		if(!users){
			await User.create({username: 'test@test.com', password: '123456789', loginStatus: false }).save()
			console.warn('Development mode active, test user with username=test@test.com password=123456789 available')
		} else {
			await User.create({username: 'test@test.com', sessionKey: "", loginStatus: false }).save()
		}
	}
}