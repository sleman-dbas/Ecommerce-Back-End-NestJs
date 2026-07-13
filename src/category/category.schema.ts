import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  // 1. الاسم الأساسي للتصنيف (يظهر للمستخدم)
  @Prop({ required: true, maxlength: 50, minlength: 2 })
  "name": string;

  // 2. الرابط الصديق (SEO) - يجب أن يكون فريداً
  @Prop({ required: true, unique: true, maxlength: 100 })
  "slug": string;

  // 3. وصف قصير لتحسين محركات البحث وظهوره في المتجر
  @Prop({ maxlength: 500 })
  "description"?: string;

  // 4. الأب (التصنيف الأعلى) - يشير إلى نفس المجموعة
  //    إذا كان null فهذا يعني أنه تصنيف جذر (رئيسي)
  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  "parent_id"?: Types.ObjectId | null;

  // 5. المسار الكامل من الجذر (Materialized Path) - سحر الأداء في MongoDB
  //    مثال: "65f3a2b1c7d8e9f012345678,65f3a2b1c7d8e9f012345679,65f3a2b1c7d8e9f012345680"
  @Prop({ type: String, default: '' })
  "path": string;

  // 6. عمق التصنيف في الشجرة (الجذر = 0، الابن المباشر = 1، إلخ)
  @Prop({ required: true, default: 0, min: 0 })
  "tree_depth": number;

  // 7. رابط صورة أيقونة التصنيف (اختياري)
  @Prop()
  "image"?: string;

  // 8. ترتيب ظهور التصنيف يدوياً (الأصغر أولاً)
  @Prop({ default: 0 })
  "order": number;

  // 9. تفعيل أو إخفاء التصنيف (بدلاً من حذفه)
  @Prop({ type: Boolean, default: true })
  "is_active": boolean;
}

// إنشاء الـ Schema من الكلاس
export const CategorySchema = SchemaFactory.createForClass(Category);

// ----- إضافة الفهارس (Indexes) لتسريع الاستعلامات -----
// 1. فهرس فريد للـ Slug (للبحث السريع في URL)
// CategorySchema.index({ slug: 1 }, { unique: true });

// // 2. فهرس للـ parent_id (لجلب الأبناء المباشرين بسرعة)
// CategorySchema.index({ parent_id: 1 });

// // 3. فهرس مركب على path و is_active (لتسريع جلب الشجرة والتصنيفات النشطة)
// CategorySchema.index({ path: 1, is_active: 1 });

// // 4. فهرس للترتيب (لجلب التصنيفات مرتبة)
// CategorySchema.index({ order: 1 });

// ----- تعديل مخرجات JSON لحذف الحقول الحساسة أو غير المرغوب فيها -----
CategorySchema.set('toJSON', {
  transform: function (doc, ret: any) {
    // حذف __v لأنه خاص بـ Mongoose ولا يحتاجه العميل
    delete ret.__v;
    // ملاحظة: لم أحذف الـ path لأنه مفيد جداً للـ Frontend
    // إذا أردت إخفاءه لأسباب أمنية، يمكنك إلغاء التعليق على السطر التالي:
    // delete ret.path;
    return ret;
  },
});