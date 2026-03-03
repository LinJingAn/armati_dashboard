import { Request, Response } from 'express';
import { companyFrameService } from './companyFrame.service.js';

export const getCompanyFrames = async (req: Request, res: Response) => {
  const companyId = req.params.companyId as string;
  const frames = await companyFrameService.getCompanyFrames(companyId);

  res.status(200).json({
    success: true,
    data: frames,
  });
};

export const getAvailableFrames = async (req: Request, res: Response) => {
  const companyId = req.params.companyId as string;
  const frames = await companyFrameService.getAvailableFramesForCompany(companyId);

  res.status(200).json({
    success: true,
    data: frames,
  });
};

export const assignFrames = async (req: Request, res: Response) => {
  const companyId = req.params.companyId as string;
  const { frameIds } = req.body;

  const result = await companyFrameService.assignFramesToCompany(companyId, frameIds);

  res.status(200).json({
    success: true,
    message: `${result.length} frame(s) assigned to company`,
    data: result,
  });
};

export const unassignFrames = async (req: Request, res: Response) => {
  const companyId = req.params.companyId as string;
  const { frameIds } = req.body;

  const result = await companyFrameService.unassignFramesFromCompany(companyId, frameIds);

  res.status(200).json({
    success: true,
    message: `${result.removed} frame(s) removed from company`,
    data: result,
  });
};

export const toggleFrame = async (req: Request, res: Response) => {
  const companyId = req.params.companyId as string;
  const frameId = req.params.frameId as string;
  const { isActive } = req.body;

  const result = await companyFrameService.toggleCompanyFrame(companyId, frameId, isActive);

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getFrameCompanies = async (req: Request, res: Response) => {
  const frameId = req.params.frameId as string;
  const companies = await companyFrameService.getFrameCompanies(frameId);

  res.status(200).json({
    success: true,
    data: companies,
  });
};

export const bulkAssignAllFrames = async (req: Request, res: Response) => {
  const companyId = req.params.companyId as string;
  const result = await companyFrameService.bulkAssignAllFramesToCompany(companyId);

  res.status(200).json({
    success: true,
    message: `${result.assigned} frame(s) assigned to company`,
    data: result,
  });
};
