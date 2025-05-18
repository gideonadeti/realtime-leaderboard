import { AuthObject } from '@clerk/express';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { auth: AuthObject }>();

    Logger.log(
      `Request auth: ${JSON.stringify(request.auth)}`,
      ClerkAuthGuard.name,
    );
    Logger.log(
      `Request auth userId: ${JSON.stringify(request.auth)}`,
      ClerkAuthGuard.name,
    );

    return request.auth.userId !== null;
  }
}
