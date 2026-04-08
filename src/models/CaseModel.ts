import { AppDataSource } from '../dataSource.js';
import { Case } from '../entities/Case.js';
import { User } from '../entities/User.js';

const caseRepository = AppDataSource.getRepository(Case);

async function createCase(
  title: string,
  description: string,
  priority: string,
  dueDate: Date | null,
  createdBy: User,
): Promise<Case> {
  const newCase = caseRepository.create({
    title,
    description,
    priority,
    dueDate: dueDate ?? undefined,
    createdBy,
  });
  return await caseRepository.save(newCase);
}

async function getAllCases(): Promise<Case[]> {
  return await caseRepository.find({
    relations: { createdBy: true },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      createdBy: { id: true, email: true, fullName: true },
    },
  });
}

async function getCaseById(id: string): Promise<Case | null> {
  return await caseRepository.findOne({
    where: { id },
    relations: { createdBy: true },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      closedAt: true,
      createdAt: true,
      createdBy: { id: true, email: true, fullName: true },
    },
  });
}

async function getCasesByStatus(status: string): Promise<Case[]> {
  return await caseRepository.find({
    where: { status },
    relations: { createdBy: true },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      createdBy: { id: true, email: true, fullName: true },
    },
  });
}

async function getCasesByPriority(priority: string): Promise<Case[]> {
  return await caseRepository.find({
    where: { priority },
    relations: { createdBy: true },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      createdBy: { id: true, email: true, fullName: true },
    },
  });
}
async function updateCase(
  id: string,
  title: string,
  description: string,
  priority: string,
  status: string,
  dueDate: Date | null,
): Promise<Case | null> {
  const existingCase = await caseRepository.findOne({ where: { id } });
  if (!existingCase) {
    return null;
  }
  existingCase.title = title;
  existingCase.description = description;
  existingCase.priority = priority;
  existingCase.status = status;
  existingCase.dueDate = dueDate ?? existingCase.dueDate;
  return await caseRepository.save(existingCase);
}

async function closeCase(id: string): Promise<Case | null> {
  const existingCase = await caseRepository.findOne({ where: { id } });
  if (!existingCase) {
    return null;
  }
  existingCase.status = 'closed';
  existingCase.closedAt = new Date();
  return await caseRepository.save(existingCase);
}

export {
  closeCase,
  createCase,
  getAllCases,
  getCaseById,
  getCasesByPriority,
  getCasesByStatus,
  updateCase,
};
