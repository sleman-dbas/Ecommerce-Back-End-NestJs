
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({timestamps: true})
export class User {

    @Prop({required: true,unique: true,auto: true})
    "id": number;

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
      validator: (v: number) => /^(010|011|012|015)\d{8}$/.test(String(v)),
      message: 'Phone must be a valid Egyptian mobile number (11 digits starting with 010,011,012,015)',
    },
    })
    "phone"?: number;
    
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
