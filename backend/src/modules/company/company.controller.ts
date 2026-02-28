import { Request, Response } from 'express';
import { companyService } from './company.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getCompanies = asyncHandler(async (req: Request, res: Response) => {
  const result = await companyService.findAll(req.query as Record<string, unknown>);
  res.json(result);
});

export const getCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await companyService.findById(req.params.id as string);
  res.json(company);
});

export const createCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await companyService.create(req.body);
  res.status(201).json(company);
});

export const updateCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await companyService.update(req.params.id as string, req.body);
  res.json(company);
});

export const deleteCompany = asyncHandler(async (req: Request, res: Response) => {
  await companyService.delete(req.params.id as string);
  res.status(204).send();
});
