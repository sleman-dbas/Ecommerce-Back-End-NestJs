import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CouponAdminController } from './controllers/coupon.admin.controller';
import { CouponUserController } from './controllers/coupon.user.controller';
import { CouponsService } from './coupon.service';
import { Coupon, CouponSchema } from './schemas/coupon.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }]),
  ],
  controllers: [CouponAdminController, CouponUserController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}