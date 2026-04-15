import { AppDataSource } from '../dataSource.js';
import { Task } from '../entities/Task.js';
import { User } from '../entities/User.js';

const taskRepository = AppDataSource.getRepository(Task);

async function createTask(
  title: string,
  description: string,
  dueDate: Date | null,
  caseEntity: { id: string },
  createdBy: User,
): Promise<Task> {
  const task = new Task();
  task.title = title;
  task.description = description;
  if (dueDate) task.dueDate = dueDate;
  task.caseEntity = caseEntity as any;
  task.createdBy = createdBy;
  return await taskRepository.save(task);
}

async function getTaskById(id: string): Promise<Task | null> {
  return await taskRepository.findOne({
    where: { id },
    relations: { createdBy: true, assignedTo: true },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      dueDate: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { id: true, email: true, fullName: true },
      assignedTo: { id: true, email: true, fullName: true },
    },
  });
}

async function getTasksByCase(caseId: string): Promise<Task[]> {
  return await taskRepository.find({
    where: { caseEntity: { id: caseId } as any },
    relations: { createdBy: true, assignedTo: true },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      createdAt: true,
      createdBy: { id: true, email: true, fullName: true },
      assignedTo: { id: true, email: true, fullName: true },
    },
  });
}

async function assignTask(id: string, assignedTo: User): Promise<Task | null> {
  const task = await taskRepository.findOne({ where: { id } });
  if (!task) {
    return null;
  }
  task.assignedTo = assignedTo;
  task.updatedAt = new Date();
  return await taskRepository.save(task);
}

async function updateTask(
  id: string,
  title: string,
  description: string,
  dueDate: Date | null,
): Promise<Task | null> {
  const task = await taskRepository.findOne({ where: { id } });
  if (!task) {
    return null;
  }
  task.title = title;
  task.description = description;
  task.dueDate = dueDate ?? task.dueDate;
  task.updatedAt = new Date();
  return await taskRepository.save(task);
}
async function changeTaskStatus(id: string, status: string): Promise<Task | null> {
  const task = await taskRepository.findOne({ where: { id } });
  if (!task) {
    return null;
  }
  task.status = status;
  task.updatedAt = new Date();
  if (status === 'completed') {
    task.completedAt = new Date();
  }
  return await taskRepository.save(task);
}
export { assignTask, changeTaskStatus, createTask, getTaskById, getTasksByCase, updateTask };
