import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import userUtils from '../utils/user';

class AuthController {
  /**
   * Authenticates a user and generates an authentication token
   *
   * Uses Basic Authentication by decoding the 'Authorization' header
   * to get the email and password. If the credentials are valid,
   * a token is generated and stored in Redis with a 24-hour expiration.
   * The generated token is then returned to the client.
   * 
   * @param req - The request object containing the authorization header.
   * @param res - The response object used to send the token or an error.
   * 
   * Responds with:
   * - 200 status code and the token if authentication is successful
   * - 401 status code if authentication fails due to missing or incorrect credentials
   */
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization') || '';
    const base64Credentials = authHeader.split(' ')[1];

    if (!base64Credentials) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = decodedCredentials.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hashedPassword = sha1(password);
    const user = await userUtils.getUser({ email, password: hashedPassword });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const tokenKey = `auth_${token}`;
    const tokenExpiry = 24 * 3600; // 24 hours in seconds

    await redisClient.set(tokenKey, user._id.toString(), tokenExpiry);

    return res.status(200).json({ token });
  }

  /**
   * Signs out a user by invalidating the authentication token
   *
   * Deletes the token from Redis to sign out the user. If the token
   * is not found or invalid, an Unauthorized error is returned.
   * 
   * @param req - The request object containing the token key.
   * @param res - The response object used to confirm sign-out or return an error.
   * 
   * Responds with:
   * - 204 status code if sign-out is successful
   * - 401 status code if the token is not valid
   */
  static async getDisconnect(req, res) {
    const { userId, key } = await userUtils.getUserIdAndKey(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await redisClient.del(key);

    return res.status(204).end();
  }
}

export default AuthController;
