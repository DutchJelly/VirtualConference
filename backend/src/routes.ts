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
}

const env = require('dotenv');
env.config();

export const app = express();
export const socketPort = process.env.SOCKET_PORT;
export const apiPort = process.env.API_PORT;
export const server = createServer(app);
export const io = socketio(server);

//Raise maximum image size
// app.use(express.json({limit: '50mb'}));
// app.use(express.urlencoded({limit: '50mb'}));

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

//TODO: this solution will overflow at 'some' point.. (it'll take A LOT of requests tho so it's no problem for now)
let freeRequestId = 0;

//Map the requests that are pending.
let directRequests: DirectRequest[] = [];
let joinRequests: JoinRequest[] = [];

const isDirectRequest = (req: DirectRequest | JoinRequest) => {
    return (<DirectRequest>req).sentToId !== undefined;
}

//Handle socket connections
io.on('connection', (socket) => {
    if (SOCKET_LOGGING)
        console.log(`[SocketIO:connection] A client with socket id ${socket.id} was connected.`);
    socket.on('register', async (data) => {
        if (!data || !data.sessionKey) return;

        const user = await User.findOne({ sessionKey: data.sessionKey });
        if (!user || user.expireDate <= Date.now()) return;

        socketMapping.set(user.id, socket);

        if (SOCKET_LOGGING)
            console.log(`[SocketIO:register] Socket "${socket.id}" is now linked to the user "${user.email}".`);
    });

    socket.on('disconnect', () => {
        socketMapping.keys()
        for (const socketMapItem of socketMapping.entries()) {
            if (socketMapItem[1] === socket) {
                socketMapping.delete(socketMapItem[0]);
                if (SOCKET_LOGGING)
                    console.log(`[SocketIO:disconnect] User id:${socketMapItem[0]} disconnected with socket "${socket.id}".`);
                return;
            }
        }
    });
});

//Emits new room data to all users that are in the room
const emitRoomUpdate = async (roomId: string) => {
    console.log('emmitting room update');
    const room = await Room.findOne({ where: { roomId }, relations: ['members', 'members.user'] });
    const calls = await Call.find({ where: { room }, relations: ['members', 'members.user'] });
    if (!room) {
        console.warn('no room found for id ' + roomId);
        return;
    }
    const roomData = {
        roomId,
        users: room.members.map(x => (x.user.toUserData())),
        groups: calls.map(x => ({ memberIds: x.members.map(y => y.user.id), groupId: x.callId, typeConversation: x.type}))
    };
    await Promise.all(roomData.users.map(async x => {

        const s = await getSocket(x.id);
        console.log(`socket for ${x.id} is ${s?.id} [connected: (${s?.connected})]`);
        if (s) {
            s.emit('roomupdate', roomData);
        }

    }));
}

//Required roomUser relations: ["room", "call", "call.members", "call.members.user"]
const leaveCalls = async (roomUser: RoomParticipant, submitUpdate: boolean) => {
    if (!roomUser.call) return;
    const call = roomUser.call;

    if (call.members.length === 0)
        throw new Error('Illegal state: found a call with no members.');

    roomUser.call = undefined;
    await roomUser.save();

    if (call.members.length === 1) {
        await Call.delete(call.callId);
    }
    

    if (submitUpdate && roomUser.room) {
        await emitRoomUpdate(roomUser.room.roomId);
    }
}

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
 * @api {Function} - LoginRequired 
 * @apiDescription Checks if the session key received from the frontend, exists in the database. If so, the user object will be set to the correct user. This function must be used in a pipeline.
 * @apiName loginRequired
 * @apiGroup Functions
 * @apiSuccess {User} user Sets user to corresponding user of sessionkey.
 * @apiError {loginError} string loginError invalid session was found.
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
    // console.log(`successfully logged in user ${user.username}`);
    next();
}

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
 * @apiParam {string} username the username for the new account
 * @apiParam {string} password the password to login
 * @apiParam {string} image the profile image
 * @apiParam {string} email a unique email adress
 *
 * @apiSuccess {string} message The username with which an account has been created will be returned.
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 201 OK
 *      {
 *          "message": "Created new user with username test@test.com."
 *      }
 * @apiError {string} error could not create the account
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
 * @api {post} /roomObject /roomObject
 * @apiDescription Returns a room object of a room with given roomID.
 * @apiName roomObject
 * @apiGroup rooms
 *
 * @apiParam {roomId} roomId The roomID of which the roomObject wants to be returned
 *
 * @apiSuccess {json} json_object The json object of the room that with given roomID
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          roomId: "4",
 * 			conferenceId: "1",
 * 			roomType: "open",
 * 			members[]: "[Bob, Jan, Henk, ...]"
 * 			
 *      }
 * @apiError roomIdDoesNotExist The room object with given roomId does not exist
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "Room does not exist."
 *      }
 *
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
 * @api {post} /userObject /userObject
 * @apiDescription Returns an user object of the user that is logged in.
 * @apiName userObject
 * @apiGroup User
 *
 * @apiParam {User} User object given from the loginRequired function.
 *
 * @apiSuccess {json} json_object The json object of the user that is currently logged in
 *
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
 * @apiError userDoesNotExits The user object wasn't set in loginRequired.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "User does not exist."
 *      }
 *
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
 * @apiGroup rooms
 *
 * @apiParam {Object} user user object.
 * @apiParam {Int} roomID the unique identifier of a room.
 *
 * @apiSuccess {Int} roomID the unique identifier of a room.
 * @apiSuccess {Array} users All users in the room with the current roomID.
 * @apiSuccess {Array} groups All group conversations in the current room with roomID. A group object contains an array of memberID's and its own groupID.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "roomID": 1,
 * 			"users": array[userObject1, userObject2],
 * 			"groups": array[groupObject1[], groupObject2[]]
 *      }
 * @apiError notEnoughData Not all fields are present in the post body.
 * @apiErrorExample Error-Response:
 *      HTTP/1.1 400 Bad Request
 *      {
 *          "error": "Not all fields are present in the post body.".
 *      }
 */
app.post('/joinroom', json(), loginRequired, async (req, res, next) => {
    const user = req.user;
    if (!user) throw new Error("user is null???????????????")
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
        groups: calls.map(x => ({ memberIds: x.members.map(y => y.id), groupId: x.callId, typeConversation: x.type }))
    });

    await emitRoomUpdate(roomId);
});

app.post('/leaveroom', json(), loginRequired, roomRequired, async (req, res, next) => {
    const user = req.user;
    await leaveRooms(user!, true);
    res.status(200).json({ message: 'Successfully left the room.' });
});


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
type RequestResponse{
    sessionKey: string, //the user that sends the request
    requestId: number, //the id of the request
    response: boolean, //accept or decline
}
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

    } else {
        const joinRequest = <JoinRequest>request;
        const call = await Call.findOne({ where: { callId: joinRequest.groupId }, relations: ['members', 'room', 'members.user'] });
        if (!call) {
            return res.status(400).json({ error: 'The call doesn\'t exist any more.' });
        }
        req.roomParticipant!.call = call;
        await req.roomParticipant!.save();

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
type JoinConversation{
    sessionKey: string,
    groupId: number,
}
 */
app.post('/joinconversation', json(), loginRequired, roomRequired, async (req, res, next) => {

    const groupId = req.body.groupId;
    if (groupId === null)
        return res.status(400).json({ error: 'Not all fields are present in the post body.' });

    const call = await Call.findOne({ where: { groupId }, relations: ["room", "members", "members.user"] });
    if (!call)
        return res.status(400).json({ error: 'That call doesn\'t exist.' });

    if (call.room.roomId !== req.roomParticipant!.room.roomId)
        return res.status(400).json({ error: 'That call isn\'t part of that room.' });

    if (req.roomParticipant!.call)
        return res.status(400).json({ error: 'You are already in a call.' });

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


    if (call.type === "closed") {
        //TODO add cooldown
        //TODO IMPORTANT joinrequests break if user logs out that received the request

        if (joinRequests.find(x => x.groupId === call.callId && x.senderId === req.user!.id))
            return res.status(400).json({ error: 'You already requested to join that conversation.' });
        const requestData = {
            id: freeRequestId++,
            groupId: call.callId,
            senderId: req.user!.id
        }
        joinRequests.push(requestData);

        //TODO IMPORTANT add error handler for production builds
        if (!call.members.length) throw new Error('Invalid state: no call members.');

        const socket = await getSocket(call.members[0].id);
        if (!socket) throw new Error('Invalid state: user in call is not connected.');

        socket.emit('joinrequest', requestData);

        return res.status(200).json({ message: `Join request request sent to ${call.members[0].user.username}.` })
    }

    res.status(400).json({ error: 'You cannot join that converstation because it\'s private.' })
});


/**
type LeaveConversation{
    sessionKey: string,
    groupId: number
}
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
