// src/customer/services/customer.service.ts
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(CustomerEntity)
    private customerRepository: Repository<CustomerEntity>,
  ) {}

  async findByPhone(phone: string): Promise<CustomerEntity | null> {
    return await this.customerRepository.findOne({
      where: { phone, deletedAt: IsNull() },
      relations: {
        conversations: true,
      },
    });
  }

  // ✅ اصلاح شده: اگر نام جدید وارد شود، به‌روزرسانی می‌شود
  async findOrCreate(phone: string, name?: string): Promise<CustomerEntity> {
    let customer = await this.findByPhone(phone);

    if (!customer) {
      customer = this.customerRepository.create({
        phone,
        name: name?.trim() || `کاربر ${phone.slice(-4)}`,
        lastActivity: new Date(),
      });
      customer = await this.customerRepository.save(customer);
    } else {
      // ✅ اگر کاربر قبلاً وجود دارد و نام جدید وارد شده، نام را به‌روزرسانی کن
      if (name && name.trim() && customer.name !== name.trim()) {
        customer.name = name.trim();
        customer.lastActivity = new Date();
        customer = await this.customerRepository.save(customer);
        console.log(`✅ نام مشتری ${customer.phone} به "${customer.name}" به‌روزرسانی شد`);
      }
    }

    return customer;
  }

  async updateLastConversation(customerId: number, conversationId: number): Promise<void> {
    await this.customerRepository.update(customerId, {
      lastConversationId: conversationId,
      lastActivity: new Date(),
    });
  }

  async getCustomerConversations(customerId: number) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, deletedAt: IsNull() },
      relations: {
        conversations: {
          messages: true,
          team: true,
          agent: true,
        },
      },
      order: {
        conversations: {
          createdAt: 'DESC',
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer.conversations;
  }

  async getLastConversation(customerId: number) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, deletedAt: IsNull() },
      relations: {
        conversations: {
          messages: true,
          team: true,
          agent: true,
        },
      },
      order: {
        conversations: {
          createdAt: 'DESC',
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer.conversations.length > 0 ? customer.conversations[0] : null;
  }
}