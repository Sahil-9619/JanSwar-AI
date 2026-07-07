import assignments from "./roleAssignments.json";
import { Role } from "@prisma/client";

type Assignment = {
  email?: string;
  role?: string;
  name?: string;
};

const validRoles = new Set<string>(Object.values(Role));

export function getRoleAssignment(email?: string | null) {
  if (!email) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const match = (assignments.users as Assignment[]).find(
    (user) => user.email?.trim().toLowerCase() === normalizedEmail
  );

  if (!match || !match.role || !validRoles.has(match.role)) {
    return null;
  }

  return {
    role: match.role as Role,
    name: match.name?.trim() || null,
  };
}
