import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LogFilter } from './shared/filters/log.filter';
import { LogInterceptor } from './shared/interceptors/log.interceptor';
import { LogService } from './shared/services/log.service';
import { LogEntity } from './shared/schemas/log.entity';
import { TimeMiddleware } from './shared/middleware/time.middleware';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { OrganizationModule } from './organization/organization.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { StaffModule } from './staff/staff.module';
import { SupportModule } from './support/support.module';
import { ConversationModule } from './conversation/conversation.module';
import { WidgetModule } from './widget/widget.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([LogEntity]),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 30,
      },
    ]),
    AuthModule,
    UserModule,
    OrganizationModule, 
    WorkspaceModule,
    StaffModule,
    SupportModule,
    ConversationModule,
    WidgetModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'files'),
      serveRoot: '/files',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LogService,
    {
      provide: APP_FILTER,
      useClass: LogFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TimeMiddleware).forRoutes('*');
  }
}