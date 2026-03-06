import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    userId: number;
  }
}
