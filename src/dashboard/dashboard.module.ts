// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './controllers/stats.controller';
import { StatsService } from './services/stats.service';
import { ConversationEntity } from '../conversation/entities/conversation.entity';
import { MessageEntity } from '../conversation/entities/message.entity';
import { WorkspaceEntity } from '../workspace/entities/workspace.entity';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { UserEntity } from '../user/entities/user.entity';
import { OrganizationEntity } from '../organization/entities/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      MessageEntity,
      WorkspaceEntity,
      UserEntity,
      OrganizationEntity,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService, WorkspaceService],
  exports: [StatsService],
})
export class DashboardModule {}