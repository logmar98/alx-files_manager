import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * Checks the status of Redis and the database
   *
   * Responds with a JSON object indicating the health of both services:
   * - redis: true if Redis is alive, false otherwise
   * - db: true if the database is alive, false otherwise
   * Returns a 200 status code with the service status.
   */
  static getStatus(req, res) {
    const serviceStatus = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    res.status(200).json(serviceStatus);
  }

  /**
   * Retrieves and returns statistics about users and files
   *
   * Fetches the total number of users and files from the database.
   * - users: number of users in the database
   * - files: number of files in the database
   * Responds with a JSON object containing these statistics.
   * Returns a 200 status code if successful, or a 500 status code with an error message if there is a failure.
   */
  static async getStats(req, res) {
    try {
      const [userCount, fileCount] = await Promise.all([
        dbClient.nbUsers(),
        dbClient.nbFiles(),
      ]);
      const stats = { users: userCount, files: fileCount };
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve stats' });
    }
  }
}

export default AppController;
