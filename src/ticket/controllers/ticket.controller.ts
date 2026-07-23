import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TicketService } from '../services/ticket.service';
import { CreateTicketDto, UpdateTicketDto } from '../dtos/ticket.dto';
import { TicketQueryDto, TicketSort } from '../dtos/ticket-query.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { GetUserId } from '../../shared/decorators/get-user-id.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('tickets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت لیست تیکت‌ها' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'title', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'in_progress', 'responded', 'closed'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['low', 'medium', 'high', 'urgent'] })
  @ApiQuery({ name: 'category', required: false, enum: ['general', 'technical', 'billing', 'feature_request', 'bug_report', 'other'] })
  findAll(
    @Query() queryParams: TicketQueryDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.ticketService.findAll(
      queryParams,
      currentUser.id,
      currentUser.role,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت یک تیکت با پیام‌های آن' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.ticketService.findOne(id, currentUser.id, currentUser.role);
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد تیکت جدید' })
  create(
    @Body() body: CreateTicketDto,
    @GetUserId() userId: number,
  ) {
    return this.ticketService.create(body, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'به‌روزرسانی تیکت' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTicketDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.ticketService.update(id, body, currentUser.id, currentUser.role);
  }

  @Put(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'اختصاص تیکت به ادمین' })
  assignTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body('assignedTo') assignedTo: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.ticketService.assignTicket(id, assignedTo, currentUser.id, currentUser.role);
  }

  @Put(':id/resolve')
  @ApiOperation({ summary: 'بستن تیکت (حل شده)' })
  resolveTicket(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.ticketService.resolveTicket(id, currentUser.id, currentUser.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'حذف تیکت' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.ticketService.delete(id, currentUser.id, currentUser.role);
  }
}