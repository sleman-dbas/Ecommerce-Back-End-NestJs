import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, maxlength: 30, minlength: 3 })
  "name": string;

  @Prop({ required: true, unique: true, match: /^\S+@\S+\.\S+$/ })
  "email": string;

  @Prop({ required: true })
  "password": string;

  @Prop({ required: true, enum: ['customer', 'admin'], default: 'customer' })
  "role": string;

  @Prop()
  "avatar"?: string;

  @Prop()
  "age"?: number;

  @Prop({
    validate: {
      validator: (v: string) => /^(093|094|095|096|099)\d{7}$/.test(v),
      message:
        'Phone number must be a valid Syrian mobile number (10 digits, starting with 093, 094, 095, 096, or 099)',
    },
  })
  "phone"?: string;

  @Prop()
  "address"?: string;

  @Prop({ type: Boolean, default: false })
  "active": boolean;

  @Prop()
  "verificationCode"?: string;

  @Prop({ enum: ['male', 'female'] })
  gender?: string;

  @Prop({ default: 0 }) tokenVersion!: number;
}




export const UserSchema = SchemaFactory.createForClass(User);

// UserSchema.index({ email: 1 }, { unique: true });
// UserSchema.index({ role: 1 });
// UserSchema.index({ active: 1 });
// UserSchema.index({ createdAt: -1 });

UserSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});
