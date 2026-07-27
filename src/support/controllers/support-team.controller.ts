import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Patch,
  Query,
  UseGuards,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { SupportTeamService } from '../services/support-team.service';
import { CreateSupportTeamDto, UpdateSupportTeamDto } from '../dtos/support-team.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WorkspaceService } from '../../workspace/services/workspace.service';

@ApiTags('support-teams')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('support/team')
export class SupportTeamController {
  constructor(
    private readonly teamService: SupportTeamService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'دریافت لیست دپارتمان‌ها' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  async findAll(
    @Query('status') status?: 'active' | 'inactive',
    @CurrentUser() currentUser?: any,
  ) {
    let workspaceId: number | undefined;
    
    try {
      const workspace = await this.workspaceService.getCurrentWorkspaceByUser(
        currentUser.id,
      );
      workspaceId = workspace.id;
    } catch (error) {
      console.warn('⚠️ No workspace found for user, returning all teams');
    }

    return this.teamService.findAll(workspaceId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت یک دپارتمان' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ایجاد دپارتمان جدید (فقط ادمین)' })
  async create(
    @Body() body: CreateSupportTeamDto,
    @CurrentUser() currentUser: any,
  ) {
    const workspace = await this.workspaceService.getCurrentWorkspaceByUser(
      currentUser.id,
    );

    if (!workspace) {
      throw new NotFoundException('No workspace found for this user');
    }

    return this.teamService.create(body, currentUser.id, workspace.id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'به‌روزرسانی کامل دپارتمان (فقط ادمین)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateSupportTeamDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.teamService.update(id, body, currentUser.id, currentUser.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'به‌روزرسانی جزئی دپارتمان (فقط ادمین)' })
  patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateSupportTeamDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.teamService.update(id, body, currentUser.id, currentUser.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'حذف دپارتمان (فقط ادمین)' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.teamService.delete(id, currentUser.id, currentUser.role);
  }
}