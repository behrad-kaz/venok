import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/services/user.service';
import { LoginDto } from '../user/dtos/user.dto';
import { UserEntity } from '../user/entities/user.entity';
import { StaffEntity } from '../staff/entities/staff.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(StaffEntity)
    private staffRepository: Repository<StaffEntity>,
  ) {}

  async validateUser(mobile: string, password: string): Promise<UserEntity> {
    const user = await this.userService.findByMobile(mobile);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.mobile, loginDto.password);
    await this.userService.updateLastLogin(user.id);

    let staffId: number | null = null;
    let staffRole: string | null = null;
    let staffName: string | null = null;

    // ✅ برای همه کاربران (حتی admin) تلاش کن staff را پیدا کن
    try {
      const staff = await this.staffRepository.findOne({
        where: { userId: user.id },
        select: {
          id: true,
          role: true,
          name: true,
          departmentId: true,
        },
      });

      if (staff) {
        staffId = staff.id;
        staffRole = staff.role;
        staffName = staff.name;
        console.log(`✅ Staff found for user ${user.id}:`, {
          staffId,
          staffRole,
          staffName,
        });
      } else {
        console.log(`ℹ️ No staff record found for user ${user.id}`);
      }
    } catch (error) {
      console.error('❌ Error fetching staff:', error);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
      staffId: staffId, // ✅ اضافه شد
      staffRole: staffRole, // ✅ اضافه شد
    };

    const response = {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        organizationId: user.organizationId,
        staffId: staffId,
        staffRole: staffRole,
        staffName: staffName,
      },
    };

    console.log('📤 Login response:', JSON.stringify(response, null, 2));
    return response;
  }
  async register(userData: any) {
    const user = await this.userService.create(userData);

    const payload = {
      sub: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
