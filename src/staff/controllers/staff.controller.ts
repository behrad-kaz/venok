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
} from '@nestjs/common';
import {
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { StaffService } from '../services/staff.service';
import { CreateStaffDto, UpdateStaffDto } from '../dtos/staff.dto';
import { StaffQueryDto, StaffSort } from '../dtos/staff-query.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../shared/decorators/public.decorator';
import { WorkspaceService } from '../../workspace/services/workspace.service';

@ApiTags('staff')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'دریافت لیست کارمندان' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'suspended'],
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: StaffSort,
    description: 'مرتب‌سازی بر اساس: name, createdAt, updatedAt',
  })
  async findAll(
    @Query() queryParams: StaffQueryDto,
    @CurrentUser() currentUser: any,
  ) {
    const workspace = await this.workspaceService.getCurrentWorkspaceByUser(
      currentUser.id,
    );
    return this.staffService.findAll(queryParams, workspace.organizationId);
  }

  @Get('me')
  @ApiOperation({ summary: 'دریافت اطلاعات کارمند جاری' })
  getCurrent(@CurrentUser() currentUser: any) {
    return this.staffService.getCurrentStaff(currentUser.id);
  }

  @Public()
  @Get('by-code/:code')
  @ApiOperation({ summary: 'دریافت کارمند بر اساس کد (عمومی)' })
  findByCode(@Param('code') code: string) {
    return this.staffService.findByCode(code);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'دریافت کارمند بر اساس شناسه کاربر' })
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.staffService.findByUser(userId);
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'دریافت کارمندان یک سازمان' })
  findByOrganization(
    @Param('organizationId', ParseIntPipe) organizationId: number,
  ) {
    return this.staffService.findByOrganization(organizationId);
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'دریافت کارمندان یک دپارتمان' })
  findByDepartment(@Param('departmentId', ParseIntPipe) departmentId: number) {
    return this.staffService.findByDepartment(departmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت یک کارمند' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد کارمند جدید' })
  async create(@Body() body: CreateStaffDto, @CurrentUser() currentUser: any) {
    try {
      console.log('📥 دریافت درخواست POST /staff:', body);

      const workspace = await this.workspaceService.getCurrentWorkspaceByUser(
        currentUser.id,
      );

      if (!workspace) {
        throw new NotFoundException('No workspace found for this user');
      }

      const result = await this.staffService.create(
        body,
        currentUser.id,
        workspace.organizationId,
      );

      console.log('✅ نتیجه ایجاد Staff:', result);
      return result;
    } catch (error) {
      console.error('❌ خطا در ایجاد Staff:', error);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'به‌روزرسانی کارمند' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStaffDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.staffService.update(id, body, currentUser.id, currentUser.role);
  }

  @Put(':id/department')
  @ApiOperation({ summary: 'تغییر دپارتمان کارمند' })
  changeDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body('departmentId', ParseIntPipe) departmentId: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.staffService.changeDepartment(
      id,
      departmentId,
      currentUser.id,
      currentUser.role,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'حذف کارمند (فقط ادمین)' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.staffService.delete(id, currentUser.id, currentUser.role);
  }
}
