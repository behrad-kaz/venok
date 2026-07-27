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
import { WorkspaceService } from '../services/workspace.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../dtos/workspace.dto';
import { WorkspaceQueryDto, WorkspaceSort } from '../dtos/workspace-query.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../shared/decorators/public.decorator';
import { OrganizationService } from '../../organization/services/organization.service';

@ApiTags('workspaces')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('workspace')
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'دریافت لیست workspaceها' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({ name: 'slug', required: false, type: String })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: WorkspaceSort,
    description: 'مرتب‌سازی بر اساس: name, createdAt, updatedAt',
  })
  findAll(@Query() queryParams: WorkspaceQueryDto) {
    return this.workspaceService.findAll(queryParams);
  }

  @Get('current')
  @ApiOperation({ summary: 'دریافت workspace جاری' })
  getCurrent(@CurrentUser() currentUser: any) {
    return this.workspaceService.getCurrentWorkspace(currentUser.id);
  }

  @Public()
  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'دریافت workspace بر اساس اسلاگ (عمومی)' })
  findBySlug(@Param('slug') slug: string) {
    return this.workspaceService.findBySlug(slug);
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'دریافت workspaceهای یک سازمان' })
  findByOrganization(
    @Param('organizationId', ParseIntPipe) organizationId: number,
  ) {
    return this.workspaceService.findByOrganization(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت یک workspace' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workspaceService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد workspace جدید' })
  async create(
    @Body() body: CreateWorkspaceDto,
    @CurrentUser() currentUser: any,
  ) {
    const organization = await this.organizationService.getOrganizationByUser(
      currentUser.id,
    );

    if (!organization) {
      throw new NotFoundException('Organization not found for this user');
    }

    const organizationId = organization.id;
    console.log(
      `✅ ایجاد workspace برای organizationId: ${organizationId} توسط کاربر: ${currentUser.id}`,
    );

    return this.workspaceService.create(body, currentUser.id, organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'به‌روزرسانی کامل workspace' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateWorkspaceDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.workspaceService.update(
      id,
      body,
      currentUser.id,
      currentUser.role,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'به‌روزرسانی جزئی workspace' })
  patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateWorkspaceDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.workspaceService.update(
      id,
      body,
      currentUser.id,
      currentUser.role,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'حذف workspace (فقط ادمین)' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.workspaceService.delete(id, currentUser.id, currentUser.role);
  }
}