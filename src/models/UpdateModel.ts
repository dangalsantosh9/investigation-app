import { AppDataSource } from '../dataSource.js';
import { TaskUpdate } from '../entities/Update.js';
import { User } from '../entities/User.js';
const updateRepository = AppDataSource.getRepository(TaskUpdate);
async function createUpdate(
  message: string,
  task: { id: string },
  createdBy: User,
): Promise<TaskUpdate> {
  const update = new TaskUpdate();
  update.message = message;
  update.task = task as any;
  update.createdBy = createdBy;
  return await updateRepository.save(update);
}
async function getUpdatesByTask(taskId: string): Promise<TaskUpdate[]> {
  return await updateRepository.find({
    where: { task: { id: taskId } as any },
    relations: { createdBy: true },
    select: {
      id: true,
      message: true,
      createdAt: true,
      editedAt: true,
      createdBy: { id: true, email: true, fullName: true },
    },
    order: { createdAt: 'ASC' },
  });
}
async function getUpdateById(id: string): Promise<TaskUpdate | null> {
  return await updateRepository.findOne({
    where: { id },
    relations: { createdBy: true },
  });
}
async function editUpdate(id: string, message: string): Promise<TaskUpdate | null> {
  const update = await updateRepository.findOne({ where: { id } });
  if (!update) {
    return null;
  }
  update.message = message;
  update.editedAt = new Date();
  return await updateRepository.save(update);
}
export { createUpdate, editUpdate, getUpdateById, getUpdatesByTask };
