import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
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

@ApiTags('widget')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('widget')
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  @Get('current')
  @ApiOperation({ summary: 'دریافت تنظیمات ویجت جاری' })
  getCurrent(@CurrentUser() currentUser: any) {
    // TODO: workspaceId از context بگیر
    const workspaceId = 1;
    return this.widgetService.getCurrentWidget(workspaceId);
  }

  @Patch()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'به‌روزرسانی تنظیمات ویجت (فقط ادمین)' })
  update(
    @Body() body: UpdateWidgetDto,
    @CurrentUser() currentUser: any,
  ) {
    // TODO: workspaceId از context بگیر
    const workspaceId = 1;
    return this.widgetService.updateWidget(workspaceId, body, currentUser.id, currentUser.role);
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