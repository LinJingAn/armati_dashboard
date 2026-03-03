import { Request, Response } from 'express';
import { importService } from './import.service.js';
import { ApiError } from '../../utils/ApiError.js';

export const importCompanies = async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('CSV file is required');
  }

  const csvContent = req.file.buffer.toString('utf-8');
  const userId = req.user!.userId;

  const result = await importService.importCompanies(csvContent, userId);

  res.status(200).json({
    success: true,
    message: `Import completed: ${result.summary.success} created, ${result.summary.skipped} skipped, ${result.summary.errors} errors`,
    data: result,
  });
};

export const importUsers = async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('CSV file is required');
  }

  const csvContent = req.file.buffer.toString('utf-8');
  const userId = req.user!.userId;

  const result = await importService.importUsers(csvContent, userId);

  res.status(200).json({
    success: true,
    message: `Import completed: ${result.summary.success} created, ${result.summary.skipped} skipped, ${result.summary.errors} errors`,
    data: result,
  });
};

export const importEmployees = async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('CSV file is required');
  }

  const csvContent = req.file.buffer.toString('utf-8');
  const userId = req.user!.userId;

  const result = await importService.importEmployees(csvContent, userId);

  res.status(200).json({
    success: true,
    message: `Import completed: ${result.summary.success} created, ${result.summary.skipped} skipped, ${result.summary.errors} errors`,
    data: result,
  });
};

export const getImportLogs = async (req: Request, res: Response) => {
  const result = await importService.getImportLogs(req.query as Record<string, unknown>);

  res.status(200).json({
    success: true,
    data: result.items,
    pagination: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    },
  });
};

export const getImportLogById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const importLog = await importService.getImportLogById(id);

  res.status(200).json({
    success: true,
    data: importLog,
  });
};

export const getCSVTemplate = async (req: Request, res: Response) => {
  const entityType = req.params.entityType as string;

  if (!['company', 'user', 'employee'].includes(entityType)) {
    throw ApiError.badRequest('Invalid entity type. Must be: company, user, or employee');
  }

  const template = importService.getCSVTemplate(entityType as 'company' | 'user' | 'employee');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${entityType}_template.csv`);
  res.status(200).send(template);
};
