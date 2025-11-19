import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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
  const swaggerBaseUrl = configService.get<string>('SWAGGER_BASE_URL');
  const battleshipBaseUrl = configService.get<string>('BATTLESHIP_BASE_URL');
  const allowedOrigins = [
    frontendBaseUrl,
    swaggerBaseUrl,
    battleshipBaseUrl,
  ].filter((origin): origin is string => Boolean(origin));

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  });

  app.setGlobalPrefix('api/v1');
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

  const config = new DocumentBuilder()
    .setTitle('Battleship Real-time Leaderboard')
    .setDescription(
      'A real-time leaderboard application for the Battleship game.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (_controllerKey: string, methodKey: string) =>
      methodKey,
  };

  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, options);

  SwaggerModule.setup('api/v1/documentation', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
