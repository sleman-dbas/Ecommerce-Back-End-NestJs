import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';

import { Supplier, SupplierDocument } from './schemas/supplier.schema';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierResponseDto } from './dto/responses/supplier-response.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
    // ملاحظة: سيتم إضافة Product Model لاحقاً عند إنشاء وحدة المنتجات
    // @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  // ============= 1. إنشاء مورد جديد =============
  async create(createDto: CreateSupplierDto): Promise<SupplierResponseDto> {
    const slug = this.generateSlug(createDto.name);
    await this.ensureSlugIsUnique(slug);

    const newSupplier = new this.supplierModel({
      ...createDto,
      slug,
    });

    const saved = await newSupplier.save();
    return SupplierResponseDto.fromEntity(saved);
  }

  // ============= 2. جلب كل الموردين (للأدمن مع Pagination) =============
  async findAllAdmin(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      is_active?: boolean;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    },
  ): Promise<{ data: SupplierResponseDto[]; total: number; page: number; lastPage: number }> {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (filters?.is_active !== undefined) {
      filter.is_active = filters.is_active;
    }

    if (filters?.search) {
      filter.$text = { $search: filters.search };
    }

    const allowedSortFields = ['name', 'sort_order', 'rating', 'createdAt'];
    const sortOptions: any = {};

    if (filters?.sort_by && allowedSortFields.includes(filters.sort_by)) {
      sortOptions[filters.sort_by] = filters.sort_order === 'desc' ? -1 : 1;
    } else {
      // default sorting: by sort_order ascending, then by name ascending
      sortOptions.sort_order = 1;
      sortOptions.name = 1;
    }

    // inhacment: if search is provided and sort_by is not provided, we will sort by text score 
    if (filters?.search && !filters?.sort_by) {
      sortOptions.score = { $meta: 'textScore' };
    }

    const [data, total] = await Promise.all([
      this.supplierModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.supplierModel.countDocuments(filter).exec(),
    ]);

    return {
      data: SupplierResponseDto.fromEntityArray(data),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // ============= 3. جلب الموردين النشطين فقط (للعميل) =============
  async findAllPublic(): Promise<SupplierResponseDto[]> {
    const suppliers = await this.supplierModel
      .find({ is_active: true })
      .sort({ sort_order: 1, name: 1 })
      .lean()
      .exec();

    return SupplierResponseDto.fromEntityArray(suppliers);
  }

  // ============= 4. جلب مورد بواسطة ID =============
  async findOneById(id: string): Promise<SupplierResponseDto> {
    const supplier = await this.supplierModel.findById(id).lean().exec();
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    return SupplierResponseDto.fromEntity(supplier);
  }

  // ============= 5. جلب مورد بواسطة Slug (للعميل) =============
  async findOneBySlug(slug: string): Promise<SupplierResponseDto> {
    const supplier = await this.supplierModel
      .findOne({ slug, is_active: true })
      .lean()
      .exec();
    if (!supplier) {
      throw new NotFoundException(`Supplier with slug "${slug}" not found`);
    }
    return SupplierResponseDto.fromEntity(supplier);
  }

  // ============= 6. تحديث مورد =============
  async update(id: string, updateDto: UpdateSupplierDto): Promise<SupplierResponseDto> {
    const currentSupplier = await this.supplierModel.findById(id).exec();
    if (!currentSupplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    let newSlug = currentSupplier.slug;
    if (updateDto.name && updateDto.name !== currentSupplier.name) {
      newSlug = this.generateSlug(updateDto.name);
      await this.ensureSlugIsUnique(newSlug, id);
    }

    const updatedSupplier = await this.supplierModel
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

    if (!updatedSupplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return SupplierResponseDto.fromEntity(updatedSupplier);
  }

  // ============= 7. حذف (تعطيل) مورد مع التحقق من المنتجات =============
  async remove(id: string): Promise<{ message: string }> {
    // 1. التحقق من وجود المورد (استعلام واحد فقط بدلاً من استدعاء findOneById)
    const supplier = await this.supplierModel.findById(id).lean().exec();
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    // 2. (إلزامي) التحقق من وجود منتجات مرتبطة بهذا المورد
    //    هذا يمنع تعطيل مورد لديه منتجات نشطة.
    //    ملاحظة: سيتم تفعيل هذا الكود عند إنشاء نموذج Product.
    /*
    const productsCount = await this.productModel.countDocuments({
      supplier_id: id,
      is_active: true, // نتأكد من وجود منتجات نشطة فقط
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        `Cannot deactivate supplier with ${productsCount} associated active product(s). Please reassign or delete them first.`,
      );
    }
    */

    // 3. تعطيل المورد (حذف ناعم)
    await this.supplierModel.findByIdAndUpdate(id, { is_active: false }).exec();

    return { message: 'Supplier deactivated successfully' };
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
    const existing = await this.supplierModel.findOne(query).lean().exec();
    if (existing) {
      throw new ConflictException(
        `Slug "${slug}" is already taken. Please change the name.`,
      );
    }
  }
}