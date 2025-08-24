import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto, SearchPaymentMethodDto } from './dto';
import { Allow, AppCtxt } from '../../common/decorators';
import { RequestContext } from '../../common/services/request-context.service';
import { PERMISSIONS } from '@gymspace/shared';

@ApiTags('Payment Methods')
@Controller('payment-methods')
@ApiBearerAuth()
@ApiSecurity('gym-id')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @Allow(PERMISSIONS.PAYMENT_METHODS_CREATE)
  @ApiOperation({ summary: 'Create a new payment method' })
  @ApiResponse({ status: 201, description: 'Payment method created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Conflict - Code already exists' })
  async createPaymentMethod(
    @Body() dto: CreatePaymentMethodDto,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.paymentMethodsService.createPaymentMethod(ctx, dto);
  }

  @Get(':id')
  @Allow(PERMISSIONS.PAYMENT_METHODS_READ)
  @ApiOperation({ summary: 'Get payment method details' })
  @ApiResponse({ status: 200, description: 'Payment method details' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async getPaymentMethod(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.paymentMethodsService.getPaymentMethod(ctx, id);
  }

  @Put(':id')
  @Allow(PERMISSIONS.PAYMENT_METHODS_UPDATE)
  @ApiOperation({ summary: 'Update payment method information' })
  @ApiResponse({ status: 200, description: 'Payment method updated successfully' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Code already exists' })
  async updatePaymentMethod(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.paymentMethodsService.updatePaymentMethod(ctx, id, dto);
  }

  @Get()
  @Allow(PERMISSIONS.PAYMENT_METHODS_READ)
  @ApiOperation({ summary: 'Search payment methods in gym' })
  @ApiResponse({ status: 200, description: 'List of payment methods' })
  async searchPaymentMethods(
    @Query() dto: SearchPaymentMethodDto,
    @AppCtxt() ctx: RequestContext,
  ) {
    return await this.paymentMethodsService.searchPaymentMethods(ctx, dto);
  }

  @Delete(':id')
  @Allow(PERMISSIONS.PAYMENT_METHODS_DELETE)
  @ApiOperation({ summary: 'Soft delete payment method' })
  @ApiResponse({ status: 200, description: 'Payment method deleted successfully' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async deletePaymentMethod(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.paymentMethodsService.deletePaymentMethod(ctx, id);
  }

  @Put(':id/toggle')
  @Allow(PERMISSIONS.PAYMENT_METHODS_UPDATE)
  @ApiOperation({ summary: 'Toggle payment method enabled/disabled status' })
  @ApiResponse({ status: 200, description: 'Payment method status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async togglePaymentMethod(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
    return await this.paymentMethodsService.togglePaymentMethod(ctx, id);
  }
}