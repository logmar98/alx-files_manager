import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

/**
 * Class for performing operations with MongoDB.
 */
class DBClient {
  constructor() {
    MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
      if (!err) {
        // Uncomment the line below to log successful connection
        // console.log('Connected successfully to server');
        this.db = client.db(DB_DATABASE);
        this.usersCollection = this.db.collection('users');
        this.filesCollection = this.db.collection('files');
      } else {
        console.log(err.message);
        this.db = false;
      }
    });
  }

  /**
   * Checks if the connection to MongoDB is alive.
   * @return {boolean} true if connection is alive, false otherwise.
   */
  isAlive() {
    return Boolean(this.db);
  }

  /**
   * Returns the number of documents in the 'users' collection.
   * @return {Promise<number>} The number of users.
   */
  async nbUsers() {
    if (!this.db) throw new Error('Database connection is not established');
    const numberOfUsers = await this.usersCollection.countDocuments();
    return numberOfUsers;
  }

  /**
   * Returns the number of documents in the 'files' collection.
   * @return {Promise<number>} The number of files.
   */
  async nbFiles() {
    if (!this.db) throw new Error('Database connection is not established');
    const numberOfFiles = await this.filesCollection.countDocuments();
    return numberOfFiles;
  }
}

const dbClient = new DBClient();

export default dbClient;
