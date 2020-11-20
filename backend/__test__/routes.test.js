const request = require('supertest')
const { app } = require('../src/routes');
// import app from "../src/routes"
describe('create_user', () => {
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/create_user')
      .send({
        username: 'test@test.com',
        password: 'test1234',
      })
    expect(res.statusCode).toEqual(201)
    expect(res.body).toHaveProperty('json')
  })
})
