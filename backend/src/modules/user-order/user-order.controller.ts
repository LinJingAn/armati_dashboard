import type { Request, Response } from 'express';
import { userOrderService } from './user-order.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { CreateUserOrderInput, UpdateUserOrderInput } from './user-order.schema.js';

const str = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? v[0] ?? '' : (v ?? '');

export const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.role === 'ADMIN' ? undefined : req.user?.userId;
  const result = await userOrderService.findAll(req.query, userId);
  res.json(result);
});

export const getUserOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.role === 'ADMIN' ? undefined : req.user?.userId;
  const order = await userOrderService.findById(str(req.params.id), userId);
  res.json(order);
});

export const createUserOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const data = req.body as CreateUserOrderInput;
  const order = await userOrderService.create(userId, data);
  res.status(201).json(order);
});

export const updateUserOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.role === 'ADMIN' ? undefined : req.user?.userId;
  const data = req.body as UpdateUserOrderInput;
  const order = await userOrderService.update(str(req.params.id), data, userId);
  res.json(order);
});

export const cancelUserOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const order = await userOrderService.cancel(str(req.params.id), userId);
  res.json(order);
});

export const getUserOrderStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const stats = await userOrderService.getStats(userId);
  res.json(stats);
});
