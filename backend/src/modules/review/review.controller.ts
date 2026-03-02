import { Request, Response } from 'express';
import { reviewService } from './review.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const str = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? v[0] ?? '' : (v ?? '');

export const getFrameReviews = asyncHandler(async (req: Request, res: Response) => {
  const result = await reviewService.findByFrameId(
    str(req.params.frameId),
    req.query as Record<string, unknown>
  );
  res.json(result);
});

export const getReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.findById(str(req.params.id));
  res.json(review);
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const review = await reviewService.create(userId, req.body);
  res.status(201).json(review);
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const review = await reviewService.update(str(req.params.id), userId, req.body);
  res.json(review);
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const isAdmin = req.user?.role === 'ADMIN';
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  await reviewService.delete(str(req.params.id), userId, isAdmin);
  res.status(204).send();
});

export const markReviewHelpful = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.markHelpful(str(req.params.id));
  res.json(review);
});

export const getUserReviewForFrame = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const review = await reviewService.getUserReviewForFrame(str(req.params.frameId), userId);
  res.json({ review });
});

export const getFrameStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await reviewService.getFrameStats(str(req.params.frameId));
  res.json(stats);
});
