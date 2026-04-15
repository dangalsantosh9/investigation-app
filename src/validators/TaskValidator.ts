import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

const assignTaskSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

const changeTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed']),
});

export { assignTaskSchema, changeTaskStatusSchema, createTaskSchema, updateTaskSchema };
