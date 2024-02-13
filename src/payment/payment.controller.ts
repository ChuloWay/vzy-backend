import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
  Next,
  RawBodyRequest,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CURRENCY, FEE_AMOUNT, FEE_TYPE, STRIPE_CLIENT } from 'src/stripe/constants';
import Stripe from 'stripe';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-guard';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    @Inject(STRIPE_CLIENT) private stripe: Stripe,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('/create-checkout-session')
  async createCheckoutSession(@Req() req: { user: any }): Promise<any> {
    return this.paymentService.createCheckoutSession(req.user);
  }
  @Post('/webhook')
  async handleStripeWebhook(@Req() req: RawBodyRequest<Request>): Promise<any> {
    return this.paymentService.handleStripeWebhook(req);
  }
}
