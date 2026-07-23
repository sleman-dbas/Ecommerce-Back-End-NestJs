import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandsController } from './brand.controller';
import { BrandsService } from './brand.service';
import { Brand, BrandSchema } from './schemas/brand.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
  ],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService], 
})
export class BrandsModule {}