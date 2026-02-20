import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3501;
  const nodeEnv = configService.get<string>('nodeEnv') || 'development';

  // Security headers
  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

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
