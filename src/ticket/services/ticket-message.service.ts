import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketMessageEntity, MessageType } from '../entities/ticket-message.entity';
import { TicketEntity, TicketStatus } from '../entities/ticket.entity';
import { CreateTicketMessageDto } from '../dtos/ticket-message.dto';
import { UserEntity, UserRole } from '../../user/entities/user.entity';

@Injectable()
export class TicketMessageService {
  constructor(
    @InjectRepository(TicketMessageEntity)
    private messageRepository: Repository<TicketMessageEntity>,
    @InjectRepository(TicketEntity)
    private ticketRepository: Repository<TicketEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async createFirstMessage(ticketId: number, userId: number, content: string) {
    const message = this.messageRepository.create({
      content,
      ticketId,
      userId,
      type: MessageType.USER,
      isRead: false,
    });
    return await this.messageRepository.save(message);
  }

  async createMessage(ticketId: number, body: CreateTicketMessageDto, userId: number, userRole: UserRole) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR && ticket.userId !== userId) {
      throw new ForbiddenException('You can only send messages to your own tickets');
    }

    if (ticket.status === TicketStatus.CLOSED) {
      throw new ForbiddenException('Cannot send message to a closed ticket');
    }

    const messageType = (userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR)
      ? MessageType.ADMIN
      : MessageType.USER;

    const message = this.messageRepository.create({
      content: body.content,
      ticketId,
      userId,
      type: messageType,
      isRead: false,
    });

    const saved = await this.messageRepository.save(message);

    // به‌روزرسانی وضعیت تیکت
    if (messageType === MessageType.ADMIN) {
      ticket.status = TicketStatus.RESPONDED;  // ← اصلاح شد
      await this.ticketRepository.save(ticket);
    }

    return this.findOneMessage(saved.id, userId, userRole);
  }

  async findOneMessage(id: number, userId: number, userRole: UserRole) {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: {
        user: true,
        ticket: true,
      },
      select: {
        id: true,
        content: true,
        type: true,
        userId: true,
        ticketId: true,
        isRead: true,
        readAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const ticket = await this.ticketRepository.findOne({
      where: { id: message.ticketId },
    });

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR && ticket?.userId !== userId) {
      throw new ForbiddenException('You can only view messages from your own tickets');
    }

    return message;
  }

  async getTicketMessages(ticketId: number, userId: number, userRole: UserRole) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR && ticket.userId !== userId) {
      throw new ForbiddenException('You can only view messages from your own tickets');
    }

    await this.markMessagesAsRead(ticketId, userId, userRole);

    const messages = await this.messageRepository.find({
      where: { ticketId },
      relations: {
        user: true,
      },
      select: {
        id: true,
        content: true,
        type: true,
        userId: true,
        ticketId: true,
        isRead: true,
        readAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
      order: { createdAt: 'ASC' },
    });

    return messages;
  }

  async markMessagesAsRead(ticketId: number, userId: number, userRole: UserRole) {
    const query = this.messageRepository
      .createQueryBuilder()
      .update(TicketMessageEntity)
      .set({ isRead: true, readAt: new Date() })
      .where('ticketId = :ticketId', { ticketId })
      .andWhere('userId != :userId', { userId });

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR) {
      query.andWhere('type = :type', { type: MessageType.ADMIN });
    } else {
      query.andWhere('type = :type', { type: MessageType.USER });
    }

    await query.execute();
  }

  async countUnreadMessages(ticketId: number, userId: number): Promise<number> {
    const query = this.messageRepository
      .createQueryBuilder()
      .where('ticketId = :ticketId', { ticketId })
      .andWhere('isRead = :isRead', { isRead: false })
      .andWhere('userId != :userId', { userId });

    return await query.getCount();
  }

  async updateMessage(id: number, content: string, userId: number, userRole: UserRole) {
    const message = await this.findOneMessage(id, userId, userRole);

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR) {
      throw new ForbiddenException('Only admins can update messages');
    }

    message.content = content;
    const saved = await this.messageRepository.save(message);
    return this.findOneMessage(saved.id, userId, userRole);
  }

  async deleteMessage(id: number, userId: number, userRole: UserRole) {
    const message = await this.findOneMessage(id, userId, userRole);

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR && message.userId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageRepository.softDelete(id);
    return { message: 'Message deleted successfully' };
  }
}