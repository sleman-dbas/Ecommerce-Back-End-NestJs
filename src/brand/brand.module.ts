import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandAdminController } from './controllers/brand.admin.controller';
import { BrandUserController } from './controllers/brand.user.controller';
import { BrandsService } from './brand.service';
import { Brand, BrandSchema } from './schemas/brand.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
  ],
  controllers: [BrandAdminController, BrandUserController],
  providers: [BrandsService],
  exports: [BrandsService], 
})
export class BrandsModule {}