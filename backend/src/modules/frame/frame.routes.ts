import { Router } from 'express';
import {
  getFrames,
  getFrame,
  createFrame,
  updateFrame,
  deleteFrame,
} from './frame.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createFrameSchema,
  updateFrameSchema,
  getFrameSchema,
} from './frame.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', getFrames);
router.get('/:id', validate(getFrameSchema), getFrame);
router.post('/', authorize('ADMIN', 'COMPANY_MANAGER'), validate(createFrameSchema), createFrame);
router.put('/:id', authorize('ADMIN', 'COMPANY_MANAGER'), validate(updateFrameSchema), updateFrame);
router.delete('/:id', authorize('ADMIN', 'COMPANY_MANAGER'), validate(getFrameSchema), deleteFrame);

export default router;
