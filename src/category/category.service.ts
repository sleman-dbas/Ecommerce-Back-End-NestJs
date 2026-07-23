import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import slugify from 'slugify';

import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/responses/category-response.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  // --- 1. Create ---
  async create(createDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    let parent: any = null;
    let ancestors: Types.ObjectId[] = [];
    let depth = 0;
    let parentFullSlug: string | null = null;

    if (createDto.parent_id) {
      parent = await this.categoryModel.findById(createDto.parent_id).lean().exec();
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${createDto.parent_id} not found`,
        );
      }
      ancestors = [...(parent.ancestors ?? []), parent._id];
      depth = ancestors.length;
      parentFullSlug = parent.full_slug ?? null;
    }

    const slug = this.generateSlug(createDto.name);
    await this.ensureSlugIsUnique(slug, createDto.parent_id ? new Types.ObjectId(createDto.parent_id) : null);

    const newCategory = new this.categoryModel({
      ...createDto,
      parent_id: createDto.parent_id ? new Types.ObjectId(createDto.parent_id) : null,
      slug,
      full_slug: this.buildFullSlug(parentFullSlug, slug),
      ancestors,
      depth,
    });

    return CategoryResponseDto.fromEntity(await newCategory.save());
  }

  // --- 2. Admin Find All (with Pagination) ---
  async findAllAdmin(page: number = 1, limit: number = 10): Promise<{ data: CategoryResponseDto[]; total: number; page: number; lastPage: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.categoryModel
        .find()
        .sort({ sort_order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.categoryModel.countDocuments().exec(),
    ]);

    return {
      data: CategoryResponseDto.fromEntity(data),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // --- 3. Get Active Tree (for Frontend) ---
  async getActiveTree(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryModel
      .find({ is_active: true })
      .sort({ sort_order: 1, name: 1 })
      .lean()
      .exec();

    return CategoryResponseDto.fromEntity(this.buildTree(categories));
  }

  // --- 4. Find by ID ---
  async findOneById(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryModel.findById(id).lean().exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return CategoryResponseDto.fromEntity(category);
  }

  // --- 5. Find by Full Slug (Public) ---
  async findOneByFullSlug(fullSlug: string): Promise<CategoryResponseDto> {
    const category = await this.categoryModel
      .findOne({ full_slug: fullSlug, is_active: true })
      .lean()
      .exec();
    if (!category) {
      throw new NotFoundException(`Category with full slug "${fullSlug}" not found`);
    }
    return CategoryResponseDto.fromEntity(category);
  }

  // --- 6. Update ---
  async update(id: string, updateDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const session = await this.categoryModel.db.startSession();
    try {
      let response: CategoryResponseDto | null = null;

      await session.withTransaction(async () => {
        // MongoDB transactions are required here so a category move either updates
        // the node and every descendant together or rolls the entire hierarchy back.
        const currentCategory = await this.categoryModel
          .findById(id)
          .session(session)
          .lean()
          .exec();

        if (!currentCategory) {
          throw new NotFoundException(`Category with ID ${id} not found`);
        }

        if (updateDto.parent_id && updateDto.parent_id === id) {
          throw new BadRequestException('A category cannot be its own parent');
        }

        const currentFullSlug = currentCategory.full_slug ?? this.buildFullSlug(null, currentCategory.slug);

        let newParentId = currentCategory.parent_id ?? null;
        let newAncestors = [...(currentCategory.ancestors ?? [])];
        let newDepth = currentCategory.depth;
        let newParentFullSlug: string | null = null;

        if (updateDto.parent_id !== undefined) {
          if (updateDto.parent_id === null || updateDto.parent_id === '') {
            newParentId = null;
            newAncestors = [];
            newDepth = 0;
            newParentFullSlug = null;
          } else {
            const newParent = await this.categoryModel
              .findById(updateDto.parent_id)
              .session(session)
              .lean()
              .exec();

            if (!newParent) {
              throw new NotFoundException('New parent category not found');
            }

            if (
              newParent._id.toString() === id ||
              (newParent.ancestors ?? []).some((ancestorId: Types.ObjectId) => ancestorId.toString() === id)
            ) {
              throw new BadRequestException(
                'Cannot set a descendant category as the parent',
              );
            }

            newParentId = new Types.ObjectId(updateDto.parent_id);
            newAncestors = [...(newParent.ancestors ?? []), newParent._id];
            newDepth = newAncestors.length;
            newParentFullSlug = newParent.full_slug ?? null;
          }
        }

        let newSlug = currentCategory.slug;
        if (updateDto.name && updateDto.name !== currentCategory.name) {
          newSlug = this.generateSlug(updateDto.name);
        }

        const resolvedParentFullSlug = newParentId
          ? newParentFullSlug ?? this.getParentFullSlugFromPath(currentFullSlug)
          : null;
        const nextFullSlug = this.buildFullSlug(resolvedParentFullSlug, newSlug);

        if (updateDto.name || updateDto.parent_id !== undefined) {
          await this.ensureSlugIsUnique(newSlug, newParentId, id, session);
        }

        const updatedCategory = await this.categoryModel
          .findByIdAndUpdate(
            id,
            {
              ...updateDto,
              parent_id: newParentId,
              slug: newSlug,
              full_slug: nextFullSlug,
              ancestors: newAncestors,
              depth: newDepth,
            },
            { returnDocument: 'after', runValidators: true, session },
          )
          .exec();

        if (!updatedCategory) {
          throw new NotFoundException(`Category with ID ${id} not found`);
        }

        if (nextFullSlug !== currentFullSlug) {
          await this.updateDescendantsHierarchy(
            currentCategory,
            updatedCategory,
            currentFullSlug,
            nextFullSlug,
            session,
          );
        }

        response = CategoryResponseDto.fromEntity(updatedCategory);
      });

      if (!response) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return response;
    } finally {
      await session.endSession();
    }
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

  private buildFullSlug(parentFullSlug: string | null, slug: string): string {
    return parentFullSlug ? `${parentFullSlug}/${slug}` : slug;
  }

  private getParentFullSlugFromPath(fullSlug: string): string | null {
    const lastSlashIndex = fullSlug.lastIndexOf('/');
    return lastSlashIndex === -1 ? null : fullSlug.slice(0, lastSlashIndex);
  }

  private async ensureSlugIsUnique(
    slug: string,
    parentId: Types.ObjectId | null,
    excludeId?: string,
    session?: ClientSession,
  ): Promise<void> {
    const query: any = { slug, parent_id: parentId };
    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const uniqueQuery = this.categoryModel.findOne(query);
    if (session) {
      uniqueQuery.session(session);
    }
    const existing = await uniqueQuery.lean().exec();
    if (existing) {
      throw new ConflictException(
        `Slug "${slug}" is already taken within this parent category. Please change the name.`,
      );
    }
  }

  private buildTree(categories: any[]): any[] {
    // O(n): one pass indexes nodes in a Map and one pass wires each node to its parent.
    const map = new Map<string, any>();
    const roots: any[] = [];

    categories.forEach((cat) => {
      map.set(cat._id.toString(), { ...cat, children: [] });
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

  private async updateDescendantsHierarchy(
    oldCategory: any,
    newCategory: any,
    oldFullSlug: string,
    newFullSlug: string,
    session: ClientSession,
  ): Promise<void> {
    const oldPrefix = [...(oldCategory.ancestors ?? []), oldCategory._id];
    const newPrefix = [...(newCategory.ancestors ?? []), newCategory._id];

    const descendants = await this.categoryModel
      .find({
        ancestors: oldCategory._id,
        _id: { $ne: newCategory._id },
      })
      .session(session)
      .sort({ depth: 1 })
      .exec();

    for (const desc of descendants) {
      const relativeAncestors = desc.ancestors.slice(oldPrefix.length);
      const updatedAncestors = [...newPrefix, ...relativeAncestors];
      const descendantSuffix = desc.full_slug.slice(oldFullSlug.length + 1);

      // Sequential updates are preferred over bulkWrite because each descendant must
      // preserve transactional rollback semantics and remain easy to reason about.
      await this.categoryModel
        .findByIdAndUpdate(
          desc._id,
          {
            ancestors: updatedAncestors,
            depth: updatedAncestors.length,
            full_slug: `${newFullSlug}/${descendantSuffix}`,
          },
          { session },
        )
        .exec();
    }
  }
}