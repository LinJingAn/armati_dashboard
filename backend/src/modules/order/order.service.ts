import prisma from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePaginationParams, parseOrderBy, PaginatedResponse } from '../../utils/pagination.js';
import type { CreateOrderInput, UpdateOrderInput } from './order.schema.js';
import type { Order } from '@prisma/client';

export class OrderService {
  async findAll(
    query: Record<string, unknown>,
    userCompanyId?: string | null,
    userRole?: string
  ): Promise<PaginatedResponse<Order>> {
    const { limit, offset, sort } = parsePaginationParams(query);
    const orderBy = parseOrderBy(sort);

    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (userRole !== 'ADMIN' && userCompanyId) {
      where.employee = { companyId: userCompanyId };
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        take: Number(limit) || 50,
        skip: Number(offset) || 0,
        orderBy,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              company: { select: { id: true, corporateName: true } },
            },
          },
          frame: {
            select: { id: true, modelName: true, color: true, size: true, image1Url: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findById(id: string): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            department: true,
            registration: true,
            company: { select: { id: true, corporateName: true, cnpj: true } },
          },
        },
        frame: true,
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    return order;
  }

  async create(data: CreateOrderInput): Promise<Order> {
    const [employee, frame] = await Promise.all([
      prisma.employee.findUnique({ where: { id: data.employeeId } }),
      prisma.frame.findUnique({ where: { id: data.frameId } }),
    ]);

    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }

    if (!frame) {
      throw ApiError.notFound('Frame not found');
    }

    if (!frame.isActive) {
      throw ApiError.badRequest('Selected frame is not available');
    }

    return prisma.order.create({
      data: {
        employeeId: data.employeeId,
        frameId: data.frameId,
        status: data.status || 'draft',
        prescriptionUrl: data.prescriptionUrl || null,
        notes: data.notes || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            company: { select: { id: true, corporateName: true } },
          },
        },
        frame: {
          select: { id: true, modelName: true, color: true, size: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateOrderInput): Promise<Order> {
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (data.frameId) {
      const frame = await prisma.frame.findUnique({ where: { id: data.frameId } });
      if (!frame) {
        throw ApiError.notFound('Frame not found');
      }
      if (!frame.isActive) {
        throw ApiError.badRequest('Selected frame is not available');
      }
    }

    return prisma.order.update({
      where: { id },
      data: {
        ...(data.frameId && { frameId: data.frameId }),
        ...(data.status && { status: data.status }),
        ...(data.prescriptionUrl !== undefined && { prescriptionUrl: data.prescriptionUrl }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            company: { select: { id: true, corporateName: true } },
          },
        },
        frame: {
          select: { id: true, modelName: true, color: true, size: true },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    await prisma.order.delete({ where: { id } });
  }

  async checkAccess(orderId: string, userCompanyId?: string | null, userRole?: string): Promise<boolean> {
    if (userRole === 'ADMIN') return true;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { employee: { select: { companyId: true } } },
    });

    if (!order) return false;

    return order.employee.companyId === userCompanyId;
  }
}

export const orderService = new OrderService();
