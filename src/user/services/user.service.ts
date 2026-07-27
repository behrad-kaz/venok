import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { UserEntity, UserRole } from '../entities/user.entity';
import {
  UserDto,
  LoginDto,
  UpdateUserDto,
  ChangePasswordDto,
} from '../dtos/user.dto';
import { UserQueryDto, UserSort } from '../dtos/user-query.dto';
import { deleteImage, extractFileInfo } from '../../shared/utils/file-utils';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async findUserById(id: number) {
    return await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        role: true,
        isActive: true,
        avatar: true,
        lastLogin: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(
    queryParams: UserQueryDto,
    currentUserId: number,
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to view all users',
      );
    }

    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (queryParams.firstName) {
      where.firstName = Like(`%${queryParams.firstName}%`);
    }
    if (queryParams.lastName) {
      where.lastName = Like(`%${queryParams.lastName}%`);
    }
    if (queryParams.email) {
      where.email = Like(`%${queryParams.email}%`);
    }
    if (queryParams.mobile) {
      where.mobile = Like(`%${queryParams.mobile}%`);
    }
    if (queryParams.role) {
      where.role = queryParams.role;
    }
    if (queryParams.isActive !== undefined) {
      where.isActive = queryParams.isActive;
    }

    const order: any = {};
    if (queryParams.sort) {
      order[queryParams.sort] = queryParams.order || 'DESC';
    } else {
      order.createdAt = queryParams.order || 'DESC';
    }

    const [data, total] = await this.userRepository.findAndCount({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        role: true,
        isActive: true,
        avatar: true,
        lastLogin: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
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

  async findOne(id: number, currentUserId: number, currentUserRole: UserRole) {
    if (currentUserRole !== UserRole.ADMIN && currentUserId !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }

    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        role: true,
        isActive: true,
        avatar: true,
        lastLogin: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async findByMobile(mobile: string) {
    return await this.userRepository.findOne({
      where: { mobile },
    });
  }

  async create(body: UserDto) {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: body.email }, { mobile: body.mobile }],
    });

    if (existingUser) {
      if (existingUser.email === body.email) {
        throw new BadRequestException('Email already exists');
      }
      if (existingUser.mobile === body.mobile) {
        throw new BadRequestException('Mobile number already exists');
      }
    }

    const user = this.userRepository.create({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      mobile: body.mobile,
      password: body.password,
      role: body.role || UserRole.USER,
      avatar: body.avatar || null,
      isActive: true,
      organizationId: body.organizationId || null,
    });

    const saved = await this.userRepository.save(user);

    const { password, ...result } = saved;
    return result;
  }

  async update(
    id: number,
    body: UpdateUserDto,
    currentUserId: number,
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.ADMIN && currentUserId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (body.avatar === null) {
      if (user.avatar) {
        console.log(`🗑️ Deleting avatar: ${user.avatar}`);
        const { fileName, folder } = extractFileInfo(user.avatar);
        await deleteImage(fileName, folder);
        user.avatar = null;
      }
    } else if (body.avatar && body.avatar !== user.avatar) {
      if (user.avatar) {
        console.log(`🗑️ Deleting old avatar: ${user.avatar}`);
        const { fileName, folder } = extractFileInfo(user.avatar);
        await deleteImage(fileName, folder);
      }
      user.avatar = body.avatar;
    }

    if (body.mobile && body.mobile !== user.mobile) {
      const existingUser = await this.userRepository.findOne({
        where: { mobile: body.mobile },
      });
      if (existingUser) {
        throw new BadRequestException('Mobile number already exists');
      }
    }

    if (body.firstName !== undefined) user.firstName = body.firstName;
    if (body.lastName !== undefined) user.lastName = body.lastName;
    if (body.mobile !== undefined) user.mobile = body.mobile;
    if (body.isActive !== undefined) user.isActive = body.isActive;

    const updated = await this.userRepository.save(user);

    const { password, ...result } = updated;
    return result;
  }

  async delete(id: number, currentUserId: number, currentUserRole: UserRole) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete users');
    }

    const user = await this.findOne(id, currentUserId, currentUserRole);

    if (user.avatar) {
      console.log(`🗑️ Deleting avatar: ${user.avatar}`);
      const { fileName, folder } = extractFileInfo(user.avatar);
      await deleteImage(fileName, folder);
    }

    await this.userRepository.delete(id);
    return { message: 'User deleted successfully' };
  }

  async login(body: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { mobile: body.mobile },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isValid = await user.comparePassword(body.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLogin = new Date();
    await this.userRepository.save(user);

    const { password, ...result } = user;
    return {
      message: 'Login successful',
      user: result,
    };
  }

  async changePassword(
    id: number,
    body: ChangePasswordDto,
    currentUserId: number,
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.ADMIN && currentUserId !== id) {
      throw new ForbiddenException('You can only change your own password');
    }

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await user.comparePassword(body.currentPassword);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = body.newPassword;
    const updated = await this.userRepository.save(user);

    const { password, ...result } = updated;
    return {
      message: 'Password changed successfully',
      user: result,
    };
  }

  async toggleStatus(
    id: number,
    currentUserId: number,
    currentUserRole: UserRole,
  ) {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can toggle user status');
    }

    const user = await this.findOne(id, currentUserId, currentUserRole);
    user.isActive = !user.isActive;
    const updated = await this.userRepository.save(user);

    const { password, ...result } = updated;
    return {
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: result,
    };
  }

  async updateLastLogin(id: number) {
    await this.userRepository.update(id, { lastLogin: new Date() });
  }
}