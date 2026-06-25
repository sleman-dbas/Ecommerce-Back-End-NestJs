import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PasswordResetTokenDocument = HydratedDocument<PasswordResetToken>;

@Schema({ timestamps: true, collection: 'password_reset_tokens' })
export class PasswordResetToken {
  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true })
  otpHash: string;

  @Prop({ required: true, index: true })
  expiresAt: Date;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  usedAt?: Date;

  @Prop({ default: 0 })
  attempts: number;

  @Prop()
  requestIp?: string;
}

export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// PasswordResetTokenSchema.index({ email: 1, isUsed: 1, expiresAt: -1 });