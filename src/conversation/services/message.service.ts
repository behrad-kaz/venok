// src/conversation/services/message.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity, MessageSenderType } from '../entities/message.entity';
import { ConversationEntity, ConversationStatus } from '../entities/conversation.entity';
import { StaffEntity } from '../../staff/entities/staff.entity';
import { CreateMessageDto, UpdateMessageDto } from '../dtos/message.dto';
import { UserRole } from '../../user/entities/user.entity';

@Injectable()
export class MessageService {
  // ✅ کلید برای جلوگیری از ذخیره تکراری - با timeout طولانی‌تر
  private savingMessages: Map<string, number> = new Map();

  constructor(
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(StaffEntity)
    private staffRepository: Repository<StaffEntity>,
  ) {}

  async getConversationMessages(
    conversationId: number,
    userId: number,
    userRole: UserRole,
  ): Promise<MessageEntity[]> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      userId !== 0 &&
      userRole !== UserRole.ADMIN &&
      conversation.agentId !== userId
    ) {
      if (userId !== 0) {
        throw new ForbiddenException(
          'You can only view messages from your own conversations',
        );
      }
    }

    if (userId !== 0) {
      await this.markMessagesAsRead(conversationId, userId, userRole);
    }

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
  ): Promise<MessageEntity> {
    // ✅ کلید یکتا: ترکیب conversationId + content + hash
    const contentHash = this.hashString(body.content);
    const uniqueKey = `${conversationId}-${contentHash}`;
    
    // ✅ بررسی وجود کلید در Map
    if (this.savingMessages.has(uniqueKey)) {
      const existingId = this.savingMessages.get(uniqueKey);
      console.log(`⚠️ پیام تکراری، نادیده گرفته شد. کلید: ${uniqueKey}, ID قبلی: ${existingId}`);
      
      // پیام قبلی را پیدا کن و برگردان
      const existing = await this.messageRepository.findOne({
        where: {
          id: existingId,
        },
      });
      if (existing) {
        console.log(`✅ پیام قبلی با ID ${existing.id} برگردانده شد`);
        return existing;
      }
    }
    
    // ✅ ذخیره در Map با زمان فعلی
    this.savingMessages.set(uniqueKey, 0); // موقتاً 0
  
    console.log(`📝 ایجاد پیام جدید با کلید: ${uniqueKey}`);

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.status === ConversationStatus.CLOSED) {
      throw new ForbiddenException(
        'Cannot send message to a closed conversation',
      );
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
    } else if (userRole === UserRole.USER) {
      const staff = await this.staffRepository.findOne({
        where: { userId: userId },
      });

      if (staff) {
        senderType = MessageSenderType.AGENT;
        senderId = staff.id;
      } else {
        senderType = MessageSenderType.CUSTOMER;
      }
    } else {
      senderType = MessageSenderType.CUSTOMER;
    }

    if (senderName && senderName !== 'مشتری') {
      const supportKeywords = [
        'پشتیبانی',
        'ادمین',
        'مدیر',
        'support',
        'admin',
        'agent',
      ];
      const lowerName = senderName.toLowerCase();
      if (supportKeywords.some((keyword) => lowerName.includes(keyword))) {
        senderType = MessageSenderType.AGENT;
      }
    }

    console.log('📝 ایجاد پیام:', {
      userId,
      userRole,
      senderType,
      senderId,
      senderName,
      uniqueKey,
    });

    const newMessage = this.messageRepository.create({
      conversationId,
      senderType,
      senderId,
      senderName:
        senderName ||
        (senderType === MessageSenderType.CUSTOMER ? 'مشتری' : 'پشتیبانی'),
      content: body.content,
      isInternalNote: body.isInternalNote || false,
      isRead: false,
      createdBy: userId === 0 ? null : userId,
      fileUrl: body.fileUrl || null,
      fileType: body.fileType || null,
    });

    const saved = await this.messageRepository.save(newMessage);
    
    // ✅ ذخیره ID واقعی در Map
    this.savingMessages.set(uniqueKey, saved.id);
    
    // ✅ بعد از 2 ثانیه کلید را پاک کن
    setTimeout(() => {
      this.savingMessages.delete(uniqueKey);
      console.log(`🗑️ کلید ${uniqueKey} از حافظه پاک شد`);
    }, 2000);

    conversation.lastActivity = new Date();
    await this.conversationRepository.save(conversation);

    return saved;
  }

  // ✅ تابع کمکی برای هش کردن متن
  private hashString(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  async updateMessage(
    id: number,
    body: UpdateMessageDto,
    userId: number,
    userRole: UserRole,
  ): Promise<MessageEntity> {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (
      userId !== 0 &&
      userRole !== UserRole.ADMIN &&
      message.createdBy !== userId
    ) {
      throw new ForbiddenException(
        'You are not allowed to update this message',
      );
    }

    if (body.content !== undefined) message.content = body.content;
    if (body.isRead !== undefined) {
      message.isRead = body.isRead;
      if (body.isRead) {
        message.readAt = new Date();
      }
    }

    const saved = await this.messageRepository.save(message);

    if (Array.isArray(saved)) {
      return saved[0];
    }

    return saved;
  }

  async markMessagesAsRead(
    conversationId: number,
    userId: number,
    userRole: UserRole,
  ): Promise<void> {
    if (userId === 0) return;

    const query = this.messageRepository
      .createQueryBuilder()
      .update(MessageEntity)
      .set({ isRead: true, readAt: new Date() })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('createdBy != :userId', { userId })
      .andWhere('isRead = :isRead', { isRead: false });

    await query.execute();
  }

  async deleteMessage(
    id: number,
    userId: number,
    userRole: UserRole,
  ): Promise<{ message: string }> {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (
      userId !== 0 &&
      userRole !== UserRole.ADMIN &&
      message.createdBy !== userId
    ) {
      throw new ForbiddenException(
        'You are not allowed to delete this message',
      );
    }

    message.deletedAt = new Date();
    await this.messageRepository.save(message);

    await this.messageRepository.softDelete(id);

    return { message: 'Message deleted successfully' };
  }
}