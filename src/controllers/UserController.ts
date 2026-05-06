import argon2 from 'argon2';
import { Request, Response } from 'express';
import {
  createUser,
  findUserByEmail,
  getAllUsers,
  getUserById,
  getUserWithPassword,
  incrementProfileViews,
  updateUserPassword,
  updateUserProfile,
} from '../models/UserModel.js';
import { parseDatabaseError } from '../utils/db-utils.js';
import {
  changePasswordSchema,
  createUserSchema,
  loginUserSchema,
  updateUserSchema,
} from '../validators/UserValidator.js';

async function registerUser(req: Request, res: Response): Promise<void> {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }

  const { email, password, fullName } = result.data;

  try {
    const passwordHash = await argon2.hash(password);
    const newUser = await createUser(email, passwordHash, fullName);
    res.status(201).json({ id: newUser.id, email: newUser.email });
  } catch (err) {
    console.error(err);
    const dbError = parseDatabaseError(err);
    res.status(500).json(dbError);
  }
}

async function loginUser(req: Request, res: Response): Promise<void> {
  const result = loginUserSchema.safeParse(req.body);
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
    req.session.fullName = user.fullName;
    req.session.role = user.role;
    req.session.isLoggedIn = true;
    req.session.authenticatedUser = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
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

function getMe(req: Request, res: Response): void {
  if (!req.session.isLoggedIn) {
    res.sendStatus(401);
    return;
  }
  res.json(req.session.authenticatedUser);
}

async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }

  const { userId } = req.params;

  if (req.session.userId !== userId) {
    res.sendStatus(403);
    return;
  }

  const result = changePasswordSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error.flatten());
    return;
  }

  const { currentPassword, newPassword } = result.data;

  const user = await getUserWithPassword(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const passwordMatches = await argon2.verify(user.passwordHash, currentPassword);
  if (!passwordMatches) {
    res.sendStatus(403);
    return;
  }

  const newPasswordHash = await argon2.hash(newPassword);
  await updateUserPassword(userId, newPasswordHash);
  res.json({ message: 'Password changed successfully' });
}
//forgot password thing
async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email, newPassword } = req.body;

  if (!email || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    res.status(404).json({ error: 'No account found with that email' });
    return;
  }

  const newPasswordHash = await argon2.hash(newPassword);
  await updateUserPassword(user.id, newPasswordHash);
  res.json({ message: 'Password reset successfully' });
}

// ADDED: change user role
async function changeUserRole(req: Request, res: Response): Promise<void> {
  if (!req.session.userId) {
    res.sendStatus(401);
    return;
  }

  if (req.session.role !== 'supervisor') {
    res.sendStatus(403);
    return;
  }

  const userId = req.params.userId as string;
  const { role } = req.body;

  if (!['supervisor', 'member'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }

  const user = await getUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { AppDataSource } = await import('../dataSource.js');
  const { User } = await import('../entities/User.js');
  const userRepo = AppDataSource.getRepository(User);
  const fullUser = await userRepo.findOne({ where: { id: userId } });
  if (!fullUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  fullUser.role = role;
  await userRepo.save(fullUser);

  res.json({ message: `Role updated to ${role}`, userId, role });
}

export {
  changePassword,
  changeUserRole,
  forgotPassword,
  getMe,
  getUserProfile,
  listUsers,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
};
