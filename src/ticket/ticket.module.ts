import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketController } from './controllers/ticket.controller';
import { TicketMessageController } from './controllers/ticket-message.controller';
import { TicketService } from './services/ticket.service';
import { TicketMessageService } from './services/ticket-message.service';
import { TicketEntity } from './entities/ticket.entity';
import { TicketMessageEntity } from './entities/ticket-message.entity';
import { UserEntity } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TicketEntity,
      TicketMessageEntity,
      UserEntity,
    ]),
  ],
  controllers: [TicketController, TicketMessageController],
  providers: [TicketService, TicketMessageService],
  exports: [TicketService, TicketMessageService],
})
export class TicketModule {}