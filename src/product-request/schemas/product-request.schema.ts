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

  // حقل جديد للتطبيع (للمقارنة الدقيقة ومنع التكرار)
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

// ============= الفهارس المحسّنة (Optimized Indexes) =============

// 1. فهرس مركب: user_id + is_active + createdAt (لـ findMyRequests)
// ProductRequestSchema.index({ user_id: 1, is_active: 1, createdAt: -1 });

// 2. فهرس مركب: status + createdAt (لـ findAllAdmin مع تصفية status)
// ProductRequestSchema.index({ status: 1, createdAt: -1 })

// 3. فهرس فريد لمنع تكرار الطلب لنفس المستخدم (يضمن Atomicity)
// ProductRequestSchema.index(
//   { normalized_product_name: 1, user_id: 1 },
//   { partialFilterExpression: { is_active: true } }
// );

// 4. فهرس النص للبحث النصي (لـ findAllAdmin عند البحث)
// ProductRequestSchema.index({ product_name: 'text', description: 'text' });


// ============= حذف الحقول التقنية =============
ProductRequestSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});