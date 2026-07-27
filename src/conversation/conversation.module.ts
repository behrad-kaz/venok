import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationController } from './controllers/conversation.controller';
import { MessageController } from './controllers/message.controller';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';
import { WorkspaceEntity } from '../workspace/entities/workspace.entity';
import { SupportTeamEntity } from '../support/entities/support-team.entity';
import { StaffEntity } from '../staff/entities/staff.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      MessageEntity,
      WorkspaceEntity,
      SupportTeamEntity,
      StaffEntity,
    ]),
  ],
  controllers: [ConversationController, MessageController],
  providers: [ConversationService, MessageService],
  exports: [ConversationService, MessageService],
})
export class ConversationModule {}