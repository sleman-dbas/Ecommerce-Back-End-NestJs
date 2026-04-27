
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({timestamps: true})
export class User {

    @Prop({required: true,maxlength:30,minlength: 3})
    "name": string;

    @Prop({ required: true, unique: true, match: /^\S+@\S+\.\S+$/ })
    "email": string;

    @Prop({required: true,minlength: 3,maxlength: 20})
    "password": string;

    @Prop({required: true,enum: ['customer', 'admin']})
    "role": string;

    @Prop({required: false})
    "avatar": string;

    @Prop({required: false})
    "age"?: number;

    @Prop({
    required: false,
    validate: {
      validator: (v: string) => /^(093|094|095|096|099)\d{7}$/.test(v),
    message: 'Phone number must be a valid Syrian mobile number (10 digits, starting with 093, 094, 095, 096, or 099)',
    },
    })
    phone?: string;
    
    @Prop({ required: false })
    "address"?: string;

    // Active Boolean, Enum [False, True] -> default false
    @Prop({ type: Boolean, default: false })
    "active": boolean;

    // Verification Code String
    @Prop({ required: false }) // optional unless required elsewhere
    "verificationCode"?: string;

    // gender String, Enum ["male", "female"]
    @Prop({ required: false, enum: ['male', 'female'] })
    "gender"?: string;

}

export const UserSchema = SchemaFactory.createForClass(User);
