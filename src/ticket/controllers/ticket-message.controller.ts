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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TicketMessageService } from '../services/ticket-message.service';
import { CreateTicketMessageDto, UpdateTicketMessageDto } from '../dtos/ticket-message.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('ticket-messages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('tickets/:ticketId/messages')
export class TicketMessageController {
  constructor(private readonly ticketMessageService: TicketMessageService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت همه پیام‌های یک تیکت' })
  getMessages(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.ticketMessageService.getTicketMessages(
      ticketId,
      currentUser.id,
      currentUser.role,
    );
  }

  @Post()
  @ApiOperation({ summary: 'ارسال پیام جدید در تیکت' })
  createMessage(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body() body: CreateTicketMessageDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.ticketMessageService.createMessage(
      ticketId,
      body,
      currentUser.id,
      currentUser.role,
    );
  }

  @Put(':messageId')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'به‌روزرسانی پیام (فقط ادمین)' })
  updateMessage(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body('content') content: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.ticketMessageService.updateMessage(
      messageId,
      content,
      currentUser.id,
      currentUser.role,
    );
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'حذف پیام' })
  deleteMessage(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.ticketMessageService.deleteMessage(
      messageId,
      currentUser.id,
      currentUser.role,
    );
  }
}