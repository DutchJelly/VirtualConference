const request = require('supertest');
const { app } = require('../src/routes');
const { initDatabase } = require ('../src/entity');

beforeAll(() => initDatabase());

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
    console.log(loggedInSession);
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
  beforeAll(async () => {
    //create another user for testing.
    await request(app).post('/register').send({
      password: 'test1234',
      image: '',
      email: 'roomtesting1@test.com',
      username: 'roomtesting1'
    });
    await request(app).post('/register').send({
      password: 'test1234',
      image: '',
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
  });

  afterAll(async () => {
    await request(app).post('/logout').send({
      sessionKey: roomTesting1Res.body.sessionKey
    });
    
    await request(app).post('/logout').send({
      sessionKey: roomTesting2Res.body.sessionKey
    });
  })

  it('should return correct room data upon joining the same one', async () => {
    const res = await request(app).post('/joinroom').send({
      sessionKey: roomTesting1Res.body.sessionKey,
      roomId: 'atestingroom'
    }) 
    expect(res.statusCode).toEqual(200);
    expect(res.body.roomId).toEqual('atestingroom');
    expect(res.body.users).toContain(x => x.id === roomTesting1Res.body.id);
    expect(res.body.groups.length).toEqual(0);
  });

  it('should show all users in a room', async () => {
    const res = await request(app).post('/joinroom').send({
      sessionKey: roomTesting2Res.body.sessionKey,
      roomId: 'atestingroom'
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.roomId).toEqual('atestingroom');
    expect(res.body.users).toContain(x => x.id === roomTesting1Res.body.id);
    expect(res.body.users).toContain(x => x.id === roomTesting2Res.body.id);
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

    expect(res2.body.users).not.toContain(x => x.id === roomTesting1Res.body.id);
    expect(res2.body.users).toContain(x => x.id === roomTesting2Res.body.id);
  });
});


describe('conversations', async () => {

  let roomTesting1Res, roomTesting2Res;

  beforeAll(async () => {
    //create another user for testing.
    await request(app).post('/register').send({
      password: 'test1234',
      image: '',
      email: 'roomtesting1@test.com',
      username: 'roomtesting1'
    })
    await request(app).post('/register').send({
      password: 'test1234',
      image: '',
      email: 'roomtesting2@test.com',
      username: 'roomtesting2'
    })
    const roomTesting1Res = await request(app).post('/login').send({
      password: 'test1234',
      email: 'roomtesting1@test.com'
    })
    const roomTesting2Res = await request(app).post('/login').send({
      password: 'test1234',
      email: 'roomtesting2@test.com'
    })

    await request(app).post('/joinroom').send({
      sessionKey: roomTesting1Res.body.sessionKey,
      roomId: 'atestingroom'
    });
    
    await request(app).post('/joinroom').send({
      sessionKey: roomTesting2Res.body.sessionKey,
      roomId: 'atestingroom'
    });
  });

  afterAll(async () => {
    await request(app).post('/logout').send({
      sessionKey: roomTesting1Res.body.sessionKey
    });
    
    await request(app).post('/logout').send({
      sessionKey: roomTesting2Res.body.sessionKey
    });
  })

  //we have to mess with sockets here...
  it('should be possible to send and accept conversation requests between users', async () => {

  });

  it('should be possible to leave conversations', async () => {

  });

  it('should not be possible to accept nonexisting requests', async () => {

  });
  
});



