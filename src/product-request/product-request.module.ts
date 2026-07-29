import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductRequestsController } from './product-request.controller';
import { ProductRequestsService } from './product-request.service';
import { ProductRequest, ProductRequestSchema } from './schemas/product-request.schema';
import { User, UserSchema } from '../user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductRequest.name, schema: ProductRequestSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ProductRequestsController],
  providers: [ProductRequestsService],
  exports: [ProductRequestsService],
})
export class ProductRequestsModule {}