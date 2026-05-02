import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1, 'Full name is required'),
});

const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
const updateUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export { changePasswordSchema, createUserSchema, loginUserSchema, updateUserSchema };
