import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import { Queue } from 'bullmq';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { AppModule } from './app.module';
import { BULLMQ_CONNECTION } from './common/queue/queue.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  // Get config
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3501;
  const nodeEnv = configService.get<string>('nodeEnv') || 'development';

  // Security headers
  app.use(helmet());

  // Response compression (60-80% reduction for JSON payloads)
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter — structured errors, no stack traces in production
  const clsService = app.get(ClsService);
  app.useGlobalFilters(new AllExceptionsFilter(configService, clsService));

  // CORS
  const devOrigins = [
    'http://localhost:3800', // Next.js web app (local dev)
    'http://localhost:3500', // Next.js web app (legacy / prod)
    'http://localhost:3502', // Next.js web app (dev server)
    'http://localhost:8000', // ML Service
    'http://localhost:8081', // Expo web
    'http://localhost:19006', // Expo web alt
  ];
  const prodOrigins = [
    'https://sparrow-invest.com',
    'https://www.sparrow-invest.com',
    'https://app.sparrow-invest.com',
    'https://admin.sparrow-invest.com',
  ];
  app.enableCors({
    origin: nodeEnv === 'production' ? prodOrigins : [...devOrigins, ...prodOrigins],
    credentials: true,
  });

  // Enable graceful shutdown hooks (triggers OnModuleDestroy on SIGTERM/SIGINT)
  app.enableShutdownHooks()

  // Swagger documentation (disabled in production)
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Sparrow Invest API')
      .setDescription('AI-Based Investment Portfolio Backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('admin/personas', 'Persona management (Admin)')
      .addTag('admin/allocations', 'Allocation strategy management (Admin)')
      .addTag('admin/models', 'ML model management (Admin)')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    // Bull Board — queue monitoring dashboard
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    const connection = app.get(BULLMQ_CONNECTION) as any;
    createBullBoard({
      queues: [
        new BullMQAdapter(new Queue('bse-orders', { connection })),
        new BullMQAdapter(new Queue('nse-orders', { connection })),
        new BullMQAdapter(new Queue('api-logs', { connection })),
      ],
      serverAdapter,
    });
    app.use('/admin/queues', serverAdapter.getRouter());
  }

  await app.listen(port);

  console.log(`
  🚀 Sparrow Invest API is running!

  📍 Server:     http://localhost:${port}
  📚 Swagger:    http://localhost:${port}/api/docs
  🔐 Auth:       POST /api/v1/auth/register, POST /api/v1/auth/login
  `);
}

bootstrap();
