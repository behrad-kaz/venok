import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import {
  TicketEntity,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from '../entities/ticket.entity';
import { CreateTicketDto, UpdateTicketDto } from '../dtos/ticket.dto';
import { TicketQueryDto, TicketSort } from '../dtos/ticket-query.dto';
import { UserEntity, UserRole } from '../../user/entities/user.entity';
import { TicketMessageService } from './ticket-message.service';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(TicketEntity)
    private ticketRepository: Repository<TicketEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly ticketMessageService: TicketMessageService,
  ) {}

  async findAll(
    queryParams: TicketQueryDto,
    currentUserId: number,
    currentUserRole: UserRole,
  ) {
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (
      currentUserRole !== UserRole.ADMIN &&
      currentUserRole !== UserRole.MODERATOR
    ) {
      where.userId = currentUserId;
    }

    if (queryParams.title) {
      where.title = Like(`%${queryParams.title}%`);
    }
    if (queryParams.status) {
      where.status = queryParams.status;
    }
    if (queryParams.priority) {
      where.priority = queryParams.priority;
    }
    if (queryParams.category) {
      where.category = queryParams.category;
    }
    if (
      queryParams.userId &&
      (currentUserRole === UserRole.ADMIN ||
        currentUserRole === UserRole.MODERATOR)
    ) {
      where.userId = queryParams.userId;
    }
    if (queryParams.assignedTo) {
      where.assignedTo = queryParams.assignedTo;
    }
    if (queryParams.isResolved !== undefined) {
      if (queryParams.isResolved) {
        where.status = TicketStatus.CLOSED;
      } else {
        where.status = In([
          TicketStatus.PENDING,
          TicketStatus.IN_PROGRESS,
          TicketStatus.RESPONDED,
        ]);
      }
    }

    const order: any = {};
    if (queryParams.sort) {
      order[queryParams.sort] = queryParams.order || 'DESC';
    } else {
      order.createdAt = queryParams.order || 'DESC';
    }

    const [data, total] = await this.ticketRepository.findAndCount({
      where,
      relations: {
        user: true,
        messages: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        category: true,
        userId: true,
        assignedTo: true,
        resolvedAt: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
      order,
      skip,
      take: limit,
    });

    const dataWithCounts = await Promise.all(
      data.map(async (ticket) => {
        const unreadCount = await this.ticketMessageService.countUnreadMessages(
          ticket.id,
          currentUserId,
        );
        return {
          ...ticket,
          unreadCount,
          messagesCount: ticket.messages?.length || 0,
        };
      }),
    );

    return {
      data: dataWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, currentUserId: number, currentUserRole: UserRole) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: {
        user: true,
        messages: {
          user: true,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        category: true,
        userId: true,
        assignedTo: true,
        resolvedAt: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
        messages: {
          id: true,
          content: true,
          type: true,
          userId: true,
          isRead: true,
          readAt: true,
          createdAt: true,
          updatedAt: true,
          user: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (
      currentUserRole !== UserRole.ADMIN &&
      currentUserRole !== UserRole.MODERATOR &&
      ticket.userId !== currentUserId
    ) {
      throw new ForbiddenException('You can only view your own tickets');
    }

    return ticket;
  }

  async create(body: CreateTicketDto, userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ticket = this.ticketRepository.create({
      title: body.title,
      description: body.description,
      category: body.category || TicketCategory.GENERAL,
      priority: body.priority || TicketPriority.MEDIUM,
      userId: userId,
      createdBy: userId,
      status: TicketStatus.PENDING,
    });

    const saved = await this.ticketRepository.save(ticket);

    await this.ticketMessageService.createFirstMessage(
      saved.id,
      userId,
      body.description,
    );

    return this.findOne(saved.id, userId, UserRole.USER);
  }

  async update(
    id: number,
    body: UpdateTicketDto,
    userId: number,
    userRole: UserRole,
  ) {
    const ticket = await this.findOne(id, userId, userRole);

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MODERATOR &&
      ticket.userId !== userId
    ) {
      throw new ForbiddenException('You can only update your own tickets');
    }

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR) {
      if (body.status || body.priority || body.category || body.assignedTo) {
        throw new ForbiddenException(
          'You cannot change status, priority, category, or assignee',
        );
      }
    }

    // بررسی اینکه تیکت بسته نشده باشد
    if (ticket.status === TicketStatus.CLOSED) {
      throw new ForbiddenException('Cannot update a closed ticket');
    }

    // اعمال تغییرات
    Object.assign(ticket, body);
    ticket.updatedBy = userId;

    // اگر وضعیت به CLOSED تغییر کرده، زمان حل شدن را ثبت کن
    if (body.status === TicketStatus.CLOSED) {
      ticket.resolvedAt = new Date();
    }

    const saved = await this.ticketRepository.save(ticket);
    return this.findOne(saved.id, userId, userRole);
  }

  async delete(id: number, userId: number, userRole: UserRole) {
    const ticket = await this.findOne(id, userId, userRole);

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MODERATOR &&
      ticket.userId !== userId
    ) {
      throw new ForbiddenException('You can only delete your own tickets');
    }

    ticket.deletedBy = userId;
    ticket.deletedAt = new Date();
    await this.ticketRepository.save(ticket);

    await this.ticketRepository.softDelete(id);

    return { message: 'Ticket deleted successfully' };
  }

  async assignTicket(
    id: number,
    assignedTo: number,
    userId: number,
    userRole: UserRole,
  ) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR) {
      throw new ForbiddenException('Only admins can assign tickets');
    }

    const ticket = await this.findOne(id, userId, userRole);
    const admin = await this.userRepository.findOne({
      where: { id: assignedTo },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.role !== UserRole.ADMIN && admin.role !== UserRole.MODERATOR) {
      throw new ForbiddenException('User is not an admin');
    }

    ticket.assignedTo = assignedTo;
    ticket.status = TicketStatus.IN_PROGRESS;
    ticket.updatedBy = userId;

    const saved = await this.ticketRepository.save(ticket);
    return this.findOne(saved.id, userId, userRole);
  }

  async resolveTicket(id: number, userId: number, userRole: UserRole) {
    const ticket = await this.findOne(id, userId, userRole);

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.MODERATOR &&
      ticket.userId !== userId
    ) {
      throw new ForbiddenException('You cannot resolve this ticket');
    }

    ticket.status = TicketStatus.CLOSED;
    ticket.resolvedAt = new Date();
    ticket.updatedBy = userId;

    const saved = await this.ticketRepository.save(ticket);
    return this.findOne(saved.id, userId, userRole);
  }
}