import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';
import userUtils from '../utils/user';

const userQueue = new Queue('userQueue');

class UsersController {
  /**
   * Creates a new user with an email and password
   *
   * Requires email and password in the request body:
   * - If the email is missing, respond with a 400 status code and "Missing email" error
   * - If the password is missing, respond with a 400 status code and "Missing password" error
   * - If the email already exists in the database, respond with a 400 status code and "Already exist" error
   * 
   * The password should be hashed using SHA1 before storage.
   * 
   * If successful, return the new user with an ID and email in the response body with a 201 status code.
   */
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) return response.status(400).send({ error: 'Missing email' });

    if (!password) return response.status(400).send({ error: 'Missing password' });

    const emailExists = await dbClient.usersCollection.findOne({ email });

    if (emailExists) return response.status(400).send({ error: 'Already exist' });

    const sha1Password = sha1(password);

    let result;
    try {
      result = await dbClient.usersCollection.insertOne({
        email,
        password: sha1Password,
      });
    } catch (err) {
      await userQueue.add({});
      return response.status(500).send({ error: 'Error creating user.' });
    }

    const user = {
      id: result.insertedId,
      email,
    };

    await userQueue.add({
      userId: result.insertedId.toString(),
    });

    return response.status(201).send(user);
  }

  /**
   * Retrieves the user associated with the provided token
   *
   * Uses the token from the request to find the user:
   * - If the user is not found, respond with a 401 status code and "Unauthorized" error
   * 
   * If found, return the user's email and ID in the response body with a 200 status code.
   */
  static async getMe(request, response) {
    const { userId } = await userUtils.getUserIdAndKey(request);

    const user = await userUtils.getUser({
      _id: ObjectId(userId),
    });

    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    const processedUser = { id: user._id, ...user };
    delete processedUser._id;
    delete processedUser.password;

    return response.status(200).send(processedUser);
  }
}

export default UsersController;
