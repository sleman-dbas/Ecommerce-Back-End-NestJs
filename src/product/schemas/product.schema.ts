import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  // ==================== المعلومات الأساسية ====================
  @Prop({ required: true, maxlength: 200, minlength: 3 })
  name!: string;

  @Prop({ required: true, unique: true, maxlength: 200 })
  slug!: string;

  @Prop({ maxlength: 5000 })
  description?: string;

  // SKU: فريد عالمياً (رقم تعريف المنتج)
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 50,
  })
  sku!: string;

  // ==================== السعر ====================
  @Prop({ required: true, min: 0 })
  price!: number;

  // السعر قبل التخفيض (لإظهار الخصم)
  @Prop({ min: 0 })
  compare_at_price?: number;

  // تكلفة الشراء (للأرباح الداخلية - لا يظهر للعميل)
  @Prop({ min: 0, select: false })
  cost_price?: number;

  // ==================== المخزون ====================
  @Prop({ required: true, default: 0, min: 0 })
  stock!: number;

  @Prop({ default: 5, min: 0 })
  low_stock_threshold!: number;

  // ==================== العلاقات ====================
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  category_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Brand', index: true })
  brand_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Supplier', index: true })
  supplier_id?: Types.ObjectId;

  // ==================== الضريبة ====================
  // هل المنتج خاضع للضريبة؟
  @Prop({ type: Boolean, default: true })
  is_taxable!: boolean;

  // قاعدة ضريبية محددة (اختياري - إذا أردت تطبيق ضريبة خاصة)
  @Prop({ type: Types.ObjectId, ref: 'Tax' })
  tax_id?: Types.ObjectId;

  // ==================== الصور ====================
  @Prop({ required: true })
  main_image!: string;

  @Prop({ type: [String], default: [] })
  gallery?: string[];

  // ==================== الحالة والتمييز ====================
  @Prop({ type: Boolean, default: true, index: true })
  is_active!: boolean;

  @Prop({ type: Boolean, default: false })
  is_featured!: boolean;

  @Prop({ type: Boolean, default: false })
  is_new!: boolean;

  // يُحسب تلقائياً: إذا كان compare_at_price > price
  @Prop({ type: Boolean, default: false })
  is_on_sale!: boolean;

  @Prop({ default: 0 })
  sort_order!: number;

  // ==================== التحليلات ====================
  @Prop({ default: 0 })
  views!: number;

  @Prop({ default: 0, min: 0, max: 5 })
  average_rating!: number;

  @Prop({ default: 0 })
  review_count!: number;

  @Prop({ default: 0 })
  sold_count!: number; // عدد المرات التي تم بيع المنتج فيها
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// ==================== الفهارس (Indexes) ====================

// // 1. فهارس فريدة
// ProductSchema.index({ slug: 1 }, { unique: true });
// ProductSchema.index({ sku: 1 }, { unique: true });

// // 2. فهرس مركب للبحث حسب التصنيف + الحالة + الترتيب (لـ category pages)
// ProductSchema.index({ category_id: 1, is_active: 1, sort_order: 1 });

// // 3. فهرس مركب للبحث حسب العلامة التجارية
// ProductSchema.index({ brand_id: 1, is_active: 1 });

// // 4. فهرس مركب للبحث حسب المورد (لتقرير الأدمن)
// ProductSchema.index({ supplier_id: 1, is_active: 1 });

// // 5. فهرس للبحث حسب السعر (للتصفية)
// ProductSchema.index({ price: 1 });

// // 6. فهرس مركب للحالة والتمييز (للمنتجات المميزة)
// ProductSchema.index({ is_active: 1, is_featured: 1, sort_order: 1 });

// // 7. فهرس للحالة والمنتجات الجديدة
// ProductSchema.index({ is_active: 1, is_new: 1, createdAt: -1 });

// // 8. فهرس للـ Cursor Pagination (الأحدث)
// ProductSchema.index({ is_active: 1, _id: 1 });

// // 9. فهرس للحالة والتخفيض (للمنتجات المخفضة)
// ProductSchema.index({ is_active: 1, is_on_sale: 1, sort_order: 1 });

// // 10. فهرس للبحث بالمنتجات الأكثر مبيعاً
// ProductSchema.index({ is_active: 1, sold_count: -1 });

// ==================== تحويل المخرجات ====================
ProductSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});