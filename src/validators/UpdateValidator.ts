import { z } from 'zod';
const createUpdateSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});
const editUpdateSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});
export { createUpdateSchema, editUpdateSchema };
