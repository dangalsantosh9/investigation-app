import { AppDataSource } from '../dataSource.js';
import { Evidence } from '../entities/Evidence.js';
import { User } from '../entities/User.js';
const evidenceRepository = AppDataSource.getRepository(Evidence);
async function createEvidence(
  type: string,
  note: string | null,
  filePath: string | null,
  task: { id: string },
  uploadedBy: User,
): Promise<Evidence> {
  const evidence = new Evidence();
  evidence.type = type;
  if (note) evidence.note = note;
  if (filePath) evidence.filePath = filePath;
  evidence.task = task as any;
  evidence.uploadedBy = uploadedBy;
  return await evidenceRepository.save(evidence);
}
async function getEvidenceByTask(taskId: string): Promise<Evidence[]> {
  return await evidenceRepository.find({
    where: { task: { id: taskId } as any },
    relations: { uploadedBy: true },
    select: {
      id: true,
      type: true,
      note: true,
      filePath: true,
      uploadedAt: true,
      uploadedBy: { id: true, email: true, fullName: true },
    },
    order: { uploadedAt: 'ASC' },
  });
}
async function getEvidenceById(id: string): Promise<Evidence | null> {
  return await evidenceRepository.findOne({
    where: { id },
    relations: { uploadedBy: true },
  });
}
export { createEvidence, getEvidenceByTask, getEvidenceById };
