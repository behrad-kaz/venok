import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';  
import csurf from 'csurf'; 
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ============================================
  // 1. Helmet - امنیت HTTP headers
  // ============================================
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ============================================
  // 2. Cookie Parser - برای CSRF
  // ============================================
  app.use(cookieParser());

  // ============================================
  // 3. CSRF Protection (با استثنا برای Swagger)
  // ============================================
  // فقط برای مسیرهای غیر از Swagger
  app.use((req: Request, res: Response, next: NextFunction) => {
    // استثنا برای Swagger و API های public
    const excludedPaths = ['/documentation', '/documentation-json', '/health'];
    if (excludedPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }
    
    // CSRF محافظت
    const csrfProtection = csurf({
      cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      },
    });
    
    return csrfProtection(req, res, next);
  });

  // ============================================
  // 4. CORS
  // ============================================
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // ============================================
  // 5. Global Pipes
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ============================================
  // 6. Swagger
  // ============================================
  const config = new DocumentBuilder()
    .setTitle('Nest App')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token here',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/documentation', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // ============================================
  // 7. Start Server
  // ============================================
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/documentation`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});