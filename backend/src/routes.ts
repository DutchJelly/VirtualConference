import express, { json } from "express"
import cors from "cors"
import { User, sessionExpireDuration } from "./entity/User";
import { Call } from "./entity/Call";
import { Room } from "./entity/Room";
import { RoomParticipant } from "./entity/RoomParticipant";
import { validate } from "class-validator"
import { compareSync } from "bcrypt"
import socketio, { Socket } from "socket.io";
import randomstring from "randomstring";
import crypto from "crypto"
import { Handler } from "express"
import { createServer } from "http"

declare global {
    namespace Express {
        interface Request {
            user?: User;
            roomParticipant?: RoomParticipant;
        }
    }
    interface DirectRequest {
        id: number,
        type: string,
        senderId: number,
        sentToId: number
    }
    interface JoinRequest {
        id: number,
        groupId: number,
        senderId: number
    }

    //If we would remove this, the ts would not compile because for some reason it then doesn't know that
    //the null of RoomParticipant.call is fine.
    interface Nullable {
        id: null | Object
    }
}

const env = require('dotenv');
env.config();

export const app = express();
export const socketPort = process.env.SOCKET_PORT;
export const apiPort = process.env.API_PORT;
export const server = createServer(app);
export const io = socketio(server);

//Raise maximum image size.
//app.use(express.json({limit: '50mb'}));
//app.use(express.urlencoded({limit: '50mb'}));

//TODO add this to .env file, there were some issues with that with jest.
const SOCKET_LOGGING = false;

app.use(
    cors({
        origin: "*"
    })
);

//Map user id's to their sockets.
const socketMapping = new Map<number, Socket>();
const getSocket = async (userId: number) => {
    let user = await User.findOne({ id: userId });
    if (!user || user.expireDate <= Date.now()) return undefined;
    return socketMapping.get(userId);
}

//TODO: this solution will overflow at 'some' point.. (it'll take A LOT of requests tho so it's no problem for now).
let freeRequestId = 0;

//Map the requests that are pending.
let directRequests: DirectRequest[] = [];
let joinRequests: JoinRequest[] = [];

const isDirectRequest = (req: DirectRequest | JoinRequest) => {
    return (<DirectRequest>req).sentToId !== undefined;
}

//Handle socket connections.
io.on('connection', (socket) => {
    socket.on('register', async (data) => {
        if (!data || !data.sessionKey) return;

        const user = await User.findOne({ sessionKey: data.sessionKey });
        if (!user || user.expireDate <= Date.now()) return;

        socketMapping.set(user.id, socket);
    });

    socket.on('disconnect', () => {
        socketMapping.keys()
        for (const socketMapItem of socketMapping.entries()) {
            if (socketMapItem[1] === socket) {
                socketMapping.delete(socketMapItem[0]);
                return;
            }
        }
    });
});

/** 
 * @api {Function} - emitRoomUpdate 
 * @apiDescription Emits new room data to all users that are in the room
 * @apiName leaveCalls
 * @apiGroup Helpfunctions
 * 
 * @apiSuccess Success-Response:
 *      roomData =
 *      {
 *          roomId: 1,
 *          users: [Jan, Pieter, Coen, Barend]),
 *          groups: [123456, 654321]
 *      }
 *
 */
const emitRoomUpdate = async (roomId: string) => {
    const room = await Room.findOne({ where: { roomId }, relations: ['members', 'members.user'] });
    const calls = await Call.find({ where: { room }, relations: ['members', 'members.user'] });
    if (!room) {
        console.warn('no room found for id ' + roomId);
        return;
    }
    const roomData = {
        roomId,
        users: room.members.map(x => (x.user.toUserData())),
        //We filter out empty groups because these could still occur in some cases. Ideally this would not be possible.
        groups: calls.map(x => ({ memberIds: x.members.map(y => y.user.id), groupId: x.callId, typeConversation: x.type})).filter(x => x.memberIds.length > 0)
    };

    //This trick allows us to use promisis in a lambda loop.
    await Promise.all(roomData.users.map(async x => {
        const s = await getSocket(x.id);
        if (s) {
            s.emit('roomupdate', roomData);
        }
    }));
}

/** 
 * @api {Function} - leaveCalls 
 * @apiDescription Lets a user leave the conversation room they are currently in
 * @apiName leaveCalls
 * @apiGroup Helpfunctions
 * 
 * @apiSuccess {Call} call User is removed from the call they were participating in.
 * 
 * @apiError {Error} Illegal state: found a call with no members.
 */
const leaveCalls = async (roomUser: RoomParticipant, submitUpdate: boolean) => {
    if (!roomUser.call) return;
    const call = roomUser.call;

    if (call.members.length === 0)
        throw new Error('Illegal state: found a call with no members.');

    //We have to use null instead of undefined because typeORM will not update relations when using 
    //undefined for obvious reasons (these relations are undefined by default, only if you specify
    //that typeORM needs to query them they get set).
    roomUser.call = null; 
    await roomUser.save();

    if (call.members.length === 1) {
        await Call.delete(call.callId);
    }
    
    if (submitUpdate && roomUser.room) {
        await emitRoomUpdate(roomUser.room.roomId);
    }
}

/** 
 * @api {Function} - leaveRooms 
 * @apiDescription Lets a user leave the physical room they are currently in
 * @apiName leaveRooms
 * @apiGroup Helpfunctions
 * 
 * @apiSuccess {Room} room User is removed from this room.
 * 
 * @apiError {deleteError} User does not exist in this room.
 * 
 */
const leaveRooms = async (user: User, submitUpdate: boolean) => {
    const roomUser = await RoomParticipant.findOne({ where: { user }, relations: ["room", "call", "call.members", "call.members.user"] });
    const roomId = roomUser?.room.roomId;
    if (!roomUser || !roomUser.room) return;

    await RoomParticipant.delete(roomUser.id);
    if (roomUser.call?.members.length === 1)
        await Call.delete(roomUser.call.callId);

    //TODO handle leavecall event here
    if (submitUpdate)
        await emitRoomUpdate(roomId!);
}

/**
 * @apiDefine loginRequired
 * @apiError {String} loginError1 Invalid session was found.
 * @apiError {String} loginError2 Invalid session key provided.
 */

/** 
 * @api {Function} - loginRequired 
 * @apiDescription Checks if the session key received from the frontend, exists in the database. If so, the user object will be set to the correct user. This function must be used in a pipeline.
 * @apiName loginRequired
 * @apiGroup Middleware
 * 
 * @apiParam {String} sessionKey The sessionkey of the user.
 * 
 * @apiSuccess {User} user Sets user to corresponding user of sessionkey in the request.
 * 
 * @apiError {String} loginError Invalid session was found.
 * @apiError {String} loginError Invalid session key provided.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "loginError": 'Invalid session key provided.'
 *      }
 */
const loginRequired: Handler = async (req, res, next) => {
    const sessionKey = req.body.sessionKey;
    if (!sessionKey) {
        return res.status(400).json({
            loginError: 'Invalid session key provided.'
        });
    }

    const user = await User.findOne({ sessionKey });
    if (!user || user.expireDate <= Date.now()) {
        return res.status(400).json({
            loginError: 'Invalid or expired session.'
        });
    }

    //TODO update login time left here

    //Pass the user to the rest of the routes.
    req.user = user;
    next();
}

/**
 * @apiDefine roomRequired
 * @apiError {String} error0 The user is not in a room.
 */

/** 
 * @api {Function} - roomRequired 
 * @apiDescription Checks if the user is currently in a physical room in the database, if so the room they are in is notified to the frontend
 * @apiName roomRequired
 * @apiGroup Middleware
 * 
 * @apiParam {User} user User object.
 * 
 * @apiSuccess {Room} roomParticipant Sets the location of the user to the room they are supposed to be in.
 * 
 * @apiError {String} error The user is not in a room.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": 'You are not in a room.'
 *      }
 */
const roomRequired: Handler = async (req, res, next) => {
    const user = req.user;

    //TODO look if this many relations can hurt performance
    const roomParticipant = await RoomParticipant.findOne({ where: { user }, relations: ["room", "user", "call", "call.members", "call.members.user", "call.members.room"] });

    if (!roomParticipant || !roomParticipant.room) {
        return res.status(400).json({
            error: 'You are not in a room.'
        });
    }
    roomParticipant.user = user!;
    req.roomParticipant = roomParticipant;
    next();
}

/**
 * @api {post} /register /register
 * @apiDescription Create a new user for the database.
 * @apiName Register
 * @apiGroup User
 *
 * 
 * @apiParam {string} username The username for the new account
 * @apiParam {string} password The password to login
 * @apiParam {string} image The profile image
 * @apiParam {string} email A unique email adress
 *
 * @apiSuccess {string} message The username with which an account has been created will be returned.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 201 OK
 *      {
 *          "message": "Created new user with username test@test.com."
 *      }
 * 
 * @apiError {string} error Could not create the account
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "An account with that email address already exists."
 *      }
 */
app.post('/register', json(), async (req, res, next) => {
    const { username, password, image, email } = req.body;
    if (!username || !password || !image || !email) {
        return res.status(400).json({ error: 'Not all fields were filled. The fields are: username, password, image, email.' });
    }
    let user = await User.findOne({ email })
    if (user) {
        res.status(400).json({ error: `That email address is already in use.` })
        return;
    }
    const userdata = { username, password, image, email };
    user = User.create(userdata);
    const errors = await validate(user);
    if (errors.length) {
        return res.status(400).json({ error: errors[0].constraints })
    }

    await user.save();
    res.status(200).json({ message: `Created a new user for ${email}.` });
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
 * @apiSuccess {String} username The username of the logged in user.
 * @apiSuccess {String} email The email of the logged in user.
 * @apiSuccess {Number} id The unique identifier of the logged in user.
 * @apiSuccess {String} image The encoded image string of the logged in user.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          sessionKey: user.sessionKey,
 *          username: user.username,
 *          email: user.email,
 *          id: user.id,
 *          image: user.image
 *      }
 * 
 * @apiError {String} error Not all fields are present in the post body.
 * @apiError {String} loginError Invalid login credentials.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "Username or password incorrect".
 *      }
 */
app.post('/login', json(), async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Not all fields are present in the post body.' });
    }

    const user = await User.findOne({ email })

    // Check if the credentials are right.
    if (!user || !compareSync(password, user.password)) {
        return res.status(400).json({ error: 'Invalid login credentials.' })
    }

    // Generate new session only if it doesn't exist. Always update expire date of session.
    if (!user.sessionKey) {
        //Make sure that the session isn't in use by another user.
        do var unusedSession = crypto.randomBytes(20).toString('base64');
        while (await User.findOne(unusedSession));
        user.sessionKey = unusedSession;
    }
    user.expireDate = Date.now() + sessionExpireDuration;
    await user.save();

    // Send back all the user data.
    res.status(200).json({
        sessionKey: user.sessionKey,
        username: user.username,
        email: user.email,
        id: user.id,
        image: user.image
    })
})

/** 
 * @apiDeprecated joinroom should be used instead.
 * @api {post} /roomObject /roomObject
 * @apiDescription Returns a room object of a room with given roomID.
 * @apiName roomObject
 * @apiGroup Rooms
 *
 * @apiParam {roomId} roomId The roomID of which the roomObject wants to be returned
 *
 * @apiSuccess {json} json_object The json object of the room that with given roomID
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          roomId: "4",
 * 			conferenceId: "1",
 * 			roomType: "open",
 * 			members[]: "[Bob, Jan, Henk, ...]"
 * 			
 *      }
 * @apiUse loginRequired
 * @apiError roomIdDoesNotExist The room object with given roomId does not exist
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "Room does not exist."
 *      }
 */  
app.post('/roomObject', json(), loginRequired, async (req, res, next) => {
	const roomId = req.body.roomId;
	const room = await Room.findOne(roomId);
	if(!room){
		return res.status(400).json({error: 'Room does not exist.'})
    }
    //TODO: This should return all groups too. Currently it also won't find any members.
	res.status(200).json({
        roomId: room.roomId,
        conferenceId: room.conferenceId,
		roomType: room.roomType,
		members: room.members
    })
});

/**
 * @apiDeprecated this method doesn't query user table relations from the database
 * @api {post} /userObject /userObject
 * @apiDescription Returns an user object of the user that is logged in.
 * @apiName userObject
 * @apiGroup User
 *
 * @apiParam {User} user User object given from the loginRequired function.
 *
 * @apiSuccess {json} json_object The json object of the user that is currently logged in
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          sessionKey: "123124esfdsg",
 * 			username: "Bob",
 * 			email: "bob@gmail.com",
 * 			id: "5"
 * 			image: "iojadsfkadfjooaoosfa" (this a a string)
 * 			
 *      }
 * @apiUse loginRequired
 * @apiError {String} error The user object wasn't set in loginRequired.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "User does not exist."
 *      }
 */  
app.post('/userObject', json(), loginRequired, async (req, res, next) => {
	const user = req.user;
	if (!user) {
        return res.status(400).json({error: 'User does not exist.'})
    }
	// Send back all the user data.
    res.status(200).json({
        sessionKey: user.sessionKey,
        username: user.username,
        email: user.email,
        id: user.id,
        image: user.image
    })
});
	
/**
 * @api {post} /logout /logout
 * @apiDescription Logging out the user. Set userStatus to false and sessionKey to "".
 * @apiName Logout
 * @apiGroup User
 *
 * @apiParam {User} user User object given from the loginRequired function.
 *
 * @apiSuccess {String} username The user that logged out.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "User Bob Smit logged out."
 *      }
 * @apiUse loginRequired
 * @apiError {String} error The user object wasn't set in loginRequired.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "There was an error loggin out."
 *      }
 */
app.post('/logout', json(), loginRequired, async (req, res, next) => {
    const user = req.user;
    user!.expireDate = Date.now();
    user!.sessionKey = ""; //Do this for debugging purposes, time would be enough.
    await user!.save();
    await leaveRooms(user!, true);
    res.status(200).json({ message: "Successfully logged out." })
});

/**
 * @api {post} /joinroom /joinroom
 * @apiDescription Join a physical room of the conference.
 * @apiName joinRoom
 * @apiGroup Rooms
 *
 * @apiParam {User} user User object.
 * @apiParam {Int} roomID The unique identifier of a room.
 *
 * @apiSuccess {Int} roomID The unique identifier of a room.
 * @apiSuccess {Array} users All users in the room with the current roomID.
 * @apiSuccess {Array} groups All group conversations in the current room with roomID. A group object contains an array of memberID's and its own groupID.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "roomID": 1,
 * 			"users": array[userObject1, userObject2],
 * 			"groups": array[groupObject1[], groupObject2[]]
 *      }
 * @apiUse loginRequired
 * @apiError {String} error Not all fields are present in the post body.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "Not all fields are present in the post body.".
 *      }
 */
app.post('/joinroom', json(), loginRequired, async (req, res, next) => {
    const user = req.user;
    const roomId = req.body.roomId;
    if (!roomId) {
        return res.status(400).json({ error: 'Not all fields are present in the post body.' });
    }

    let room = await Room.findOne({ where: { roomId } });
    if (!room) {
        room = Room.create({ roomId });
        await room.save();
    }

    let roomParticipant = await RoomParticipant.findOne({ user });
    if (!roomParticipant) {
        roomParticipant = RoomParticipant.create({ room, user, call: undefined });
    } else roomParticipant.room = room;

    await roomParticipant.save();

    const calls = await Call.find({ where: { room }, relations: ["room", "members"] });

    //Now get the members (which are relations) of the room.
    room = await Room.findOne({ where: { roomId }, relations: ["members", "members.user"] });
    if (!room) throw new Error('Internal error -> room should not be undefined.');

    res.status(200).json({
        roomId: room.roomId,
        users: room.members.filter(x => x.user).map(x => x.user.toUserData()),
        groups: calls.map(x => ({ memberIds: x.members.map(y => y.id), groupId: x.callId, typeConversation: x.type })).filter(x => x.memberIds.length > 0)
    });

    await emitRoomUpdate(roomId);
});

/**
 * @api {post} /leaveroom /leaveroom
 * @apiDescription Leave a physical room of the conference.
 * @apiName leaveRoom
 * @apiGroup Rooms
 *
 * @apiParam {String} sessionKey A valid login token of a user.
 *
 * @apiSuccess {String} message A confirmation message.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "message": 'Successfully left the room.',
 *      }
 * @apiUse loginRequired
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "loginError": "Something went wrong with logging in."
 *      }
 * @socket roomupdate sends roomupdate to all users in the corresponding room
 */
app.post('/leaveroom', json(), loginRequired, roomRequired, async (req, res, next) => {
    const user = req.user;
    await leaveRooms(user!, true);
    res.status(200).json({ message: 'Successfully left the room.' });
});

/**
 * @api {post} /requestconversation /requestconversation
 * @apiDescription Request a conversation with another user.
 * @apiName requestConversation
 * @apiGroup Conversation
 *
 * @apiParam {Number} userId The unique identifier of the user who is receiving the request.
 * @apiParam {String} conversationType The type of the requested conversation.
 *
 * @apiSuccess {Number} id The unique identifier of the request.
 * @apiSuccess {String} type The type of the requested conversation.
 * @apiSuccess {Number} senderId The unique identifier of the user sending the request.
 * @apiSuccess {Number} sentToId The unique identifier of the user receiving the request.
 * @apiSuccess {String} message A confirmation message that the request is send.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          message: 'Succesfully sent a conversation request.' 
 *      }
 * @apiUse loginRequired
 * @apiUse roomRequired
 * @apiError {String} error1 Not all fields are present in the post body.
 * @apiError {String} error2 The type of the requested conversation is not supported.
 * @apiError {String} error3 The user who is sending the request is already in a call.
 * @apiError {String} error4 The user who is receiving the request does not exist.
 * @apiError {String} error5 The user is not connected.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "Not all fields are present in the post body.".
 *      }
 * 
 * @socket directrequest Sends directrequest socket event to specified user.
 */
app.post('/requestconversation', json(), loginRequired, roomRequired, async (req, res, next) => {
    const { userId, conversationType } = req.body;

    if (!userId || !conversationType)
        return res.status(400).json({ error: 'Not all fields are present in the post body.' });

    if (conversationType !== 'open' && conversationType !== 'closed' && conversationType !== 'private')
        return res.status(400).json({ error: 'That conversation type is not supported.' });

    if (req.roomParticipant!.call)
        return res.status(400).json({ error: 'You are already in a call.' });

    let requestedUser = await User.findOne({ id: userId });

    if (!requestedUser)
        return res.status(400).json({ error: 'That user doesn\'t exist.' });

    const socket = await getSocket(userId);
    if (!socket)
        return res.status(400).json({ error: `${requestedUser.username} is not connected.` });

    const requestData = {
        id: freeRequestId++,
        type: conversationType,
        senderId: req.user!.id,
        sentToId: requestedUser.id
    };

    directRequests.push(requestData);
    socket.emit('directrequest', requestData);

    res.status(200).json({ message: 'Succesfully sent a conversation request.' });
});

/**
 * @api {post} /conversationrequestresponse /conversationrequestresponse
 * @apiDescription Answer a request for a conversation from another user
 * @apiName conversationRequestResponse
 * @apiGroup Conversation
 *
 * @apiParam {Int} requestId The unique identifier of the request.
 * @apiParam {Boolean}response The response given by the user who received the request (accept/decline).
 *
 * @apiSuccess {Int} groupId The unique identifier of the group conversation.
 * @apiSuccess {String} roomCode The url of the conversation.
 * @apiSuccess {Int} memberIds All unique identifiers of the users in the conversation.
 * @apiSuccess {Int} typeConversation The type of the conversation.
 * @apiSuccess {String} message A confirmation message if the user has declined the request.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          groupId: callId,
 *          roomCode: callUrl,
 *          memberIds: [user1ID, user2ID],
 *          typeConversation: type
 *      }
 * @apiUse loginRequired
 * @apiUse roomRequired
 * @apiError {String} error1 Not all fields are present in the post body.
 * @apiError {String} error2 The user has not received a request.
 * @apiError {String} error3 The user is not connected. 
 * @apiError {String} error4 The user who sends the request is not in this room anymore. 
 * @apiError {String} error5 The user who sends the request is already in a call. 
 * @apiError {String} error6 The conversation the sender tries to join does not exist anymore.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "Not all fields are present in the post body.".
 *      }
 */
app.post('/conversationrequestresponse', json(), loginRequired, roomRequired, async (req, res, next) => {
    const { requestId, response } = req.body;
    if (requestId === undefined || response === undefined)
        return res.status(400).json({ error: 'Not all fields are present in the post body.' });

    let request = directRequests.find(x => x.id === requestId && x.sentToId === req.user!.id) ?? joinRequests.find(x => x.id === requestId && x.groupId === req.roomParticipant!.call?.callId);
    if (!request)
        return res.status(400).json({ error: 'You have not received a request to respond to.' });


    //Declare some consts for the sender of the request.
    const sender = await User.findOne({ id: request.senderId });
    const senderRoom = await RoomParticipant.findOne({ where: { user: sender }, relations: ['room', 'user'] });
    const socket = await getSocket(request.senderId);

    if (!socket)
        return res.status(400).json({ error: `${sender!.username} is not connected.` });

    //Remove the request from memory.
    directRequests = directRequests.filter(x => x.id !== requestId);
    if (isDirectRequest(request)) {
        directRequests = directRequests.filter(x => x.id !== requestId);
    } else {
        joinRequests = joinRequests.filter(x => x.id !== requestId);
    }

    if (!response) {
        socket.emit('requestdeclined', { message: `${req.user!.username} declined your request.` })
        //TODO: we could also let sender know that you declined his/her request, but this could be a bit harsh.
        return res.status(200).json({ message: `Succesfully declined request of ${sender!.username}.` });
    }

    //Check if the sender of the request is still in the same room when we try to accept a conversation.
    if (!senderRoom || req.roomParticipant!.room.roomId !== senderRoom.room.roomId)
        return res.status(400).json({ error: `${sender!.username} is not present in your room.` });

    //Check if the sender of the request is now in a call, if so we can't start a conversation.
    if (senderRoom.call)
        return res.status(400).json({ error: `${sender!.username} is already in a call.` });

    //If the request is a direct request, we make a new call and put both users in the call. The user that accepts will
    //also leave any call that the users is in.
    if (isDirectRequest(request)) {
        if (req.roomParticipant!.call)
            await leaveCalls(req.roomParticipant!, false);

        const newCall = Call.create({
            url: randomstring.generate(),
            type: (<DirectRequest>request).type,
            room: req.roomParticipant!.room,
        });

        //Make sure that the call url is unique.
        while (await Call.findOne({ url: newCall.url })) newCall.url = randomstring.generate();

        await newCall.save();

        req.roomParticipant!.call = newCall;
        senderRoom.call = newCall;
        await req.roomParticipant!.save();
        await senderRoom.save();

        const callData = {
            groupId: newCall.callId,
            roomCode: newCall.url,
            memberIds: [req.roomParticipant!.user.id, senderRoom.user.id],
            typeConversation: newCall.type
        };

        socket.emit('requestaccepted', callData);
        await emitRoomUpdate(req.roomParticipant!.room.roomId);

        return res.status(200).json(callData);

    } 
    //If it's a join request, we'll send the request sender the call info and put the user in the call.
    else {
        const joinRequest = <JoinRequest>request;
        const call = await Call.findOne({ where: { callId: joinRequest.groupId }, relations: ['members', 'room', 'members.user'] });
        if (!call) {
            return res.status(400).json({ error: 'The call doesn\'t exist anymore.' });
        }
        senderRoom.call = call;
        await senderRoom.save();

        const callData = {
            groupId: call.callId,
            roomCode: call.url,
            memberIds: [...call.members.map(x => x.user.id), req.roomParticipant?.user.id],
            typeConversation: call.type
        };

        socket.emit('requestaccepted', callData);
        await emitRoomUpdate(req.roomParticipant!.room.roomId);
        return res.status(200).json(callData);
    }
});

/**
 * @api {post} /joinconversation /joinconversation
 * @apiDescription Start the process of join an open groupconversation or sending a request to join a closed groupconversation.
 * @apiName joinConversation
 * @apiGroup Conversation
 *
 * @apiParam {String} sessionKey User session.
 * @apiParam {Int} roomId The unique identifier of a room.
 * @apiParam {Int} groupId The unique identifier of a conversation.
 *
 * ***Open Conversation***
 * @apiSuccess {Int} groupId1 The unique identifier of the group conversation.
 * @apiSuccess {String} roomCode1 The url of the conversation.
 * @apiSuccess {Int} memberIds1 All unique identifiers of the users in the conversation.
 * @apiSuccess {Int} typeConversation1 The type of the conversation (closed/open/private).
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *              groupId: callId,
 *              roomCode: callUrl,
 *              memberIds: [user1ID, user2ID],
 *              typeConversation: type
 *      }
 * 
 * ***Closed Conversation***
 * @apiSuccess {Int} id2 The unique identifier of the request.
 * @apiSuccess {Int} groupId2 The unique identifier of the group conversation.
 * @apiSuccess {Int} senderId2 The id of the user who sends the request.
 * @apiSuccess {String} message2 A confimation message that the request is send.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *              "id" : requestId,
 *              "groupId" : callId,
 *              "senderId" : requestSender,
 *      }
 * 
 * @apiUse loginRequired
 * @apiUse roomRequired
 * @apiError error1 Not all fields are present in the post body.
 * @apiError error2 The conversation the sender tries to join does not exist anymore.
 * @apiError error3 The conversation the user tries to join is not in that room.
 * @apiError error4 The user who sends the request is already in a call. 
 * @apiError error5 The user already received a request for that conversation.
 * @apiError error6 The conversation has no members.
 * @apiError error7 The user receiving the request is not connected.
 * @apiError error8 The user cannot join a private conversation.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "You cannot join that converstation because it's private.".
 *      }
 */
app.post('/joinconversation', json(), loginRequired, roomRequired, async (req, res, next) => {
    const groupId = req.body.groupId;
    if (groupId === null)
        return res.status(400).json({ error: 'Not all fields are present in the post body.' });

    const call = await Call.findOne({ where: { callId: groupId }, relations: ["room", "members", "members.user"] });
    if (!call)
        return res.status(400).json({ error: 'That call doesn\'t exist.' });

    if (call.room.roomId !== req.roomParticipant!.room.roomId)
        return res.status(400).json({ error: 'That call isn\'t part of that room.' });

    if (req.roomParticipant!.call)
        return res.status(400).json({ error: 'You are already in a call.' });

    //If the conversation is open, we let the user join the conversation.
    if (call.type === "open") {
        req.roomParticipant!.call = call;
        await req.roomParticipant!.save();
        await emitRoomUpdate(req.roomParticipant!.room.roomId);
        return res.status(200).json({
            groupId: call.callId,
            roomCode: call.url,
            memberIds: call.members.map(x => x.user.id),
            typeConversation: call.type
        });
    }

    //If the conversation is closed, we first send a request to the first user in the conversation.
    if (call.type === "closed") {
        if (joinRequests.find(x => x.groupId === call.callId && x.senderId === req.user!.id))
            return res.status(400).json({ error: 'You already requested to join that conversation.' });
        const requestData = {
            id: freeRequestId++,
            groupId: call.callId,
            senderId: req.user!.id
        }
        joinRequests.push(requestData);

        if (!call.members.length) throw new Error('Invalid state: no call members.');

        const socket = await getSocket(call.members[0].user.id);
        if (!socket) throw new Error('Invalid state: user in call is not connected.');

        socket.emit('joinrequest', requestData);

        return res.status(200).json({ message: `Join request sent to ${call.members[0].user.username}.` })
    }

    res.status(400).json({ error: 'You cannot join that converstation because it\'s private.' })
});

/**
 * @api {post} /leaveconversation /leaveconversation
 * @apiDescription Leave a conversation.
 * @apiName leaveconversation
 * @apiGroup Conversation
 *
 * @apiSuccess {String} message A confirmation message.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "message": 'Successfully left all group(s).',
 *      }
 * 
 * @apiUse loginRequired
 * @apiUse roomRequired
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "The user is not in a room."
 *      }
 */
app.post('/leaveconversation', json(), loginRequired, roomRequired, async (req, res, next) => {
    //TODO errorhandling
    await leaveCalls(req.roomParticipant!, true);
    res.status(200).json({ message: 'Successfully left all group(s).' });
});

app.get('/');

//404 not found error for API if no route matched
app.use((req, res) => {
    if (!res.headersSent)
        res.status(404).json({ error: 'This route could not be found' })
});
