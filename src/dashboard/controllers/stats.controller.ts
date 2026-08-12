// src/dashboard/controllers/stats.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StatsService } from '../services/stats.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { WorkspaceService } from '../../workspace/services/workspace.service';

@ApiTags('dashboard-stats')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dashboard/stats')
export class StatsController {
  constructor(
    private readonly statsService: StatsService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'دریافت آمار داشبورد' })
  async getStats(@CurrentUser() currentUser: any) {
    const workspace = await this.workspaceService.getCurrentWorkspaceByUser(currentUser.id);
    return this.statsService.getDashboardStats(workspace.id);
  }
}