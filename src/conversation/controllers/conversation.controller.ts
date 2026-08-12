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
  NotFoundException,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { ConversationService } from '../services/conversation.service';
import {
  CreateConversationDto,
  UpdateConversationDto,
} from '../dtos/conversation.dto';
import {
  ConversationQueryDto,
  ConversationSort,
} from '../dtos/conversation-query.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../shared/decorators/public.decorator';
import { WorkspaceService } from '../../workspace/services/workspace.service';

@ApiTags('conversations')
@Controller('conversation')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'دریافت لیست گفتگوها' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'customerName', required: false, type: String })
  @ApiQuery({ name: 'customerPhone', required: false, type: String })
  @ApiQuery({ name: 'subject', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['open', 'waiting', 'answered', 'closed'],
  })
  @ApiQuery({ name: 'priority', required: false, enum: ['normal', 'urgent'] })
  @ApiQuery({ name: 'teamId', required: false, type: Number })
  @ApiQuery({ name: 'agentId', required: false, type: Number })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ConversationSort,
    description: 'مرتب‌سازی بر اساس: createdAt, updatedAt, startDate',
  })
  async findAll(
    @Query() queryParams: ConversationQueryDto,
    @CurrentUser() currentUser: any,
  ) {
    let workspaceId: number;

    try {
      const workspace = await this.workspaceService.getCurrentWorkspaceByUser(
        currentUser.id,
      );
      workspaceId = workspace.id;
      console.log(
        `📌 workspaceId برای کاربر ${currentUser.id}: ${workspaceId}`,
      );
    } catch (error) {
      console.warn('⚠️ کاربر workspace ندارد، استفاده از workspace پیش‌فرض 1');
      workspaceId = 1;
    }

    return this.conversationService.findAll(
      queryParams,
      workspaceId,
      currentUser.id,
      currentUser.role,
    );
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'دریافت یک گفتگو با پیام‌های آن' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.conversationService.findOne(
      id,
      currentUser.id,
      currentUser.role,
    );
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'ایجاد گفتگوی جدید (عمومی - برای ویجت)' })
  async create(@Body() body: CreateConversationDto) {
    const defaultWorkspace = await this.workspaceService.getDefaultWorkspace();

    if (!defaultWorkspace) {
      throw new NotFoundException('هیچ Workspace ای در سیستم وجود ندارد');
    }

    const workspaceId = defaultWorkspace.id;
    console.log(`✅ ایجاد گفتگو با workspaceId: ${workspaceId}`);

    const result = await this.conversationService.createPublic(
      body,
      workspaceId,
    );
    return result;
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'به‌روزرسانی گفتگو' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateConversationDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.conversationService.update(
      id,
      body,
      currentUser.id,
      currentUser.role,
    );
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'به‌روزرسانی جزئی گفتگو' })
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateConversationDto,
    @CurrentUser() currentUser: any,
  ) {
    console.log(`📤 PATCH /conversation/${id}`, body);
    return this.conversationService.update(
      id,
      body,
      currentUser.id,
      currentUser.role,
    );
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'حذف گفتگو (فقط ادمین)' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.conversationService.delete(
      id,
      currentUser.id,
      currentUser.role,
    );
  }
}