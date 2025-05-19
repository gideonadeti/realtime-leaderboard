import { clerkClient } from '@clerk/express';
import { verifyWebhook } from '@clerk/express/webhooks';
import { Controller, Logger, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private logger = new Logger(WebhooksController.name);

  @Post()
  async handleClerkWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      const event = await verifyWebhook(req);
      const userId = event.data?.id;

      if (!userId) {
        this.logger.warn('Missing user ID');

        return res.sendStatus(400);
      }

      switch (event.type) {
        case 'user.deleted':
          await this.handleUserDeleted(userId);
          break;
        case 'user.updated':
          await this.handleUserUpdated(userId);
          break;
        default:
          this.logger.log(`Unhandled event: ${event.type}`);
      }

      return res.sendStatus(204);
    } catch (error) {
      this.logger.error('Error verifying webhook:', (error as Error).stack);

      return res.sendStatus(400);
    }
  }

  private async handleUserDeleted(userId: string) {
    const activityIds = await this.prismaService.activity.findMany({
      where: {
        scores: { some: { userId } },
      },
      select: { id: true },
    });

    await Promise.all([
      ...activityIds.map((a) => this.redisService.removeUser(a.id, userId)),
      this.redisService.removeUser('global', userId),
      this.prismaService.user.delete({ where: { id: userId } }),
    ]);
  }

  private async handleUserUpdated(userId: string) {
    const clerkUser = await clerkClient.users.getUser(userId);

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        name: clerkUser.fullName || '',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
      },
    });
  }
}
