import { Request, Response } from 'express';
import { reviewService } from './review.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const getFrameReviews = asyncHandler(async (req: Request, res: Response) => {
  const result = await reviewService.findByFrameId(
    req.params.frameId,
    req.query as Record<string, unknown>
  );
  res.json(result);
});

export const getReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.findById(req.params.id);
  res.json(review);
});

export const createReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const review = await reviewService.create(userId, req.body);
  res.status(201).json(review);
});

export const updateReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const review = await reviewService.update(req.params.id, userId, req.body);
  res.json(review);
});

export const deleteReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const isAdmin = req.user?.role === 'ADMIN';
  
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  await reviewService.delete(req.params.id, userId, isAdmin);
  res.status(204).send();
});

export const markReviewHelpful = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.markHelpful(req.params.id);
  res.json(review);
});

export const getUserReviewForFrame = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const review = await reviewService.getUserReviewForFrame(req.params.frameId, userId);
  res.json({ review });
});

export const getFrameStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await reviewService.getFrameStats(req.params.frameId);
  res.json(stats);
});
