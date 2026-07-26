import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CouponDocument = HydratedDocument<Coupon>;

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum ApplicableTo {
  ALL = 'all',
  CATEGORIES = 'categories',
  BRANDS = 'brands',
  PRODUCTS = 'products',
}

@Schema({ timestamps: true })
export class Coupon {

    @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 20,
    minlength: 3,
  })
  code!: string;

  @Prop({ maxlength: 500 })
  description?: string;

  @Prop({ required: true, enum: DiscountType, default: DiscountType.PERCENTAGE })
  discount_type!: DiscountType;

  // قيمة الخصم (إذا كانت نسبة، تكون القيمة القصوى 100)
  @Prop({ required: true, min: 0 })
  discount_value!: number;

  // الحد الأدنى لقيمة الطلب لتطبيق القسيمة (0 يعني لا يوجد حد)
  @Prop({ default: 0, min: 0 })
  minimum_order_amount!: number;

  // أقصى خصم مسموح (مفيد مع النسبة المئوية، مثلاً خصم 20% بحد أقصى 50$)
  @Prop({ min: 0 })
  max_discount_amount?: number;

  // تاريخ البدء والانتهاء
  @Prop({ required: true })
  valid_from!: Date;

  @Prop({ required: true })
  valid_to!: Date;

  // الحد الأقصى لعدد مرات استخدام القسيمة (إجمالي)
  @Prop({ default: 1, min: 1 })
  usage_limit!: number;

  // عدد مرات الاستخدام الحالية
  @Prop({ default: 0, min: 0 })
  usage_count!: number;

  // الحد الأقصى لكل مستخدم (0 يعني غير محدود)
  @Prop({ default: 0, min: 0 })
  per_user_limit!: number;

  // نطاق التطبيق: هل تنطبق على كل شيء أم فئات محددة؟
  @Prop({ required: true, enum: ApplicableTo, default: ApplicableTo.ALL })
  applicable_to!: ApplicableTo;

  // معرفات الفئات (إذا كان applicable_to = categories)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  applicable_category_ids?: Types.ObjectId[];

  // معرفات العلامات التجارية (إذا كان applicable_to = brands)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Brand' }], default: [] })
  applicable_brand_ids?: Types.ObjectId[];

  // معرفات المنتجات (إذا كان applicable_to = products)
//   @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
//   applicable_product_ids?: Types.ObjectId[];

  // حالة التفعيل (للحذف الناعم)
  @Prop({ type: Boolean, default: true })
  is_active!: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

// ============= الفهارس (Indexes) =============
// // 1. فهرس فريد للـ code (للبحث السريع عند التحقق)
// CouponSchema.index({ code: 1 }, { unique: true });

// // 2. فهرس مركب للبحث عن القسائم النشطة والصالحة (للعميل)
// CouponSchema.index({ is_active: 1, valid_from: 1, valid_to: 1 });

// // 3. فهرس لتسريع عمليات جلب القسائم المنتهية الصلاحية (للأدمن)
// CouponSchema.index({ valid_to: 1 });

// // 4. فهرس للحالة والترتيب (للوحة التحكم)
// CouponSchema.index({ is_active: 1, valid_from: -1 });

// ============= حذف الحقول التقنية =============
CouponSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});