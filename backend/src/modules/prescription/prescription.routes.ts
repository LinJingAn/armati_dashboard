import { Router } from 'express';
import {
  getPrescription,
  createPrescription,
  updatePrescription,
  upsertPrescription,
  deletePrescription,
} from './prescription.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  getPrescriptionSchema,
  createPrescriptionSchema,
  updatePrescriptionSchema,
} from './prescription.schema.js';

const router = Router();

router.use(authenticate);

// Get prescription for an order
router.get(
  '/order/:orderId',
  validate(getPrescriptionSchema),
  getPrescription
);

// Create prescription for an order
router.post(
  '/order/:orderId',
  authorize('ADMIN', 'COMPANY_MANAGER'),
  validate(createPrescriptionSchema),
  createPrescription
);

// Update prescription for an order
router.put(
  '/order/:orderId',
  authorize('ADMIN', 'COMPANY_MANAGER'),
  validate(updatePrescriptionSchema),
  updatePrescription
);

// Upsert (create or update) prescription for an order
router.patch(
  '/order/:orderId',
  authorize('ADMIN', 'COMPANY_MANAGER'),
  validate(createPrescriptionSchema),
  upsertPrescription
);

// Delete prescription for an order
router.delete(
  '/order/:orderId',
  authorize('ADMIN'),
  validate(getPrescriptionSchema),
  deletePrescription
);

export default router;
