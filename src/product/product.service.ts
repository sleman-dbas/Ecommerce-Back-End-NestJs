import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';

import { Product, ProductDocument } from './schemas/product.schema';
import { Category, CategoryDocument } from '../category/schemas/category.schema';
import { Brand } from '../brand/schemas/brand.schema';
import { Supplier } from '../supplier/schemas/supplier.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto, SortBy } from './dto/filter-products.dto';
import { ProductResponseDto } from './dto/responses/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Brand.name) private brandModel: Model<Brand>,
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
  ) {}

  // ==================== 1. إنشاء منتج ====================
  async create(createDto: CreateProductDto): Promise<ProductResponseDto> {
    // 1. التحقق من صحة العلاقات
    await this.validateRelations(createDto);

    // 2. توليد الـ Slug
    const slug = this.generateSlug(createDto.name);
    await this.ensureSlugIsUnique(slug);

    // 3. التحقق من فريدة الـ SKU
    await this.ensureSkuIsUnique(createDto.sku);

    // 4. حساب is_on_sale تلقائياً
    const isOnSale = !!(
      createDto.compare_at_price && createDto.compare_at_price > createDto.price
    );

    // 5. إنشاء المنتج
    const newProduct = new this.productModel({
      ...createDto,
      slug,
      is_on_sale: isOnSale,
    });

    const saved = await newProduct.save();
    return ProductResponseDto.fromEntity(saved);
  }

  // ==================== 2. جلب المنتجات (Admin - Offset Pagination) ====================
  async findAllAdmin(
    filters: FilterProductsDto,
  ): Promise<{ data: ProductResponseDto[]; total: number; page: number; lastPage: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter = this.buildFilter(filters);
    const sortOptions = this.buildSortOptions(filters.sort_by ?? SortBy.NEWEST);

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('category_id', 'name slug full_slug')
        .populate('brand_id', 'name slug')
        .populate('supplier_id', 'name slug')
        .lean()
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      data: ProductResponseDto.fromEntityArray(data),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // ==================== 3. جلب المنتجات العامة (Cursor Pagination) ====================
  async findAllPublic(
    filters: FilterProductsDto,
    cursor?: string,
    limit: number = 10,
  ): Promise<{ data: ProductResponseDto[]; nextCursor: string | null; hasNextPage: boolean }> {
    const filter = this.buildFilter(filters);
    filter.is_active = true;

    // تطبيق الـ Cursor
    if (cursor) {
      if (!Types.ObjectId.isValid(cursor)) {
        throw new BadRequestException('Invalid cursor format');
      }
      filter._id = { $gt: new Types.ObjectId(cursor) };
    }

    const sortOptions = this.buildSortOptions(filters.sort_by ?? SortBy.NEWEST);

    const products = await this.productModel
      .find(filter)
      .sort(sortOptions)
      .limit(limit + 1)
      .populate('category_id', 'name slug full_slug')
      .populate('brand_id', 'name slug')
      .lean()
      .exec();

    const hasNextPage = products.length > limit;
    const data = products.slice(0, limit);

    let nextCursor: string | null = null;
    if (hasNextPage && data.length > 0) {
      nextCursor = data[data.length - 1]._id.toString();
    }

    return {
      data: ProductResponseDto.fromEntityArray(data),
      nextCursor,
      hasNextPage,
    };
  }

  // ==================== 4. جلب منتجات تصنيف معين (باستخدام ancestors) ====================
  async findByCategorySlug(
    categoryFullSlug: string,
    filters: FilterProductsDto,
    cursor?: string,
    limit: number = 10,
  ): Promise<{ data: ProductResponseDto[]; nextCursor: string | null; hasNextPage: boolean }> {
    // 1. جلب التصنيف
    const category = await this.categoryModel
      .findOne({ full_slug: categoryFullSlug, is_active: true })
      .lean()
      .exec();

    if (!category) {
      throw new NotFoundException(
        `Category with full_slug "${categoryFullSlug}" not found`,
      );
    }

    // 2. جلب جميع التصنيفات الفرعية باستخدام ancestors
    const subCategories = await this.categoryModel
      .find({
        ancestors: category._id,
        is_active: true,
      })
      .select('_id')
      .lean()
      .exec();

    const categoryIds = [category._id, ...subCategories.map((sub) => sub._id)];

    // 3. بناء الفلتر
    const filter = this.buildFilter(filters);
    filter.category_id = { $in: categoryIds };
    filter.is_active = true;

    // 4. تطبيق Cursor
    if (cursor) {
      if (!Types.ObjectId.isValid(cursor)) {
        throw new BadRequestException('Invalid cursor format');
      }
      filter._id = { $gt: new Types.ObjectId(cursor) };
    }

    const sortOptions = this.buildSortOptions(filters.sort_by ?? SortBy.NEWEST);

    const products = await this.productModel
      .find(filter)
      .sort(sortOptions)
      .limit(limit + 1)
      .populate('category_id', 'name slug full_slug')
      .populate('brand_id', 'name slug')
      .lean()
      .exec();

    const hasNextPage = products.length > limit;
    const data = products.slice(0, limit);

    let nextCursor: string | null = null;
    if (hasNextPage && data.length > 0) {
      nextCursor = data[data.length - 1]._id.toString();
    }

    return {
      data: ProductResponseDto.fromEntityArray(data),
      nextCursor,
      hasNextPage,
    };
  }

  // ==================== 5. جلب منتج بواسطة ID ====================
  async findOneById(id: string): Promise<ProductResponseDto> {
    const product = await this.productModel
      .findById(id)
      .populate('category_id', 'name slug full_slug')
      .populate('brand_id', 'name slug')
      .populate('supplier_id', 'name slug')
      .populate('tax_id', 'name type rate')
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return ProductResponseDto.fromEntity(product);
  }

  // ==================== 6. جلب منتج بواسطة Slug (للعميل) ====================
  async findOneBySlug(slug: string): Promise<ProductResponseDto> {
    const product = await this.productModel
      .findOne({ slug, is_active: true })
      .populate('category_id', 'name slug full_slug')
      .populate('brand_id', 'name slug')
      .populate('supplier_id', 'name slug')
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    // زيادة المشاهدات (بدون انتظار)
    this.productModel.findByIdAndUpdate(product._id, { $inc: { views: 1 } }).exec();

    return ProductResponseDto.fromEntity(product);
  }

  // ==================== 7. تحديث منتج ====================
  async update(id: string, updateDto: UpdateProductDto): Promise<ProductResponseDto> {
    const currentProduct = await this.productModel.findById(id).exec();
    if (!currentProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // 1. تحديث العلاقات إن تغيرت
    if (updateDto.category_id || updateDto.brand_id || updateDto.supplier_id) {
      await this.validateRelations(updateDto);
    }

    // 2. تحديث الـ Slug
    let newSlug = currentProduct.slug;
    if (updateDto.name && updateDto.name !== currentProduct.name) {
      newSlug = this.generateSlug(updateDto.name);
      await this.ensureSlugIsUnique(newSlug, id);
    }

    // 3. تحديث الـ SKU
    if (updateDto.sku && updateDto.sku !== currentProduct.sku) {
      await this.ensureSkuIsUnique(updateDto.sku, id);
    }

    // 4. إعادة حساب is_on_sale
    const compareAtPrice = updateDto.compare_at_price ?? currentProduct.compare_at_price;
    const price = updateDto.price ?? currentProduct.price;
    const isOnSale = !!(compareAtPrice && compareAtPrice > price);

    // 5. التحديث
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(
        id,
        {
          ...updateDto,
          slug: newSlug,
          is_on_sale: isOnSale,
        },
        { new: true, runValidators: true },
      )
      .populate('category_id', 'name slug full_slug')
      .populate('brand_id', 'name slug')
      .populate('supplier_id', 'name slug')
      .lean()
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return ProductResponseDto.fromEntity(updatedProduct);
  }

  // ==================== 8. تحديث المخزون ====================
  async updateStock(id: string, quantity: number): Promise<ProductResponseDto> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${Math.abs(quantity)}`,
      );
    }

    const updated = await this.productModel
      .findByIdAndUpdate(id, { stock: newStock }, { new: true })
      .populate('category_id', 'name slug full_slug')
      .populate('brand_id', 'name slug')
      .populate('supplier_id', 'name slug')
      .lean()
      .exec();

    return ProductResponseDto.fromEntity(updated);
  }

  // ==================== 9. حذف (تعطيل) منتج ====================
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.productModel
      .findByIdAndUpdate(id, { is_active: false }, { new: true })
      .lean()
      .exec();

    if (!result) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return { message: 'Product deactivated successfully' };
  }

  // ==================== دوال مساعدة ====================

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
    const existing = await this.productModel.findOne(query).lean().exec();
    if (existing) {
      throw new ConflictException(`Slug "${slug}" is already taken.`);
    }
  }

  private async ensureSkuIsUnique(sku: string, excludeId?: string): Promise<void> {
    const query: any = { sku: sku.toUpperCase().trim() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await this.productModel.findOne(query).lean().exec();
    if (existing) {
      throw new ConflictException(`SKU "${sku}" is already taken.`);
    }
  }

  private async validateRelations(dto: Partial<CreateProductDto>): Promise<void> {
    if (dto.category_id) {
      const category = await this.categoryModel.findById(dto.category_id).lean().exec();
      if (!category) throw new NotFoundException('Category not found');
    }

    if (dto.brand_id) {
      const brand = await this.brandModel.findById(dto.brand_id).lean().exec();
      if (!brand) throw new NotFoundException('Brand not found');
    }

    if (dto.supplier_id) {
      const supplier = await this.supplierModel.findById(dto.supplier_id).lean().exec();
      if (!supplier) throw new NotFoundException('Supplier not found');
    }
  }

  private buildFilter(filters: FilterProductsDto): any {
    const filter: any = {};

    if (filters.search) {
      filter.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.category_id) filter.category_id = filters.category_id;
    if (filters.brand_id) filter.brand_id = filters.brand_id;
    if (filters.supplier_id) filter.supplier_id = filters.supplier_id;

    if (filters.min_price !== undefined || filters.max_price !== undefined) {
      filter.price = {};
      if (filters.min_price !== undefined) filter.price.$gte = filters.min_price;
      if (filters.max_price !== undefined) filter.price.$lte = filters.max_price;
    }

    if (filters.is_active !== undefined) filter.is_active = filters.is_active;
    if (filters.is_featured !== undefined) filter.is_featured = filters.is_featured;
    if (filters.is_new !== undefined) filter.is_new = filters.is_new;
    if (filters.is_on_sale !== undefined) filter.is_on_sale = filters.is_on_sale;

    if (filters.in_stock !== undefined) {
      filter.stock = filters.in_stock ? { $gt: 0 } : 0;
    }

    return filter;
  }

  private buildSortOptions(sortBy: SortBy): any {
    switch (sortBy) {
      case SortBy.PRICE_ASC:
        return { price: 1 };
      case SortBy.PRICE_DESC:
        return { price: -1 };
      case SortBy.NAME_ASC:
        return { name: 1 };
      case SortBy.NAME_DESC:
        return { name: -1 };
      case SortBy.NEWEST:
        return { createdAt: -1 };
      case SortBy.OLDEST:
        return { createdAt: 1 };
      case SortBy.POPULARITY:
        return { views: -1 };
      case SortBy.RATING:
        return { average_rating: -1 };
      case SortBy.BEST_SELLING:
        return { sold_count: -1 };
      default:
        return { createdAt: -1 };
    }
  }
}