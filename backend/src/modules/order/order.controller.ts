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

export const addOrderItems = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = req.params.id as string;
  const hasAccess = await orderService.checkAccess(id, req.user.companyId, req.user.role);

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  const items = await orderService.addItems(id, req.body);
  res.status(201).json({
    success: true,
    message: `${items.length} item(s) added to order`,
    data: items,
  });
});

export const updateOrderItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = req.params.id as string;
  const itemId = req.params.itemId as string;
  const hasAccess = await orderService.checkAccess(id, req.user.companyId ?? undefined, req.user.role);

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  const item = await orderService.updateItem(id, itemId, req.body);
  res.json({
    success: true,
    data: item,
  });
});

export const removeOrderItem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = req.params.id as string;
  const itemId = req.params.itemId as string;
  const hasAccess = await orderService.checkAccess(id, req.user.companyId ?? undefined, req.user.role);

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  await orderService.removeItem(id, itemId);
  res.status(204).send();
});

export const transitionOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = req.params.id as string;
  const hasAccess = await orderService.checkAccess(id, req.user.companyId, req.user.role);

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  const { status, note } = req.body;
  const order = await orderService.transitionStatus(
    id,
    status,
    req.user.userId,
    req.user.role as 'ADMIN' | 'COMPANY_MANAGER' | 'USER',
    note
  );

  res.json({
    success: true,
    message: `Order status changed to ${status}`,
    data: order,
  });
});

export const getAvailableTransitions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = req.params.id as string;
  const hasAccess = await orderService.checkAccess(id, req.user.companyId, req.user.role);

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  const transitions = await orderService.getAvailableStatusTransitions(
    id,
    req.user.role as 'ADMIN' | 'COMPANY_MANAGER' | 'USER'
  );

  res.json({
    success: true,
    data: transitions,
  });
});

export const getOrderStatusHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = req.params.id as string;
  const hasAccess = await orderService.checkAccess(id, req.user.companyId, req.user.role);

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  const history = await orderService.getStatusHistory(id);

  res.json({
    success: true,
    data: history,
  });
});
