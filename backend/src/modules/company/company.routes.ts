import { Router } from 'express';
import {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} from './company.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createCompanySchema,
  updateCompanySchema,
  getCompanySchema,
} from './company.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN'), getCompanies);
router.get('/:id', authorize('ADMIN', 'COMPANY_MANAGER'), validate(getCompanySchema), getCompany);
router.post('/', authorize('ADMIN'), validate(createCompanySchema), createCompany);
router.put('/:id', authorize('ADMIN'), validate(updateCompanySchema), updateCompany);
router.delete('/:id', authorize('ADMIN'), validate(getCompanySchema), deleteCompany);

export default router;
