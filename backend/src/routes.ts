import express, {json} from "express"
import cors from "cors"
import { User } from "./entity/User";
import { validate} from "class-validator"
import {compareSync} from "bcrypt"
import {verify, sign, decode} from "jsonwebtoken"
import socketio, { Socket } from "socket.io";
import randomstring from "randomstring";

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

//map room to a list of users
//var rooms = new Map<string, string[]>();

//map user to room
var rooms = new Map<string, string>();

//map username to the socket they're on
var socketMapping = new Map<string, Socket>();

//map username to conversation type
var conversation = new Map<string, string>();

var typeConversation = "";

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
});

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
});

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
});

// Test login
app.get('/testlogin/:username', json(), async (req, res, next) => {
    var username = req.params.username;
    console.log(`a user logged in: ${username}`);
    if(onlineUsers.includes(username)){
        res.status(200).json({message: `you logged in`, online: onlineUsers});
        return;
    }
    onlineUsers.push(username);
    res.status(200).json({message: `you logged in`, online: onlineUsers});

    io.emit('testlogin', {online: onlineUsers});
});

app.get('/typeconversation/:name/:withwho', json(), async (req, res, next) => {
    var user = req.params.name;
    var withwho = req.params.withwho;
    console.log("Typeconversation");
    
    if(!onlineUsers.includes(user) || !onlineUsers.includes(withwho)){
        res.status(400).json({message: "error, one of the users is not online"});
        console.log("withwho or user wasn't logged in");
        return;
    }
    
    //if conversation type is private, no one else can join the conversation
    if(conversation.get(withwho) === "private"){
        console.log('it is a private conversation');
        socketMapping.get(user)?.emit("typeConversation", {withwho, type: "private"});
        return;
    }

    //if conversation type is open, any user can join the conversation without any permission
    if(conversation.get(withwho) === "open"){
        console.log('it is an open conversation');
        socketMapping.get(user)?.emit("typeConversation", {withwho, type: "open"});
        return;
    }

    //if conversation type is closed, any user who want to join the conversation must ask for permission
    if(conversation.get(withwho) === "closed"){
        console.log('it is a closed conversation');
        socketMapping.get(user)?.emit("typeConversation", {withwho, type: "closed"});
        return;
    }

    console.log("chose conversation type");
    socketMapping.get(user)?.emit("typeConversation", {withwho, type: "none"});
});

app.get('/requestconversation/:name/:withwho/:type', json(), async (req, res, next) => {
    var user = req.params.name;
    var withwho = req.params.withwho;
    typeConversation = req.params.type;

    console.log(`request conversation user: ${user}, withWho: ${withwho}`);
    
    // if(!onlineUsers.includes(user) || !onlineUsers.includes(withwho)){
    //     res.status(400).json({message: "error, one of the users is not online"});
    //     console.log("withwho or user wasn't logged in");
    //     return;
    // }

    requested.set(user, withwho);

    //withwho gets request with socketio
    console.log('sent a socket event of requestConversation');
    socketMapping.get(withwho)?.emit("requestConversation", {user, type: typeConversation});
    res.status(200).json({message: `sent a request to ${withwho}`});
});

app.get('/acceptconversation/:name/:withwho', json(), async (req, res, next) => {
    var user = req.params.name;
    var withwho = req.params.withwho;
    console.log(`accept conversation user: ${user}, withWho: ${withwho}`);

    if(!onlineUsers.includes(user) || !onlineUsers.includes(withwho)){
        console.log("error, one of the users is not online");
        res.status(400).json({message: "error, one of the users is not online"});
        return;
    }

    if(requested.get(withwho) !== user){
        console.log("no request is opened");
        res.status(400).json({message: "no request is opened"});
        return;
    }

    // for(var value of rooms.values()){
    //     if(value.includes(withwho)){
    //         console.log("user is already in conversation");
    //         res.status(400).json({message: "user is already in conversation"});
    //         return;
    //     }
    // }

    if(rooms.has(withwho)){
        console.log("user is already in conversation");
        res.status(400).json({message: "user is already in conversation"});
        return;
    }

    conversation.set(user, typeConversation);
    conversation.set(withwho, typeConversation);

    var userIsInRoom = false;
    var roomName = "";
    // for(var room of rooms.keys()){
    //     if(rooms.get(room)?.includes(user)){
    //         userIsInRoom = true;
    //         roomName = room;
    //     }
    // }
    if(rooms.has(user)){
        userIsInRoom = true;
        roomName = rooms.get(user) || "";
    }

    if(userIsInRoom){
        //If user is in room already, add withwho to it.
        //rooms.get(roomName)?.push(withwho);
        rooms.set(withwho, roomName);
        console.log(`${user} is already in room`);
    }else{
        //If not, create a new room with the two users.
        roomName = randomstring.generate();
        //rooms.set(roomName, [user, withwho]);
        rooms.set(user, roomName);
        rooms.set(withwho, roomName);
        console.log(`${user} start a new conversation with ${withwho} in room: ${roomName}`);
    }
    
    //Delete withwho from requested mapping because request is answered.
    requested.delete(withwho);
    
    //Notify withWho that user has accepted the conversation.
    socketMapping.get(withwho)?.emit("requestAcceptedTo", {user, room: roomName});

    //Notify user that he/she has accepted the conversation.
    socketMapping.get(user)?.emit("requestAcceptedFrom", {withwho, room: roomName});

    //Return the room name to user.
    res.status(200).json({user: withwho, room: roomName});
});

app.get('/joinopenconversation/:name/:withwho', json(), async (req, res, next) => {
    var user = req.params.name;
    var withwho = req.params.withwho;
    console.log(`${user} joined open conversation with ${withwho}`);

    if(!onlineUsers.includes(user) || !onlineUsers.includes(withwho)){
        console.log("error, one of the users is not online");
        res.status(400).json({message: "error, one of the users is not online"});
        return;
    }

    if(rooms.has(user)){
        console.log("user is already in conversation");
        res.status(400).json({message: "user is already in conversation"});
        return;
    }

    conversation.set(user, "open");
    conversation.set(withwho, "open");

    var roomName = rooms.get(withwho) || "";

    rooms.set(user, roomName);

    socketMapping.get(user)?.emit("joinOpenConversation", {user, room: roomName});

    //Return the room name to user.
    res.status(200).json({user: withwho, room: roomName});
});

app.get('/declineconversation/:name/:withwho', json(), async (req, res, next) => {
    var user = req.params.name;
    var withwho = req.params.withwho;

    console.log(`decline conversation user: ${user}, withWho: ${withwho}`);

    if(!onlineUsers.includes(user) || !onlineUsers.includes(withwho)){
        console.log(`decline not successful because on of the users was not online. Passed user args: [${user}, ${withwho}]`);
        res.status(400).json({message: "error, one of the users is not online"});
        return;
    }

    if(requested.get(withwho) !== user){
        console.log("decline not successful because no request was opened");
        res.status(400).json({message: "no request is opened"});
        return;
    }
    requested.delete(withwho);
    socketMapping.get(withwho)?.emit("requestDeclined", {user});
    res.status(200).json({message: "request was declined"});
});

app.get('/leaveconversation/:name', json(), async (req, res, next) => {
    var user = req.params.name;
    var roomName = "";
    if(rooms.has(user)){
        roomName = rooms.get(user) || "";
        rooms.delete(user);
        console.log(`${user} leaves room`)
    };
    socketMapping.get(user)?.emit("leaveCoversation", {user});
    for (let [key, value] of rooms){
        if(value === roomName){
            socketMapping.get(key)?.emit("leaveCoversation", {user});
        }
    }

    if(conversation.has(user)){
        conversation.delete(user);
        console.log(`${user} is deleted from map conversation`)
    }
});

app.get('/')

//404 not found error for API if no route matched
app.use((req, res) => {
    if (!res.headersSent)
        res.status(404).json({error: 'This route could not be found'})
    console.log(`${req.ip} requested ${req.url} - ${res.statusCode}`)
})
