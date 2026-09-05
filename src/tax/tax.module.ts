import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaxesAdminController } from './controllers/tax.admin.controller';
import { TaxesPublicController } from './controllers/tax.public.controller';
import { TaxesService } from './tax.service';
import { Tax, TaxSchema } from './schemas/tax.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tax.name, schema: TaxSchema }]),
  ],
  controllers: [TaxesAdminController, TaxesPublicController],
  providers: [TaxesService],
  exports: [TaxesService],
})
export class TaxesModule {}