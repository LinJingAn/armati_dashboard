import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_FOLDERS = ['frames', 'prescriptions', 'employees', 'tickets', 'avatars'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

const baseUploadDir = path.join(__dirname, '..', '..', '..', env.UPLOAD_DIR);

ALLOWED_FOLDERS.forEach(folder => {
  const dir = path.join(baseUploadDir, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = req.body.folder || 'frames';
    
    if (!ALLOWED_FOLDERS.includes(folder)) {
      cb(new Error('Invalid folder'), '');
      return;
    }

    const uploadPath = path.join(baseUploadDir, folder);
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
});

export class UploadService {
  getFileUrl(folder: string, filename: string): string {
    return `/uploads/${folder}/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const relativePath = fileUrl.replace('/uploads/', '');
    const filePath = path.join(baseUploadDir, relativePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  validateFolder(folder: string): void {
    if (!ALLOWED_FOLDERS.includes(folder)) {
      throw ApiError.badRequest('Invalid folder. Allowed folders: ' + ALLOWED_FOLDERS.join(', '));
    }
  }
}

export const uploadService = new UploadService();
