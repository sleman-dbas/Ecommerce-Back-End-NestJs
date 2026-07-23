import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';

import { Brand, BrandDocument } from './schemas/brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandResponseDto } from './dto/responses/brand-response.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
  ) {}

  // ============= 1. إنشاء علامة تجارية جديدة =============
  async create(createDto: CreateBrandDto): Promise<BrandResponseDto> {
    // توليد الـ Slug من الاسم إذا لم يتم إرساله
    const slug = this.generateSlug(createDto.name);

    // التأكد من فريدة الـ Slug
    await this.ensureSlugIsUnique(slug);

    const newBrand = new this.brandModel({
      ...createDto,
      slug,
    });

    const saved = await newBrand.save();
    return BrandResponseDto.fromEntity(saved);
  }

  // ============= 2. جلب كل العلامات (للأدمن مع Pagination) =============
  async findAllAdmin(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ data: BrandResponseDto[]; total: number; page: number; lastPage: number }> {
    const skip = (page - 1) * limit;

    // بناء فلتر البحث
    const filter: any = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      this.brandModel
        .find(filter)
        .sort({ sort_order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.brandModel.countDocuments(filter).exec(),
    ]);

    return {
      data: BrandResponseDto.fromEntityArray(data),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // ============= 3. جلب العلامات النشطة فقط (للعميل) =============
  async findAllPublic(): Promise<BrandResponseDto[]> {
    const brands = await this.brandModel
      .find({ is_active: true })
      .sort({ sort_order: 1, name: 1 })
      .lean()
      .exec();

    return BrandResponseDto.fromEntityArray(brands);
  }

  // ============= 4. جلب علامة بواسطة ID =============
  async findOneById(id: string): Promise<BrandResponseDto> {
    const brand = await this.brandModel.findById(id).lean().exec();
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    return BrandResponseDto.fromEntity(brand);
  }

  // ============= 5. جلب علامة بواسطة Slug (للعميل) =============
  async findOneBySlug(slug: string): Promise<BrandResponseDto> {
    const brand = await this.brandModel
      .findOne({ slug, is_active: true })
      .lean()
      .exec();
    if (!brand) {
      throw new NotFoundException(`Brand with slug "${slug}" not found`);
    }
    return BrandResponseDto.fromEntity(brand);
  }

  // ============= 6. تحديث علامة تجارية =============
  async update(id: string, updateDto: UpdateBrandDto): Promise<BrandResponseDto> {
    const currentBrand = await this.brandModel.findById(id).exec();
    if (!currentBrand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    // إذا تغير الاسم، قم بتحديث الـ Slug
    let newSlug = currentBrand.slug;
    if (updateDto.name && updateDto.name !== currentBrand.name) {
      newSlug = this.generateSlug(updateDto.name);
      await this.ensureSlugIsUnique(newSlug, id);
    }

    const updatedBrand = await this.brandModel
      .findByIdAndUpdate(
        id,
        {
          ...updateDto,
          slug: newSlug,
        },
        { returnDocument: 'after', runValidators: true },
      )
      .lean()
      .exec();

    if (!updatedBrand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return BrandResponseDto.fromEntity(updatedBrand);
  }

  // ============= 7. حذف (تعطيل) علامة تجارية =============
  async remove(id: string): Promise<{ message: string }> {
    const brand = await this.findOneById(id);

    // هنا يمكنك إضافة تحقق: هل توجد منتجات مرتبطة بهذه العلامة؟
    // إذا كنت تريد منع الحذف في حال وجود منتجات، يمكنك إضافة هذا التحقق.
    // لكن في هذا التصميم، سنقوم بتعطيلها فقط.

    await this.brandModel.findByIdAndUpdate(id, { is_active: false }).exec();
    return { message: 'Brand deactivated successfully' };
  }

  // ============= دوال مساعدة (Helpers) =============

  private generateSlug(name: string): string {
    return slugify(name, {
      lower: true,
      strict: true,
      locale: 'ar',
      remove: /[*+~.()'"!:@]/g,
    });
  }

  private async ensureSlugIsUnique(slug: string, excludeId?: string): Promise<void> {
    const query: any = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await this.brandModel.findOne(query).lean().exec();
    if (existing) {
      throw new ConflictException(
        `Slug "${slug}" is already taken. Please change the name.`,
      );
    }
  }
}