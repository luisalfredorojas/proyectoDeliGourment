import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// Create Express instance
const expressApp = express();

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:5173', 
      'http://localhost:3000',
      // Vercel production URLs (will be configured via environment variables)
      process.env.FRONTEND_URL || '',
      /\.vercel\.app$/, // Allow all Vercel preview deployments
    ].filter(Boolean), // Remove empty strings
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('DeliGourmet API')
    .setDescription('API para el sistema de gestión de pedidos de panadería')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();

  const port = process.env.PORT || 3000;
  
  // Only listen if not in Vercel serverless environment
  if (process.env.VERCEL !== '1') {
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
  
  return expressApp;
}

// For Vercel serverless
export default bootstrap();

// For local development
if (require.main === module) {
  bootstrap();
}
