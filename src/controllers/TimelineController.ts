import { Request, Response } from 'express';
import { AppDataSource } from '../dataSource.js';
import { Evidence } from '../entities/Evidence.js';
import { Update } from '../entities/Update.js';
import { getCaseById } from '../models/CaseModel.js';
import { getTasksByCase } from '../models/TaskModel.js';
async function getCaseTimeline(req: Request, res: Response): Promise<void> {
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
  const tasks = await getTasksByCase(caseId);
  const updateRepo = AppDataSource.getRepository(Update);
  const evidenceRepo = AppDataSource.getRepository(Evidence);
  const timeline = await Promise.all(
    tasks.map(async (task) => {
      const updates = await updateRepo.find({
        where: { task: { id: task.id } as any },
        relations: { createdBy: true },
        order: { createdAt: 'ASC' },
      });
      const evidence = await evidenceRepo.find({
        where: { task: { id: task.id } as any },
        relations: { uploadedBy: true },
        order: { uploadedAt: 'ASC' },
      });
      return {
        task,
        updates,
        evidence,
      };
    }),
  );
  res.json({ case: existingCase, timeline });
}
export { getCaseTimeline };
