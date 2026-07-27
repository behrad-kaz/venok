import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ConversationEntity, ConversationStatus } from '../entities/conversation.entity';
import { CreateConversationDto, UpdateConversationDto } from '../dtos/conversation.dto';
import { ConversationQueryDto } from '../dtos/conversation-query.dto';
import { WorkspaceEntity } from '../../workspace/entities/workspace.entity';
import { SupportTeamEntity } from '../../support/entities/support-team.entity';
import { StaffEntity } from '../../staff/entities/staff.entity';
import { UserRole } from '../../user/entities/user.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(SupportTeamEntity)
    private teamRepository: Repository<SupportTeamEntity>,
    @InjectRepository(StaffEntity)
    private staffRepository: Repository<StaffEntity>,
  ) {}

  async findAll(queryParams: ConversationQueryDto, workspaceId: number, userId: number, userRole: UserRole) {
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId,
    };

    if (queryParams.customerName) {
      where.customerName = Like(`%${queryParams.customerName}%`);
    }
    if (queryParams.customerPhone) {
      where.customerPhone = Like(`%${queryParams.customerPhone}%`);
    }
    if (queryParams.subject) {
      where.subject = Like(`%${queryParams.subject}%`);
    }
    if (queryParams.status) {
      where.status = queryParams.status;
    }
    if (queryParams.priority) {
      where.priority = queryParams.priority;
    }
    if (queryParams.teamId) {
      where.teamId = queryParams.teamId;
    }
    if (queryParams.agentId) {
      where.agentId = queryParams.agentId;
    }

    if (userRole === UserRole.USER) {
      where.agentId = userId;
    }

    const order: any = {};
    if (queryParams.sort) {
      order[queryParams.sort] = queryParams.order || 'DESC';
    } else {
      order.createdAt = queryParams.order || 'DESC';
    }

    const [data, total] = await this.conversationRepository.findAndCount({
      where,
      relations: {
        team: true,
        agent: true,
        messages: true,
      },
      order,
      skip,
      take: limit,
    });

    const dataWithCounts = data.map((conversation) => {
      const messages = conversation.messages || [];
      const unreadCount = messages.filter((m) => !m.isRead && m.senderType !== 'agent').length;

      return {
        ...conversation,
        messagesCount: messages.length,
        unreadCount,
      };
    });

    return {
      data: dataWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, userId: number, userRole: UserRole) {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: {
        team: true,
        agent: true,
        messages: {
          sender: true,
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (userRole === UserRole.USER && conversation.agentId !== userId) {
      throw new ForbiddenException('You can only view your own conversations');
    }

    const messages = conversation.messages || [];
    const unreadCount = messages.filter((m) => !m.isRead && m.senderType !== 'agent').length;

    return {
      ...conversation,
      messagesCount: messages.length,
      unreadCount,
    };
  }

  async create(body: CreateConversationDto, userId: number, workspaceId: number) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (body.teamId) {
      // ✅ teamId از نوع number است
      const team = await this.teamRepository.findOne({
        where: { id: body.teamId },
      });
      if (!team) {
        throw new NotFoundException('Team not found');
      }
    }

    const conversation = this.conversationRepository.create({
      ...body,
      workspaceId,
      createdBy: userId,
      status: ConversationStatus.OPEN,
      startDate: new Date(),
      lastActivity: new Date(),
    });

    const saved = await this.conversationRepository.save(conversation);
    return this.findOne(saved.id, userId, UserRole.ADMIN);
  }

  async update(id: number, body: UpdateConversationDto, userId: number, userRole: UserRole) {
    const conversation = await this.findOne(id, userId, userRole);

    if (userRole !== UserRole.ADMIN && conversation.agentId !== userId) {
      throw new ForbiddenException('You are not allowed to update this conversation');
    }

    if (body.teamId) {
      // ✅ teamId از نوع number است
      const team = await this.teamRepository.findOne({
        where: { id: body.teamId },
      });
      if (!team) {
        throw new NotFoundException('Team not found');
      }
    }

    if (body.agentId) {
      const agent = await this.staffRepository.findOne({
        where: { id: body.agentId },
      });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }
    }

    if (body.status !== undefined) conversation.status = body.status;
    if (body.priority !== undefined) conversation.priority = body.priority;
    if (body.teamId !== undefined) conversation.teamId = body.teamId;
    if (body.agentId !== undefined) conversation.agentId = body.agentId;
    if (body.subject !== undefined) conversation.subject = body.subject;
    conversation.updatedBy = userId;
    conversation.lastActivity = new Date();

    if (body.status === ConversationStatus.CLOSED) {
      conversation.closedAt = new Date();
      conversation.closedBy = userId;
    }

    const saved = await this.conversationRepository.save(conversation);
    return this.findOne(saved.id, userId, userRole);
  }

  async delete(id: number, userId: number, userRole: UserRole) {
    const conversation = await this.findOne(id, userId, userRole);

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete conversations');
    }

    conversation.deletedAt = new Date();
    await this.conversationRepository.save(conversation);

    await this.conversationRepository.softDelete(id);

    return { message: 'Conversation deleted successfully' };
  }
}