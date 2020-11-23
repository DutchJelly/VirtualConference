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
//let rooms = new Map<string, string>();

//map username to the socket they're on
let socketMapping = new Map<string, Socket>();

// Keep type of call for request stored
let typeConversation = ""

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

app.get('/debug', async (req, res) => { //TODO: security???
	const allUsers = await User.find();
	const allRooms = await Rooms.find();
	const allCalls = await Calls.find();
	console.log(allUsers);
	console.log(allRooms);
	console.log(allCalls);
	res.json({data: allUsers, allRooms, allCalls})
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
    // TODO: use proper secret key
	// or use sessions (with redis)

	let sessionKey = crypto.randomBytes(20).toString('base64'); //generate session key
	user.loginStatus = true;
	user.sessionKey = sessionKey;
	await user.save();
    // const loginToken = sign({username}, `secret`)
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
    // const loginToken = sign({username}, `secret`)
    res.status(200).json("User logged out")
})

// Test login
app.get('/testlogin/:username', json(), async (req, res, next) => {
    let username = req.params.username;
    console.log(`a user logged in: ${username}`);
    let groups = await getGroups();
    if(onlineUsers.includes(username)){
        res.status(200).json({message: `you logged in`, online: onlineUsers, groups});
        return;
    }
    onlineUsers.push(username);
    res.status(200).json({message: `you logged in`, online: onlineUsers, groups});

    io.emit('testlogin', {online: onlineUsers, groups});
});

/**
 * @api {get} /typeconversation User requests a conversation
 * @apiName Type Converation
 * @apiGroup Call
 *
 * @apiParam {name} User that witwho wants to send a request with
 *           {withwho} User that name wants to send a request to
 * 
 * @apiSuccess {String} name that is used to check if the user has a use for the conversation-type
 *             {String} name that is used to check the status of the user that a request could be send to
 * 
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "Converation-type of user Coen Bakker has been determined"
 *      }
 * @apiError ErrorDecliningCall .
 * @apiErrorExample Error-Response: The conversation-type of the other could not be checked
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "One of the users is not online"
 *      }
 *
 */
app.get('/typeconversation/:name/:withwho', json(), async (req, res, next) => {
    //TODO: sessionkey checken
    let user = req.params.name;
    let withwho = req.params.withwho;
    let type = 'none';

    let isUserOnline = await User.findOne({username:user})
    let isWithwhoOnline = await User.findOne({username:withwho})

    if (isUserOnline == undefined || isWithwhoOnline == undefined) {
        res.status(400).json({message: "One of the users does not exist"});
        return;
    }

    if(!isUserOnline?.loginStatus || !isWithwhoOnline?.loginStatus){ // Check if one of the two is online
        res.status(400).json({message: "One of the users is not online"});
        return;
    }
    
    let withwhoCall = await Calls.findOne({username:withwho})
    let roomType = ""
    if (withwhoCall != undefined) {
        let roomID = withwhoCall.allCalls().roomID
        let room = await Rooms.findOne({roomID:roomID})
        if (room != undefined)
            roomType = room.allRooms().roomType
    }
    //if conversation type is private, no one else can join the conversation
    if(roomType === "private"){ type = "private"; }

    //if conversation type is open, any user can join the conversation without any permission
    else if(roomType === "open"){ type = "open"; }

    //if conversation type is closed, any user who want to join the conversation must ask for permission
    else if(roomType === "closed"){ type = "closed"; }

    socketMapping.get(user)?.emit("typeConversation", {withwho, type});

    //Return the type to user.
    res.status(200).json({withwho, type});
});

/**
 * @api {get} /requestconversation User requests a conversation
 * @apiName Request Converation
 * @apiGroup Call
 *
 * @apiParam {name} User that will send a request for a conversation.
 *           {withwho} User that will receive a request for a conversation.
 *           {type} Type of the requested conversation
 * 
 * @apiSuccess {String} name that is used to check if the user can send a request
 *             {String} name that is used to check if the requested person is available
 *             {String} type that is used to check the conversation type
 * 
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "User Bob Smit send a conversation to user Coen Bakker"
 *      }
 * @apiError ErrorDecliningCall .
 * @apiErrorExample Error-Response: A call between user and withwho could not be created
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "user is already in conversation"
 *      }
 *
 */
app.get('/requestconversation/:name/:withwho/:type', json(), async (req, res, next) => {
    //TODO: sessionkey checken
    //TODO: aanmaken requestID (moet uniek zijn) en meesturen naar de frontend en checken in de accept/decline functie
    let user = req.params.name;
    let withwho = req.params.withwho;
    typeConversation = req.params.type;
    
    let isUserOnline = await User.findOne({username:user})
    let isWithwhoOnline = await User.findOne({username:withwho})
    if (isUserOnline == undefined || isWithwhoOnline == undefined) {
        res.status(400).json({message: "One of the users does not exist"});
        return;
    }
    if(!isUserOnline.loginStatus || !isWithwhoOnline.loginStatus){ // Check if one of the two is online
        res.status(400).json({message: "One of the users is not online"});
        return;
    }

    requested.set(user, withwho);

    //withwho gets request with socketio
    socketMapping.get(withwho)?.emit("requestConversation", {user, type: typeConversation});
    res.status(200).json({message: `sent a request to ${withwho}`});
});

/**
 * @api {get} /acceptconversation User declines a conversation
 * @apiName Accept Converation
 * @apiGroup Call
 *
 * @apiParam {user} User that accepted a call request form withwho.
 *           {withwho} User that send user an invitation for a conversation.
 * @apiSuccess {String} name that is used to insert user into the calls table
 *             {String} name that is used to insert withwho into the calls table
 * 
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "User Bob Smit accepted to start a call user Coen Bakker"
 *      }
 * @apiError ErrorDecliningCall .
 * @apiErrorExample Error-Response: A request could not be send
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "user is already in conversation"
 *      }
 *
 */
app.get('/acceptconversation/:name/:withwho', json(), async (req, res, next) => {
    //TODO: sessionkey checken
    //TODO: checken requestID
    let user = req.params.name;
    let withwho = req.params.withwho;

    let isUserOnline = await User.findOne({username:user})
    let isWithwhoOnline = await User.findOne({username:withwho})
    if (isUserOnline == undefined || isWithwhoOnline == undefined) {
        res.status(400).json({message: "One of the users does not exist"});
        return;
    }
    if(!isUserOnline.loginStatus || !isWithwhoOnline.loginStatus){ // Check if one of the two is online
        res.status(400).json({message: "One of the users is not online"});
        return;
    }

    if(requested.get(withwho) !== user){
        res.status(400).json({message: "No request is opened"});
        return;
    }
    
    let ongoingConversation = await Calls.findOne({username:withwho})
    if(ongoingConversation){
        res.status(400).json({message: "user is already in conversation"});
        return;
    }

    let userIsInRoom = false;
    let roomName = "";

    let inConversation = await Calls.findOne({username:user})
    if(inConversation != undefined){
        userIsInRoom = true;
    }
    
    let call = Calls.create()
    if(userIsInRoom){
        //User is in room already
        let room = await Calls.findOne({username:user});
        if (room != undefined){
            call.roomID = room.roomID;
            let roomObject = await Rooms.findOne({roomID: room.roomID})
            if (roomObject != undefined)
                roomName = roomObject.roomCode;
        }
    } else{
        //If not, create a new room with the two users.
        roomName = randomstring.generate();

        // Create new room in rooms-table
        let room = Rooms.create()
        //room.roomID = "testwaarde" // roomID.toString()
        room.roomCode = roomName.toString()
        room.roomType = typeConversation.toString()
        let errors = await validate(room);
        let error = errors[0]
        if (error){
            res.status(400).json({error: error.constraints})
            return;
        }
        await room.save();

        // Add user new call

        let roomObject = await Rooms.findOne({roomCode: roomName})

        if (roomObject != undefined)
            call.roomID = roomObject.roomID
            call.username = user
            errors = await validate(call);
            error = errors[0]
        if (error){
            res.status(400).json({error: error.constraints})
            return;
        }
        await call.save();
    }
    // Add witwho to call
    call.username = withwho

    const errors = await validate(call);
    const error = errors[0]
    if (error){
        res.status(400).json({error: error.constraints})
        return;
    }

    await call.save();

    //Delete withwho from requested mapping because request is answered.
    requested.delete(withwho);
    
    //Notify withWho that user has accepted the conversation.
    socketMapping.get(withwho)?.emit("requestAcceptedTo", {user, room: roomName});

    //Notify user that he/she has accepted the conversation.
    socketMapping.get(user)?.emit("requestAcceptedFrom", {withwho, room: roomName});
    //Return the room name to user.
    res.status(200).json({user: withwho, room: roomName});
});

/**
 * @api {get} /joinopenconversation User declines a conversation
 * @apiName Join Open Converation
 * @apiGroup Call
 *
 * @apiParam {name} User that wants to join an open call with withwho.
 *           {withwho} User that is alread in an open call.
 *
 * @apiSuccess {String} name The user that declined the conversation.
 *             {String} witwho The user that declined the conversation.
 * 
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "User Bob Smit has joined a open call with user Coen Bakker"
 *      }
 * @apiError ErrorDecliningCall .
 * @apiErrorExample Error-Response: User could not join a open conversation
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "user is already in conversation"
 *      }
 *
 */
app.get('/joinopenconversation/:name/:withwho', json(), async (req, res, next) => {
    //TODO: sessionkey checken
    let user = req.params.name;
    let withwho = req.params.withwho;
    console.log(`${user} joined open conversation with ${withwho}`);

    let isUserOnline = await User.findOne({username:user})
    let isWithwhoOnline = await User.findOne({username:withwho})
    if (isUserOnline == undefined || isWithwhoOnline == undefined) {
        res.status(400).json({message: "One of the users does not exist"});
        return;
    }
    if(!isUserOnline.loginStatus || !isWithwhoOnline.loginStatus){ // Check if one of the two is online
        res.status(400).json({message: "error, one of the users is not online"});
        return;
    }

    let inConversation = await Calls.findOne({username:user})
    if(inConversation != undefined){
        res.status(400).json({message: "user is already in conversation"});
        return;
    }

    let callObject = await Calls.findOne({username:withwho})
    let roomName = ""
    // Add user to call
    let call = Calls.create()
    if (callObject != undefined) {
        call.roomID = callObject.roomID
        let roomObject = await Rooms.findOne({roomID:callObject.roomID})
        if (roomObject != undefined)
            roomName = roomObject.roomCode
    } else {
        res.status(400).json({message: "user is already in conversation"});
        return;
    }
    call.username = user
    const errors = await validate(call);
    const error = errors[0]
    if (error){
        res.status(400).json({error: error.constraints})
        return;
    }
    await call.save();
    //res.status(201).json({message: `Added user with name ${user} to existing open call`})

    socketMapping.get(user)?.emit("joinOpenConversation", {user, room: roomName});

    // await getGroups();

    //Return the room name to user.
    res.status(200).json({user: withwho, room: roomName});
});

/**
 * @api {get} /declineconversation User declines a conversation
 * @apiName Decline Converation
 * @apiGroup Call
 *
 * @apiParam {name} User that declined the call.
 *
 * @apiSuccess {String} name The user that declined the conversation.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "User Bob Smit declined a call."
 *      }
 * @apiError ErrorDecliningCall .
 * @apiErrorExample Error-Response: Request was not succesfully denied
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "No request is opened"
 *      }
 *
 */
app.get('/declineconversation/:name/:withwho', json(), async (req, res, next) => {
    //TODO: sessionkey checken
    //TODO: checken requestID
    let user = req.params.name;
    let withwho = req.params.withwho;

    let isUserOnline = await User.findOne({username:user})
    let isWithwhoOnline = await User.findOne({username:withwho})
    if (isUserOnline == undefined || isWithwhoOnline == undefined) {
        res.status(400).json({message: "One of the users does not exist"});
        return;
    }
    if(!isUserOnline.loginStatus || !isWithwhoOnline.loginStatus){ // Check if one of the two is online
        res.status(400).json({message: "One of the users is not online"});
        return;
    }

    if(requested.get(withwho) !== user){
        res.status(400).json({message: "No request is opened"});
        return;
    }
    requested.delete(withwho);
    socketMapping.get(withwho)?.emit("requestDeclined", {user});
    res.status(200).json({message: "request was declined"});
});

/**
 * @api {get} /leaveconversation User leaves a conversation
 * @apiName Leave Converation
 * @apiGroup Call
 *
 * @apiParam {name} User that left the call.
 *
 * @apiSuccess {String} name The user that left the conversation.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "User Bob Smit left a call."
 *      }
 * @apiError ErrorLeavingCall The user wasn't removed from the Calls table.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "User not deleted from Calls table in database"
 *      }
 *
 */
app.get('/leaveconversation/:name', json(), async (req, res, next) => {
    //TODO: sessionkey checken
    let user = req.params.name;
    let roomID = -1;

    let inConversation = await Calls.findOne({username:user})
    if(inConversation != undefined){
        roomID = inConversation.roomID
        Calls.delete({username: user});
        let userExist = await Calls.findOne({username: user});
        if (userExist != undefined){
            res.status(400).json({error: 'User not deleted from Calls table in database'})
            return
        }

        let thisRoomConversation = await Calls.find({roomID: roomID})
        socketMapping.get(user)?.emit("leaveConversation", {user});

        // Last user leaves a room, room gets deleted
        if (thisRoomConversation.length == 0) {
            await Rooms.delete({roomID: roomID});
        }
    }
});

app.get('/')

//404 not found error for API if no route matched
app.use((req, res) => {
    if (!res.headersSent)
        res.status(404).json({error: 'This route could not be found'})
})

//This does not yet work because not all users are actually registered as being in a call.
async function getGroups(){
    console.log("start getGroups");
    let calls = await Calls.find();
    let groups: {id: number, members: string[]}[] = [];
    calls.forEach(x => {
        let group = groups.find(y => y.id === x.roomID);
        if(!group && x.username && x.roomID){
            groups.push({id: x.roomID, members: [x.username]});
        }
        else if(group){
            group.members.push(x.username);
        }
    })
    console.log(groups);
    return groups;
}
