import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { createUser, findUserByEmail } from '../models/UserModel.js';
import { createUserSchema } from '../validators/UserValidator.js';

async function registerUser(req: Request, res: Response) {
  try {
    //it validates the input we provide
    const parsed = createUserSchema.parse(req.body);

    const { email, password } = parsed;

    //this will confirm if the user exists or not
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    //hash password section
    const passwordHash = await bcrypt.hash(password, 10);

    //create a user
    const user = await createUser(email, passwordHash);

    return res.status(201).json(user);
  } catch (error) {
    return res.status(400).json({ error });
  }
}

async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    //store the session
    req.session.userId = user.id;

    return res.json({ message: 'Login successful' });
  } catch (error) {
    return res.status(400).json({ error });
  }
}

export { loginUser, registerUser };
