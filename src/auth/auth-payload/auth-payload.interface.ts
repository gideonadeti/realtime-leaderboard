import { UserRole } from 'generated/prisma';

export interface AuthPayload {
  email: string;
  sub: string;
  role: UserRole;
  jti: string;
}
