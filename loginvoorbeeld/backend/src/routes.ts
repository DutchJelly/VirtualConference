import express, {json} from "express"
import cors from "cors"
import { User } from "./entity/User";
import { validate} from "class-validator"
import {compareSync} from "bcrypt"
import {verify, sign, decode} from "jsonwebtoken"

export const app = express()
export const port = 5000;

app.use(cors({
    origin: "*"
}))

app.get('/user/:email', async (req, res) => {
    const email = req.params.email;
    const token = req.headers.authorization
    const user = await User.findOne({username: email})
    if (!user || !token || !email) {
        res.status(400).json({error: 'Missing'})
        return;
    }
    const claims = verify(token, `secret`)
    res.json({data: user.toUserData()})
})

app.post('/create_user', json(), async (req, res, next) => {
    const {username, password} = req.body;
    if (!username)
        res.status(400).json({error: 'No username in post body'})
    if (!password)
        res.status(400).json({error: 'No password in post body'})
    if (!username || !password)
        return;
    const user = User.create({username, password})
    const errors = await validate(user);
    const error = errors[0]
    if (error){
        res.status(400).json({error: error.constraints})
        return;
    }
    await user.save();
    res.status(201).json({message: `Created new user with username ${username}`})
    next()
})

app.post('/login', json(), async (req, res, next) => {
    const {username, password} = req.body;
    const user = await User.findOne({username})
    if (!user) {
        res.status(400).json({error: `No registered user for email ${username}`})
        return;
    }
    const passwordsMatch = compareSync(password, user.password)
    if (!passwordsMatch) {
        res.status(400).json({error: `Username or password incorrect`})
        return;
    }
    // TODO: use proper secret key
    // or use sessions (with redis)
    const loginToken = sign({username}, `secret`)
    res.status(200).json({token: loginToken})
})


app.use((req, res) => {
    if (!res.headersSent)
        res.status(404).json({error: 'This route could not be found'})
    console.log(`${req.ip} requested ${req.url} - ${res.statusCode}`)
})
