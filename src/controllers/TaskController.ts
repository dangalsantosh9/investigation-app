import { Request, Response } from 'express';
import { getCaseById } from '../models/CaseModel.js';
import {
  assignTask,
  changeTaskStatus,
  createTask,
  getTaskById,
  getTasksByCase,
  updateTask,
} from '../models/TaskModel.js';
import { getUserById } from '../models/UserModel.js';
import { parseDatabaseError } from '../utils/db-utils.js';
import {
  assignTaskSchema,
  changeTaskStatusSchema,
  createTaskSchema,
  updateTaskSchema,
} from '../validators/TaskValidator.js';

async function createNewTask(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }
  if (req.session.role !== 'supervisor') {
    res.sendStatus(403);
    return;
  }

  const { caseId } = req.params;

  const existingCase = await getCaseById(caseId as string);
  if (!existingCase) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  if (existingCase.status == 'closed') {
    res.status(403).json({ error: 'Cannot add tasks to a closed case' });
    return;
  }

  const result = createTaskSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }

  const { title, description, dueDate } = result.data;
  const user = await getUserById(req.session.userId);
  if (!user) {
    res.sendStatus(401);
    return;
  }

  try {
    const newTask = await createTask(
      title,
      description ?? '',
      dueDate ? new Date(dueDate) : null,
      existingCase,
      user,
    );
    res.status(201).json({ task: newTask });
  } catch (err) {
    console.error(err);
    const dbError = parseDatabaseError(err);
    res.status(500).json(dbError);
  }
}

async function listTasksForCase(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }
  const { caseId } = req.params;
  const existingCase = await getCaseById(caseId as string);
  if (!existingCase) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }

  const tasks = await getTasksByCase(caseId as string);
  res.json({ tasks });
}

async function getTask(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }

  const { taskId } = req.params;
  const task = await getTaskById(taskId as string);

  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ task });
}

async function assignTaskToUser(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }
  if (req.session.role !== 'supervisor') {
    res.sendStatus(403);
    return;
  }
  const { taskId } = req.params;

  const result = assignTaskSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }

  const { userId } = result.data;

  const user = await getUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const updatedTask = await assignTask(taskId as string, user);
  if (!updatedTask) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json({ task: updatedTask });
}

async function editTask(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }
  if (req.session.role !== 'supervisor') {
    res.sendStatus(403);
    return;
  }

  const { taskId } = req.params;
  const result = updateTaskSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }
  const { title, description, dueDate } = result.data;

  try {
    const updatedTask = await updateTask(
      taskId as string,
      title,
      description ?? '',
      dueDate ? new Date(dueDate) : null,
    );
    if (!updatedTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ task: updatedTask });
  } catch (err) {
    console.error(err);
    const dbError = parseDatabaseError(err);
    res.status(500).json(dbError);
  }
}

async function updateTaskStatus(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }

  const taskId = req.params.taskId as string;

  const result = changeTaskStatusSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }

  const { status } = result.data;
  const updatedTask = await changeTaskStatus(taskId, status);
  if (!updatedTask) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ task: updatedTask });
}

export { assignTaskToUser, createNewTask, editTask, getTask, listTasksForCase, updateTaskStatus };
