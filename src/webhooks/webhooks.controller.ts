import { clerkClient, User } from '@clerk/express';
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
      const clerkId = event.data?.id;

      if (!clerkId) {
        this.logger.warn('Missing user ID in event data');
        return res.sendStatus(400);
      }

      this.logger.log(
        `Received Clerk event: ${event.type} for user ${clerkId}`,
      );

      switch (event.type) {
        case 'user.deleted':
          await this.handleUserDeleted(clerkId);
          break;
        case 'user.updated':
          await this.handleUserUpdated(clerkId);
          break;
        default:
          this.logger.log(`Unhandled Clerk event type: ${event.type}`);
      }

      return res.sendStatus(204);
    } catch (error) {
      this.logger.error('Error verifying webhook', (error as Error).stack);

      return res.sendStatus(400);
    }
  }

  private async handleUserDeleted(clerkId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      this.logger.warn(
        `User with clerkId ${clerkId} not found. Skipping delete.`,
        this.handleUserDeleted.name,
      );

      return;
    }

    const activityIds = await this.prismaService.activity.findMany({
      where: {
        scores: { some: { userId: user.id } },
      },
      select: { id: true },
    });

    await Promise.all([
      ...activityIds.map((a) => this.redisService.removeUser(a.id, user.id)),
      this.redisService.removeUser('global', user.id),
      this.prismaService.user.delete({ where: { id: user.id } }),
    ]);

    this.logger.log(
      `User ${user.id} deleted from DB and Redis`,
      this.handleUserDeleted.name,
    );
  }

  private async handleUserUpdated(clerkId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      this.logger.warn(
        `User with clerkId ${clerkId} not found. Skipping update.`,
        this.handleUserUpdated.name,
      );

      return;
    }

    let clerkUser: User;

    try {
      clerkUser = await clerkClient.users.getUser(clerkId);
    } catch (error) {
      this.logger.error(
        `Failed to fetch Clerk user ${clerkId}`,
        (error as Error).stack,
      );

      return;
    }

    const email = clerkUser.primaryEmailAddress?.emailAddress || '';
    const name = clerkUser.fullName || '';

    if (!email) {
      this.logger.warn(`Clerk user ${clerkId} has no primary email`);
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { name, email },
    });

    this.logger.log(`User ${user.id} updated with name and email`);
  }
}
