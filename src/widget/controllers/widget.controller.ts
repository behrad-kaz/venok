import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  NotFoundException,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { WidgetService } from '../services/widget.service';
import { UpdateWidgetDto } from '../dtos/widget.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../shared/decorators/public.decorator';
import { WorkspaceService } from '../../workspace/services/workspace.service';

@ApiTags('widget')
@Controller('widget')
export class WidgetController {
  constructor(
    private readonly widgetService: WidgetService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  // ✅ مسیر عمومی - دریافت تنظیمات ویجت با workspaceId از query
  @Public()
  @Get('current')
  @ApiOperation({ summary: 'دریافت تنظیمات ویجت جاری (عمومی)' })
  @ApiQuery({
    name: 'workspaceId',
    required: false,
    type: Number,
    description: 'شناسه workspace (اختیاری - در صورت عدم ارسال، اولین workspace استفاده می‌شود)'
  })
  async getCurrent(
    @Query('workspaceId') workspaceId?: number,
  ) {
    let finalWorkspaceId = workspaceId;

    // ✅ اگر workspaceId ارسال نشده، از اولین workspace استفاده کن
    if (!finalWorkspaceId) {
      const defaultWorkspace = await this.workspaceService.getDefaultWorkspace();
      if (!defaultWorkspace) {
        throw new NotFoundException('No workspace found in system');
      }
      finalWorkspaceId = defaultWorkspace.id;
    }

    return this.widgetService.getCurrentWidget(finalWorkspaceId as number);
  }

  // ✅ مسیر عمومی - دریافت کد اسکریپت ویجت
  @Public()
  @Get('script')
  @ApiOperation({ summary: 'دریافت کد اسکریپت ویجت (عمومی)' })
  @ApiQuery({
    name: 'workspaceId',
    required: true,
    type: Number,
    description: 'شناسه workspace'
  })
  getScript(@Query('workspaceId') workspaceId: number) {
    return this.widgetService.getWidgetScript(workspaceId);
  }

  // ✅ مسیر عمومی - دریافت کد اسکریپت ویجت با شناسه در مسیر
  @Public()
  @Get('script/:workspaceId')
  @ApiOperation({ summary: 'دریافت کد اسکریپت ویجت با شناسه workspace (عمومی)' })
  getScriptByWorkspace(@Param('workspaceId') workspaceId: number) {
    return this.widgetService.getWidgetScript(workspaceId);
  }

  // ✅ مسیر محافظت‌شده - به‌روزرسانی تنظیمات ویجت (فقط ادمین)
  @Patch()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'به‌روزرسانی تنظیمات ویجت (فقط ادمین)' })
  async update(
    @Body() body: UpdateWidgetDto,
    @CurrentUser() currentUser: any,
  ) {
    let workspace;

    try {
      workspace = await this.workspaceService.getCurrentWorkspaceByUser(
        currentUser.id,
      );
    } catch (error) {
      // اگر کاربر workspace ندارد، اولین workspace را بگیر
      workspace = await this.workspaceService.getDefaultWorkspace();
      if (!workspace) {
        throw new NotFoundException('No workspace found for this user');
      }
    }

    return this.widgetService.updateWidget(
      workspace.id,
      body,
      currentUser.id,
      currentUser.role
    );
  }
}