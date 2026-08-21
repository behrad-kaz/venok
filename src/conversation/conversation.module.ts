// src/conversation/conversation.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConversationController } from './controllers/conversation.controller';
import { MessageController } from './controllers/message.controller';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';
import { WorkspaceEntity } from '../workspace/entities/workspace.entity';
import { SupportTeamEntity } from '../support/entities/support-team.entity';
import { StaffEntity } from '../staff/entities/staff.entity';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { OrganizationEntity } from '../organization/entities/organization.entity';
import { UserEntity } from '../user/entities/user.entity';
import { ConversationGateway } from './conversation.gateway';
import { CustomerModule } from '../customer/customer.module';
import { NotificationModule } from '../notification/notification.module'; // ✅ اضافه شد

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      MessageEntity,
      WorkspaceEntity,
      SupportTeamEntity,
      StaffEntity,
      OrganizationEntity,
      UserEntity,
    ]),
    CustomerModule,
    NotificationModule, // ✅ اضافه شد
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ConversationController, MessageController],
  providers: [
    ConversationService,
    MessageService,
    WorkspaceService,
    ConversationGateway,
  ],
  exports: [ConversationService, MessageService, ConversationGateway],
})
export class ConversationModule {}