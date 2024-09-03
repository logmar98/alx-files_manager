import { expect, use, should, request } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { ObjectId } from 'mongodb';
import app from '../server';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

use(chaiHttp);
should();

// User Endpoints ==============================================

describe('Testing User Endpoints', () => {
  const credentials = 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=';
  let token = '';
  let userId = '';
  const user = {
    email: 'bob@dylan.com',
    password: 'toto1234!',
  };

  before(async () => {
    await redisClient.client.flushall('ASYNC');
    await dbClient.usersCollection.deleteMany({});
    await dbClient.filesCollection.deleteMany({});
  });

  after(async () => {
    await redisClient.client.flushall('ASYNC');
    await dbClient.usersCollection.deleteMany({});
    await dbClient.filesCollection.deleteMany({});
  });

  // Users
  describe('POST /users', () => {
    it('returns the id and email of the created user', async () => {
      const response = await request(app).post('/users').send(user);
      
      expect(response.statusCode).to.equal(201);
      expect(response.body.email).to.equal(user.email);
      expect(response.body).to.have.property('id');

      userId = response.body.id;
      const userMongo = await dbClient.usersCollection.findOne({ _id: ObjectId(userId) });
      expect(userMongo).to.exist;
    });

    it('fails to create user because password is missing', async () => {
      const response = await request(app).post('/users').send({ email: 'bob@dylan.com' });
      
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.eql({ error: 'Missing password' });
    });

    it('fails to create user because email is missing', async () => {
      const response = await request(app).post('/users').send({ password: 'toto1234!' });
      
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.eql({ error: 'Missing email' });
    });

    it('fails to create user because it already exists', async () => {
      await request(app).post('/users').send(user); // Create user
      
      const response = await request(app).post('/users').send(user); // Attempt to create same user again
      
      expect(response.statusCode).to.equal(400);
      expect(response.body).to.eql({ error: 'Already exists' });
    });
  });

  // Connect
  describe('GET /connect', () => {
    it('fails if no user is found for credentials', async () => {
      const response = await request(app).get('/connect').send();
      
      expect(response.statusCode).to.equal(401);
      expect(response.body).to.eql({ error: 'Unauthorized' });
    });

    it('returns a token if user is found for credentials', async () => {
      const spyRedisSet = sinon.spy(redisClient, 'set');

      const response = await request(app)
        .get('/connect')
        .set('Authorization', credentials)
        .send();
        
      token = response.body.token;

      expect(response.statusCode).to.equal(200);
      expect(response.body).to.have.property('token');
      expect(spyRedisSet.calledOnceWithExactly(`auth_${token}`, userId, 24 * 3600)).to.be.true;

      spyRedisSet.restore();
    });

    it('token exists in Redis', async () => {
      const redisToken = await redisClient.get(`auth_${token}`);
      expect(redisToken).to.exist;
    });
  });

  // Disconnect
  describe('GET /disconnect', () => {
    it('should respond with unauthorized because there is no token for user', async () => {
      const response = await request(app).get('/disconnect').send();
      
      expect(response.statusCode).to.equal(401);
      expect(response.body).to.eql({ error: 'Unauthorized' });
    });

    it('should sign-out the user based on the token', async () => {
      const response = await request(app)
        .get('/disconnect')
        .set('X-Token', token)
        .send();
        
      expect(response.statusCode).to.equal(204);
      expect(response.text).to.be.equal('');
    });

    it('token no longer exists in Redis', async () => {
      const redisToken = await redisClient.get(`auth_${token}`);
      expect(redisToken).to.not.exist;
    });
  });

  // Users Me
  describe('GET /users/me', () => {
    before(async () => {
      const response = await request(app)
        .get('/connect')
        .set('Authorization', credentials)
        .send();
        
      token = response.body.token;
    });

    it('should return unauthorized because no token is passed', async () => {
      const response = await request(app).get('/users/me').send();
      
      expect(response.statusCode).to.equal(401);
      expect(response.body).to.eql({ error: 'Unauthorized' });
    });

    it('should retrieve the user based on the token used', async () => {
      const response = await request(app)
        .get('/users/me')
        .set('X-Token', token)
        .send();
        
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.eql({ id: userId, email: user.email });
    });
  });
});
