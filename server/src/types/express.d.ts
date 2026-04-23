import type { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      uploadedFileUrl?: string;
      uploadedFileType?: string;
    }
  }
}

export {};
