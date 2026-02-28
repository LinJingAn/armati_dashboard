import { Request, Response } from 'express';
import { supportTicketService } from './supportTicket.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

export const getSupportTickets = asyncHandler(async (req: Request, res: Response) => {
  const result = await supportTicketService.findAll(
    req.query as Record<string, unknown>,
    req.user?.companyId,
    req.user?.role
  );
  res.json(result);
});

export const getSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await supportTicketService.findById(req.params.id as string);
  res.json(ticket);
});

export const createSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await supportTicketService.create(req.body);
  res.status(201).json(ticket);
});

export const updateSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = req.params.id as string;
  const hasAccess = await supportTicketService.checkAccess(
    id,
    req.user.companyId,
    req.user.role
  );

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this ticket');
  }

  if (req.user.role === 'USER') {
    delete req.body.status;
    delete req.body.resolution;
  }

  const ticket = await supportTicketService.update(id, req.body);
  res.json(ticket);
});
