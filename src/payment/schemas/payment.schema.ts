import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentStatus } from '../enum/enum.index';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema()
export class Payment {
  @Prop({ default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  stripeSessionId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: PaymentStatus })
  status: PaymentStatus; // Payment status (e.g., "pending", "succeeded", "failed")

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

const PaymentSchema = SchemaFactory.createForClass(Payment);

export { PaymentSchema };
