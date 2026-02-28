import { Router } from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from './user.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
} from './user.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN'), getUsers);
router.get('/:id', validate(getUserSchema), getUser);
router.post('/', authorize('ADMIN'), validate(createUserSchema), createUser);
router.put('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', authorize('ADMIN'), validate(getUserSchema), deleteUser);

export default router;
