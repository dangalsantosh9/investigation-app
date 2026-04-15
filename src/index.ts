import express, { Express } from 'express';
import './config.js'; // do not remove this line
import {
  getUserProfile,
  listUsers,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
} from './controllers/UserController.js';

import {
  closeCaseById,
  createNewCase,
  editCase,
  getCase,
  listCases,
} from './controllers/CaseController.js';

import {
  assignTaskToUser,
  createNewTask,
  editTask,
  getTask,
  listTasksForCase,
  updateTaskStatus,
} from './controllers/TaskController.js';
import { initializeDatabase } from './dataSource.js';
import { sessionMiddleware } from './sessionConfig.js';

const app: Express = express();

app.use(sessionMiddleware); // Setup session management middleware
app.use(express.json()); // Setup JSON body parsing middleware
app.use(express.urlencoded({ extended: false })); // Setup urlencoded (HTML Forms) body parsing middleware

// Setup static resource file middleware
// This allows the client to access any file inside the `public` directory
// Only put file that you actually want to be publicly accessibly in the `public` folder
app.use(express.static('public', { extensions: ['html'] }));

// -- Auth Routes --
app.post('/register', registerUser);
app.post('/login', loginUser);
app.delete('/logout', logoutUser);

// -- User Routes --
app.get('/users', listUsers);
app.get('/users/:userId/profile', getUserProfile);
app.patch('/users/:userId/profile', updateProfile);
// case routes
app.post('/cases', createNewCase);
app.get('/cases', listCases);
app.get('/cases/:caseId', getCase);
app.patch('/cases/:caseId', editCase);
app.patch('/cases/:caseId/close', closeCaseById);

// task routes
app.post('/cases/:caseId/tasks', createNewTask);
app.get('/cases/:caseId/tasks', listTasksForCase);
app.get('/tasks/:taskId', getTask);
app.patch('/tasks/:taskId', editTask);
app.patch('/tasks/:taskId/assign', assignTaskToUser);
app.patch('/tasks/:taskId/status', updateTaskStatus);

//- will be deleting after testing is done
app.patch('/users/:userId/make-supervisor', async (req, res) => {
  const { AppDataSource } = await import('./dataSource.js');
  const { User } = await import('./entities/User.js');
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: req.params.userId } });
  if (!user) {
    res.sendStatus(404);
    return;
  }
  user.role = 'supervisor';
  await userRepo.save(user);
  res.json({ message: 'User promoted to supervisor', user });
});

const startServer = async () => {
  await initializeDatabase();
  app.listen(process.env.PORT, () => {
    console.log(`Server listening on http://localhost:${process.env.PORT}`);
  });
};

startServer();
