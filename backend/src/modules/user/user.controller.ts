import { Request, Response } from 'express';
import { userService } from './user.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.findAll(req.query as Record<string, unknown>);
  res.json(result);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  
  const id = req.params.id as string;
  if (req.user.role !== 'ADMIN' && req.user.userId !== id) {
    throw ApiError.forbidden('You can only view your own profile');
  }

  const user = await userService.findById(id);
  res.json(user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.create(req.body);
  res.status(201).json(user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = req.params.id as string;
  if (req.user.role !== 'ADMIN' && req.user.userId !== id) {
    throw ApiError.forbidden('You can only update your own profile');
  }

  if (req.user.role !== 'ADMIN') {
    delete req.body.role;
    delete req.body.isActive;
    delete req.body.companyId;
  }

  const user = await userService.update(id, req.body);
  res.json(user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.delete(req.params.id as string);
  res.status(204).send();
});
