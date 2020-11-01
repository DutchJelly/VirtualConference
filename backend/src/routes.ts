import express, {json} from "express"
import cors from "cors"
import { User } from "./entity/User";
import { Rooms } from "./entity/Rooms";
import { Calls } from "./entity/Calls";
import { validate} from "class-validator"
import {compareSync} from "bcrypt"
import {verify, sign, decode} from "jsonwebtoken"
import socketio, { Socket } from "socket.io";
import randomstring from "randomstring";
import crypto from "crypto"
import { Handler } from "express" // Importeer het type Handler
// import { loginRequired } from "./index"

//credits naar Sjors Holstrop
declare global {
namespace Express {
		interface Request {
			user?: User;
		}
	}
}
	
// Checks if sessionKey exists.
const loginRequired: Handler = async (req, res, next) => {
	// Pak de token van de Authorization header van de request
	// const sessionKey = req.headers.authorization
	const {sessionKey} = req.body.data;
	console.log(sessionKey)
	if (!sessionKey)
		throw Error(`Session token missing in Authorization header`)
	// Er van uitgaande dat de column met tokens sessionToken heet:
	const authenticatedUser = await User.findOne({sessionKey: sessionKey})
	if (!authenticatedUser)
		throw Error(`User provided token did not match any existing tokens`)
	// We zetten de uit de database verkregen User op het request object, zodat die beschikbaar
	// is voor volgende Handler functies die de request afwerken:
	req.user = authenticatedUser;
	next();
}


const env = require('dotenv');
env.config();

export const app = express();

// const swaggerUi = require('swagger-ui-express'); //for api documentation
// const swaggerDocument = require('./swagger.json'); //for api documentation
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); //for api documentation

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
let onlineUsers:string[] = [];

//map user to a user that he requested
let requested = new Map<string, string>();

//map user to room
let rooms = new Map<string, string>();

//map username to the socket they're on
let socketMapping = new Map<string, Socket>();

//OUDE VERSIE kan in de database gezet worden
//map username to conversation type
let conversation = new Map<string, string>();
let typeConversation = "";

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

//Returns all users INCLUDING passwords and everything else
app.get('/allUsers', async (req, res) => { //TODO: security???
	const allUsers = await User.find();
	res.json({data: allUsers})
})

app.get('/debug', async (req, res) => { //TODO: security???
	const allUsers = await User.find();
	const allRooms = await Rooms.find();
	const allCalls = await Calls.find();
	console.log(allUsers);
	console.log(allRooms);
	console.log(allCalls);
	res.json({data: allUsers, allRooms, allCalls})
})

//Returns 1 userObject corresponding to the given username
app.post('/userObject', json(), async (req, res) => { //TODO: security???
	const {username, password} = req.body.data;
    const token = req.headers.authorization
	const user = await User.findOne({username})
	if (!user) {
        res.status(400).json({error: `No registered user for email ${username}`})
        return;
	}
	const userData = user.toUserData()
	res.json({userData})
	return;
})

//Returns the user status corrseponding to the given username
app.post('/userStatus', json(), async (req, res) => { //TODO: security???
	const {username, password} = req.body.data;
    const token = req.headers.authorization
	const user = await User.findOne({username})
	if (!user) {
        res.status(400).json({error: `No registered user for email ${username}.`})
        return;
	}
	const userData = user.toUserData()
	const status = userData.loginStatus;
	res.json({status})
	return;
})

app.post('/create_user', json(), async (req, res, next) => {
	const isOnline = false;
	const {username, password} = req.body.data;
    if (!username)
		res.status(400).json({error: 'No username in post body'})
    if (!password)
        res.status(400).json({error: 'No password in post body'})
    if (!username || !password)
		return;
	let user = await User.findOne({username})
	if(user){
		res.status(400).json({error: `User: ${username} already exists.`})
		return;
	}
	const temp = {username, password, isOnline} //Without this it crashes??????????
	user = User.create(temp)
	user.loginStatus = false;
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
	
    const {username, password} = req.body.data;
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

	let sessionKey = crypto.randomBytes(20).toString('base64'); //generate session key
	user.loginStatus = true;
	user.sessionKey = sessionKey;
	await user.save();
    // const loginToken = sign({username}, `secret`)
    res.status(200).json({sessionKey: sessionKey})
})
  
app.post('/logout', json(), loginRequired, async (req, res, next) => {
	const user = req.user;
    if (!user) {
        res.status(400).json({error: `There was an error loggin out`})
        return;
	}
	user.loginStatus = false;
	user.sessionKey = "";
	await user.save();
    // const loginToken = sign({username}, `secret`)
    res.status(200).json("User logged out")
})

// Test login
app.get('/testlogin/:username', json(), async (req, res, next) => {
    let username = req.params.username;
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
    let user = req.params.name;
    let withwho = req.params.withwho;
    let type = 'none';
    console.log(`Typeconversation, user: ${user}, withwho: ${withwho}`);
    
    if(!onlineUsers.includes(user) || !onlineUsers.includes(withwho)){ //TODO check sessionkey voor users
        res.status(400).json({message: "error, one of the users is not online"});
        console.log("withwho or user wasn't logged in");
        return;
    }
    
    //if conversation type is private, no one else can join the conversation
    if(conversation.get(withwho) === "private"){
        console.log('it is a private conversation');
        type = "private";
    }
    //if conversation type is open, any user can join the conversation without any permission
    else if(conversation.get(withwho) === "open"){
        console.log('it is an open conversation');
        type = "open";
    }
    //if conversation type is closed, any user who want to join the conversation must ask for permission
    else if(conversation.get(withwho) === "closed"){
        console.log('it is a closed conversation');
        type = "closed";
    }

    console.log("chose conversation type");
    socketMapping.get(user)?.emit("typeConversation", {withwho, type});

    //Return the type to user.
    res.status(200).json({withwho, type});
});

app.get('/requestconversation/:name/:withwho/:type', json(), async (req, res, next) => {
    let user = req.params.name;
    let withwho = req.params.withwho;
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
    let user = req.params.name;
    let withwho = req.params.withwho;
    console.log(`accept conversation user: ${user}, withWho: ${withwho}`);

    if(!onlineUsers.includes(user) || !onlineUsers.includes(withwho)){ //TODO check sessionkey van users
        console.log("error, one of the users is not online");
        res.status(400).json({message: "error, one of the users is not online"});
        return;
    }

    if(requested.get(withwho) !== user){
        console.log("no request is opened");
        res.status(400).json({message: "no request is opened"});
        return;
    }
    
    let ongoingConversation = await Calls.findOne({username:user})
    if(ongoingConversation){
        console.log("user is already in conversation");
        res.status(400).json({message: "user is already in conversation"});
        return;
    }

    conversation.set(user, typeConversation); //TODO zodra de database type opslaat, dit in rooms-table definieren
    conversation.set(withwho, typeConversation);

    let userIsInRoom = false;
    let roomName = "";

    let inConversation = await Calls.findOne({username:user})
    let callObject = null
    if (inConversation != undefined)
        callObject = inConversation.allCalls();
    if(inConversation){
        userIsInRoom = true;
    }

    if(userIsInRoom){
        //User is in room already
        console.log(`${user} is already in room`);
    } else{
        //If not, create a new room with the two users.
        roomName = randomstring.generate();
        const room = new Rooms()

        // Add user to call
        let call = Calls.create()
        if (callObject != null)
        call.roomID = roomName
        call.username = user
        const errors = await validate(call);
        const error = errors[0]
        if (error){
            res.status(400).json({error: error.constraints})
            return;
        }
        await call.save();
        res.status(201).json({message: `Added user with name ${user} to new call`})
        next()
    }
    // Add witwho to call
    let call = Calls.create()
    if (callObject != null)
    call.roomID = callObject.roomID
    call.username = withwho
    const errors = await validate(call);
    const error = errors[0]
    if (error){
        res.status(400).json({error: error.constraints})
        return;
    }
    await call.save();
    res.status(201).json({message: `Added other user with name ${user} to call`})
    next()
    
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
    let user = req.params.name;
    let withwho = req.params.withwho;
    console.log(`${user} joined open conversation with ${withwho}`);

    if(!onlineUsers.includes(user) || !onlineUsers.includes(withwho)){ // TODO check sessionkey
        console.log("error, one of the users is not online");
        res.status(400).json({message: "error, one of the users is not online"});
        return;
    }

    let inConversation = await Calls.findOne({username:user})
    if(inConversation){
        console.log("user is already in conversation");
        res.status(400).json({message: "user is already in conversation"});
        return;
    }

    conversation.set(user, "open"); //TODO Voeg types toe zodra mogelijk in rooms-table
    conversation.set(withwho, "open");

    let otherConversation = await Calls.findOne({username:withwho})
    let callObject = null
    if (otherConversation != undefined)
        callObject = otherConversation.allCalls();

    let roomName = ""
    // Add user to call
    let call = Calls.create()
    if (callObject != null) {
        call.roomID = callObject.roomID
        roomName = callObject.roomID
    }
    call.username = user
    const errors = await validate(call);
    const error = errors[0]
    if (error){
        res.status(400).json({error: error.constraints})
        return;
    }
    await call.save();
    res.status(201).json({message: `Added user with name ${user} to existing open call`})
    next()

    socketMapping.get(user)?.emit("joinOpenConversation", {user, room: roomName});

    //Return the room name to user.
    res.status(200).json({user: withwho, room: roomName});
});

app.get('/declineconversation/:name/:withwho', json(), async (req, res, next) => {
    let user = req.params.name;
    let withwho = req.params.withwho;

    console.log(`decline conversation user: ${user}, withWho: ${withwho}`);

    if(!onlineUsers.includes(user) || !onlineUsers.includes(withwho)){ // TODO check sessionkey
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
    let user = req.params.name;
    let roomName = "";

    let inConversation = await Calls.findOne({username:user})
    let callObject = null
    if (inConversation != undefined)
        callObject = inConversation.allCalls();
    if(inConversation){
        if (callObject != null)
        roomName = callObject.roomID.toString()
        rooms.delete(user); //TODO delete user uit Calls-table
        console.log(`${user} leaves room`)
    }

    socketMapping.get(user)?.emit("leaveCoversation", {user});
    for (let [key, value] of rooms){
        if(value === roomName){
            socketMapping.get(key)?.emit("leaveCoversation", {user});
        }
    }

    if(conversation.has(user)){ // TODO kan weg als bovende TODO werkt
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
