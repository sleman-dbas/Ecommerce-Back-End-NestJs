import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import  slugify from 'slugify';

import { Category, CategoryDocument } from './category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  // --- 1. Create ---
  async create(createDto: CreateCategoryDto): Promise<CategoryDocument> {
    let parent: CategoryDocument | null = null;  
    let depth = 0;
    let fullPath = '';

    if (createDto.parent_id) {
      parent = await this.categoryModel.findById(createDto.parent_id).exec();
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${createDto.parent_id} not found`,
        );
      }
      depth = parent.tree_depth + 1;
      fullPath = parent.path ? `${parent.path},${parent._id}` : `${parent._id}`;
    }

    const slug = this.generateSlug(createDto.name);
    await this.ensureSlugIsUnique(slug);

    const newCategory = new this.categoryModel({
      ...createDto,
      slug,
      tree_depth: depth,
      path: fullPath,
    });

    return await newCategory.save();
  }

  // --- 2. Admin Find All (with Pagination) ---
  async findAllAdmin(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.categoryModel
        .find()
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.categoryModel.countDocuments().exec(),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // --- 3. Get Active Tree (for Frontend) ---
  async getActiveTree(): Promise<any[]> {
    const categories = await this.categoryModel
      .find({ is_active: true })
      .sort({ order: 1, name: 1 })
      .exec();

    return this.buildTree(categories);
  }

  // --- 4. Find by ID ---
  async findOneById(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  // --- 5. Find by Slug (Public) ---
  async findOneBySlug(slug: string): Promise<CategoryDocument> {
    const category = await this.categoryModel
      .findOne({ slug, is_active: true })
      .exec();
    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }
    return category;
  }

  // --- 6. Update ---
  async update(id: string, updateDto: UpdateCategoryDto): Promise<CategoryDocument> {
    const currentCategory = await this.findOneById(id);

    if (updateDto.parent_id && updateDto.parent_id === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    let newDepth = currentCategory.tree_depth;
    let newPath = currentCategory.path;

    if (updateDto.parent_id !== undefined) {
      if (updateDto.parent_id === null || updateDto.parent_id === '') {
        newDepth = 0;
        newPath = '';
      } else {
        const newParent = await this.categoryModel.findById(updateDto.parent_id).exec();
        if (!newParent) {
          throw new NotFoundException('New parent category not found');
        }
        if (newParent.path.includes(id) || newParent._id.toString() === id) {
          throw new BadRequestException(
            'Cannot set a descendant category as the parent',
          );
        }
        newDepth = newParent.tree_depth + 1;
        newPath = newParent.path
          ? `${newParent.path},${newParent._id}`
          : `${newParent._id}`;
      }
    }

    let newSlug = currentCategory.slug;
    if (updateDto.name && updateDto.name !== currentCategory.name) {
      newSlug = this.generateSlug(updateDto.name);
      await this.ensureSlugIsUnique(newSlug, id);
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(
        id,
        {
          ...updateDto,
          slug: newSlug,
          tree_depth: newDepth,
          path: newPath,
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (updateDto.parent_id !== undefined) {
      await this.updateDescendantsPaths(currentCategory, updatedCategory);
    }

    return updatedCategory;
  }

  // --- 7. Remove (Soft Delete) ---
  async remove(id: string): Promise<{ message: string }> {
    const category = await this.findOneById(id);

    const childrenCount = await this.categoryModel
      .countDocuments({ parent_id: id })
      .exec();
    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete a category that has sub-categories. Please delete them first.',
      );
    }

    await this.categoryModel.findByIdAndUpdate(id, { is_active: false }).exec();
    return { message: 'Category deactivated successfully' };
  }

  // ================= Helper Methods =================

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
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const existing = await this.categoryModel.findOne(query).exec();
    if (existing) {
      throw new ConflictException(
        `Slug "${slug}" is already taken. Please change the name.`,
      );
    }
  }

  private buildTree(categories: any[]): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

    categories.forEach((cat) => {
      const obj = cat.toObject ? cat.toObject() : cat;
      map.set(obj._id.toString(), { ...obj, children: [] });
    });

    categories.forEach((cat) => {
      const node = map.get(cat._id.toString());
      if (cat.parent_id && map.has(cat.parent_id.toString())) {
        const parentNode = map.get(cat.parent_id.toString());
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  private async updateDescendantsPaths(
    oldCategory: CategoryDocument,
    newCategory: CategoryDocument,
  ): Promise<void> {
    const oldPathPrefix = oldCategory.path
      ? `${oldCategory.path},${oldCategory._id}`
      : `${oldCategory._id}`;

    const newPathPrefix = newCategory.path
      ? `${newCategory.path},${newCategory._id}`
      : `${newCategory._id}`;

    const depthOffset = newCategory.tree_depth - oldCategory.tree_depth;

    const descendants = await this.categoryModel
      .find({
        path: { $regex: new RegExp('^' + oldPathPrefix) },
        _id: { $ne: newCategory._id },
      })
      .exec();

    for (const desc of descendants) {
      const updatedPath = desc.path.replace(oldPathPrefix, newPathPrefix);
      const updatedDepth = desc.tree_depth + depthOffset;

      await this.categoryModel
        .findByIdAndUpdate(desc._id, {
          path: updatedPath,
          tree_depth: updatedDepth,
        })
        .exec();
    }
    // Note: The above loop updates each descendant one by one. For large trees, consider using bulkWrite for efficiency.
    // the reasone do not use bulkWrite is because the Category is not a large collection and the number of descendants is usually small. If you expect a large number of descendants, you can uncomment the following bulkWrite implementation for better performance.
    // const bulkOps = descendants.map(desc => ({
    //   updateOne: {
    //     filter: { _id: desc._id },
    //     update: {
    //       path: desc.path.replace(oldPathPrefix, newPathPrefix),
    //       tree_depth: desc.tree_depth + depthOffset,
    //     },
    //   },
    // }));
    // await this.categoryModel.bulkWrite(bulkOps);
  }
}