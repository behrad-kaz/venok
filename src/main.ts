import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ============================================
  // 1. CORS - باید قبل از Helmet باشد
  // ============================================
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-context-token'],
    exposedHeaders: ['Content-Disposition'],
  });

  // ============================================
  // 2. Helmet - با تنظیمات مناسب برای تصاویر
  // ============================================
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          // ✅ اجازه بارگذاری تصاویر از localhost و data
          imgSrc: ["'self'", 'data:', 'validator.swagger.io', 'http://localhost:3000', 'http://localhost:3001'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          // ✅ اجازه اتصال به API
          connectSrc: ["'self'", 'http://localhost:3000', 'http://localhost:3001'],
        },
      },
      crossOriginEmbedderPolicy: false,
      // ✅ اجازه دسترسی به منابع از domainهای دیگر
      crossOriginResourcePolicy: { policy: "cross-origin" },
      // ✅ اجازه نمایش محتوا در iframe
      frameguard: { action: 'deny' },
    }),
  );

  // ============================================
  // 3. Cookie Parser
  // ============================================
  app.use(cookieParser());

  // ============================================
  // 4. Global Pipes
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
  // 5. Swagger Documentation
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
  // 6. Start Server
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