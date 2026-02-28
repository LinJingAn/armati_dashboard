import { Router } from 'express';
import {
  getSupportTickets,
  getSupportTicket,
  createSupportTicket,
  updateSupportTicket,
} from './supportTicket.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createSupportTicketSchema,
  updateSupportTicketSchema,
  getSupportTicketSchema,
} from './supportTicket.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', getSupportTickets);
router.get('/:id', validate(getSupportTicketSchema), getSupportTicket);
router.post('/', validate(createSupportTicketSchema), createSupportTicket);
router.put('/:id', authorize('ADMIN'), validate(updateSupportTicketSchema), updateSupportTicket);

export default router;
