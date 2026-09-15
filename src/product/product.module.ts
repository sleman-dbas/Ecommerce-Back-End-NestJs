import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsPublicController } from '././controllers/products.public.controller';
import { ProductsAdminController } from '././controllers/products.admin.controller';
import { ProductsService } from './product.service';
import { Product, ProductSchema } from './schemas/product.schema';
import { Category, CategorySchema } from '../category/schemas/category.schema';
import { Brand, BrandSchema } from '../brand/schemas/brand.schema';
import { Supplier, SupplierSchema } from '../supplier/schemas/supplier.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Brand.name, schema: BrandSchema },
      { name: Supplier.name, schema: SupplierSchema },
    ]),
  ],
  controllers: [ProductsPublicController, ProductsAdminController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}