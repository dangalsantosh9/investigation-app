import argon2 from 'argon2';
import { Request, Response } from 'express';
import {
  createUser,
  findUserByEmail,
  getAllUsers,
  getUserById,
  incrementProfileViews,
  updateUserProfile,
} from '../models/UserModel.js';
import { parseDatabaseError } from '../utils/db-utils.js';
import { createUserSchema, updateUserSchema } from '../validators/UserValidator.js';

async function registerUser(req: Request, res: Response): Promise<void> {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }

  const { email, password } = result.data;

  try {
    const passwordHash = await argon2.hash(password);
    const newUser = await createUser(email, passwordHash);
    res.status(201).json({ id: newUser.id, email: newUser.email });
  } catch (err) {
    console.error(err);
    const dbError = parseDatabaseError(err);
    res.status(500).json(dbError);
  }
}

async function loginUser(req: Request, res: Response): Promise<void> {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }

  const { email, password } = result.data;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      res.sendStatus(403);
      return;
    }

    const passwordMatches = await argon2.verify(user.passwordHash, password);
    if (!passwordMatches) {
      res.sendStatus(403);
      return;
    }

    await req.session.clearSession();
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.role = user.role;
    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
}

async function logoutUser(req: Request, res: Response): Promise<void> {
  await req.session.clearSession();
  res.sendStatus(204);
}

async function getUserProfile(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }

  const { userId } = req.params;

  if (req.session.userId !== userId) {
    res.sendStatus(403);
    return;
  }

  let user = await getUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  user = await incrementProfileViews(user);
  res.json({ user });
}

async function updateProfile(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }

  const { userId } = req.params;

  if (req.session.userId !== userId) {
    res.sendStatus(403);
    return;
  }

  const result = updateUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }

  const { fullName, email } = result.data;

  try {
    const updatedUser = await updateUserProfile(userId, fullName, email);
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    const dbError = parseDatabaseError(err);
    res.status(500).json(dbError);
  }
}

async function listUsers(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }

  const users = await getAllUsers();
  res.json({ users });
}

export { getUserProfile, listUsers, loginUser, logoutUser, registerUser, updateProfile };
