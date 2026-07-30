// ============================================================
// FILE: src/widget/controllers/widget.controller.ts
// ============================================================
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  NotFoundException,  // ✅ اضافه شد
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
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
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('widget')
export class WidgetController {
  constructor(
    private readonly widgetService: WidgetService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Get('current')
  @ApiOperation({ summary: 'دریافت تنظیمات ویجت جاری' })
  async getCurrent(@CurrentUser() currentUser: any) {
    // ✅ دریافت workspaceId از کاربر جاری
    const workspace = await this.workspaceService.getCurrentWorkspaceByUser(
      currentUser.id,
    );
    
    if (!workspace) {
      throw new NotFoundException('Workspace not found for this user');
    }
    
    return this.widgetService.getCurrentWidget(workspace.id);
  }

  @Patch()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'به‌روزرسانی تنظیمات ویجت (فقط ادمین)' })
  async update(
    @Body() body: UpdateWidgetDto,
    @CurrentUser() currentUser: any,
  ) {
    // ✅ دریافت workspaceId از کاربر جاری
    const workspace = await this.workspaceService.getCurrentWorkspaceByUser(
      currentUser.id,
    );
    
    if (!workspace) {
      throw new NotFoundException('Workspace not found for this user');
    }
    
    return this.widgetService.updateWidget(
      workspace.id, 
      body, 
      currentUser.id, 
      currentUser.role
    );
  }

  @Public()
  @Post('script')
  @ApiOperation({ summary: 'دریافت کد اسکریپت ویجت (عمومی)' })
  getScript(@Body('workspaceId') workspaceId: number) {
    return this.widgetService.getWidgetScript(workspaceId);
  }

  @Public()
  @Get('script/:workspaceId')
  @ApiOperation({ summary: 'دریافت کد اسکریپت ویجت با شناسه workspace (عمومی)' })
  getScriptByWorkspace(@Body('workspaceId') workspaceId: number) {
    return this.widgetService.getWidgetScript(workspaceId);
  }
}
// ============================================================