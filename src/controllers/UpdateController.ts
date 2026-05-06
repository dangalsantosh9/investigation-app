import { Request, Response } from 'express';
import { AppDataSource } from '../dataSource.js';
import { TaskUpdate } from '../entities/Update.js';
import { getTaskById } from '../models/TaskModel.js';
import {
  createUpdate,
  editUpdate,
  getUpdateById,
  getUpdatesByTask,
} from '../models/UpdateModel.js';
import { getUserById } from '../models/UserModel.js';
import { createUpdateSchema, editUpdateSchema } from '../validators/UpdateValidator.js';
async function postUpdate(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }
  const taskId = req.params.taskId as string;
  const task = await getTaskById(taskId);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  const result = createUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }
  const { message } = result.data;
  const user = await getUserById(req.session.userId);
  if (!user) {
    res.sendStatus(401);
    return;
  }
  const newUpdate = await createUpdate(message, task, user);
  res.status(201).json({ update: newUpdate });
}
async function getTaskUpdates(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);

    return;
  }
  const taskId = req.params.taskId as string;
  const task = await getTaskById(taskId);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  const updates = await getUpdatesByTask(taskId);
  res.json({ updates });
}
async function editTaskUpdate(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }
  const updateId = req.params.updateId as string;
  const existingUpdate = await getUpdateById(updateId);
  if (!existingUpdate) {
    res.status(404).json({ error: 'Update not found' });
    return;
  }
  if (existingUpdate.createdBy.id !== req.session.userId) {
    res.sendStatus(403);
    return;
  }
  const result = editUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }
  const { message } = result.data;
  const updated = await editUpdate(updateId, message);
  res.json({ update: updated });
}

async function getRecentUpdates(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }
  if (req.session.role !== 'supervisor') {
    res.sendStatus(403);
    return;
  }

  const updateRepo = AppDataSource.getRepository(TaskUpdate);
  const updates = await updateRepo.find({
    relations: { createdBy: true, task: true },
    select: {
      id: true,
      message: true,
      createdAt: true,
      editedAt: true,
      createdBy: { id: true, fullName: true },
      task: { id: true, title: true },
    },
    order: { createdAt: 'DESC' },
    take: 10, // ADDED: only last 10 updates
  });

  res.json({ updates });
}

export { editTaskUpdate, getRecentUpdates, getTaskUpdates, postUpdate };
