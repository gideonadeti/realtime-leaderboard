import { MiddlewareConsumer, Module } from '@nestjs/common';

import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { LoggingMiddleware } from './logging/logging.middleware';
import { ActivitiesModule } from './activities/activities.module';
import { AttachUserMiddleware } from './attach-user/attach-user.middleware';

@Module({
  imports: [AuthModule, ActivitiesModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware, AttachUserMiddleware).forRoutes('*');
  }
}
