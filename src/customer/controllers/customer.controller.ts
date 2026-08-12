// src/customer/controllers/customer.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomerService } from '../services/customer.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('customers')
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Public()
  @Get('by-phone/:phone')
  @ApiOperation({ summary: 'دریافت مشتری بر اساس شماره همراه (عمومی)' })
  async findByPhone(@Param('phone') phone: string) {
    return this.customerService.findByPhone(phone);
  }

  @Public()
  @Post('find-or-create')
  @ApiOperation({ summary: 'یافتن یا ایجاد مشتری (عمومی)' })
  async findOrCreate(@Body() body: { phone: string; name?: string }) {
    return this.customerService.findOrCreate(body.phone, body.name);
  }

  @Get(':id/conversations')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'دریافت همه گفتگوهای یک مشتری' })
  async getConversations(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.getCustomerConversations(id);
  }

  @Get(':id/last-conversation')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'دریافت آخرین گفتگوی یک مشتری' })
  async getLastConversation(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.getLastConversation(id);
  }
}