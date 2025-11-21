import { PlayerRole } from '@prisma/client';

export interface AuthPayload {
  username: string;
  sub: string;
  jti: string;
  role: PlayerRole;
}
