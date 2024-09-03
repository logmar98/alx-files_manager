import { expect, use, should, request } from 'chai';
import chaiHttp from 'chai-http';
import app from '../server';
import dbClient from '../utils/db';

use(chaiHttp);
should();

// General APP Endpoints ==============================================

describe('testing App Status Endpoints', () => {
  describe('GET /status', () => {
    it('returns the status of Redis and MongoDB connection', async () => {
      const response = await request(app).get('/status');

      expect(response.statusCode).to.equal(200);
      expect(response.body).to.eql({ redis: true, db: true });
    });
  });

  describe('GET /stats', () => {
    beforeEach(async () => {
      // Clear collections before each test
      await dbClient.usersCollection.deleteMany({});
      await dbClient.filesCollection.deleteMany({});
    });

    it('returns number of users and files in DB (0 for this one)', async () => {
      const response = await request(app).get('/stats');

      expect(response.statusCode).to.equal(200);
      expect(response.body).to.eql({ users: 0, files: 0 });
    });

    it('returns number of users and files in DB (1 user and 2 files for this one)', async () => {
      await dbClient.usersCollection.insertOne({ name: 'Larry' });
      await dbClient.filesCollection.insertOne({ name: 'image.png' });
      await dbClient.filesCollection.insertOne({ name: 'file.txt' });

      const response = await request(app).get('/stats');

      expect(response.statusCode).to.equal(200);
      expect(response.body).to.eql({ users: 1, files: 2 });
    });
  });
});
