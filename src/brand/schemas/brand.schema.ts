import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BrandDocument = HydratedDocument<Brand>;

@Schema({ timestamps: true })
export class Brand {

  @Prop({ required: true, maxlength: 50, minlength: 2 })
  name!: string;

  @Prop({ required: true, unique: true, maxlength: 100 })
  slug!: string;

  // وصف قصير للعلامة التجارية (للـ SEO)
  @Prop({ maxlength: 500 })
  description?: string;

  @Prop()
  logo?: string;

  @Prop({ default: 0 })
  sort_order!: number;

  @Prop({ type: Boolean, default: true })
  is_active!: boolean;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

// ============= الفهارس (Indexes) =============
// 1. فهرس فريد للـ slug (للبحث السريع في الروابط)
// BrandSchema.index({ slug: 1 }, { unique: true });

// 2. فهرس مركب للحالة والترتيب (لجلب العلامات النشطة مرتبة)
// BrandSchema.index({ is_active: 1, sort_order: 1, name: 1 });

// 3. فهرس للترتيب فقط
// BrandSchema.index({ sort_order: 1 });

// ============= حذف الحقول التقنية من المخرجات =============
BrandSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});