import { Request, Response } from 'express';
import path from 'path';
import { createEvidence, getEvidenceById, getEvidenceByTask } from '../models/EvidenceModel.js';
import { getTaskById } from '../models/TaskModel.js';
import { getUserById } from '../models/UserModel.js';
import { createEvidenceSchema } from '../validators/EvidenceValidator.js';

async function uploadEvidence(req: Request, res: Response): Promise<void> {
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
  const result = createEvidenceSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }
  const { type, note } = result.data;
  const user = await getUserById(req.session.userId);
  if (!user) {
    res.sendStatus(401);
    return;
  }
  const filePath = req.file ? req.file.path : null;
  if (type === 'file' && !filePath) {
    res.status(400).json({ error: 'File is required for type file' });
    return;
  }

  if (type === 'note' && !note) {
    res.status(400).json({ error: 'Note is required for type note' });
    return;
  }
  const evidence = await createEvidence(type, note ?? null, filePath, task, user);
  res.status(201).json({ evidence });
}

async function getTaskEvidence(req: Request, res: Response): Promise<void> {
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
  const evidence = await getEvidenceByTask(taskId);
  res.json({ evidence });
}

async function downloadEvidence(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }
  const evidenceId = req.params.evidenceId as string;
  const evidence = await getEvidenceById(evidenceId);
  if (!evidence) {
    res.status(404).json({ error: 'Evidence not found' });
    return;
  }
  if (!evidence.filePath) {
    res.status(400).json({ error: 'This evidence has no file attached' });
    return;
  }
  const absolutePath = path.resolve(evidence.filePath);
  res.download(absolutePath);
}

export { uploadEvidence, getTaskEvidence, downloadEvidence };
