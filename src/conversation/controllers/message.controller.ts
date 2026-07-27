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

@ApiTags('messages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('conversation/:conversationId/message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

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
  createMessage(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() body: CreateMessageDto,
    @CurrentUser() currentUser: any,
  ) {
    // نام فرستنده از کاربر جاری گرفته می‌شود
    const senderName = `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email;
    return this.messageService.createMessage(
      conversationId,
      body,
      currentUser.id,
      currentUser.role,
      senderName,
    );
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