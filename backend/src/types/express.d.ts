import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phoneNumber: string;
        fullName: string;
        role: Role;
      };
    }
  }
}
