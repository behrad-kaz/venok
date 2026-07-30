import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { WorkspaceEntity } from '../entities/workspace.entity';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../dtos/workspace.dto';
import { WorkspaceQueryDto } from '../dtos/workspace-query.dto';
import { OrganizationEntity } from '../../organization/entities/organization.entity';
import { UserEntity, UserRole } from '../../user/entities/user.entity';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(OrganizationEntity)
    private organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async findAll(queryParams: WorkspaceQueryDto, organizationId?: number) {
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (queryParams.name) {
      where.name = Like(`%${queryParams.name}%`);
    }
    if (queryParams.code) {
      where.code = Like(`%${queryParams.code}%`);
    }
    if (queryParams.slug) {
      where.slug = Like(`%${queryParams.slug}%`);
    }

    const order: any = {};
    if (queryParams.sort) {
      order[queryParams.sort] = queryParams.order || 'DESC';
    } else {
      order.createdAt = queryParams.order || 'DESC';
    }

    const [data, total] = await this.workspaceRepository.findAndCount({
      where,
      relations: {
        organization: true,
      },
      order,
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
      relations: {
        organization: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async findBySlug(slug: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { slug },
      relations: {
        organization: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async findByOrganization(organizationId: number) {
    const workspaces = await this.workspaceRepository.find({
      where: { organizationId },
      relations: {
        organization: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return workspaces;
  }

  async getCurrentWorkspace(userId: number) {
    const workspaces = await this.workspaceRepository.find({
      where: {},
      take: 1,
    });

    if (workspaces.length === 0) {
      throw new NotFoundException('No workspace found');
    }

    return workspaces[0];
  }

  // ✅ متد جدید: دریافت workspace جاری کاربر بر اساس userId
  async getCurrentWorkspaceByUser(userId: number) {
    // 1. پیدا کردن کاربر و سازمانش
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.organizationId) {
      throw new NotFoundException('User has no organization');
    }

    // 2. پیدا کردن اولین workspace سازمان
    const workspace = await this.workspaceRepository.findOne({
      where: { organizationId: user.organizationId },
      order: { createdAt: 'ASC' },
    });

    if (!workspace) {
      throw new NotFoundException('No workspace found for this organization');
    }

    return workspace;
  }

  async create(
    body: CreateWorkspaceDto,
    userId: number,
    organizationId: number,
  ) {
    // بررسی وجود سازمان
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // بررسی تکراری نبودن کد و اسلاگ
    const existingWorkspace = await this.workspaceRepository.findOne({
      where: [{ code: body.code }, { slug: body.slug }],
    });

    if (existingWorkspace) {
      if (existingWorkspace.code === body.code) {
        throw new BadRequestException(`Code "${body.code}" already exists`);
      }
      if (existingWorkspace.slug === body.slug) {
        throw new BadRequestException(`Slug "${body.slug}" already exists`);
      }
    }

    const workspace = this.workspaceRepository.create({
      ...body,
      organizationId,
      managerStaffId: userId,
      status: 'active',
      logo: body.logo || null,
    });

    const saved = await this.workspaceRepository.save(workspace);
    return this.findOne(saved.id);
  }

  async update(
    id: number,
    body: UpdateWorkspaceDto,
    userId: number,
    userRole: UserRole,
  ) {
    const workspace = await this.findOne(id);

    if (userRole !== UserRole.ADMIN && workspace.managerStaffId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this workspace',
      );
    }

    // ============ اطلاعات شرکت ============
    if (body.name !== undefined) workspace.name = body.name;
    if (body.code !== undefined) workspace.code = body.code;
    if (body.slug !== undefined) workspace.slug = body.slug;
    if (body.status !== undefined) workspace.status = body.status;
    if (body.phone !== undefined) workspace.phone = body.phone;
    if (body.email !== undefined) workspace.email = body.email;
    if (body.logo !== undefined) workspace.logo = body.logo;

    // ============ اطلاعات پشتیبانی ============
    if (body.supportPhone !== undefined)
      workspace.supportPhone = body.supportPhone;
    if (body.supportEmail !== undefined)
      workspace.supportEmail = body.supportEmail;
    if (body.alertPhone !== undefined) workspace.alertPhone = body.alertPhone;
    if (body.introText !== undefined) workspace.introText = body.introText;

    // ============ ساعات کاری ============
    if (body.workingDays !== undefined) {
      workspace.workingDays = {
        ...workspace.workingDays,
        ...body.workingDays,
      };
    }
    if (body.workStartTime !== undefined)
      workspace.workStartTime = body.workStartTime;
    if (body.workEndTime !== undefined)
      workspace.workEndTime = body.workEndTime;
    if (body.outOfHoursMessage !== undefined)
      workspace.outOfHoursMessage = body.outOfHoursMessage;

    // ============ اعلان‌ها ============
    if (body.sendLinkSms !== undefined)
      workspace.sendLinkSms = body.sendLinkSms;
    if (body.sendOtpForPasswordChange !== undefined)
      workspace.sendOtpForPasswordChange = body.sendOtpForPasswordChange;
    if (body.notifyManagerForUnanswered !== undefined)
      workspace.notifyManagerForUnanswered = body.notifyManagerForUnanswered;
    if (body.notifyNewConversations !== undefined)
      workspace.notifyNewConversations = body.notifyNewConversations;

    // ============ امنیت ============
    if (body.requireStrongPassword !== undefined)
      workspace.requireStrongPassword = body.requireStrongPassword;
    if (body.requirePhoneVerificationForPasswordChange !== undefined)
      workspace.requirePhoneVerificationForPasswordChange =
        body.requirePhoneVerificationForPasswordChange;
    if (body.autoLogoutMinutes !== undefined)
      workspace.autoLogoutMinutes = body.autoLogoutMinutes;

    // ============ فیلدهای حذف شده ============
    // address, city, postalCode - حذف شدند

    if (body.timezone !== undefined) workspace.timezone = body.timezone;
    if (body.locale !== undefined) workspace.locale = body.locale;
    if (body.managerStaffId !== undefined)
      workspace.managerStaffId = body.managerStaffId;

    const saved = await this.workspaceRepository.save(workspace);
    return this.findOne(saved.id);
  }

  async delete(id: number, userId: number, userRole: UserRole) {
    const workspace = await this.findOne(id);

    // فقط ادمین یا مدیر workspace می‌تواند حذف کند
    if (userRole !== UserRole.ADMIN && workspace.managerStaffId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this workspace',
      );
    }

    workspace.deletedAt = new Date();
    await this.workspaceRepository.save(workspace);

    await this.workspaceRepository.softDelete(id);

    return { message: 'Workspace deleted successfully' };
  }
}
