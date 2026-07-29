import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupplierAdminController } from './controllers/supplier.admin.controller';
import { SupplierUserController } from './controllers/supplier.user.controller';
import { SuppliersService } from './supplier.service';
import { Supplier, SupplierSchema } from './schemas/supplier.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Supplier.name, schema: SupplierSchema }]),
  ],
  controllers: [SupplierAdminController, SupplierUserController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}