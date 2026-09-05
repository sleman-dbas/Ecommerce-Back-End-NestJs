import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TaxDocument = HydratedDocument<Tax>;

export enum TaxType {
  PERCENTAGE = 'percentage', // نسبة مئوية من سعر المنتج
  FIXED = 'fixed',           // قيمة ثابتة لكل منتج (أو لكل طلب)
}

export enum ApplicableTo {
  ALL = 'all',
  CATEGORIES = 'categories',
  BRANDS = 'brands',
  PRODUCTS = 'products',
}

@Schema({ timestamps: true })
export class Tax {
  // اسم الضريبة (مثل: "ضريبة القيمة المضافة 15%")
  @Prop({ required: true, maxlength: 100 })
  name!: string;

  // نوع الضريبة (نسبة أو قيمة ثابتة)
  @Prop({ required: true, enum: TaxType, default: TaxType.PERCENTAGE })
  type!: TaxType;

  // قيمة الضريبة (إذا كانت نسبة، فالقيمة القصوى 100)
  @Prop({ required: true, min: 0 })
  rate!: number;

  // ============= نطاق التطبيق (Applicability) =============
  @Prop({ required: true, enum: ApplicableTo, default: ApplicableTo.ALL })
  applicable_to!: ApplicableTo;

  // معرفات الفئات (إذا كان applicable_to = categories)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  applicable_category_ids?: Types.ObjectId[];

  // معرفات العلامات التجارية (إذا كان applicable_to = brands)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Brand' }], default: [] })
  applicable_brand_ids?: Types.ObjectId[];

  // معرفات المنتجات (إذا كان applicable_to = products)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  applicable_product_ids?: Types.ObjectId[];

  // ============= نطاق الموقع (Location Scope) =============
  // إذا كانت is_global = true، يتم تطبيق الضريبة على كل المواقع
  @Prop({ type: Boolean, default: true })
  is_global!: boolean;

  // خلاف ذلك، يمكن تحديد الموقع بدقة
  @Prop({ maxlength: 100 })
  country?: string;

  @Prop({ maxlength: 100 })
  state?: string;

  @Prop({ maxlength: 100 })
  city?: string;

  @Prop({ maxlength: 20 })
  postal_code?: string;

  // ============= ترتيب الأولوية =============
  // عندما تنطبق ضرائب متعددة، تُطبق حسب الأولوية (الأصغر أولاً)
  @Prop({ default: 0 })
  priority!: number;

  // ============= حالة التفعيل =============
  @Prop({ type: Boolean, default: true })
  is_active!: boolean;
}

export const TaxSchema = SchemaFactory.createForClass(Tax);

// ============= الفهارس (Indexes) =============

// 1. فهرس مركب للحالة والأولوية (للاستعلامات العامة)
// TaxSchema.index({ is_active: 1, priority: 1 });

// // 2. فهرس للحالة والنطاق العالمي (للبحث عن الضرائب العالمية)
// TaxSchema.index({ is_active: 1, is_global: 1 });

// // 3. فهرس مركب للموقع + الحالة (للبحث عن الضرائب حسب الموقع)
// TaxSchema.index({ country: 1, state: 1, city: 1, is_active: 1 });

// // 4. فهرس للحقول المرجعية (للـ populate)
// TaxSchema.index({ applicable_category_ids: 1 });
// TaxSchema.index({ applicable_brand_ids: 1 });
// TaxSchema.index({ applicable_product_ids: 1 });

// ============= حذف الحقول التقنية =============
TaxSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});