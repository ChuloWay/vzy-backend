import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { UserModule } from 'src/user/user.module';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]), UserModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
