import { Request, Response } from 'express';
import { AppDataSource } from '../dataSource.js';
import { Task } from '../entities/Task.js';
async function getAssignedTasks(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }
  const { userId } = req.params;
  if (req.session.userId !== userId) {
    res.sendStatus(403);
    return;
  }
  const taskRepo = AppDataSource.getRepository(Task);
  const status = req.query.status as string | undefined;
  const whereClause: any = { assignedTo: { id: userId } };
  if (status) {
    whereClause.status = status;
  }
  const tasks = await taskRepo.find({
    where: whereClause,
    relations: { caseEntity: true },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      createdAt: true,
      caseEntity: { id: true, title: true },
    },
    order: { dueDate: 'ASC' },
  });
  res.json({ tasks });
}
async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }
  const { userId } = req.params;
  if (req.session.userId !== userId) {
    res.sendStatus(403);
    return;
  }
  const taskRepo = AppDataSource.getRepository(Task);
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);
  const allTasks = await taskRepo.find({
    where: { assignedTo: { id: userId } as any },
  });
  const overdue = allTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed',
  );
  const dueSoon = allTasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) >= now &&
      new Date(t.dueDate) <= threeDaysFromNow &&
      t.status !== 'completed',
  );
  res.json({
    summary: {
      total: allTasks.length,
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      completed: allTasks.filter((t) => t.status === 'completed').length,
      inProgress: allTasks.filter((t) => t.status === 'in_progress').length,
      pending: allTasks.filter((t) => t.status === 'pending').length,
    },
  });
}
export { getAssignedTasks, getDashboardSummary };
