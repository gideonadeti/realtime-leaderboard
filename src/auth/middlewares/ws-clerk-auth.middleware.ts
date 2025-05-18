import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

import { AuthService } from '../auth.service';

export const wsClerkAuthMiddleware = (authService: AuthService) => {
  return async (
    socket: Socket & { user: any },
    next: (error?: Error) => void,
  ) => {
    try {
      await authService.validateClient(socket);

      next();
    } catch (error) {
      Logger.error(
        'Failed to authenticate WebSocket client:',
        (error as Error).stack,
        wsClerkAuthMiddleware.name,
      );

      next(error as Error);
    }
  };
};
