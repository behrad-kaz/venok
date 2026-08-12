// src/dashboard/services/stats.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, Between } from 'typeorm'; // ✅ اضافه شد
import { ConversationEntity, ConversationStatus } from '../../conversation/entities/conversation.entity';
import { MessageEntity, MessageSenderType } from '../../conversation/entities/message.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
  ) {}

  async getDashboardStats(workspaceId: number) {
    // ✅ 1. گفتگوهای باز (open, waiting, answered)
    const openConversations = await this.conversationRepository.count({
      where: {
        workspaceId,
        status: In([ConversationStatus.OPEN, ConversationStatus.WAITING, ConversationStatus.ANSWERED]),
        deletedAt: IsNull(),
      },
    });

    // ✅ 2. در انتظار اولین پاسخ
    const waitingForFirstResponse = await this.getWaitingForFirstResponseCount(workspaceId);

    // ✅ 3. میانگین زمان پاسخ‌گویی
    const avgResponseTime = await this.getAverageResponseTime(workspaceId);

    // ✅ 4. گفتگوهای حل‌شده امروز
    const solvedToday = await this.getSolvedTodayCount(workspaceId);

    // ✅ 5. تغییرات نسبت به دیروز
    const previousDayStats = await this.getPreviousDayStats(workspaceId);

    return {
      openConversations,
      waitingForFirstResponse,
      avgResponseTime,
      solvedToday,
      changes: {
        openConversations: openConversations - previousDayStats.openConversations,
        waitingForFirstResponse: waitingForFirstResponse - previousDayStats.waitingForFirstResponse,
        solvedToday: solvedToday - previousDayStats.solvedToday,
      },
    };
  }

  private async getWaitingForFirstResponseCount(workspaceId: number): Promise<number> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .where('conversation.workspaceId = :workspaceId', { workspaceId })
      .andWhere('conversation.status IN (:...statuses)', {
        statuses: [ConversationStatus.OPEN, ConversationStatus.WAITING],
      })
      .andWhere('conversation.deletedAt IS NULL')
      .getMany();

    let count = 0;
    for (const conv of conversations) {
      const messages = conv.messages || [];
      const firstCustomerMessage = messages
        .filter(m => m.senderType === MessageSenderType.CUSTOMER)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

      const firstSupportMessage = messages
        .filter(m => m.senderType === MessageSenderType.AGENT)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

      if (firstCustomerMessage && !firstSupportMessage) {
        count++;
      } else if (firstCustomerMessage && firstSupportMessage) {
        if (firstSupportMessage.createdAt < firstCustomerMessage.createdAt) {
          count++;
        }
      }
    }

    return count;
  }

  private async getAverageResponseTime(workspaceId: number): Promise<string> {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .where('conversation.workspaceId = :workspaceId', { workspaceId })
      .andWhere('conversation.deletedAt IS NULL')
      .getMany();

    let totalResponseTime = 0;
    let count = 0;

    for (const conv of conversations) {
      const messages = conv.messages || [];
      const customerMessages = messages.filter(m => m.senderType === MessageSenderType.CUSTOMER);
      const supportMessages = messages.filter(m => m.senderType === MessageSenderType.AGENT);

      if (customerMessages.length === 0 || supportMessages.length === 0) continue;

      const firstCustomerMessage = customerMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      const firstSupportMessage = supportMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

      if (firstSupportMessage.createdAt > firstCustomerMessage.createdAt) {
        const diff = firstSupportMessage.createdAt.getTime() - firstCustomerMessage.createdAt.getTime();
        totalResponseTime += diff;
        count++;
      }
    }

    if (count === 0) {
      return '۰ دقیقه';
    }

    const avgMs = totalResponseTime / count;
    const avgMinutes = Math.round(avgMs / (1000 * 60));

    if (avgMinutes < 1) {
      return 'کمتر از ۱ دقیقه';
    }

    return `${avgMinutes} دقیقه`;
  }

  private async getSolvedTodayCount(workspaceId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.conversationRepository.count({
      where: {
        workspaceId,
        status: ConversationStatus.CLOSED,
        closedAt: Between(today, tomorrow),
        deletedAt: IsNull(),
      },
    });
  }

  private async getPreviousDayStats(workspaceId: number): Promise<{
    openConversations: number;
    waitingForFirstResponse: number;
    solvedToday: number;
  }> {
    const openConversations = await this.conversationRepository.count({
      where: {
        workspaceId,
        status: In([ConversationStatus.OPEN, ConversationStatus.WAITING, ConversationStatus.ANSWERED]),
        deletedAt: IsNull(),
      },
    });

    const waitingForFirstResponse = await this.getWaitingForFirstResponseCount(workspaceId);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const solvedYesterday = await this.conversationRepository.count({
      where: {
        workspaceId,
        status: ConversationStatus.CLOSED,
        closedAt: Between(yesterday, yesterdayEnd),
        deletedAt: IsNull(),
      },
    });

    return {
      openConversations,
      waitingForFirstResponse,
      solvedToday: solvedYesterday,
    };
  }
}