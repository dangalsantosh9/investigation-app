import 'express-session';

declare module 'express-session' {
  export interface Session {
    clearSession(): Promise<void>; // DO NOT MODIFY THIS!
    userId?: string;
    email?: string;
    fullName?: string;
    role?: string;
    isLoggedIn?: boolean;
    authenticatedUser?: {
      userId: string;
      email: string;
      fullName: string;
      role: string;
    };
  }
}
