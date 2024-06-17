import { HttpException, HttpStatus, Inject, Injectable, RawBodyRequest, Logger } from '@nestjs/common';
import { CURRENCY, FEE_AMOUNT, FEE_TYPE, STRIPE_CLIENT } from 'src/stripe/constants';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Payment } from './schemas/payment.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from 'src/user/user.service';
import { PaymentStatus } from './enum/enum.index';
import { PaymentError } from 'src/utils/AppError';

@Injectable()
export class PaymentService {
  private logger = new Logger(PaymentService.name);
  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    @Inject(STRIPE_CLIENT) private stripe: Stripe,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  /**
   * Create a new checkout session for the user.
   *
   * @param {any} user - the user object
   * @return {Promise<any>} the created checkout session
   */
  async createCheckoutSession(user: any): Promise<any> {
    const userId = user._id.toString();
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
        metadata: {
          userId,
        },
      });

      return session;
    } catch (error) {
      throw new HttpException('Failed to create Stripe Checkout session', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Stripe Webhook handler.
   *
   * @param {RawBodyRequest<Request>} req - the request object
   * @return {Promise<any>} the result of the function
   */
  async handleStripeWebhook(req: RawBodyRequest<Request>): Promise<any> {
    try {
      // Retrieve the Stripe webhook secret from your environment or configuration
      const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      // Retrieve the Stripe signature header from the request headers
      const stripeSignature = req.headers['stripe-signature'];

      const rawBody = req.rawBody;

      // Verify the Stripe webhook event
      const event = this.stripe.webhooks.constructEvent(rawBody, stripeSignature, stripeWebhookSecret);

      // Handle the event based on its type
      switch (event.type) {
        case 'payment_intent.succeeded':
          this.logger.log('Payment intent succeeded');
          break;

        case 'checkout.session.completed':
          this.logger.log('Payment checkout session completed');

          await this.handlePaymentSuccess(event?.data?.object);

          break;

        case 'payment_intent.payment_failed':
          // Log event data
          this.logger.error('Payment intent failed');
          break;

        case 'checkout.session.async_payment_failed':
          // Handle failed checkout session event
          this.logger.error('Async payment failed');

          // Perform actions to handle failed payment for the session
          await this.handlePaymentFailure(event?.data?.object);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error handling Stripe webhook event:', error);
      throw new HttpException('Failed to handle Stripe webhook event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves payment information for a given session ID.
   *
   * @param {string} sessionId - The session ID for which payment information is to be retrieved
   * @return {Promise<any>} A Promise that resolves to the retrieved payment information
   */
  private async retrievePaymentInfo(sessionId: string) {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }

  /**
   * Handle the success of a payment by processing the payment data and updating the user and payment records accordingly.
   *
   * @param {any} data - the payment data received
   * @return {Promise<void>} a promise that resolves when the payment success handling is complete
   */
  private async handlePaymentSuccess(eventObject: any): Promise<void> {
    const data = await this.retrievePaymentInfo(eventObject.id);

    const session = await this.paymentModel.startSession();
    session.startTransaction();

    try {
      const userId = data?.metadata?.userId;
      const userEmail = data?.customer_details?.email;

      if (!userId || !userEmail) {
        throw new Error('Missing userId or userEmail in payment data');
      }

      const user = await this.userService.findUserByEmail(userEmail);

      if (!user || user._id.toString() !== userId) {
        throw new Error('Provided userId and userEmail do not belong to the same user');
      }

      const stripeSessionId = data.id;
      const amount = data.amount_total;
      const status = PaymentStatus.Succeeded;

      const payment = new this.paymentModel({
        user: user._id,
        stripeSessionId,
        amount,
        status,
      });

      await payment.save({ session });

      await this.userService.updateUserStatus(user._id, payment, session);

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new PaymentError('Failed to handle payment success', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async handlePaymentFailure(eventObject: any): Promise<void> {
    const data = await this.retrievePaymentInfo(eventObject.id);

    const session = await this.paymentModel.startSession();
    session.startTransaction();

    try {
      const userId = data?.metadata?.userId;
      const userEmail = data?.customer_details?.email;

      if (!userId || !userEmail) {
        throw new Error('Missing userId or userEmail in payment data');
      }

      const user = await this.userService.findUserByEmail(userEmail);

      if (!user || user._id.toString() !== userId) {
        throw new Error('Provided userId and userEmail do not belong to the same user');
      }

      const stripeSessionId = data.id;
      const amount = data.amount_total;
      const status = PaymentStatus.Failed;

      const payment = new this.paymentModel({
        user: user._id,
        stripeSessionId,
        amount,
        status,
      });

      await payment.save({ session });

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new PaymentError('Failed to handle payment failure', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
