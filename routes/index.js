import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

function controllerRouting(app) {
  const router = express.Router();
  app.use('/', router);

  // App Controller

  /**
   * Route to check the status of Redis and the database.
   * Responds with the status of both services.
   */
  router.get('/status', (req, res) => {
    AppController.getStatus(req, res);
  });

  /**
   * Route to get the number of users and files in the database.
   * Responds with user and file counts.
   */
  router.get('/stats', (req, res) => {
    AppController.getStats(req, res);
  });

  // User Controller

  /**
   * Route to create a new user in the database.
   * Expects user data in the request body.
   */
  router.post('/users', (req, res) => {
    UsersController.postNew(req, res);
  });

  /**
   * Route to retrieve the current user based on the token.
   * Responds with user data if authenticated.
   */
  router.get('/users/me', (req, res) => {
    UsersController.getMe(req, res);
  });

  // Auth Controller

  /**
   * Route to sign in a user by generating an authentication token.
   * Uses Basic Authentication with credentials from the 'Authorization' header.
   */
  router.get('/connect', (req, res) => {
    AuthController.getConnect(req, res);
  });

  /**
   * Route to sign out a user by invalidating the authentication token.
   * Deletes the token from Redis.
   */
  router.get('/disconnect', (req, res) => {
    AuthController.getDisconnect(req, res);
  });

  // Files Controller

  /**
   * Route to upload a new file.
   * Expects file data in the request body and saves it to the database and disk.
   */
  router.post('/files', (req, res) => {
    FilesController.postUpload(req, res);
  });

  /**
   * Route to retrieve a file document by its ID.
   * Responds with the file metadata.
   */
  router.get('/files/:id', (req, res) => {
    FilesController.getShow(req, res);
  });

  /**
   * Route to retrieve all user file documents for a specific parentId with pagination.
   * Responds with a list of file documents.
   */
  router.get('/files', (req, res) => {
    FilesController.getIndex(req, res);
  });

  /**
   * Route to publish a file, setting its 'isPublic' status to true.
   * Updates the file document based on its ID.
   */
  router.put('/files/:id/publish', (req, res) => {
    FilesController.putPublish(req, res);
  });

  /**
   * Route to unpublish a file, setting its 'isPublic' status to false.
   * Updates the file document based on its ID.
   */
  router.put('/files/:id/unpublish', (req, res) => {
    FilesController.putUnpublish(req, res);
  });

  /**
   * Route to retrieve the content of a file document based on its ID.
   * Responds with the file content.
   */
  router.get('/files/:id/data', (req, res) => {
    FilesController.getFile(req, res);
  });
}

export default controllerRouting;
