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
import { OrganizationService } from '../services/organization.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationType,
  LegalType,
} from '../dtos/organization.dto';
import {
  OrganizationQueryDto,
  OrganizationSort,
} from '../dtos/organization-query.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('organizations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // ✅ مسیرهای خاص باید قبل از مسیرهای عمومی با :id قرار بگیرند

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'دریافت لیست سازمان‌ها (فقط ادمین)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'slug', required: false, type: String })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: OrganizationSort,
    description: 'مرتب‌سازی بر اساس: name, createdAt, updatedAt',
  })
  findAll(
    @Query() queryParams: OrganizationQueryDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.organizationService.findAll(queryParams, currentUser.id);
  }

  @Get('current')
  @ApiOperation({ summary: 'دریافت سازمان جاری کاربر' })
  getCurrent(@CurrentUser() currentUser: any) {
    return this.organizationService.getCurrentOrganization(currentUser.id);
  }

  @Public()
  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'دریافت سازمان بر اساس اسلاگ (عمومی)' })
  findBySlug(@Param('slug') slug: string) {
    return this.organizationService.findBySlug(slug);
  }

  @Get('my')
  @ApiOperation({ summary: 'دریافت سازمان‌های کاربر جاری' })
  getMyOrganizations(@CurrentUser() currentUser: any) {
    return this.organizationService.findByUser(currentUser.id);
  }

  // ✅ by-user باید قبل از :id قرار بگیرد
  @Get('by-user')
  @ApiOperation({ summary: 'دریافت سازمان کاربر جاری' })
  async getOrganizationByUser(@CurrentUser() currentUser: any) {
    // ✅ اگر کاربر organizationId دارد، آن را برگردان
    if (currentUser.organizationId) {
      const organization = await this.organizationService.findOne(
        currentUser.organizationId,
        currentUser.id,
      );
      if (organization) {
        return organization;
      }
    }

    // ✅ اگر کاربر organizationId ندارد، از متد getOrganizationByUser استفاده کن
    const organization = await this.organizationService.getOrganizationByUser(
      currentUser.id,
    );

    if (!organization) {
      throw new NotFoundException('سازمانی برای این کاربر یافت نشد');
    }

    return organization;
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت یک سازمان' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.organizationService.findOne(id, currentUser.id);
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد سازمان جدید' })
  create(@Body() body: CreateOrganizationDto, @CurrentUser() currentUser: any) {
    return this.organizationService.create(body, currentUser.id);
  }

  @Patch()
  @ApiOperation({ summary: 'به‌روزرسانی سازمان جاری' })
  async updateCurrent(
    @Body() body: UpdateOrganizationDto,
    @CurrentUser() currentUser: any,
  ) {
    const organization = await this.organizationService.getOrganizationByUser(
      currentUser.id,
    );

    if (!organization) {
      throw new NotFoundException('Organization not found for this user');
    }

    return this.organizationService.update(
      organization.id,
      body,
      currentUser.id,
      currentUser.role,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'به‌روزرسانی سازمان با شناسه' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOrganizationDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.organizationService.update(
      id,
      body,
      currentUser.id,
      currentUser.role,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'حذف سازمان (فقط ادمین)' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.organizationService.delete(
      id,
      currentUser.id,
      currentUser.role,
    );
  }
}