import prisma from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import type { CompanyFrame, Frame } from '@prisma/client';

type FrameWithMapping = Frame & { companyFrames?: { isActive: boolean }[] };

export class CompanyFrameService {
  async getCompanyFrames(companyId: string): Promise<FrameWithMapping[]> {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    const companyFrames = await prisma.companyFrame.findMany({
      where: { companyId, isActive: true },
      include: {
        frame: true,
      },
    });

    return companyFrames.map((cf) => ({
      ...cf.frame,
      companyFrames: [{ isActive: cf.isActive }],
    }));
  }

  async getAvailableFramesForCompany(companyId: string): Promise<Frame[]> {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    const assignedFrameIds = await prisma.companyFrame.findMany({
      where: { companyId },
      select: { frameId: true },
    });

    const assignedIds = assignedFrameIds.map((cf) => cf.frameId);

    return prisma.frame.findMany({
      where: {
        isActive: true,
        id: { notIn: assignedIds },
      },
      orderBy: { modelName: 'asc' },
    });
  }

  async assignFramesToCompany(companyId: string, frameIds: string[]): Promise<CompanyFrame[]> {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    const frames = await prisma.frame.findMany({
      where: { id: { in: frameIds } },
    });

    if (frames.length !== frameIds.length) {
      throw ApiError.badRequest('One or more frame IDs are invalid');
    }

    const results: CompanyFrame[] = [];

    for (const frameId of frameIds) {
      const existing = await prisma.companyFrame.findUnique({
        where: { companyId_frameId: { companyId, frameId } },
      });

      if (existing) {
        // Reactivate if inactive
        if (!existing.isActive) {
          const updated = await prisma.companyFrame.update({
            where: { id: existing.id },
            data: { isActive: true },
          });
          results.push(updated);
        } else {
          results.push(existing);
        }
      } else {
        const created = await prisma.companyFrame.create({
          data: { companyId, frameId, isActive: true },
        });
        results.push(created);
      }
    }

    return results;
  }

  async unassignFramesFromCompany(companyId: string, frameIds: string[]): Promise<{ removed: number }> {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    const result = await prisma.companyFrame.deleteMany({
      where: {
        companyId,
        frameId: { in: frameIds },
      },
    });

    return { removed: result.count };
  }

  async toggleCompanyFrame(companyId: string, frameId: string, isActive: boolean): Promise<CompanyFrame> {
    const companyFrame = await prisma.companyFrame.findUnique({
      where: { companyId_frameId: { companyId, frameId } },
    });

    if (!companyFrame) {
      throw ApiError.notFound('Company-frame mapping not found');
    }

    return prisma.companyFrame.update({
      where: { id: companyFrame.id },
      data: { isActive },
    });
  }

  async getFrameCompanies(frameId: string): Promise<{ company: { id: string; corporateName: string; cnpj: string }; isActive: boolean }[]> {
    const frame = await prisma.frame.findUnique({ where: { id: frameId } });
    if (!frame) {
      throw ApiError.notFound('Frame not found');
    }

    const companyFrames = await prisma.companyFrame.findMany({
      where: { frameId },
      include: {
        company: {
          select: { id: true, corporateName: true, cnpj: true },
        },
      },
    });

    return companyFrames.map((cf) => ({
      company: cf.company,
      isActive: cf.isActive,
    }));
  }

  async bulkAssignAllFramesToCompany(companyId: string): Promise<{ assigned: number }> {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    const allFrames = await prisma.frame.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const existingMappings = await prisma.companyFrame.findMany({
      where: { companyId },
      select: { frameId: true },
    });

    const existingFrameIds = new Set(existingMappings.map((m) => m.frameId));
    const newFrameIds = allFrames.filter((f) => !existingFrameIds.has(f.id)).map((f) => f.id);

    if (newFrameIds.length === 0) {
      return { assigned: 0 };
    }

    await prisma.companyFrame.createMany({
      data: newFrameIds.map((frameId) => ({ companyId, frameId, isActive: true })),
    });

    return { assigned: newFrameIds.length };
  }
}

export const companyFrameService = new CompanyFrameService();
