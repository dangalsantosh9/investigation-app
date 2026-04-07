import 'express-session';

declare module 'express-session' {
  export interface Session {
    clearSession(): Promise<void>; // DO NOT MODIFY THIS!
    userId?: string;
    email?: string;
    role?: string;
  }
}
