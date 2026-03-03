import { Request, Response } from 'express';
import { prescriptionService } from './prescription.service.js';
import { ApiError } from '../../utils/ApiError.js';

export const getPrescription = async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const orderId = req.params.orderId as string;
  const hasAccess = await prescriptionService.checkOrderAccess(orderId, req.user.companyId ?? undefined, req.user.role);

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  const prescription = await prescriptionService.findByOrderId(orderId);

  res.status(200).json({
    success: true,
    data: prescription,
  });
};

export const createPrescription = async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const orderId = req.params.orderId as string;
  const hasAccess = await prescriptionService.checkOrderAccess(orderId, req.user.companyId ?? undefined, req.user.role);

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  const prescription = await prescriptionService.create(orderId, req.body);

  res.status(201).json({
    success: true,
    message: 'Prescription created successfully',
    data: prescription,
  });
};

export const updatePrescription = async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const orderId = req.params.orderId as string;
  const hasAccess = await prescriptionService.checkOrderAccess(orderId, req.user.companyId ?? undefined, req.user.role);

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  const prescription = await prescriptionService.update(orderId, req.body);

  res.status(200).json({
    success: true,
    message: 'Prescription updated successfully',
    data: prescription,
  });
};

export const upsertPrescription = async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const orderId = req.params.orderId as string;
  const hasAccess = await prescriptionService.checkOrderAccess(orderId, req.user.companyId ?? undefined, req.user.role);

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  const prescription = await prescriptionService.upsert(orderId, req.body);

  res.status(200).json({
    success: true,
    message: 'Prescription saved successfully',
    data: prescription,
  });
};

export const deletePrescription = async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const orderId = req.params.orderId as string;
  const hasAccess = await prescriptionService.checkOrderAccess(orderId, req.user.companyId ?? undefined, req.user.role);

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  await prescriptionService.delete(orderId);

  res.status(204).send();
};
