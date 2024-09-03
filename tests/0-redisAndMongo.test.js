import { expect, use, should } from 'chai';
import chaiHttp from 'chai-http';
import { promisify } from 'util';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

use(chaiHttp);
should();

// redisClient
describe('testing the clients for MongoDB and Redis', () => {
  describe('redis Client', () => {
    before(async () => {
      await promisify(redisClient.client.flushall).bind(redisClient.client)('ASYNC');
    });

    after(async () => {
      await promisify(redisClient.client.flushall).bind(redisClient.client)('ASYNC');
    });

    it('shows that connection is alive', () => {
      expect(redisClient.isAlive()).to.equal(true);
    });

    it('returns key as null because it does not exist', async () => {
      expect(await redisClient.get('myKey')).to.equal(null);
    });

    it('set key can be called without issue', async () => {
      await redisClient.set('myKey', 12, 1);
      // Verify the key was set correctly
      expect(await redisClient.get('myKey')).to.equal('12');
    });

    it('returns key with null because it expired', async () => {
      const sleep = promisify(setTimeout);
      await sleep(1100);
      expect(await redisClient.get('myKey')).to.equal(null);
    });
  });

  // dbClient
  describe('db Client', () => {
    before(async () => {
      await dbClient.usersCollection.deleteMany({});
      await dbClient.filesCollection.deleteMany({});
    });

    after(async () => {
      await dbClient.usersCollection.deleteMany({});
      await dbClient.filesCollection.deleteMany({});
    });

    it('shows that connection is alive', () => {
      expect(dbClient.isAlive()).to.equal(true);
    });

    it('shows number of user documents', async () => {
      expect(await dbClient.nbUsers()).to.equal(0);

      await dbClient.usersCollection.insertOne({ name: 'Larry' });
      await dbClient.usersCollection.insertOne({ name: 'Karla' });
      expect(await dbClient.nbUsers()).to.equal(2);
    });

    it('shows number of file documents', async () => {
      expect(await dbClient.nbFiles()).to.equal(0);

      await dbClient.filesCollection.insertOne({ name: 'FileOne' });
      await dbClient.filesCollection.insertOne({ name: 'FileTwo' });
      expect(await dbClient.nbFiles()).to.equal(2);
    });
  });
});
