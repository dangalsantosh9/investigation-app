import { get } from './api.js';

export interface User {
  userId: string;
  email: string;
  fullName: string;
  role: string;
}

let user: User | null = $state(null);
let loaded = $state(false);

export function getUser(): User | null {
  return user;
}

export function isLoaded(): boolean {
  return loaded;
}

export function setUser(newUser: User | null): void {
  user = newUser;
}

export async function fetchUser(): Promise<void> {
  const result = await get<User>('/api/me');
  if (result.ok) {
    user = result.data;
  } else {
    user = null;
  }
  loaded = true;
}
