import { Router } from 'express';
import multer from 'multer';
import {
  importCompanies,
  importUsers,
  importEmployees,
  getImportLogs,
  getImportLogById,
  getCSVTemplate,
} from './import.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { getImportLogSchema, importLogsQuerySchema } from './import.schema.js';

const router = Router();

// Use memory storage for CSV files (small files, parsed in-memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// All import routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// CSV Templates (downloadable)
router.get('/templates/:entityType', getCSVTemplate);

// Import endpoints
router.post('/companies', upload.single('file'), importCompanies);
router.post('/users', upload.single('file'), importUsers);
router.post('/employees', upload.single('file'), importEmployees);

// Import logs
router.get('/logs', validate(importLogsQuerySchema), getImportLogs);
router.get('/logs/:id', validate(getImportLogSchema), getImportLogById);

export default router;
