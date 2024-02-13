import { HttpException, HttpStatus, Inject, Injectable, RawBodyRequest } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CURRENCY, FEE_AMOUNT, FEE_TYPE, STRIPE_CLIENT } from 'src/stripe/constants';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentDocument, PaymentStatus } from './schemas/payment.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from 'src/user/user.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    @Inject(STRIPE_CLIENT) private stripe: Stripe,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}
  async createCheckoutSession(user: any): Promise<any> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: CURRENCY,
              product_data: {
                name: FEE_TYPE,
              },
              unit_amount: FEE_AMOUNT,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: this.configService.get<string>('SUCCESS_URL'),
        cancel_url: this.configService.get<string>('CANCEL_URL'),
        customer_email: user.email,
      });

      return session;
    } catch (error) {
      throw new HttpException('Failed to create Stripe Checkout session', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
 
  async handleStripeWebhook(req: RawBodyRequest<Request>): Promise<any> {
    try {
      // Retrieve the Stripe webhook secret from your environment or configuration
      const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      // Retrieve the Stripe signature header from the request headers
      const stripeSignature = req.headers['stripe-signature'];

      // Get the raw request body as a Buffer
      const rawBody = req.rawBody;

      // Verify the Stripe webhook event
      const event = this.stripe.webhooks.constructEvent(
        rawBody, // Raw body of the request
        stripeSignature, // Stripe signature header
        stripeWebhookSecret,
      );

      // Handle the event based on its type
      switch (event.type) {
        case 'payment_intent.succeeded':
          // Handle successful payment intent event
          // await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          // Handle failed payment intent event
          break;
        // Add more cases for other webhook event types as needed
        default:
          // Log unknown event types
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Respond with 200 OK to acknowledge receipt of the event
      return { received: true };
    } catch (error) {
      // Log and handle errors
      console.error('Error handling Stripe webhook event:', error);
      throw new HttpException('Failed to handle Stripe webhook event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const session = await this.paymentModel.startSession();
    session.startTransaction();

    try {
      // Extract relevant information from the payment intent
      const userId = paymentIntent.metadata.userId; // Assuming you're passing user ID as metadata
      const stripeId = paymentIntent.id;
      const amount = paymentIntent.amount;
      const status = PaymentStatus.Succeeded;

      // Create a new Payment record
      const payment = new this.paymentModel({
        user: userId,
        stripeId,
        amount,
        status,
      });

      // Save the payment record
      await payment.save({ session });

      // Update user status to "paid"
      await this.userService.updateUserStatus(userId, session);

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error handling payment success:', error);
      throw new HttpException('Failed to handle payment success', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
