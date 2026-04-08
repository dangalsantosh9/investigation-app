import { Request, Response } from 'express';
import {
  closeCase,
  createCase,
  getAllCases,
  getCaseById,
  getCasesByPriority,
  getCasesByStatus,
  updateCase,
} from '../models/CaseModel.js';
import { getUserById } from '../models/UserModel.js';
import { parseDatabaseError } from '../utils/db-utils.js';
import { createCaseSchema, updateCaseSchema } from '../validators/CaseValidator.js';

async function createNewCase(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }

  // only supervisors can create cases
  if (req.session.role !== 'supervisor') {
    res.sendStatus(403);
    return;
  }

  const result = createCaseSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }

  const { title, description, priority, dueDate } = result.data;

  const user = await getUserById(req.session.userId);
  if (!user) {
    res.sendStatus(401);
    return;
  }

  try {
    const newCase = await createCase(
      title,
      description ?? '',
      priority,
      dueDate ? new Date(dueDate) : null,
      user,
    );
    res.status(201).json({ case: newCase });
  } catch (err) {
    console.error(err);
    const dbError = parseDatabaseError(err);
    res.status(500).json(dbError);
  }
}

async function listCases(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }

  const status = req.query.status as string | undefined;
  const priority = req.query.priority as string | undefined;

  if (status) {
    const cases = await getCasesByStatus(status);
    res.json({ cases });
    return;
  }

  if (priority) {
    const cases = await getCasesByPriority(priority);
    res.json({ cases });
    return;
  }

  const cases = await getAllCases();
  res.json({ cases });
}

async function getCase(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }

  const caseId = req.params.caseId as string;
  const existingCase = await getCaseById(caseId);

  if (!existingCase) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }

  res.json({ case: existingCase });
}

async function editCase(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }

  if (req.session.role !== 'supervisor') {
    res.sendStatus(403);
    return;
  }

  const caseId = req.params.caseId as string;

  // check if case is closed
  const existingCase = await getCaseById(caseId);
  if (!existingCase) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }

  if (existingCase.status === 'closed') {
    res.status(403).json({ error: 'Cannot modify a closed case' });
    return;
  }

  const result = updateCaseSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }

  const { title, description, priority, status, dueDate } = result.data;

  try {
    const updatedCase = await updateCase(
      caseId,
      title,
      description ?? '',
      priority,
      status,
      dueDate ? new Date(dueDate) : null,
    );
    res.json({ case: updatedCase });
  } catch (err) {
    console.error(err);
    const dbError = parseDatabaseError(err);
    res.status(500).json(dbError);
  }
}

async function closeCaseById(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }

  if (req.session.role !== 'supervisor') {
    res.sendStatus(403);
    return;
  }

  const caseId = req.params.caseId as string;
  const existingCase = await getCaseById(caseId);

  if (!existingCase) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }

  if (existingCase.status === 'closed') {
    res.status(400).json({ error: 'Case is already closed' });
    return;
  }

  const closedCase = await closeCase(caseId);
  res.json({ case: closedCase });
}

export { closeCaseById, createNewCase, editCase, getCase, listCases };
