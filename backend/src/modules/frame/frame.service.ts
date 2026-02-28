import prisma from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePaginationParams, parseOrderBy, PaginatedResponse } from '../../utils/pagination.js';
import type { CreateFrameInput, UpdateFrameInput } from './frame.schema.js';
import type { Frame } from '@prisma/client';

interface FrameWithReviewStats extends Frame {
  reviewCount: number;
  averageRating: number;
}

export class FrameService {
  async findAll(query: Record<string, unknown>): Promise<PaginatedResponse<FrameWithReviewStats>> {
    const { limit, offset, sort } = parsePaginationParams(query);
    const orderBy = parseOrderBy(sort);

    const where: Record<string, unknown> = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    if (query.category) {
      where.category = { equals: String(query.category), mode: 'insensitive' };
    }

    if (query.brand) {
      where.brand = { equals: String(query.brand), mode: 'insensitive' };
    }

    if (query.size) {
      where.size = { equals: String(query.size), mode: 'insensitive' };
    }

    if (query.color) {
      where.color = { contains: String(query.color), mode: 'insensitive' };
    }

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) {
        (where.price as Record<string, number>).gte = Number(query.minPrice);
      }
      if (query.maxPrice) {
        (where.price as Record<string, number>).lte = Number(query.maxPrice);
      }
    }

    if (query.search) {
      where.OR = [
        { modelName: { contains: String(query.search), mode: 'insensitive' } },
        { sku: { contains: String(query.search), mode: 'insensitive' } },
        { color: { contains: String(query.search), mode: 'insensitive' } },
        { category: { contains: String(query.search), mode: 'insensitive' } },
        { brand: { contains: String(query.search), mode: 'insensitive' } },
      ];
    }

    const [frames, total] = await Promise.all([
      prisma.frame.findMany({
        where,
        take: Number(limit) || 50,
        skip: Number(offset) || 0,
        orderBy,
        include: {
          reviews: {
            select: { rating: true },
          },
        },
      }),
      prisma.frame.count({ where }),
    ]);

    // Calculate review stats for each frame
    const items: FrameWithReviewStats[] = frames.map((frame) => {
      const reviews = (frame as typeof frame & { reviews: { rating: number }[] }).reviews || [];
      const reviewCount = reviews.length;
      const averageRating = reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

      // Remove the reviews array from the response (we only need the stats)
      const { reviews: _reviews, ...frameData } = frame as typeof frame & { reviews: { rating: number }[] };

      return {
        ...frameData,
        reviewCount,
        averageRating: Math.round(averageRating * 10) / 10,
      };
    });

    return { items, total, limit, offset };
  }

  async findById(id: string): Promise<Frame> {
    const frame = await prisma.frame.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!frame) {
      throw ApiError.notFound('Frame not found');
    }

    return frame;
  }

  async create(data: CreateFrameInput): Promise<Frame> {
    return prisma.frame.create({
      data: {
        modelName: data.modelName,
        sku: data.sku || null,
        color: data.color || null,
        size: data.size || null,
        category: data.category || null,
        brand: data.brand || null,
        price: data.price ?? 149.00,
        image1Url: data.image1Url || null,
        image2Url: data.image2Url || null,
        image3Url: data.image3Url || null,
        image4Url: data.image4Url || null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateFrameInput): Promise<Frame> {
    const frame = await prisma.frame.findUnique({ where: { id } });

    if (!frame) {
      throw ApiError.notFound('Frame not found');
    }

    return prisma.frame.update({
      where: { id },
      data: {
        ...(data.modelName && { modelName: data.modelName }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.size !== undefined && { size: data.size }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.brand !== undefined && { brand: data.brand }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.image1Url !== undefined && { image1Url: data.image1Url }),
        ...(data.image2Url !== undefined && { image2Url: data.image2Url }),
        ...(data.image3Url !== undefined && { image3Url: data.image3Url }),
        ...(data.image4Url !== undefined && { image4Url: data.image4Url }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    const frame = await prisma.frame.findUnique({ where: { id } });

    if (!frame) {
      throw ApiError.notFound('Frame not found');
    }

    await prisma.frame.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const frameService = new FrameService();
