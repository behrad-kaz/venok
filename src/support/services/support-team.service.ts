import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTeamEntity } from '../entities/support-team.entity';
import {
  CreateSupportTeamDto,
  UpdateSupportTeamDto,
} from '../dtos/support-team.dto';
import { WorkspaceEntity } from '../../workspace/entities/workspace.entity';
import { UserRole } from '../../user/entities/user.entity';
import { StaffEntity } from '../../staff/entities/staff.entity';

@Injectable()
export class SupportTeamService {
  constructor(
    @InjectRepository(SupportTeamEntity)
    private teamRepository: Repository<SupportTeamEntity>,
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(StaffEntity)
    private staffRepository: Repository<StaffEntity>,
  ) {}

  async findAll(workspaceId?: number, status?: 'active' | 'inactive') {
    const where: any = {};

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const teams = await this.teamRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
    });

    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const staffs = await this.staffRepository.find({
          where: { departmentId: team.id },
          relations: {
            user: true,
          },
        });

        const memberCount = staffs.length;
        const manager = staffs.find((s) => s.role === 'department_manager');
        const managerName = manager?.name || null;

        return {
          ...team,
          memberCount,
          managerName,
          openConversations: 0,
        };
      }),
    );

    return teamsWithStats;
  }

  async findOne(id: number) {
    const team = await this.teamRepository.findOne({
      where: { id },
      relations: {
        workspace: true,
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const staffs = await this.staffRepository.find({
      where: { departmentId: id },
      relations: {
        user: true,
      },
    });

    const memberCount = staffs.length;
    const manager = staffs.find((s) => s.role === 'department_manager');
    const managerName = manager?.name || null;

    return {
      ...team,
      memberCount,
      managerName,
      openConversations: 0,
    };
  }

  async create(
    body: CreateSupportTeamDto,
    userId: number,
    workspaceId: number,
  ) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const team = this.teamRepository.create({
      ...body,
      workspaceId,
      createdBy: userId,
      color: body.color || '#59D8C3',
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    const saved = await this.teamRepository.save(team);
    return this.findOne(saved.id);
  }

  async update(
    id: number,
    body: UpdateSupportTeamDto,
    userId: number,
    userRole: UserRole,
  ) {
    const team = await this.findOne(id);

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to update this team');
    }

    if (body.name !== undefined) team.name = body.name;
    if (body.description !== undefined) team.description = body.description;
    if (body.color !== undefined) team.color = body.color;
    if (body.isActive !== undefined) team.isActive = body.isActive;
    team.updatedBy = userId;

    const saved = await this.teamRepository.save(team);
    return this.findOne(saved.id);
  }

  async delete(id: number, userId: number, userRole: UserRole) {
    const team = await this.findOne(id);

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete teams');
    }

    const staffs = await this.staffRepository.find({
      where: { departmentId: id },
    });

    for (const staff of staffs) {
      staff.departmentId = null;
      staff.updatedBy = userId;
      await this.staffRepository.save(staff);
    }

    team.deletedBy = userId;
    team.deletedAt = new Date();
    await this.teamRepository.save(team);

    await this.teamRepository.softDelete(id);

    return { message: 'Team deleted successfully' };
  }
}