import { Request, Response } from 'express';
import { frameService } from './frame.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getFrames = asyncHandler(async (req: Request, res: Response) => {
  const result = await frameService.findAll(req.query as Record<string, unknown>);
  res.json(result);
});

export const getFrame = asyncHandler(async (req: Request, res: Response) => {
  const frame = await frameService.findById(req.params.id as string);
  res.json(frame);
});

export const createFrame = asyncHandler(async (req: Request, res: Response) => {
  const frame = await frameService.create(req.body);
  res.status(201).json(frame);
});

export const updateFrame = asyncHandler(async (req: Request, res: Response) => {
  const frame = await frameService.update(req.params.id as string, req.body);
  res.json(frame);
});

export const deleteFrame = asyncHandler(async (req: Request, res: Response) => {
  await frameService.delete(req.params.id as string);
  res.status(204).send();
});
