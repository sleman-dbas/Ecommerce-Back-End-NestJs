import { PartialType } from '@nestjs/swagger';
import { CreateProductRequestDto } from './create-product-request.dto';

export class UpdateProductRequestDto extends PartialType(CreateProductRequestDto) {}
