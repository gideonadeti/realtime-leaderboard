import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { clerkMiddleware } from '@clerk/express';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const frontendBaseUrl = configService.get<string>('FRONTEND_BASE_URL');

  Logger.log(`CORS Origin: ${frontendBaseUrl}`);
  Logger.log(
    `CORS Origin equals vercel frontend: ${frontendBaseUrl === 'https://realtime-leaderboard-frontend.vercel.app'}`,
  );

  app.enableCors({
    origin: [frontendBaseUrl],
    credentials: true,
  });

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
    .addTag('Activities')
    .addTag('Scores')
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
