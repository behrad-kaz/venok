import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { MessageService } from '../services/message.service';
import { CreateMessageDto, UpdateMessageDto } from '../dtos/message.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ConversationGateway } from '../conversation.gateway';

@ApiTags('messages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('conversation/:conversationId/message')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly conversationGateway: ConversationGateway,
  ) {}

  @Get()
  @ApiOperation({ summary: 'دریافت همه پیام‌های یک گفتگو' })
  getMessages(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.messageService.getConversationMessages(
      conversationId,
      currentUser.id,
      currentUser.role,
    );
  }

  @Post()
  @ApiOperation({ summary: 'ارسال پیام جدید در گفتگو' })
  async createMessage(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() body: CreateMessageDto,
    @CurrentUser() currentUser: any,
  ) {
    let senderId = currentUser.id;
    
    if (currentUser.staffId) {
      senderId = currentUser.staffId;
    }
    
    const senderName = `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email || 'پشتیبانی';
    
    console.log('📤 ارسال پیام:', {
      conversationId,
      userId: currentUser.id,
      userRole: currentUser.role,
      staffId: currentUser.staffId,
      senderName,
      hasFile: !!body.fileUrl,
    });
    
    const message = await this.messageService.createMessage(
      conversationId,
      body,
      currentUser.id,
      currentUser.role,
      senderName,
    );

    // ✅ ارسال پیام از طریق Socket.io با اطلاعات فایل
    const socketMessage = {
      id: message.id,
      text: message.content,
      senderType: message.senderType,
      timestamp: message.createdAt,
      isInternal: message.isInternalNote,
      senderName: senderName,
      senderId: message.senderId,
      fileUrl: message.fileUrl,
      fileType: message.fileType,
    };

    this.conversationGateway.server
      .to(`conversation_${conversationId}`)
      .emit('new_message', socketMessage);

    console.log(`✅ پیام از ${senderName} به room conversation_${conversationId} ارسال شد`);

    return message;
  }

  @Put(':messageId')
  @ApiOperation({ summary: 'به‌روزرسانی پیام' })
  updateMessage(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() body: UpdateMessageDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.messageService.updateMessage(messageId, body, currentUser.id, currentUser.role);
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'حذف پیام' })
  deleteMessage(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.messageService.deleteMessage(messageId, currentUser.id, currentUser.role);
  }
}