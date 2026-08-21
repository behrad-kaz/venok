// src/notification/services/notification.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import {
  ConversationEntity,
  ConversationStatus,
  ConversationPriority,
} from '../../conversation/entities/conversation.entity';
import {
  MessageEntity,
  MessageSenderType,
} from '../../conversation/entities/message.entity';
import { StaffEntity } from '../../staff/entities/staff.entity';
import { WidgetEntity } from '../../widget/entities/widget.entity';
import { NotificationEntity, NotificationType } from '../entities/notification.entity';

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'danger';
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  timestamp: Date;
  isRead: boolean;
  fingerprint: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(StaffEntity)
    private staffRepository: Repository<StaffEntity>,
    @InjectRepository(WidgetEntity)
    private widgetRepository: Repository<WidgetEntity>,
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
  ) {}

  async getNotifications(workspaceId: number): Promise<Notification[]> {
    const notifications: Notification[] = [];

    console.log(`🔍 بررسی نوتیفیکیشن‌ها برای workspaceId: ${workspaceId}`);

    // ✅ 1. گفتگوهای بدون پاسخ بیش از ۱۰ دقیقه
    const waitingConversations =
      await this.getWaitingConversations(workspaceId);
    console.log(`📊 گفتگوهای بدون پاسخ: ${waitingConversations}`);
    if (waitingConversations > 0) {
      notifications.push({
        id: `waiting-${Date.now()}`,
        type: 'warning',
        title: 'گفتگوهای بدون پاسخ',
        description: `${waitingConversations} گفتگو منتظر  پاسخ هستند`,
        buttonText: 'مشاهده گفتگوها',
        buttonLink: '/dashboard/conversations',
        timestamp: new Date(),
        isRead: false,
        fingerprint: `waiting-${workspaceId}`,
      });
    }

    // ✅ 2. گفتگوهای بدون مسئول
    const unassignedConversations =
      await this.getUnassignedConversations(workspaceId);
    console.log(`📊 گفتگوهای بدون مسئول: ${unassignedConversations}`);
    if (unassignedConversations > 0) {
      notifications.push({
        id: `unassigned-${Date.now()}`,
        type: 'info',
        title: 'چند گفتگو بدون مسئول مشخص',
        description: `${unassignedConversations} گفتگو هنوز به کسی اختصاص داده نشده‌اند`,
        buttonText: 'مشاهده گفتگوها',
        buttonLink: '/dashboard/conversations',
        timestamp: new Date(),
        isRead: false,
        fingerprint: `unassigned-${workspaceId}`,
      });
    }

    // ✅ 3. وضعیت نصب ویجت
    const widgetStatus = await this.getWidgetStatus(workspaceId);
    console.log(
      `📊 وضعیت ویجت: ${widgetStatus.installed ? 'نصب شده' : 'نصب نشده'}`,
    );
    if (!widgetStatus.installed) {
      notifications.push({
        id: `widget-${Date.now()}`,
        type: 'info',
        title: 'نصب ویجت سایت هنوز کامل نشده',
        description: 'برای دریافت درخواست از مشتریان، ویجت را نصب کنید',
        buttonText: 'تکمیل ویجت',
        buttonLink: '/dashboard/widget',
        timestamp: new Date(),
        isRead: false,
        fingerprint: `widget-${workspaceId}`,
      });
    }

    // ✅ 4. دپارتمان‌های شلوغ
    const busyDepartments = await this.getBusyDepartments(workspaceId);
    console.log(`📊 دپارتمان‌های شلوغ: ${busyDepartments.length}`);
    if (busyDepartments.length > 0) {
      notifications.push({
        id: `busy-${Date.now()}`,
        type: 'warning',
        title: 'صف شلوغ در دپارتمان‌ها',
        description: `${busyDepartments.map((d) => d.name).join('، ')} دارای گفتگوهای باز زیاد هستند`,
        buttonText: 'بررسی دپارتمان‌ها',
        buttonLink: '/dashboard/departments',
        timestamp: new Date(),
        isRead: false,
        fingerprint: `busy-${workspaceId}`,
      });
    }

    // ✅ 5. گفتگوهای با اولویت فوری
    const urgentConversations = await this.getUrgentConversations(workspaceId);
    console.log(`📊 گفتگوهای فوری: ${urgentConversations}`);
    if (urgentConversations > 0) {
      notifications.push({
        id: `urgent-${Date.now()}`,
        type: 'danger',
        title: 'گفتگوهای فوری نیاز به توجه دارند',
        description: `${urgentConversations} گفتگو با اولویت فوری در انتظار پاسخ هستند`,
        buttonText: 'مشاهده گفتگوها',
        buttonLink: '/dashboard/conversations?priority=urgent',
        timestamp: new Date(),
        isRead: false,
        fingerprint: `urgent-${workspaceId}`,
      });
    }

    // ✅ 6. نوتیفیکیشن‌های ذخیره شده در دیتابیس
    const storedNotifications = await this.notificationRepository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });

    for (const stored of storedNotifications) {
      notifications.push({
        id: `stored-${stored.id}`,
        type: stored.type,
        title: stored.title,
        description: stored.description,
        buttonText: stored.buttonText || 'مشاهده',
        buttonLink: stored.buttonLink || '/dashboard',
        timestamp: stored.createdAt,
        isRead: stored.isRead,
        fingerprint: stored.fingerprint || `stored-${stored.id}`,
      });
    }

    // ✅ حذف نوتیفیکیشن‌های تکراری بر اساس fingerprint
    const seen = new Set<string>();
    const uniqueNotifications = notifications.filter((n) => {
      if (seen.has(n.fingerprint)) {
        return false;
      }
      seen.add(n.fingerprint);
      return true;
    });

    console.log(`📨 ${uniqueNotifications.length} نوتیفیکیشن نهایی ایجاد شد`);

    // مرتب‌سازی بر اساس زمان (جدیدترین اول)
    uniqueNotifications.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    return uniqueNotifications;
  }

  async createNotification(
    workspaceId: number,
    data: {
      title: string;
      description: string;
      type: NotificationType;
      recipientId?: number;
      buttonText?: string;
      buttonLink?: string;
      fingerprint?: string;
    },
  ): Promise<NotificationEntity> {
    const notification = this.notificationRepository.create({
      title: data.title,
      description: data.description,
      type: data.type,
      workspaceId,
      recipientId: data.recipientId || null,
      buttonText: data.buttonText || null,
      buttonLink: data.buttonLink || null,
      fingerprint: data.fingerprint || null,
    });

    return this.notificationRepository.save(notification);
  }

  // ============================================================
  // متدهای کمکی
  // ============================================================

  private async getWaitingConversations(workspaceId: number): Promise<number> {
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
      const customerMessages = messages
        .filter((m) => m.senderType === MessageSenderType.CUSTOMER)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const supportMessages = messages
        .filter((m) => m.senderType === MessageSenderType.AGENT)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      if (customerMessages.length === 0) continue;

      const lastCustomerMessage = customerMessages[customerMessages.length - 1];
      const lastSupportMessage =
        supportMessages[supportMessages.length - 1] || null;

      const isWaiting =
        !lastSupportMessage ||
        lastSupportMessage.createdAt < lastCustomerMessage.createdAt;

      if (isWaiting) {
        count++;
      }
    }

    return count;
  }

  private async getUnassignedConversations(
    workspaceId: number,
  ): Promise<number> {
    return await this.conversationRepository.count({
      where: {
        workspaceId,
        agentId: IsNull(),
        status: In([ConversationStatus.OPEN, ConversationStatus.WAITING]),
        deletedAt: IsNull(),
      },
    });
  }

  private async getWidgetStatus(
    workspaceId: number,
  ): Promise<{ installed: boolean }> {
    const widget = await this.widgetRepository.findOne({
      where: { workspaceId },
    });

    return {
      installed: widget?.isActive || false,
    };
  }

  private async getBusyDepartments(
    workspaceId: number,
  ): Promise<{ id: number; name: string; count: number }[]> {
    const result = await this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.team', 'team')
      .select('team.id', 'id')
      .addSelect('team.name', 'name')
      .addSelect('COUNT(conversation.id)', 'count')
      .where('conversation.workspaceId = :workspaceId', { workspaceId })
      .andWhere('conversation.status IN (:...statuses)', {
        statuses: [
          ConversationStatus.OPEN,
          ConversationStatus.WAITING,
          ConversationStatus.ANSWERED,
        ],
      })
      .andWhere('conversation.deletedAt IS NULL')
      .andWhere('conversation.teamId IS NOT NULL')
      .groupBy('team.id')
      .addGroupBy('team.name')
      .having('COUNT(conversation.id) > 5')
      .getRawMany();

    return result.map((r) => ({
      id: r.id,
      name: r.name,
      count: parseInt(r.count, 10),
    }));
  }

  private async getUrgentConversations(workspaceId: number): Promise<number> {
    return await this.conversationRepository.count({
      where: {
        workspaceId,
        priority: ConversationPriority.URGENT,
        status: In([ConversationStatus.OPEN, ConversationStatus.WAITING]),
        deletedAt: IsNull(),
      },
    });
  }

  // ✅ متد برای تولید نوتیفیکیشن تغییر دپارتمان
  async generateStaffNotifications(
    workspaceId: number,
    staffId: number,
    oldDepartmentId: number | null,
    newDepartmentId: number | null,
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    if (oldDepartmentId !== newDepartmentId) {
      const staff = await this.staffRepository.findOne({
        where: { id: staffId },
      });

      if (staff) {
        const oldDeptName = oldDepartmentId
          ? await this.getDepartmentName(oldDepartmentId)
          : 'بدون دپارتمان';
        const newDeptName = newDepartmentId
          ? await this.getDepartmentName(newDepartmentId)
          : 'بدون دپارتمان';

        notifications.push({
          id: `department-change-${Date.now()}`,
          type: 'info',
          title: 'تغییر دپارتمان عضو',
          description: `دپارتمان "${staff.name}" از "${oldDeptName}" به "${newDeptName}" تغییر یافت`,
          buttonText: 'مشاهده اعضا',
          buttonLink: '/dashboard/members',
          timestamp: new Date(),
          isRead: false,
          fingerprint: `department-change-${workspaceId}-${staffId}`,
        });
      }
    }

    return notifications;
  }

  private async getDepartmentName(departmentId: number): Promise<string> {
    const result = await this.staffRepository
      .createQueryBuilder('staff')
      .innerJoin('staff.department', 'department')
      .select('department.name', 'name')
      .where('staff.departmentId = :departmentId', { departmentId })
      .limit(1)
      .getRawOne();

    return result?.name || 'نامشخص';
  }
}
