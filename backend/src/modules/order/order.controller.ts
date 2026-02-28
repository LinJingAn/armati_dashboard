import { Request, Response } from 'express';
import { orderService } from './order.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.findAll(
    req.query as Record<string, unknown>,
    req.user?.companyId,
    req.user?.role
  );
  res.json(result);
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.findById(req.params.id as string);
  res.json(order);
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.create(req.body);
  res.status(201).json(order);
});

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = req.params.id as string;
  const hasAccess = await orderService.checkAccess(
    id,
    req.user.companyId,
    req.user.role
  );

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  if (req.user.role === 'USER') {
    delete req.body.status;
  }

  const order = await orderService.update(id, req.body);
  res.json(order);
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  await orderService.delete(req.params.id as string);
  res.status(204).send();
});
