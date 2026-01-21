import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with dynamic origin check
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean);
  
  console.log('CORS configured with allowed origins:', allowedOrigins);

  // Add raw middleware to handle preflight requests
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Check if origin is allowed
    const isAllowed = !origin || 
                      allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app');
    
    if (isAllowed && origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With');
      res.setHeader('Access-Control-Expose-Headers', 'Authorization');
    }
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      return res.status(204).end();
    }
    
    next();
  });
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow any vercel.app domain
      if (origin.endsWith('.vercel.app')) {
        console.log('Accepting Vercel domain:', origin);
        return callback(null, true);
      }
      
      console.log('Rejected origin:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
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
    .setDescription('API for bakery management system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
  console.log(`Swagger docs available at: http://0.0.0.0:${port}/api/docs`);
  console.log('🚀 Deployment successful - 2026-01-21 01:24');
}

bootstrap();
