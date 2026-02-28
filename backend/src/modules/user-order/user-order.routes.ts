import { Router } from 'express';
import {
  getUserOrders,
  getUserOrder,
  createUserOrder,
  updateUserOrder,
  cancelUserOrder,
  getUserOrderStats,
} from './user-order.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import {
  createUserOrderSchema,
  updateUserOrderSchema,
  getUserOrderSchema,
} from './user-order.schema.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getUserOrderStats);
router.get('/', getUserOrders);
router.get('/:id', validate(getUserOrderSchema), getUserOrder);
router.post('/', validate(createUserOrderSchema), createUserOrder);
router.put('/:id', validate(updateUserOrderSchema), updateUserOrder);
router.post('/:id/cancel', validate(getUserOrderSchema), cancelUserOrder);

export default router;
