# api layout

This is a quick document that describes the general layout of the api, including the data types that the routes use.

------------------------------

### /login
**request**
```ts
type LoginRequest{
    email: string,
    password: string
}
```

**response**
all user data

if fail: response with `error: string`


### /conversationrequestresponse

Accept a conversation if one is requested.
**request**
```ts
type RequestResponse{
    sessionKey: string, //the user that sends the request
    requestId: number, //the id of the request
    response: boolean, //accept or decline
}
```

**response**
if accepted
```ts
type Group{
    groupId: number,
    roomCode: string,
    memberIds: number[],
    typeConversation: string
}
```
if declined
```ts
type Message{
    message: string,
}
```

**sockets**
if accepted: `emit('newGroup')`
```ts
type Group{
    groupId: number,
    roomCode: string,
    memberIds: number[],
    typeConversation: string
}
```

if declined: `emit('declinedRequest')`
```ts
type Message{
    message: string
}
```

### /joinconversation
Joins a converation. If it's open you'll join and the response will be a room code. If it's a closed conversation, a conversation request will be created with an corresponding response of 'request sent to ...'.

**request**
```ts
type JoinConversation{
    sessionKey: string,
    groupId: number,
}
```

**response**
on success
```ts
type Response{
    roomCode: string
}
```
on decline
```ts
type ErrorMessage{
    message: string
}
```

**sockets**
if success: `emit('groupMemberUpdate')`
```ts
type NewMembers{
    groupId: number,
    memberIds: number[]
}
```

### /leaveconversation

**request**
```ts
type LeaveConversation{
    sessionKey: string,
    groupId: number
}
```
**sockets**
if success: `emit('groupMemberUpdate')`
```ts
type NewMembers{
    groupId: number,
    memberIds: number[]
}
```

### /requestconversation

**request**
```ts
type ConversationRequest{
    sessionKey: string,
    userId: number,
    conversationType: string,
}
```


**response**

**sockets**
`emit('conversationrequest')`
```ts
type ConversationRequest{
    requestId: number,
    User: { //with who
        userId: number,
        userName: string,
    }
    conversationType: string,
}
```

### /joinRoom
Join a room of the conference. (this is not a jitsi room, but a physical room)
**request**
```ts
type JoinRoom{
    sessionKey: string,
    roomId: string,
}
```

**response**
```ts
type Room{
    roomId: string,
    users: {
        username: string,
        id: number,
        image: string,
        //... all user properties except the session key
    } = [],
    groups: {
        memberIds: number[],
        groupId: number
    } = []
}
```
or an error
```ts
type Error{
    error: string
}
```
**sockets**
`emit('userjoined')` with the new user
