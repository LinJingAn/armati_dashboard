import { Router } from 'express';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from './employee.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  getEmployeeSchema,
} from './employee.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', getEmployees);
router.get('/:id', validate(getEmployeeSchema), getEmployee);
router.post('/', authorize('ADMIN'), validate(createEmployeeSchema), createEmployee);
router.put('/:id', authorize('ADMIN'), validate(updateEmployeeSchema), updateEmployee);
router.delete('/:id', authorize('ADMIN'), validate(getEmployeeSchema), deleteEmployee);

export default router;
