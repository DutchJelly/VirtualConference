const request = require('supertest');
const { app, server } = require('../src/routes');
const { initDatabase, closeDatabase } = require ('../src/entity');

//Setup socketio
const ioClient = require('socket.io-client');
let serverAddr;
//Allow socketsCount sockets for testing.
const sockets = [];
const socketsCount = 3;

beforeAll(async (done) => {
  await initDatabase();
  serverAddr = server.listen().address();
  done();
});

afterAll(async (done) => {
  await closeDatabase();
  server.close();
  done();
})

beforeEach((done) => {
  let cbCalledCounter = 0;
  const cb = () => {
    if(++cbCalledCounter === socketsCount)
      done();
  }

  for(let i = 0; i < socketsCount; i++){
    sockets[i] = ioClient.connect(`http://[${serverAddr.address}]:${serverAddr.port}`, {
      'reconnection delay': 0,
      'reopen delay': 0,
      'force new connection': true,
      transports: ['websocket'],
    });
    sockets[i].on('connect', () => cb());
  }
});

afterEach((done) => {
  for(let i = 0; i < socketsCount; i++){
    if(sockets[i].connected){
      sockets[i].disconnect();
    }
  }
  done();
});


// import app from "../src/routes"
describe('user handling', () => {
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        username: 'test',
        password: 'test1234',
        image: 'anImage',
        email: 'test@test.com'
      });
    if(res.statusCode === 200)
      expect(res.body.message).toBeDefined();
    else expect(res.body.error).toBeDefined();
  })
  let loggedInSession;

  it('should login the new user', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'test@test.com',
        password: 'test1234',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.sessionKey).toBeDefined();
    expect(res.body.id).toBeDefined();
    expect(res.body.email).toEqual('test@test.com');
    expect(res.body.username).toEqual('test');
    expect(res.body.image).toBeDefined();

    loggedInSession = res.body.sessionKey;
  })

  it('should not login a nonexisting user', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'idontexist@notexisting.com',
        password: 'idontexist1234',
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBeDefined();
  });

  it('should logout the logged in user', async () => {
    const res = await request(app).post('/logout').send({
      sessionKey: loggedInSession
    })
    expect(res.statusCode).toEqual(200);

    //TODO find a way to test this
  });
})


describe('roomhandling',  () => {

  let roomTesting1Res;
  let roomTesting2Res;

  beforeAll(async (next) => {
    await request(app).post('/register').send({
      password: 'test1234',
      image: '123',
      email: 'roomtesting1@test.com',
      username: 'roomtesting1'
    });
    await request(app).post('/register').send({
      password: 'test1234',
      image: '1234',
      email: 'roomtesting2@test.com',
      username: 'roomtesting2'
    })
    roomTesting1Res = await request(app).post('/login').send({
      password: 'test1234',
      email: 'roomtesting1@test.com'
    })
    roomTesting2Res = await request(app).post('/login').send({
      password: 'test1234',
      email: 'roomtesting2@test.com'
    })
    next();
  });

  afterAll(async (next) => {
    await request(app).post('/logout').send({
      sessionKey: roomTesting1Res.body.sessionKey
    });
    await request(app).post('/logout').send({
      sessionKey: roomTesting2Res.body.sessionKey
    });
    next();
  });

  it('should return correct room data upon joining the same one', async () => {
    const res = await request(app).post('/joinroom').send({
      sessionKey: roomTesting1Res.body.sessionKey,
      roomId: 'atestingroom'
    }) 
    expect(res.statusCode).toEqual(200);
    expect(res.body.roomId).toEqual('atestingroom');
    expect(res.body.users).toEqual(expect.arrayContaining([expect.objectContaining({id: roomTesting1Res.body.id})]));
    expect(res.body.groups.length).toEqual(0);
  });

  it('should show all users in a room', async () => {
    await request(app).post('/joinroom').send({
      sessionKey: roomTesting1Res.body.sessionKey,
      roomId: 'atestingroom'
    })
    const res = await request(app).post('/joinroom').send({
      sessionKey: roomTesting2Res.body.sessionKey,
      roomId: 'atestingroom'
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.roomId).toEqual('atestingroom');
    expect(res.body.users).toEqual(expect.arrayContaining([
      expect.objectContaining({id: roomTesting1Res.body.id}),
      expect.objectContaining({id: roomTesting2Res.body.id})
    ]));
    expect(res.body.groups.length).toEqual(0);
  });

  it('should allow people to leave a room', async () => {
    const res = await request(app).post('/leaveroom').send({
      sessionKey: roomTesting1Res.body.sessionKey,
      roomId: 'atestingroom'
    });
    expect(res.statusCode).toEqual(200);

    const res2 = await request(app).post('/joinroom').send({
      sessionKey: roomTesting2Res.body.sessionKey,
      roomId: 'atestingroom'
    });

    expect(res2.body.users).not.toEqual(expect.arrayContaining([
      expect.objectContaining({id: roomTesting1Res.body.id}),
    ]));
    expect(res2.body.users).toEqual(expect.arrayContaining([
      expect.objectContaining({id: roomTesting2Res.body.id}),
    ]));
  });
});

describe('conversations', () => {
  let conversationTesting1, conversationTesting2, conversationTesting3;
  let roomData;

  beforeAll(async (done) => {
    //create another user for testing.
    await request(app).post('/register').send({
      password: 'test1234',
      image: '123',
      email: 'conversationtesting1@test.com',
      username: 'conversationtesting1'
    })
    await request(app).post('/register').send({
      password: 'test1234',
      image: '123',
      email: 'conversationtesting2@test.com',
      username: 'conversationtesting2'
    })
    await request(app).post('/register').send({
      password: 'test1234',
      image: '123',
      email: 'conversationtesting3@test.com',
      username: 'conversationtesting3'
    })
    conversationTesting1 = await request(app).post('/login').send({
      password: 'test1234',
      email: 'conversationtesting1@test.com'
    })
    conversationTesting2 = await request(app).post('/login').send({
      password: 'test1234',
      email: 'conversationtesting2@test.com'
    })
    conversationTesting3 = await request(app).post('/login').send({
      password: 'test1234',
      email: 'conversationtesting3@test.com'
    })

    await request(app).post('/joinroom').send({
      sessionKey: conversationTesting1.body.sessionKey,
      roomId: 'atestingroom'
    });
    await request(app).post('/joinroom').send({
      sessionKey: conversationTesting2.body.sessionKey,
      roomId: 'atestingroom'
    });
    roomData = await request(app).post('/joinroom').send({
      sessionKey: conversationTesting3.body.sessionKey,
      roomId: 'atestingroom'
    });
    done();
  });

  afterAll(async (done) => {
    await request(app).post('/logout').send({
      sessionKey: conversationTesting1.body.sessionKey
    });
    await request(app).post('/logout').send({
      sessionKey: conversationTesting2.body.sessionKey
    });
    await request(app).post('/logout').send({
      sessionKey: conversationTesting3.body.sessionKey
    });
    done();
  })

  it('should be possible to send and accept conversation requests between users', async (done) => {
    
    sockets[0].emit('register', {sessionKey: conversationTesting1.body.sessionKey});
    sockets[1].emit('register', {sessionKey: conversationTesting2.body.sessionKey});
    sockets[2].emit('register', {sessionKey: conversationTesting3.body.sessionKey});

    sockets[1].on('directrequest', async (data) => {
      
      sockets[0].on('requestaccepted', (data) => {

        expect(data.memberIds).toHaveLength(2);
        expect(data.memberIds).toEqual(expect.arrayContaining([
          conversationTesting1.body.id, conversationTesting2.body.id
        ]));
        expect(data.groupId).toBeDefined();
        expect(data.typeConversation).toEqual('open');
        expect(data.roomCode).toBeDefined();
        done();
      })


      expect(data).toMatchObject({
        senderId: conversationTesting1.body.id,
        type: 'open',
        sentToId: conversationTesting2.body.id,
      });
      const conversationResponseRes = await request(app).post('/conversationrequestresponse').send({
        sessionKey: conversationTesting2.body.sessionKey,
        requestId: data.id,
        response: true
      });
      if(conversationResponseRes.statusCode === 400)
        console.error(`received error: ${conversationResponseRes.body.error}`);

      expect(conversationResponseRes.body.memberIds).toHaveLength(2);
      expect(conversationResponseRes.body.memberIds).toEqual(expect.arrayContaining([
        conversationTesting1.body.id, conversationTesting2.body.id
      ]));
      expect(conversationResponseRes.body.groupId).toBeDefined();
      expect(conversationResponseRes.body.typeConversation).toEqual('open');
      expect(conversationResponseRes.body.roomCode).toBeDefined();
    });

    const res = await request(app).post('/requestconversation').send({
      sessionKey: conversationTesting1.body.sessionKey,
      userId: conversationTesting2.body.id,
      conversationType: 'open'
    });

    if(res.statusCode === 400) console.log(res.body);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBeDefined();
  });

  it('should be possible to join an open call', async (done) => {
    done();
  });

  it('should be possible to leave conversations', async (done) => {

    sockets[0].emit('register', {sessionKey: conversationTesting1.body.sessionKey});
    sockets[1].emit('register', {sessionKey: conversationTesting2.body.sessionKey});
    sockets[2].emit('register', {sessionKey: conversationTesting3.body.sessionKey});


    const leaveRes1 = await request(app).post('/leaveconversation').send({
      sessionKey: conversationTesting1.body.sessionKey,
    });
    const leaveRes2 = await request(app).post('/leaveconversation').send({
      sessionKey: conversationTesting2.body.sessionKey,
    });
    expect(leaveRes1.statusCode).toEqual(200);
    expect(leaveRes2.statusCode).toEqual(200);

    sockets[0].on('roomupdate', (data) => {
      expect(data.groups.memberIds.length).toHaveLength(0);
      //TODO, this should be called, write done() here...
    });

    const leaveRes3 = await request(app).post('/leaveconversation').send({
      sessionKey: conversationTesting3.body.sessionKey,
    });
    expect(leaveRes3.statusCode).toEqual(200);   
    done();
  });

  it('should not be possible to accept nonexisting requests', async (done) => {
    done();
  });
  
});



