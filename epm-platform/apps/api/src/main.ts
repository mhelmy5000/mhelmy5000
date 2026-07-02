import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Mizan EPM API bootstrap. Global `/api` prefix, strict validation (whitelist +
 * transform so DTOs are the contract), Swagger/OpenAPI at `/api/docs`, security
 * headers, and CORS for the web app.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({ origin: process.env.WEB_ORIGIN?.split(',') ?? true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Mizan EPM API')
    .setDescription('Enterprise Performance Management — IAM + KPI module (Phase 1)')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('auth')
    .addTag('kpi')
    .addTag('ai')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`Mizan EPM API listening on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
