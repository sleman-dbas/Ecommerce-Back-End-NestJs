import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductRequest, ProductRequestSchema } from './schemas/product-request.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { ProductRequestUserController } from './controllers/product-request.user.controller';
import { ProductRequestAdminController } from './controllers/product-request.admin.controller';
import { ProductRequestService } from './services/product-request.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductRequest.name, schema: ProductRequestSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ProductRequestUserController, ProductRequestAdminController],
  providers: [ProductRequestService],
  exports: [ProductRequestService],
})
export class ProductRequestsModule {}