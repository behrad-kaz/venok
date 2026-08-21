// src/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { NotificationEntity } from './entities/notification.entity';
import { ConversationEntity } from '../conversation/entities/conversation.entity';
import { MessageEntity } from '../conversation/entities/message.entity';
import { StaffEntity } from '../staff/entities/staff.entity';
import { WidgetEntity } from '../widget/entities/widget.entity';
import { WorkspaceEntity } from '../workspace/entities/workspace.entity';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { UserEntity } from '../user/entities/user.entity';
import { OrganizationEntity } from '../organization/entities/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      ConversationEntity,
      MessageEntity,
      StaffEntity,
      WidgetEntity,
      WorkspaceEntity,
      UserEntity,
      OrganizationEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, WorkspaceService],
  exports: [NotificationService],
})
export class NotificationModule {}
