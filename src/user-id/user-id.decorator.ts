import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Player } from '@prisma/client';

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const player = request.user as Player;

    return player.id;
  },
);
