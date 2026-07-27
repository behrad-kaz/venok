import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity, MessageSenderType } from '../entities/message.entity';
import { ConversationEntity, ConversationStatus } from '../entities/conversation.entity';
import { StaffEntity } from '../../staff/entities/staff.entity';
import { CreateMessageDto, UpdateMessageDto } from '../dtos/message.dto';
import { UserRole } from '../../user/entities/user.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(StaffEntity)
    private staffRepository: Repository<StaffEntity>,
  ) {}

  async getConversationMessages(conversationId: number, userId: number, userRole: UserRole) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (userRole === UserRole.USER && conversation.agentId !== userId) {
      throw new ForbiddenException('You can only view messages from your own conversations');
    }

    await this.markMessagesAsRead(conversationId, userId, userRole);

    const messages = await this.messageRepository.find({
      where: { conversationId },
      relations: {
        sender: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return messages;
  }

  async createMessage(
    conversationId: number,
    body: CreateMessageDto,
    userId: number,
    userRole: UserRole,
    senderName: string,
  ) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.status === ConversationStatus.CLOSED) {
      throw new ForbiddenException('Cannot send message to a closed conversation');
    }

    let senderType: MessageSenderType;
    let senderId: number | null = null;

    if (userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR) {
      senderType = MessageSenderType.AGENT;
      const staff = await this.staffRepository.findOne({
        where: { userId: userId },
      });
      if (staff) {
        senderId = staff.id;
      }
    } else {
      senderType = MessageSenderType.CUSTOMER;
    }

    const message = this.messageRepository.create({
      conversationId,
      senderType,
      senderId,
      senderName,
      content: body.content,
      isInternalNote: body.isInternalNote || false,
      isRead: false,
      createdBy: userId,
    });

    const saved = await this.messageRepository.save(message);

    conversation.lastActivity = new Date();
    await this.conversationRepository.save(conversation);

    return saved;
  }

  async updateMessage(
    id: number,
    body: UpdateMessageDto,
    userId: number,
    userRole: UserRole,
  ) {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (userRole !== UserRole.ADMIN && message.createdBy !== userId) {
      throw new ForbiddenException('You are not allowed to update this message');
    }

    if (body.content !== undefined) message.content = body.content;
    if (body.isRead !== undefined) {
      message.isRead = body.isRead;
      if (body.isRead) {
        message.readAt = new Date();
      }
    }

    const saved = await this.messageRepository.save(message);
    return saved;
  }

  async markMessagesAsRead(conversationId: number, userId: number, userRole: UserRole) {
    const query = this.messageRepository
      .createQueryBuilder()
      .update(MessageEntity)
      .set({ isRead: true, readAt: new Date() })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('createdBy != :userId', { userId })
      .andWhere('isRead = :isRead', { isRead: false });

    await query.execute();
  }

  async deleteMessage(id: number, userId: number, userRole: UserRole) {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (userRole !== UserRole.ADMIN && message.createdBy !== userId) {
      throw new ForbiddenException('You are not allowed to delete this message');
    }

    message.deletedAt = new Date();
    await this.messageRepository.save(message);

    await this.messageRepository.softDelete(id);

    return { message: 'Message deleted successfully' };
  }
}