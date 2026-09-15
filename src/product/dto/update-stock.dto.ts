import { IsNumber, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateStockDto {
  @IsNumber()
  @IsNotEmpty({ message: 'Quantity is required' })
  @Transform(({ value }) => parseInt(value))
  quantity: number; // يمكن أن يكون موجباً (إضافة) أو سالباً (خصم)
}