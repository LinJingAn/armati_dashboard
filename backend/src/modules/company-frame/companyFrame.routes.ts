import { Router } from 'express';
import {
  getCompanyFrames,
  getAvailableFrames,
  assignFrames,
  unassignFrames,
  toggleFrame,
  getFrameCompanies,
  bulkAssignAllFrames,
} from './companyFrame.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  getCompanyFramesSchema,
  assignFramesSchema,
  unassignFramesSchema,
  toggleCompanyFrameSchema,
  getFrameCompaniesSchema,
} from './companyFrame.schema.js';

const router = Router();

router.use(authenticate);

// Get frames assigned to a company
router.get(
  '/company/:companyId',
  authorize('ADMIN', 'COMPANY_MANAGER'),
  validate(getCompanyFramesSchema),
  getCompanyFrames
);

// Get frames available to assign (not yet assigned)
router.get(
  '/company/:companyId/available',
  authorize('ADMIN', 'COMPANY_MANAGER'),
  validate(getCompanyFramesSchema),
  getAvailableFrames
);

// Assign frames to a company
router.post(
  '/company/:companyId/assign',
  authorize('ADMIN'),
  validate(assignFramesSchema),
  assignFrames
);

// Bulk assign all active frames to a company
router.post(
  '/company/:companyId/assign-all',
  authorize('ADMIN'),
  validate(getCompanyFramesSchema),
  bulkAssignAllFrames
);

// Unassign frames from a company
router.post(
  '/company/:companyId/unassign',
  authorize('ADMIN'),
  validate(unassignFramesSchema),
  unassignFrames
);

// Toggle frame active status for a company
router.patch(
  '/company/:companyId/frame/:frameId',
  authorize('ADMIN'),
  validate(toggleCompanyFrameSchema),
  toggleFrame
);

// Get companies that have a specific frame assigned
router.get(
  '/frame/:frameId/companies',
  authorize('ADMIN'),
  validate(getFrameCompaniesSchema),
  getFrameCompanies
);

export default router;
