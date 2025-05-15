import { MiddlewareConsumer, Module } from '@nestjs/common';

import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { LoggingMiddleware } from './logging/logging.middleware';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
