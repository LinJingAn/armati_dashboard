import { Router } from 'express';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} from './order.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createOrderSchema,
  updateOrderSchema,
  getOrderSchema,
} from './order.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', getOrders);
router.get('/:id', validate(getOrderSchema), getOrder);
router.post('/', validate(createOrderSchema), createOrder);
router.put('/:id', authorize('ADMIN'), validate(updateOrderSchema), updateOrder);
router.delete('/:id', authorize('ADMIN'), validate(getOrderSchema), deleteOrder);

export default router;
