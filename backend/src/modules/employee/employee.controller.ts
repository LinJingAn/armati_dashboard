import { Request, Response } from 'express';
import { employeeService } from './employee.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  const result = await employeeService.findAll(
    req.query as Record<string, unknown>,
    req.user?.companyId,
    req.user?.role
  );
  res.json(result);
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await employeeService.findById(req.params.id as string);
  res.json(employee);
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  if (req.user.role === 'COMPANY_MANAGER' && req.body.companyId !== req.user.companyId) {
    throw ApiError.forbidden('You can only create employees for your company');
  }

  const employee = await employeeService.create(req.body);
  res.status(201).json(employee);
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = req.params.id as string;
  const hasAccess = await employeeService.checkAccess(
    id,
    req.user.companyId,
    req.user.role
  );

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this employee');
  }

  const employee = await employeeService.update(id, req.body);
  res.json(employee);
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = req.params.id as string;
  const hasAccess = await employeeService.checkAccess(
    id,
    req.user.companyId,
    req.user.role
  );

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this employee');
  }

  await employeeService.delete(id);
  res.status(204).send();
});
