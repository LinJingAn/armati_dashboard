import prisma from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePaginationParams, parseOrderBy, PaginatedResponse } from '../../utils/pagination.js';
import type { CreateReviewInput, UpdateReviewInput } from './review.schema.js';
import type { Review } from '@prisma/client';

interface ReviewWithUser extends Review {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface FrameReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export class ReviewService {
  async findByFrameId(
    frameId: string,
    query: Record<string, unknown>
  ): Promise<PaginatedResponse<ReviewWithUser> & { stats: FrameReviewStats }> {
    const { limit, offset, sort } = parsePaginationParams(query);
    const orderBy = parseOrderBy(sort || '-createdAt');

    const frame = await prisma.frame.findUnique({ where: { id: frameId } });
    if (!frame) {
      throw ApiError.notFound('Frame not found');
    }

    const [items, total, stats] = await Promise.all([
      prisma.review.findMany({
        where: { frameId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        take: Number(limit) || 10,
        skip: Number(offset) || 0,
        orderBy,
      }),
      prisma.review.count({ where: { frameId } }),
      this.getFrameStats(frameId),
    ]);

    return { items, total, limit, offset, stats };
  }

  async getFrameStats(frameId: string): Promise<FrameReviewStats> {
    const reviews = await prisma.review.findMany({
      where: { frameId },
      select: { rating: true },
    });

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    reviews.forEach((review) => {
      ratingDistribution[review.rating as 1 | 2 | 3 | 4 | 5]++;
      totalRating += review.rating;
    });

    return {
      averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
      totalReviews: reviews.length,
      ratingDistribution,
    };
  }

  async findById(id: string): Promise<ReviewWithUser> {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    return review;
  }

  async create(userId: string, data: CreateReviewInput): Promise<Review> {
    const frame = await prisma.frame.findUnique({ where: { id: data.frameId } });
    if (!frame) {
      throw ApiError.notFound('Frame not found');
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        frameId_userId: {
          frameId: data.frameId,
          userId,
        },
      },
    });

    if (existingReview) {
      throw ApiError.badRequest('You have already reviewed this product');
    }

    return prisma.review.create({
      data: {
        frameId: data.frameId,
        userId,
        rating: data.rating,
        title: data.title || null,
        comment: data.comment || null,
        isVerified: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, userId: string, data: UpdateReviewInput): Promise<Review> {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    if (review.userId !== userId) {
      throw ApiError.forbidden('You can only edit your own reviews');
    }

    return prisma.review.update({
      where: { id },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.comment !== undefined && { comment: data.comment }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    if (review.userId !== userId && !isAdmin) {
      throw ApiError.forbidden('You can only delete your own reviews');
    }

    await prisma.review.delete({ where: { id } });
  }

  async markHelpful(id: string): Promise<Review> {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    return prisma.review.update({
      where: { id },
      data: {
        helpful: { increment: 1 },
      },
    });
  }

  async getUserReviewForFrame(frameId: string, userId: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: {
        frameId_userId: {
          frameId,
          userId,
        },
      },
    });
  }
}

export const reviewService = new ReviewService();
