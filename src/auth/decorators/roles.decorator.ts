import { SetMetadata } from '@nestjs/common';

import { PlayerRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: PlayerRole[]) => SetMetadata(ROLES_KEY, roles);
