import { AppDataSource } from '../dataSource.js';
import { User } from '../entities/User.js';

const userRepository = AppDataSource.getRepository(User);

async function createUser(email: string, passwordHash: string): Promise<User> {
  const user = userRepository.create({
    email,
    passwordHash,
  });

  return await userRepository.save(user);
}

async function findUserByEmail(email: string): Promise<User | null> {
  return await userRepository.findOne({
    where: { email },
  });
}

export { createUser, findUserByEmail };
