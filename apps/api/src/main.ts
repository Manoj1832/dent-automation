import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;
  const frontendUrl = configService.get<string>('frontendUrl') || 'http://localhost:3000';

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        frontendUrl.replace(/\/$/, ''), // Strip trailing slash just in case
        'http://localhost:3000',
        'https://dent-automation.vercel.app'
      ];
      
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, false); // Or throw error, but false just blocks it safely
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global pipes — validation
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

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global response transform
  app.useGlobalInterceptors(new TransformInterceptor());

  // Enable graceful shutdown to prevent EADDRINUSE
  app.enableShutdownHooks();

  // Safety net to ensure the process actually dies if something hangs
  const forceExit = () => {
    setTimeout(() => process.exit(0), 1000).unref();
  };
  process.on('SIGINT', forceExit);
  process.on('SIGTERM', forceExit);
  process.on('SIGUSR2', forceExit);

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🦷 SREE ARUMUGAVADIVU Dental Clinic API running on http://localhost:${port}/api`);
  logger.log(`📊 Environment: ${configService.get<string>('nodeEnv')}`);
}

bootstrap();
