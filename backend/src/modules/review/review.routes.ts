import { Router } from 'express';
import {
  getFrameReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getUserReviewForFrame,
  getFrameStats,
} from './review.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import {
  createReviewSchema,
  updateReviewSchema,
  getReviewSchema,
  getFrameReviewsSchema,
  markHelpfulSchema,
} from './review.schema.js';

const router = Router();

router.get('/frame/:frameId', validate(getFrameReviewsSchema), getFrameReviews);
router.get('/frame/:frameId/stats', validate(getFrameReviewsSchema), getFrameStats);

router.use(authenticate);

router.get('/frame/:frameId/user', validate(getFrameReviewsSchema), getUserReviewForFrame);
router.get('/:id', validate(getReviewSchema), getReview);
router.post('/', validate(createReviewSchema), createReview);
router.put('/:id', validate(updateReviewSchema), updateReview);
router.delete('/:id', validate(getReviewSchema), deleteReview);
router.post('/:id/helpful', validate(markHelpfulSchema), markReviewHelpful);

export default router;
