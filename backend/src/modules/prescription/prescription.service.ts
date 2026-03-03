import prisma from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import type { CreatePrescriptionInput, UpdatePrescriptionInput } from './prescription.schema.js';
import type { PrescriptionSpec } from '@prisma/client';

export class PrescriptionService {
  async findByOrderId(orderId: string): Promise<PrescriptionSpec | null> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    return prisma.prescriptionSpec.findUnique({
      where: { orderId },
    });
  }

  async create(orderId: string, data: CreatePrescriptionInput): Promise<PrescriptionSpec> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const existing = await prisma.prescriptionSpec.findUnique({
      where: { orderId },
    });

    if (existing) {
      throw ApiError.conflict('Prescription already exists for this order. Use PUT to update.');
    }

    return prisma.prescriptionSpec.create({
      data: {
        orderId,
        odSphere: data.odSphere ?? null,
        odCylinder: data.odCylinder ?? null,
        odAxis: data.odAxis ?? null,
        odAddition: data.odAddition ?? null,
        osSphere: data.osSphere ?? null,
        osCylinder: data.osCylinder ?? null,
        osAxis: data.osAxis ?? null,
        osAddition: data.osAddition ?? null,
        pdRight: data.pdRight ?? null,
        pdLeft: data.pdLeft ?? null,
        pdBinocular: data.pdBinocular ?? null,
        notes: data.notes ?? null,
      },
    });
  }

  async update(orderId: string, data: UpdatePrescriptionInput): Promise<PrescriptionSpec> {
    const prescription = await prisma.prescriptionSpec.findUnique({
      where: { orderId },
    });

    if (!prescription) {
      throw ApiError.notFound('Prescription not found for this order');
    }

    return prisma.prescriptionSpec.update({
      where: { orderId },
      data: {
        ...(data.odSphere !== undefined && { odSphere: data.odSphere }),
        ...(data.odCylinder !== undefined && { odCylinder: data.odCylinder }),
        ...(data.odAxis !== undefined && { odAxis: data.odAxis }),
        ...(data.odAddition !== undefined && { odAddition: data.odAddition }),
        ...(data.osSphere !== undefined && { osSphere: data.osSphere }),
        ...(data.osCylinder !== undefined && { osCylinder: data.osCylinder }),
        ...(data.osAxis !== undefined && { osAxis: data.osAxis }),
        ...(data.osAddition !== undefined && { osAddition: data.osAddition }),
        ...(data.pdRight !== undefined && { pdRight: data.pdRight }),
        ...(data.pdLeft !== undefined && { pdLeft: data.pdLeft }),
        ...(data.pdBinocular !== undefined && { pdBinocular: data.pdBinocular }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async upsert(orderId: string, data: CreatePrescriptionInput): Promise<PrescriptionSpec> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    return prisma.prescriptionSpec.upsert({
      where: { orderId },
      create: {
        orderId,
        odSphere: data.odSphere ?? null,
        odCylinder: data.odCylinder ?? null,
        odAxis: data.odAxis ?? null,
        odAddition: data.odAddition ?? null,
        osSphere: data.osSphere ?? null,
        osCylinder: data.osCylinder ?? null,
        osAxis: data.osAxis ?? null,
        osAddition: data.osAddition ?? null,
        pdRight: data.pdRight ?? null,
        pdLeft: data.pdLeft ?? null,
        pdBinocular: data.pdBinocular ?? null,
        notes: data.notes ?? null,
      },
      update: {
        odSphere: data.odSphere ?? null,
        odCylinder: data.odCylinder ?? null,
        odAxis: data.odAxis ?? null,
        odAddition: data.odAddition ?? null,
        osSphere: data.osSphere ?? null,
        osCylinder: data.osCylinder ?? null,
        osAxis: data.osAxis ?? null,
        osAddition: data.osAddition ?? null,
        pdRight: data.pdRight ?? null,
        pdLeft: data.pdLeft ?? null,
        pdBinocular: data.pdBinocular ?? null,
        notes: data.notes ?? null,
      },
    });
  }

  async delete(orderId: string): Promise<void> {
    const prescription = await prisma.prescriptionSpec.findUnique({
      where: { orderId },
    });

    if (!prescription) {
      throw ApiError.notFound('Prescription not found for this order');
    }

    await prisma.prescriptionSpec.delete({
      where: { orderId },
    });
  }

  async checkOrderAccess(orderId: string, userCompanyId?: string | null, userRole?: string): Promise<boolean> {
    if (userRole === 'ADMIN') return true;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { employee: { select: { companyId: true } } },
    });

    if (!order) return false;

    return order.employee.companyId === userCompanyId;
  }
}

export const prescriptionService = new PrescriptionService();
