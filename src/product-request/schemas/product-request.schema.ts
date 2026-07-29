import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductRequestDocument = HydratedDocument<ProductRequest>;

export enum RequestStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ADDED = 'added',
}

@Schema({ timestamps: true })
export class ProductRequest {
  @Prop({ required: true, maxlength: 200 })
  product_name!: string;

  // حقل التطبيع للمقارنة الدقيقة ومنع التكرار
  @Prop({ required: true, maxlength: 200 })
  normalized_product_name!: string;

  @Prop({ maxlength: 1000 })
  description?: string;

  @Prop()
  product_url?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user_id?: Types.ObjectId;

  @Prop({ maxlength: 100 })
  customer_email?: string;

  @Prop({ maxlength: 100 })
  customer_name?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: false })
  suggested_category_id?: Types.ObjectId;

  @Prop({ required: true, enum: RequestStatus, default: RequestStatus.PENDING })
  status!: RequestStatus;

  @Prop({ maxlength: 500 })
  admin_notes?: string;

  @Prop({ default: 1 })
  request_count!: number;

  @Prop({ type: Boolean, default: true })
  is_active!: boolean;
}

export const ProductRequestSchema = SchemaFactory.createForClass(ProductRequest);

// ============= الفهارس المحسّنة والمصححة (Active Indexes) =============

// 1. فهرس مركب: user_id + is_active + createdAt (لـ findMyRequests)
// ProductRequestSchema.index({ user_id: 1, is_active: 1, createdAt: -1 });

// 2. فهرس مركب: status + is_active + createdAt (لـ findAllAdmin والـ Aggregation)
// ProductRequestSchema.index({ status: 1, is_active: 1, createdAt: -1 });

// 3. أ) فهرس فريد للمستخدمين المسجلين (Registered Users)
// يضمن عدم تكرار نفس المنتج لنفس المستخدم المسجل
// ProductRequestSchema.index(
//   { normalized_product_name: 1, user_id: 1 },
//   {
//     unique: true,
//     partialFilterExpression: {
//       is_active: true,
//       user_id: { $exists: true, $ne: null },
//     },
//   },
// );

// 3. ب) فهرس فريد للعملاء الزوار (Guest Users)
// يضمن عدم تكرار نفس المنتج لنفس البريد الإلكتروني للزائر
// ProductRequestSchema.index(
//   { normalized_product_name: 1, customer_email: 1 },
//   {
//     unique: true,
//     partialFilterExpression: {
//       is_active: true,
//       user_id: null,
//       customer_email: { $exists: true, $ne: null },
//     },
//   },
// );

// 4. فهرس النص للبحث النصي (لـ findAllAdmin عند البحث)
// ProductRequestSchema.index({ product_name: 'text', description: 'text' });

// ============= تحويل مخرجات JSON =============
ProductRequestSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});