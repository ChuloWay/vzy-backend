import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';

export enum PaymentStatus {
  Pending = 'pending',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

export type PaymentDocument = HydratedDocument<Payment>;


@Schema()
export class Payment {
  @Prop({ default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  user: User;

  @Prop({ required: true })
  stripeId: string;

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
