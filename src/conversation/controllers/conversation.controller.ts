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
import {
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { ConversationService } from '../services/conversation.service';
import { CreateConversationDto, UpdateConversationDto } from '../dtos/conversation.dto';
import { ConversationQueryDto, ConversationSort } from '../dtos/conversation-query.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('conversations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت لیست گفتگوها' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'customerName', required: false, type: String })
  @ApiQuery({ name: 'customerPhone', required: false, type: String })
  @ApiQuery({ name: 'subject', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'waiting', 'answered', 'closed'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['normal', 'urgent'] })
  @ApiQuery({ name: 'teamId', required: false, type: Number })
  @ApiQuery({ name: 'agentId', required: false, type: Number })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ConversationSort,
    description: 'مرتب‌سازی بر اساس: createdAt, updatedAt, startDate',
  })
  findAll(
    @Query() queryParams: ConversationQueryDto,
    @CurrentUser() currentUser: any,
  ) {
    // TODO: workspaceId از context بگیر
    const workspaceId = 1;
    return this.conversationService.findAll(
      queryParams,
      workspaceId,
      currentUser.id,
      currentUser.role,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت یک گفتگو با پیام‌های آن' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.conversationService.findOne(id, currentUser.id, currentUser.role);
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد گفتگوی جدید' })
  create(
    @Body() body: CreateConversationDto,
    @CurrentUser() currentUser: any,
  ) {
    // TODO: workspaceId از context بگیر
    const workspaceId = 1;
    return this.conversationService.create(body, currentUser.id, workspaceId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'به‌روزرسانی گفتگو' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateConversationDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.conversationService.update(id, body, currentUser.id, currentUser.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'حذف گفتگو (فقط ادمین)' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.conversationService.delete(id, currentUser.id, currentUser.role);
  }
}