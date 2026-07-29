import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryAdminController } from './controllers/category.admin.controller';
import { CategoryUserController } from './controllers/category.user.controller';
import { CategoriesService } from './category.service';
import { Category, CategorySchema } from './schemas/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
  ],
  controllers: [CategoryAdminController, CategoryUserController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}