import redis from 'redis';
import { promisify } from 'util';

/**
 * Class for performing operations with Redis service.
 */
class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);

    this.client.on('error', (error) => {
      console.log(`Redis client not connected to the server: ${error.message}`);
    });

    this.client.on('connect', () => {
      // Uncomment the line below to log successful connection
      // console.log('Redis client connected to the server');
    });
  }

  /**
   * Checks if the connection to Redis is alive.
   * @return {boolean} true if the connection is alive, false otherwise.
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * Retrieves the value corresponding to a key from Redis.
   * @param {string} key - The key to search for in Redis.
   * @return {Promise<string>} The value associated with the key.
   */
  async get(key) {
    const value = await this.getAsync(key);
    return value;
  }

  /**
   * Sets a new key in Redis with a specific TTL.
   * @param {string} key - The key to be saved in Redis.
   * @param {string} value - The value to be assigned to the key.
   * @param {number} duration - The TTL of the key, in seconds.
   * @return {Promise<void>} No return value.
   */
  async set(key, value, duration) {
    await this.client.setex(key, duration, value);
  }

  /**
   * Deletes a key from Redis.
   * @param {string} key - The key to be deleted.
   * @return {Promise<void>} No return value.
   */
  async del(key) {
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
