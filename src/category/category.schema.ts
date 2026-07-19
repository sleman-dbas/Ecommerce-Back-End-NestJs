import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  // Human-readable category name shown in the storefront and admin UI.
  @Prop({ required: true, maxlength: 50, minlength: 2 })
  name!: string;

  // URL-safe slug unique only within the same parent category.
  @Prop({ required: true, maxlength: 100 })
  slug!: string;

  // Optional long-form description for SEO and merchandising.
  @Prop({ maxlength: 500 })
  description?: string;

  // Direct parent category. Root categories keep this as null.
  @Prop({ type: Types.ObjectId, ref: Category.name, default: null })
  parent_id?: Types.ObjectId | null;

  // Ordered ancestor chain from the root to the immediate parent.
  // Example: Electronics -> [] , Phones -> [Electronics], Android -> [Electronics, Phones]
  @Prop({ type: [{ type: Types.ObjectId, ref: Category.name }], default: [] })
  ancestors!: Types.ObjectId[];

  // Category depth in the hierarchy. Root nodes start at 0.
  @Prop({ required: true, default: 0, min: 0 })
  depth!: number;

  // Optional category image used in navigation and merchandising.
  @Prop()
  image?: string;

  // Manual sort order for category listings; smaller values render first.
  @Prop({ default: 0 })
  sort_order!: number;

  // Soft-activation flag for hiding categories without deleting them.
  @Prop({ type: Boolean, default: true })
  is_active!: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes tuned for hierarchical category lookups at scale.
CategorySchema.index({ parent_id: 1 });
CategorySchema.index({ ancestors: 1 });
CategorySchema.index({ parent_id: 1, slug: 1 }, { unique: true });
CategorySchema.index({ sort_order: 1 });
CategorySchema.index({ is_active: 1 });

CategorySchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});