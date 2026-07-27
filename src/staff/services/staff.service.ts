import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { StaffEntity, StaffStatus, StaffRole } from '../entities/staff.entity';
import { CreateStaffDto, UpdateStaffDto } from '../dtos/staff.dto';
import { StaffQueryDto } from '../dtos/staff-query.dto';
import { OrganizationEntity } from '../../organization/entities/organization.entity';
import { UserEntity, UserRole } from '../../user/entities/user.entity';
import { SupportTeamEntity } from '../../support/entities/support-team.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffEntity)
    private staffRepository: Repository<StaffEntity>,
    @InjectRepository(OrganizationEntity)
    private organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SupportTeamEntity)
    private teamRepository: Repository<SupportTeamEntity>,
  ) {}

  async findAll(queryParams: StaffQueryDto, organizationId?: number) {
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
    if (queryParams.status) {
      where.status = queryParams.status;
    }

    const order: any = {};
    if (queryParams.sort) {
      order[queryParams.sort] = queryParams.order || 'DESC';
    } else {
      order.createdAt = queryParams.order || 'DESC';
    }

    const [data, total] = await this.staffRepository.findAndCount({
      where,
      relations: {
        organization: true,
        user: true,
        department: true,
      },
      select: {
        id: true,
        organizationId: true,
        userId: true,
        name: true,
        code: true,
        status: true,
        role: true,
        departmentId: true,
        phone: true,
        email: true,
        isActive: true,
        lastOnlineAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mobile: true,
          avatar: true,
        },
        department: {
          id: true,
          name: true,
          color: true,
        },
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
    const staff = await this.staffRepository.findOne({
      where: { id },
      relations: {
        organization: true,
        user: true,
        department: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff;
  }

  async findByCode(code: string) {
    const staff = await this.staffRepository.findOne({
      where: { code },
      relations: {
        organization: true,
        user: true,
        department: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff;
  }

  async findByUser(userId: number) {
    return await this.staffRepository.findOne({
      where: { userId },
      relations: {
        organization: true,
        user: true,
        department: true,
      },
    });
  }

  async findByOrganization(organizationId: number) {
    return await this.staffRepository.find({
      where: { organizationId },
      relations: {
        organization: true,
        user: true,
        department: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getCurrentStaff(userId: number) {
    const staff = await this.findByUser(userId);
    if (!staff) {
      throw new NotFoundException('No staff record found for this user');
    }
    return staff;
  }

  async create(body: CreateStaffDto, userId: number, organizationId: number) {
    console.log('📥 دریافت درخواست ایجاد Staff:', {
      body,
      userId,
      organizationId,
    });

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const existingStaff = await this.staffRepository.findOne({
      where: { code: body.code },
    });

    if (existingStaff) {
      throw new BadRequestException(`Code "${body.code}" already exists`);
    }

    // ✅ بررسی و اعتبارسنجی departmentId
    let department: SupportTeamEntity | null = null;
    if (body.departmentId) {
      department = await this.teamRepository.findOne({
        where: { id: body.departmentId },
      });
      if (!department) {
        throw new NotFoundException(
          `Department with ID ${body.departmentId} not found`,
        );
      }
      console.log('✅ دپارتمان پیدا شد:', department);
    }

    // ✅ ایجاد کاربر
    const nameParts = body.name.trim().split(' ');
    const firstName = nameParts[0] || body.name;
    const lastName = nameParts.slice(1).join(' ') || '';

    const user = this.userRepository.create({
      firstName,
      lastName,
      email: body.email || `${body.code}@example.com`,
      mobile: body.phone || '09123456789',
      password: '12345678',
      role: UserRole.USER,
      isActive: true,
      organizationId: organizationId,
    });

    const savedUser = await this.userRepository.save(user);
    console.log('✅ کاربر ایجاد شد:', savedUser.id);

    const targetUserId = savedUser.id;

    // ✅ ایجاد Staff
    const staff = this.staffRepository.create({
      name: body.name,
      code: body.code,
      phone: body.phone || null,
      email: body.email || null,
      organizationId,
      userId: targetUserId,
      status: StaffStatus.ACTIVE,
      role: body.role || StaffRole.STAFF,
      departmentId: body.departmentId || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdBy: userId,
    });

    console.log('📤 ذخیره Staff:', staff);

    const saved = await this.staffRepository.save(staff);
    console.log('✅ Staff ذخیره شد:', saved.id);

    return this.findOne(saved.id);
  }

  async update(
    id: number,
    body: UpdateStaffDto,
    userId: number,
    userRole: UserRole,
  ) {
    const staff = await this.findOne(id);

    if (userRole !== UserRole.ADMIN && staff.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this staff record',
      );
    }

    if (body.code && body.code !== staff.code) {
      const existingStaff = await this.staffRepository.findOne({
        where: { code: body.code },
      });
      if (existingStaff) {
        throw new BadRequestException(`Code "${body.code}" already exists`);
      }
    }

    if (body.departmentId !== undefined && body.departmentId !== null) {
      const department = await this.teamRepository.findOne({
        where: { id: body.departmentId },
      });
      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    if (body.name !== undefined) staff.name = body.name;
    if (body.code !== undefined) staff.code = body.code;
    if (body.status !== undefined) staff.status = body.status;
    if (body.role !== undefined) staff.role = body.role;
    if (body.departmentId !== undefined) staff.departmentId = body.departmentId;
    if (body.phone !== undefined) staff.phone = body.phone;
    if (body.email !== undefined) staff.email = body.email;
    if (body.isActive !== undefined) staff.isActive = body.isActive;
    if (body.lastOnlineAt !== undefined) staff.lastOnlineAt = body.lastOnlineAt;
    staff.updatedBy = userId;

    const saved = await this.staffRepository.save(staff);
    return this.findOne(saved.id);
  }

  async delete(id: number, userId: number, userRole: UserRole) {
    const staff = await this.findOne(id);

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete staff records');
    }

    staff.deletedBy = userId;
    staff.deletedAt = new Date();
    await this.staffRepository.save(staff);

    await this.staffRepository.softDelete(id);

    return { message: 'Staff deleted successfully' };
  }

  async findByDepartment(departmentId: number) {
    return await this.staffRepository.find({
      where: { departmentId },
      relations: {
        organization: true,
        user: true,
        department: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async changeDepartment(
    staffId: number,
    departmentId: number,
    userId: number,
    userRole: UserRole,
  ) {
    const staff = await this.findOne(staffId);

    if (userRole !== UserRole.ADMIN && staff.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to change department for this staff',
      );
    }

    const department = await this.teamRepository.findOne({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    staff.departmentId = departmentId;
    staff.updatedBy = userId;

    const saved = await this.staffRepository.save(staff);
    return this.findOne(saved.id);
  }
}
