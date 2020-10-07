import express, {json} from "express"
import cors from "cors"
import { User } from "./entity/User";
import { validate} from "class-validator"
import {compareSync} from "bcrypt"
import {verify, sign, decode} from "jsonwebtoken"




export const app = express()
export const port = 5000;

// var http = require('http').createServer(app);
// var io = require('socket.io')(http);
// var socket = io();

var server = require('http').Server(app);

var io = require('socket.io')(server);

app.use(cors({
    origin: "*"
}))

app.get('/user/:email', async (req, res, next) => {
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

// Testing jitsi rooms

var onlineUsers:string[] = [];

//map user to a user that he requested
var requested = new Map<string, string>();

//map room to list of users
var rooms = new Map<string, string[]>();


app.get('/testlogin/:username', json(), async (req, res, next) => {
    var username = req.params.username;
    console.log(username);
    if(!onlineUsers.includes(username))
        onlineUsers.push(username);
    res.status(200).json({message: `you logged in`, online: onlineUsers})
})

app.get('/requestconversation/:name/:withwho', json(), async (req, res, next) => {
    var user = req.params.name;
    var withwho = req.params.withwho;
    console.log(`request conversation user: ${user}, withWho: ${withwho}`);
    
    if(!onlineUsers.includes(user) || !onlineUsers.includes(withwho)){
        res.status(400).json({message: "error, one of the users is not online"});
        return;
    }

    requested.set(user, withwho);
    //withwho gets request with socketio
    io.emit(`${withwho}_requestconversation`, JSON.stringify({user}))
})

app.get('/acceptconversation/:name/:withwho', json(), async (req, res, next) => {
    var user = req.params.name;
    var withwho = req.params.withwho;
    console.log(`accept conversation user: ${user}, withWho: ${withwho}`);

    if(!onlineUsers.includes(user) || !onlineUsers.includes(withwho)){
        res.status(400).json({message: "error, one of the users is not online"});
        return;
    }

    if(requested.get(withwho) !== user){
        res.status(400).json({message: "no request is opened"});
        return;
    }

    for(var value in rooms.values()){
        if(value.includes(withwho)){
            res.status(400).json({message: "user is already in conversation"});
            return;
        }
    }

    requested.delete(withwho);

    //Notify withWho that user has accepted the conversation.
    io.emit(`${withwho}_acceptconversation`, JSON.stringify({user, room: "room"}))

    //Return the room name to user.
    res.status(200).json({user: withwho, room: "room"});
})

app.get('/test', json(), (req, res, next) => {
    io.emit("test", "hello");
    res.status(200).json({hi: "hello"});
})







app.get('/')


app.use((req, res) => {
    if (!res.headersSent)
        res.status(404).json({error: 'This route could not be found'})
    console.log(`${req.ip} requested ${req.url} - ${res.statusCode}`)
})
