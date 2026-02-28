import { Request, Response, NextFunction } from 'express';
import { upload, uploadService } from './upload.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

export const uploadFile = [
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          next(ApiError.badRequest('File too large. Maximum size is 5MB.'));
        } else {
          next(ApiError.badRequest(err.message));
        }
      } else {
        next();
      }
    });
  },
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded');
    }

    const folder = req.body.folder || 'frames';
    const url = uploadService.getFileUrl(folder, req.file.filename);

    res.json({
      success: true,
      data: {
        url,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  }),
];

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    throw ApiError.badRequest('File URL is required');
  }

  await uploadService.deleteFile(url);

  res.json({
    success: true,
    message: 'File deleted successfully',
  });
});
