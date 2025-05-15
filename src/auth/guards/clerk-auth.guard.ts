import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { auth: any }>();

    return request.auth !== undefined;
  }
}
