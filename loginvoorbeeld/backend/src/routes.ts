import express, {json} from "express"
import cors from "cors"
import { User } from "./entity/User";
import { ReadStream } from "typeorm/platform/PlatformTools";

export const app = express()
export const port = 5000;

app.use(cors({
    origin: "*"
}))


app.get('/', async (req, res) => {
    const allUsers = await User.find()
    console.log({allUsers})
    res.json({data: allUsers})
})

app.get('/create', (req, res, next) => {
    const user = User.create({username: 'sjors2', password: 'hunter2'})
    user.save();
    res.json({message: "Created new user"})
    next()
})

app.post('/login', (req, res, next) => {

})


app.use((req, res) => {
    console.log(`${req.ip} requested ${req.url} - ${res.statusCode}`)
})
