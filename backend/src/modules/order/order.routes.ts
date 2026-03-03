import { Router } from 'express';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  addOrderItems,
  updateOrderItem,
  removeOrderItem,
  transitionOrderStatus,
  getAvailableTransitions,
  getOrderStatusHistory,
} from './order.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createOrderSchema,
  updateOrderSchema,
  getOrderSchema,
  addOrderItemsSchema,
  updateOrderItemSchema,
  removeOrderItemSchema,
  transitionStatusSchema,
} from './order.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', getOrders);
router.get('/:id', validate(getOrderSchema), getOrder);
router.post('/', validate(createOrderSchema), createOrder);
router.put('/:id', authorize('ADMIN'), validate(updateOrderSchema), updateOrder);
router.delete('/:id', authorize('ADMIN'), validate(getOrderSchema), deleteOrder);

// Order items management
router.post('/:id/items', authorize('ADMIN', 'COMPANY_MANAGER'), validate(addOrderItemsSchema), addOrderItems);
router.patch('/:id/items/:itemId', authorize('ADMIN', 'COMPANY_MANAGER'), validate(updateOrderItemSchema), updateOrderItem);
router.delete('/:id/items/:itemId', authorize('ADMIN', 'COMPANY_MANAGER'), validate(removeOrderItemSchema), removeOrderItem);

// Status workflow
router.get('/:id/transitions', validate(getOrderSchema), getAvailableTransitions);
router.get('/:id/status-history', validate(getOrderSchema), getOrderStatusHistory);
router.post('/:id/transition', authorize('ADMIN', 'COMPANY_MANAGER'), validate(transitionStatusSchema), transitionOrderStatus);

export default router;
