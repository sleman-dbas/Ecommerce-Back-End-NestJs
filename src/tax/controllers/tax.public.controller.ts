import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TaxesService } from '../tax.service';
import { CalculateTaxDto } from '../dto/calculate-tax.dto';
import { TaxResponseDto } from '../dto/responses/tax-response.dto';

@Controller('taxes')
export class TaxesPublicController {
  constructor(private readonly taxesService: TaxesService) {}

  // جلب جميع القواعد الضريبية النشطة (للعرض في المتجر)
  @Get('public')
  findAllPublic(): Promise<TaxResponseDto[]> {
    return this.taxesService.findAllPublic();
  }

  // حساب الضريبة (يُستخدم أثناء الدفع)
  @Post('calculate')
  calculateTax(@Body() calculateDto: CalculateTaxDto): Promise<{
    tax_amount: number;
    total_with_tax: number;
    applied_taxes: TaxResponseDto[];
    breakdown: Array<{ name: string; rate: number; amount: number }>;
  }> {
    return this.taxesService.calculateTax(calculateDto);
  }
}