import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SupplierDocument = HydratedDocument<Supplier>;

@Schema({ timestamps: true })
export class Supplier {

  @Prop({ required: true, maxlength: 100, minlength: 2 })
  name!: string;

  @Prop({ required: true, maxlength: 100 })
  slug!: string;

  // وصف المورد (للـ SEO ولإظهاره في صفحة المورد)
  @Prop({ maxlength: 1000 })
  description?: string;

  @Prop({ maxlength: 100 })
  contact_person?: string;

  @Prop({ maxlength: 100 })
  email?: string;

  @Prop({ maxlength: 20 })
  phone?: string;

  @Prop({ maxlength: 200 })
  address?: string;

  @Prop()
  website?: string;

  @Prop()
  logo?: string;

  @Prop({ min: 1, max: 5, default: 3 })
  rating?: number;

  @Prop({ default: 0 })
  sort_order!: number;

  @Prop({ type: Boolean, default: true })
  is_active!: boolean;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);

// ================================================================
// (Indexes) 
// ================================================================

// query: findOne({ slug, is_active: true }) =>
// SupplierSchema.index({ slug: 1, is_active: 1 }, { unique: true });

//    query : find({ is_active: true }).sort({ sort_order: 1, name: 1 })
// SupplierSchema.index({ is_active: 1, sort_order: 1, name: 1 });
    
//    query : $text: { $search: ... }
// SupplierSchema.index({ name: 'text', description: 'text' });

// Now we dont use the index for sort_order, rating and email beacause we dont use them in the queries 

// ============= حذف الحقول التقنية =============
SupplierSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});