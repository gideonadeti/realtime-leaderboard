import { Module } from '@nestjs/common';

import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
