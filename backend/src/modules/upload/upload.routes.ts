import { Router } from 'express';
import { uploadFile, deleteFile } from './upload.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', uploadFile);
router.delete('/', deleteFile);

export default router;
