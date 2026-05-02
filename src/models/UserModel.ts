import { AppDataSource } from '../dataSource.js';
import { User } from '../entities/User.js';

const userRepository = AppDataSource.getRepository(User);

async function createUser(email: string, passwordHash: string, fullName: string): Promise<User> {
  const user = userRepository.create({ email, passwordHash, fullName });
  return await userRepository.save(user);
}

async function findUserByEmail(email: string): Promise<User | null> {
  return await userRepository.findOne({ where: { email } });
}

async function getUserById(id: string): Promise<User | null> {
  return await userRepository.findOne({
    where: { id },
    select: { id: true, email: true, fullName: true, role: true, profileViews: true },
  });
}

async function getAllUsers(): Promise<User[]> {
  return await userRepository.find({
    select: { id: true, email: true, fullName: true, role: true },
  });
}

async function updateUserProfile(
  id: string,
  fullName: string,
  email: string,
): Promise<User | null> {
  const user = await userRepository.findOne({ where: { id } });
  if (!user) {
    return null;
  }
  user.fullName = fullName;
  user.email = email;
  return await userRepository.save(user);

  //return without passwordHash
  return await userRepository.findOne({
    select: { id: true, email: true, fullName: true, role: true, profileViews: true },
  });
}
async function incrementProfileViews(user: User): Promise<User> {
  user.profileViews += 1;
  return await userRepository.save(user);
}
//for updating password
async function updateUserPassword(id: string, newPasswordHash: string): Promise<User | null> {
  const user = await userRepository.findOne({ where: { id } });
  if (!user) return null;
  user.passwordHash = newPasswordHash;
  return await userRepository.save(user);
}
//get the user with password for the verification purposes
async function getUserWithPassword(id: string): Promise<User | null> {
  return await userRepository.findOne({ where: { id } });
}

export {
  createUser,
  findUserByEmail,
  getAllUsers,
  getUserById,
  getUserWithPassword,
  incrementProfileViews,
  updateUserPassword,
  updateUserProfile,
};
