import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { clerkMiddleware } from '@clerk/express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.use(cookieParser());
  app.use(clerkMiddleware());

  const config = new DocumentBuilder()
    .setTitle('Real-time Leaderboard')
    .setDescription('A real-time leaderboard system for ranking and scoring.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth')
    .build();
  const options: SwaggerDocumentOptions = {
    operationIdFactory: (_controllerKey: string, methodKey: string) =>
      methodKey,
  };
  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, options);

  SwaggerModule.setup('api/documentation', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
