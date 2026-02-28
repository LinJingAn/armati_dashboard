import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    frameId: z.string().uuid('Invalid frame ID'),
    rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
    title: z.string().max(100).optional().nullable(),
    comment: z.string().max(1000).optional().nullable(),
  }),
});

export const updateReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    rating: z.number().min(1).max(5).optional(),
    title: z.string().max(100).optional().nullable(),
    comment: z.string().max(1000).optional().nullable(),
  }),
});

export const getReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getFrameReviewsSchema = z.object({
  params: z.object({
    frameId: z.string().uuid(),
  }),
});

export const markHelpfulSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>['body'];
