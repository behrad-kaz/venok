import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConversationEntity, ConversationStatus } from '../entities/conversation.entity';
import { CreateConversationDto, UpdateConversationDto } from '../dtos/conversation.dto';
import { ConversationQueryDto } from '../dtos/conversation-query.dto';
import { WorkspaceEntity } from '../../workspace/entities/workspace.entity';
import { SupportTeamEntity } from '../../support/entities/support-team.entity';
import { StaffEntity } from '../../staff/entities/staff.entity';
import { UserRole } from '../../user/entities/user.entity';
import { CustomerService } from '../../customer/services/customer.service';

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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly customerService: CustomerService,
  ) {}

  private static cleanConversation(conversation: ConversationEntity) {
    const { messages, customer, agent, team, ...rest } = conversation as any;

    const cleanMessages = (messages || []).map((m: any) => {
      const { conversation: _c, sender, ...msgRest } = m;
      let cleanSender;
      if (sender) {
        const { user, ...senderRest } = sender as any;
        let cleanUser;
        if (user) {
          const { password: _p, ...userRest } = user as any;
          cleanUser = userRest;
        }
        cleanSender = { ...senderRest, user: cleanUser };
      }
      return { ...msgRest, sender: cleanSender };
    });

    const cleanCustomer = customer
      ? (() => {
          const { conversations: _c, ...c } = customer as any;
          return c;
        })()
      : null;

    const cleanAgent = agent
      ? (() => {
          const { user, ...a } = agent as any;
          let cleanUser;
          if (user) {
            const { password: _p, ...u } = user as any;
            cleanUser = u;
          }
          return { ...a, user: cleanUser };
        })()
      : null;

    return {
      ...rest,
      customer: cleanCustomer,
      agent: cleanAgent,
      team: team ? { ...team } : null,
      messages: cleanMessages,
    };
  }

  // ✅ متد ایجاد گفتگوی عمومی (ویجت)
  async createPublic(body: CreateConversationDto, workspaceId: number) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // ✅ پیدا کردن یا ایجاد مشتری
    const customer = await this.customerService.findOrCreate(
      body.customerPhone,
      body.customerName,
    );

    // ✅ بررسی آخرین گفتگوی باز مشتری
    const lastConversation = await this.conversationRepository.findOne({
      where: {
        customerId: customer.id,
        status: In([ConversationStatus.OPEN, ConversationStatus.WAITING, ConversationStatus.ANSWERED]),
        deletedAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // ✅ اگر گفتگوی باز وجود دارد، همان را برگردان
    if (lastConversation) {
      console.log(`✅ مشتری ${customer.phone} گفتگوی باز دارد: ${lastConversation.id}`);

      lastConversation.lastActivity = new Date();
      await this.conversationRepository.save(lastConversation);

      let customerToken: string | null = null;
      try {
        customerToken = this.jwtService.sign(
          {
            conversationId: lastConversation.id,
            customerId: customer.id,
            customerPhone: customer.phone,
            type: 'customer',
          },
          {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '7d',
          }
        );
        console.log(`✅ customerToken برای گفتگوی موجود ${lastConversation.id} تولید شد`);
      } catch (error) {
        console.error('❌ خطا در تولید customerToken:', error);
      }

      const result = await this.findOneInternal(lastConversation.id);

      return {
        ...result,
        customerToken,
        isExisting: true,
        customerId: customer.id,
      };
    }

    // ✅ ایجاد گفتگوی جدید
    if (body.teamId) {
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
      customerId: customer.id,
      createdBy: 0,
      status: ConversationStatus.OPEN,
      startDate: new Date(),
      lastActivity: new Date(),
    });

    const saved = await this.conversationRepository.save(conversation);

    // ✅ به‌روزرسانی آخرین گفتگوی مشتری
    await this.customerService.updateLastConversation(customer.id, saved.id);

    // ✅ تولید customerToken برای مشتری
    let customerToken: string | null = null;
    try {
      customerToken = this.jwtService.sign(
        {
          conversationId: saved.id,
          customerId: customer.id,
          customerPhone: saved.customerPhone,
          type: 'customer',
        },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: '7d',
        }
      );
      console.log(`✅ customerToken برای گفتگو ${saved.id} تولید شد`);
    } catch (error) {
      console.error('❌ خطا در تولید customerToken:', error);
    }

    const result = await this.findOneInternal(saved.id);

    return {
      ...result,
      customerToken,
      isExisting: false,
      customerId: customer.id,
    };
  }

  // ✅ متد دریافت لیست گفتگوها با اطلاعات مشتری
  async findAll(queryParams: ConversationQueryDto, workspaceId: number, userId: number, userRole: UserRole) {
    console.log(`🔍 findAll - userId: ${userId}, userRole: ${userRole}`);

    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const skip = (page - 1) * limit;

    const order: any = {};
    if (queryParams.sort) {
      order[queryParams.sort] = queryParams.order || 'DESC';
    } else {
      order.createdAt = queryParams.order || 'DESC';
    }

    let data: ConversationEntity[] = [];
    let total = 0;

    // ✅ استفاده از QueryBuilder با اضافه کردن customer
    const queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.team', 'team')
      .leftJoinAndSelect('conversation.agent', 'agent')
      .leftJoinAndSelect('agent.user', 'user')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .leftJoinAndSelect('conversation.customer', 'customer') // ✅ اضافه شد
      .where('conversation.workspaceId = :workspaceId', { workspaceId })
      .andWhere('conversation.deletedAt IS NULL');

    // ✅ فیلترهای اضافی
    if (queryParams.customerName) {
      queryBuilder.andWhere('conversation.customerName LIKE :customerName', {
        customerName: `%${queryParams.customerName}%`
      });
    }
    if (queryParams.customerPhone) {
      queryBuilder.andWhere('conversation.customerPhone LIKE :customerPhone', {
        customerPhone: `%${queryParams.customerPhone}%`
      });
    }
    if (queryParams.subject) {
      queryBuilder.andWhere('conversation.subject LIKE :subject', {
        subject: `%${queryParams.subject}%`
      });
    }
    if (queryParams.status) {
      queryBuilder.andWhere('conversation.status = :status', {
        status: queryParams.status
      });
    }
    if (queryParams.priority) {
      queryBuilder.andWhere('conversation.priority = :priority', {
        priority: queryParams.priority
      });
    }
    if (queryParams.teamId) {
      queryBuilder.andWhere('conversation.teamId = :teamId', {
        teamId: queryParams.teamId
      });
    }
    if (queryParams.agentId) {
      queryBuilder.andWhere('conversation.agentId = :agentId', {
        agentId: queryParams.agentId
      });
    }

    // ============================================================
    // ✅ منطق فیلتر بر اساس نقش
    // ============================================================
    if (userRole === UserRole.USER) {
      const staff = await this.staffRepository.findOne({
        where: { userId: userId },
        relations: {
          department: true,
        },
      });

      if (staff && staff.role === 'department_manager') {
        const departmentId = staff.departmentId;

        console.log(`👔 کاربر با staffId ${staff.id} مدیر دپارتمان است (userRole=USER اما staffRole=department_manager)`);

        if (departmentId) {
          const staffsInDepartment = await this.staffRepository.find({
            where: {
              departmentId: departmentId,
            },
            select: {
              id: true,
            },
          });

          const staffIds = staffsInDepartment.map(s => s.id);

          if (staffIds.length > 0) {
            queryBuilder.andWhere(
              '(conversation.teamId = :departmentId OR conversation.agentId IN (:...staffIds))',
              { departmentId, staffIds }
            );
          } else {
            queryBuilder.andWhere('conversation.teamId = :departmentId', { departmentId });
          }

          console.log(`👔 مدیر دپارتمان ${departmentId}: ${staffIds.length} کارمند در دپارتمان`);
        } else {
          queryBuilder.andWhere('conversation.agentId = :staffId', { staffId: staff.id });
        }
      } else if (staff) {
        queryBuilder.andWhere('conversation.agentId = :staffId', { staffId: staff.id });
        console.log(`👤 کارمند با staffId ${staff.id}: فقط گفتگوهای خودش`);
      } else {
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
    } else if (userRole === UserRole.MODERATOR) {
      const staff = await this.staffRepository.findOne({
        where: { userId: userId },
        relations: {
          department: true,
        },
      });

      if (staff && staff.departmentId) {
        const departmentId = staff.departmentId;
        const managerStaffId = staff.id;

        const staffsInDepartment = await this.staffRepository.find({
          where: {
            departmentId: departmentId,
          },
          select: {
            id: true,
          },
        });

        const staffIds = staffsInDepartment.map(s => s.id);

        console.log(`👔 مدیر دپارتمان ${departmentId} (MODERATOR - staffId: ${managerStaffId}): ${staffIds.length} کارمند در دپارتمان`, staffIds);

        if (staffIds.length > 0) {
          queryBuilder.andWhere(
            '(conversation.teamId = :departmentId OR conversation.agentId IN (:...staffIds))',
            { departmentId, staffIds }
          );
        } else {
          queryBuilder.andWhere('conversation.teamId = :departmentId', { departmentId });
        }
      } else {
        if (staff) {
          queryBuilder.andWhere('conversation.agentId = :staffId', { staffId: staff.id });
        } else {
          return {
            data: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
          };
        }
      }
    }
    // مدیر کل (ADMIN): همه گفتگوها - بدون فیلتر اضافی

    // مرتب‌سازی
    const sortField = queryParams.sort || 'createdAt';
    const sortOrder = queryParams.order || 'DESC';
    queryBuilder.orderBy(`conversation.${sortField}`, sortOrder as any);

    // صفحه‌بندی
    queryBuilder.skip(skip).take(limit);

    console.log('📝 SQL Query:', queryBuilder.getSql());
    console.log('📝 Parameters:', queryBuilder.getParameters());

    [data, total] = await queryBuilder.getManyAndCount();

    console.log(`📊 یافت شد: ${data.length} گفتگو از مجموع ${total} برای workspaceId: ${workspaceId}`);

    const dataWithCounts = data.map((conversation) => {
      const messages = conversation.messages || [];
      const unreadCount = messages.filter((m) => !m.isRead && m.senderType !== 'agent').length;

      return {
        ...ConversationService.cleanConversation(conversation),
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

  // ✅ متد داخلی برای یافتن گفتگو بدون محدودیت نقش
  async findOneInternal(id: number) {
    const conversation = await this.conversationRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: {
        team: true,
        agent: {
          user: true,
        },
        messages: {
          sender: true,
        },
        customer: true, // ✅ اضافه شد
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const messages = conversation.messages || [];
    const unreadCount = messages.filter((m) => !m.isRead && m.senderType !== 'agent').length;

    return {
      ...ConversationService.cleanConversation(conversation),
      messagesCount: messages.length,
      unreadCount,
    };
  }

  // ✅ متد یافتن یک گفتگو با دسترسی مناسب
  async findOne(id: number, userId: number, userRole: UserRole) {
    const conversation = await this.conversationRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: {
        team: true,
        agent: {
          user: true,
        },
        messages: {
          sender: true,
        },
        customer: true, // ✅ اضافه شد
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // ✅ بررسی دسترسی برای مشاهده گفتگو
    let hasAccess = false;

    if (userRole === UserRole.ADMIN) {
      hasAccess = true;
    } else if (userRole === UserRole.MODERATOR) {
      const staff = await this.staffRepository.findOne({
        where: { userId: userId },
        relations: {
          department: true,
        },
      });

      if (staff && staff.departmentId) {
        if (conversation.teamId === staff.departmentId) {
          hasAccess = true;
        } else {
          const staffsInDepartment = await this.staffRepository.find({
            where: {
              departmentId: staff.departmentId,
            },
            select: {
              id: true,
            },
          });
          const staffIds = staffsInDepartment.map(s => s.id);
          if (conversation.agentId && staffIds.includes(conversation.agentId)) {
            hasAccess = true;
          }
        }
      }
    } else if (userRole === UserRole.USER) {
      const staff = await this.staffRepository.findOne({
        where: { userId: userId },
        relations: {
          department: true,
        },
      });

      if (staff && staff.role === 'department_manager') {
        if (staff.departmentId) {
          if (conversation.teamId === staff.departmentId) {
            hasAccess = true;
          } else {
            const staffsInDepartment = await this.staffRepository.find({
              where: {
                departmentId: staff.departmentId,
              },
              select: {
                id: true,
              },
            });
            const staffIds = staffsInDepartment.map(s => s.id);
            if (conversation.agentId && staffIds.includes(conversation.agentId)) {
              hasAccess = true;
            }
          }
        }
      } else if (staff && conversation.agentId === staff.id) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    const messages = conversation.messages || [];
    const unreadCount = messages.filter((m) => !m.isRead && m.senderType !== 'agent').length;

    return {
      ...ConversationService.cleanConversation(conversation),
      messagesCount: messages.length,
      unreadCount,
    };
  }

  // ✅ متد ایجاد گفتگو (داخلی)
  async create(body: CreateConversationDto, userId: number, workspaceId: number) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // ✅ پیدا کردن یا ایجاد مشتری
    const customer = await this.customerService.findOrCreate(
      body.customerPhone,
      body.customerName,
    );

    // ✅ بررسی آخرین گفتگوی باز مشتری
    const lastConversation = await this.conversationRepository.findOne({
      where: {
        customerId: customer.id,
        status: In([ConversationStatus.OPEN, ConversationStatus.WAITING, ConversationStatus.ANSWERED]),
        deletedAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // ✅ اگر گفتگوی باز وجود دارد، همان را برگردان
    if (lastConversation) {
      console.log(`✅ مشتری ${customer.phone} گفتگوی باز دارد: ${lastConversation.id}`);

      lastConversation.lastActivity = new Date();
      await this.conversationRepository.save(lastConversation);

      let customerToken: string | null = null;
      try {
        customerToken = this.jwtService.sign(
          {
            conversationId: lastConversation.id,
            customerId: customer.id,
            customerPhone: customer.phone,
            type: 'customer',
          },
          {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '7d',
          }
        );
      } catch (error) {
        console.error('❌ خطا در تولید customerToken:', error);
      }

      const result = await this.findOneInternal(lastConversation.id);

      return {
        ...result,
        customerToken,
        isExisting: true,
        customerId: customer.id,
      };
    }

    if (body.teamId) {
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
      customerId: customer.id,
      createdBy: userId,
      status: ConversationStatus.OPEN,
      startDate: new Date(),
      lastActivity: new Date(),
    });

    const saved = await this.conversationRepository.save(conversation);

    // ✅ به‌روزرسانی آخرین گفتگوی مشتری
    await this.customerService.updateLastConversation(customer.id, saved.id);

    let customerToken: string | null = null;
    try {
      customerToken = this.jwtService.sign(
        {
          conversationId: saved.id,
          customerId: customer.id,
          customerPhone: saved.customerPhone,
          type: 'customer',
        },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: '7d',
        }
      );
    } catch (error) {
      console.error('❌ خطا در تولید customerToken:', error);
    }

    const result = await this.findOneInternal(saved.id);

    return {
      ...result,
      customerToken,
      isExisting: false,
      customerId: customer.id,
    };
  }

  // ✅ متد به‌روزرسانی گفتگو
  async update(id: number, body: UpdateConversationDto, userId: number, userRole: UserRole) {
    const conversation = await this.conversationRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: {
        customer: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with id ${id} not found`);
    }

    let hasAccess = false;

    if (userRole === UserRole.ADMIN) {
      hasAccess = true;
    } else if (userRole === UserRole.MODERATOR) {
      const staff = await this.staffRepository.findOne({
        where: { userId: userId },
        relations: {
          department: true,
        },
      });

      if (staff && staff.departmentId) {
        if (conversation.teamId === staff.departmentId) {
          hasAccess = true;
        } else {
          const staffsInDepartment = await this.staffRepository.find({
            where: {
              departmentId: staff.departmentId,
            },
            select: {
              id: true,
            },
          });
          const staffIds = staffsInDepartment.map(s => s.id);
          if (conversation.agentId && staffIds.includes(conversation.agentId)) {
            hasAccess = true;
          }
        }
      }
    } else if (userRole === UserRole.USER) {
      const staff = await this.staffRepository.findOne({
        where: { userId: userId },
        relations: {
          department: true,
        },
      });

      if (staff && staff.role === 'department_manager') {
        if (staff.departmentId) {
          if (conversation.teamId === staff.departmentId) {
            hasAccess = true;
          } else {
            const staffsInDepartment = await this.staffRepository.find({
              where: {
                departmentId: staff.departmentId,
              },
              select: {
                id: true,
              },
            });
            const staffIds = staffsInDepartment.map(s => s.id);
            if (conversation.agentId && staffIds.includes(conversation.agentId)) {
              hasAccess = true;
            }
          }
        }
      } else if (staff && conversation.agentId === staff.id) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      throw new ForbiddenException('You are not allowed to update this conversation');
    }

    if (body.teamId) {
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
    return this.findOneInternal(saved.id);
  }

  // ✅ متد حذف گفتگو
  async delete(id: number, userId: number, userRole: UserRole) {
    const conversation = await this.findOneInternal(id);

    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete conversations');
    }

    conversation.deletedAt = new Date();
    await this.conversationRepository.save(conversation);

    await this.conversationRepository.softDelete(id);

    return { message: 'Conversation deleted successfully' };
  }
}