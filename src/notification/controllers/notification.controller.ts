// src/notification/controllers/notification.controller.ts
import { Controller, Get, Post, Body, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { Public } from '../../shared/decorators/public.decorator';
import { JwtService } from '@nestjs/jwt';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { NotificationType } from '../entities/notification.entity';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly workspaceService: WorkspaceService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'دریافت لیست نوتیفیکیشن‌ها' })
  async getNotifications(@Query('token') token: string) {
    console.log('📨 درخواست دریافت نوتیفیکیشن‌ها دریافت شد');
    
    if (!token) {
      console.log('ℹ️ توکن وجود ندارد');
      return { notifications: [], total: 0, unread: 0 };
    }

    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      
      console.log(`👤 کاربر ${userId} درخواست نوتیفیکیشن کرد`);
      
      if (!userId) {
        throw new Error('Invalid token: userId not found');
      }
      
      const workspace = await this.workspaceService.getCurrentWorkspaceByUser(userId);
      console.log(`📌 workspaceId: ${workspace.id}`);
      
      const notifications = await this.notificationService.getNotifications(workspace.id);
      
      console.log(`📊 ${notifications.length} نوتیفیکیشن برای کاربر ${userId} ارسال شد`);
      
      return {
        notifications,
        total: notifications.length,
        unread: notifications.filter(n => !n.isRead).length,
      };
    } catch (error) {
      console.error('❌ خطا در دریافت نوتیفیکیشن‌ها:', error.message);
      console.error('❌ Stack:', error.stack);
      return { notifications: [], total: 0, unread: 0, error: error.message };
    }
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد نوتیفیکیشن جدید' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string', enum: ['warning', 'info', 'danger'] },
        recipientId: { type: 'number' },
        buttonText: { type: 'string' },
        buttonLink: { type: 'string' },
        fingerprint: { type: 'string' },
      },
      required: ['title', 'description', 'type'],
    },
  })
  async createNotification(
    @CurrentUser() currentUser: any,
    @Body() body: {
      title: string;
      description: string;
      type: NotificationType;
      recipientId?: number;
      buttonText?: string;
      buttonLink?: string;
      fingerprint?: string;
    },
  ) {
    console.log('📥 درخواست ایجاد نوتیفیکیشن:', body);

    try {
      const workspace = await this.workspaceService.getCurrentWorkspaceByUser(
        currentUser.id,
      );

      if (!workspace) {
        throw new Error('No workspace found for this user');
      }

      const notification = await this.notificationService.createNotification(
        workspace.id,
        {
          title: body.title,
          description: body.description,
          type: body.type || NotificationType.INFO,
          recipientId: body.recipientId,
          buttonText: body.buttonText,
          buttonLink: body.buttonLink,
          fingerprint: body.fingerprint,
        },
      );

      console.log('✅ نوتیفیکیشن ایجاد شد:', notification.id);
      return notification;
    } catch (error) {
      console.error('❌ خطا در ایجاد نوتیفیکیشن:', error);
      throw error;
    }
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'دریافت تعداد نوتیفیکیشن‌های خوانده نشده' })
  async getUnreadCount(@Query('token') token: string) {
    if (!token) {
      return { unreadCount: 0 };
    }

    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      
      const workspace = await this.workspaceService.getCurrentWorkspaceByUser(userId);
      const notifications = await this.notificationService.getNotifications(workspace.id);
      
      return {
        unreadCount: notifications.filter(n => !n.isRead).length,
      };
    } catch (error) {
      return { unreadCount: 0 };
    }
  }
}
