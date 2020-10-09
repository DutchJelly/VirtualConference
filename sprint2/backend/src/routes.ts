import express, {json} from "express"
import cors from "cors"
import { User } from "./entity/User";
import { validate} from "class-validator"
import {compareSync} from "bcrypt"
import {verify, sign, decode} from "jsonwebtoken"
import socketio, { Socket } from "socket.io";


const env = require('dotenv');
env.config();

export const app = express();
export const socketPort = process.env.SOCKET_PORT;
export const apiPort = process.env.API_PORT;
export const server = require("http").createServer(app);
const io = socketio(server);


app.use(
    cors({
        origin: "*"
    })
);

//testing jitsi rooms
var onlineUsers:string[] = [];

//map user to a user that he requested
var requested = new Map<string, string>();

//map room to list of users
var rooms = new Map<string, string[]>();

//map username to the socket they're on
var socketMapping = new Map<string, Socket>();


//Handle socket connections
io.on('connection', (socket) => {
    console.log(`[SocketIO:connection] A client with socket id ${socket.id} was connected.`);
    
    socket.on("register", (data) => {
        if(!data || !data.username) 
            return;
        console.log(`[SocketIO:register] User "${data.username}" wants to authenticate on socket ${socket.id}.`);
        if(data.username && onlineUsers.includes(data.username)){
            socketMapping.set(data.username, socket);
            console.log(`[SocketIO:register] Socket "${socket.id}" is now linked to the user "${data.username}".`)
        }
    });

    //TODO add periodic socketio event handling here to see if a user is online 
});

//API requests
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




app.get('/testlogin/:username', json(), async (req, res, next) => {
    var username = req.params.username;
    console.log(`a user logged in: ${username}`);
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
        console.log("withwho or user wasn't logged in");
        return;
    }

    requested.set(user, withwho);
    //withwho gets request with socketio

    console.log('sent a socket event of requestConversation');
    socketMapping.get(withwho)?.emit("requestConversation", {user});
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

    //Return the room name to user.
    res.status(200).json({user: withwho, room: "room"});
})

app.get('/test', json(), (req, res, next) => {
    io.emit("test", "hello");
    res.status(200).json({hi: "hello"});
    for(var key in socketMapping){
        socketMapping.get(key)?.emit("test", "hello world");
    }
})

app.get('/')

//404 not found error for API if no route matched
app.use((req, res) => {
    if (!res.headersSent)
        res.status(404).json({error: 'This route could not be found'})
    console.log(`${req.ip} requested ${req.url} - ${res.statusCode}`)
})
