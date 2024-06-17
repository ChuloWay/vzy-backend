import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { hash } from 'bcrypt';
import { Payment } from 'src/payment/schemas/payment.schema';
import { UserStatus } from '../enum/enum.index';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true, minlength: 4, maxlength: 20 })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Payment' }], default: [] })
  payments: Payment[];

  @Prop({ type: String, enum: UserStatus, default: UserStatus.NOT_PAID })
  status: UserStatus;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

UserSchema.pre<User>('save', async function (next) {
  const user = this;

  try {
    const hashedPassword = await hash(user.password, 10);
    user.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});

export { UserSchema };
