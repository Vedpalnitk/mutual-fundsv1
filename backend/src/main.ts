import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3001;

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS - 3500 series ports for this project
  app.enableCors({
    origin: [
      'http://localhost:3500', // Next.js web app
      'http://localhost:3502', // ML Service
      'http://localhost:8081', // Expo web
      'http://localhost:19006', // Expo web alt
    ],
    credentials: true,
  });

  // Swagger documentation
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

  await app.listen(port);

  console.log(`
  🚀 Sparrow Invest API is running!

  📍 Server:     http://localhost:${port}
  📚 Swagger:    http://localhost:${port}/api/docs
  🔐 Auth:       POST /api/v1/auth/register, POST /api/v1/auth/login
  `);
}

bootstrap();
