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
	

 /**
 * @api {Function} - LoginRequired
 * @apiDescription Checks if the session key received from the frontend, exists in the database. If so, the user object will be set to the correct user. This function must be used in a pipeline.
 * @apiName loginRequired
 * @apiGroup Functions
 * 
 * @apiParam {NULL} NULL No parameters.
 *
 * @apiSuccess {object} userObject Sets userObject to user with the correct sessionkey.
 *
 * @apiError NoSessionTokenGiven There was no session token found in the body data.
 * @apiError NoSessionTokenMatch No match was found with the given session token.
 */
const loginRequired: Handler = async (req, res, next) => {
	// Pak de token van de body data header van de request
	// const sessionKey = req.headers.authorization
	const {sessionKey} = req.body.data;
	if (!sessionKey)
		throw Error(`Session token missing in data body`)
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
var onlineUsers:string[] = [];

//map user to a user that he requested
var requested = new Map<string, string>();

//map room to a list of users
//var rooms = new Map<string, string[]>();

//map user to room
var rooms = new Map<string, string>();

//map username to the socket they're on
var socketMapping = new Map<string, Socket>();

//OUDE VERSIE kan in de database gezet worden
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
app.get('/user/:email', async (req, res, next) => { //TODO: is this function even used????
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

/**
 * @api {get} /allUsers /allUsers
 * @apiDescription Getting all users objects from the database
 * @apiName allUsers
 * @apiGroup User
 * 
 * @apiParam {NULL} NULL No parameters.
 *
 * @apiSuccess {array} allUsers All userObjects.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "username: test@test.com"
 * 			"password: dsbhdsfhyihi32h3rhbjdsnjdsfjkdsf"
 * 			"sessionKey: dkdkjn3mmdfkfmnhsa"
 * 			"loginStatus: True"
 *      }
 * @apiError UserDoesNotExist The user could not be found in the database.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "No registered user for email test@test.com"
 *      }
 *
 */
app.get('/allUsers', loginRequired, async (req, res) => { //TODO: security??? SHOULD BE DELETEN ON PRODUCTION
	if (process.env.NODE_ENV === 'development') {
		const allUsers = await User.find();
		res.status(200).json({data: allUsers})
	} else {
		res.status(400).json("NO PERMISSION")
	}
})


app.get('/debug', async (req, res) => { //TODO: security??? AND DELETE ON PRODUCTION
	if (process.env.NODE_ENV === 'development') {
		const allUsers = await User.find();
		const allRooms = await Rooms.find();
		const allCalls = await Calls.find();
		console.log(allUsers);
		console.log(allRooms);
		console.log(allCalls);
		res.json({data: allUsers, allRooms, allCalls})
	} else {
		res.status(400).json("NO PERMISSION")
	}
})

/**
 * @api {post} /userData /userData
 * @apiDescription Getting the userData of a specific user (userData is defined in User.ts
 * @apiName userData
 * @apiGroup User
 *
 * @apiParam {string} username Username of which the userData needs to be returned.
 *
 * @apiSuccess {object} userData A userData object. (Defined in User.ts).
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "username: test@test.com"
 * 			"loginStatus: True"
 *      }
 * @apiError UserDoesNotExist The user could not be found in the database.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "No registered user for email test@test.com"
 *      }
 *
 */
app.post('/userData', loginRequired, json(), async (req, res) => { //TODO: security???
	const {username} = req.body.data;
	const user = await User.findOne({username})
	if (!user) {
        res.status(400).json({error: `No registered user for email ${username}`})
        return;
	}
	const userData = user.toUserData()
	res.status(200).json({userData})
	return;
})

/**
 * @api {post} /userStatus /userStatus
 * @apiDescription Getting the status of a specific user
 * @apiName userStatus
 * @apiGroup User
 *
 * @apiParam {string} username Username of which the status needs to be returned.
 *
 * @apiSuccess {Boolean} loginStatus Login status of the user.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          True
 *      }
 * @apiError UserDoesNotExist The user could not be found in the database.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "No registered user for email test@test.com."
 *      }
 *
 */
app.post('/userStatus', json(), async (req, res) => { //TODO: security???
	const {username} = req.body.data;
	const user = await User.findOne({username})
	if (!user) {
        res.status(400).json({error: `No registered user for email ${username}.`})
        return;
	}
	const userData = user.toUserData()
	const status = userData.loginStatus;
	res.status(200).json({status})
	return;
})

/**
 * @api {post} /create_user /create_user
 * @apiDescription Create a new user for the database.
 * @apiName Create user
 * @apiGroup User
 *
 * @apiParam {String} username Email with which the user wants to create an account.
 * @apiParam {String} password Password with which the user wants to create an account.
 *
 * @apiSuccess {String} username The username with which an account has been created will be returned.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 201 OK
 *      {
 *          Created new user with username test@test.com.
 *      }
 * @apiError NoUsernameGiven No username was given to the backend.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "No username in post body"
 *      }
 * @apiError NoPasswordGiven No password was given to the backend.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "No password in post body'"
 *      }
 *
 * @apiError UserAlreadyExists The username given to the backend already exists.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "User: {username} already exists"
 *      }
 * 
 * @apiError validateUser The user could not be put in the database.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "Constraints that failed validation with error message"
 *      }
 */
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

/**
 * @api {post} /login /login
 * @apiDescription Make a login request.
 * @apiName Login
 * @apiGroup User
 *
 * @apiParam {String} username User who wants to login's email.
 * @apiParam {String} password User who wants to login's password.
 *
 * @apiSuccess {String} sessionKey A session token that can be used to make authenticated requests.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "sessionToken": "ABCDEFGHIJ0123456789".
 *      }
 * @apiError EmailNotFound The provided email address did not match any existing ones.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "No registered user for email {provided email address}".
 *      }
 *
 * @apiError PasswordIncorrect The provided password was incorrect.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "Username or password incorrect".
 *      }
 */
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

	var sessionKey = crypto.randomBytes(20).toString('base64'); //generate session key
	user.loginStatus = true;
	user.sessionKey = sessionKey;
	await user.save();
    res.status(200).json({sessionKey: sessionKey})
})

/**
 * @api {post} /logout /logout
 * @apiDescription Logging out the user. Set userStatus to false and sessionKey to "".
 * @apiName Logout
 * @apiGroup User
 *
 * @apiParam {User} User object given from the loginRequired function.
 *
 * @apiSuccess {String} username The user that logged out.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "User Bob Smit logged out."
 *      }
 * @apiError ErrorLoggingOut The user object wasn't set in loginRequired.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "There was an error loggin out."
 *      }
 *
 */
app.post('/logout', json(), loginRequired, async (req, res, next) => {
	const user = req.user;
    if (!user) {
        res.status(400).json({error: `There was an error loggin out`})
        return;
	}
	user.loginStatus = false;
	user.sessionKey = "";
	await user.save();
    res.status(200).json(`User ${user.username} logged out.`)
})

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
        const room = new Rooms()

        // OUDE VERSIE Opgeslagen in een Map => omzetten naar database
        rooms.set(user, roomName);
        rooms.set(withwho, roomName);

        console.log(`${user} start a new conversation with ${withwho} in room: ${roomName}`);
        room.roomCode = roomName
        await room.save()


        //Put the users in the call table
        const roomObject = await Rooms.findOne({roomCode: roomName}) //want to find roomID created for the roomName
        if(!roomObject)
          return;
        const call = new Calls()
        call.roomID = roomObject.roomID
        call.username = user;
        await call.save()
        call.username = withwho
        await call.save()
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
