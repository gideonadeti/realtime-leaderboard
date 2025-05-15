import { AuthObject, clerkClient } from '@clerk/express';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request } from 'express';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AttachUserMiddleware implements NestMiddleware {
  constructor(private readonly prismaService: PrismaService) {}

  private readonly logger = new Logger(AttachUserMiddleware.name);

  async use(req: Request & { auth: AuthObject }, res: any, next: NextFunction) {
    const auth = req.auth;

    if (auth.userId) {
      const userId = auth.userId;

      try {
        let user = await this.prismaService.user.findUnique({
          where: { clerkId: userId },
        });

        if (!user) {
          const clerkUser = await clerkClient.users.getUser(userId);

          user = await this.prismaService.user.create({
            data: {
              name: clerkUser.fullName as string,
              email: clerkUser.primaryEmailAddress!.emailAddress,
              clerkId: userId,
            },
          });
        }

        req['user'] = user;
      } catch (error) {
        this.logger.error('Failed to attach user:', error);
      }
    }

    next();
  }
}
