import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const updateUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email(),
});

export { createUserSchema, updateUserSchema };
