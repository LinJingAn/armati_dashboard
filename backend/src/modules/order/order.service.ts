import prisma from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePaginationParams, parseOrderBy, PaginatedResponse } from '../../utils/pagination.js';
import type { CreateOrderInput, UpdateOrderInput, AddOrderItemsInput, UpdateOrderItemInput, OrderStatus } from './order.schema.js';
import type { Order, OrderItem, Role } from '@prisma/client';
import { validateStatusTransition, getAvailableTransitions } from '../../utils/orderWorkflow.js';

type OrderWithRelations = Order & {
  employee?: { id: string; name: string; department?: string | null; registration?: string | null; company?: { id: string; corporateName: string; cnpj?: string } };
  frame?: { id: string; modelName: string; color?: string | null; size?: string | null; image1Url?: string | null } | null;
  items?: (OrderItem & { frame: { id: string; modelName: string; color?: string | null; size?: string | null; image1Url?: string | null } })[];
};

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export class OrderService {
  async findAll(
    query: Record<string, unknown>,
    userCompanyId?: string | null,
    userRole?: string
  ): Promise<PaginatedResponse<OrderWithRelations>> {
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
          items: {
            include: {
              frame: {
                select: { id: true, modelName: true, color: true, size: true, image1Url: true },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findById(id: string): Promise<OrderWithRelations> {
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
        items: {
          include: {
            frame: {
              select: { id: true, modelName: true, color: true, size: true, image1Url: true, price: true },
            },
          },
        },
        prescriptionSpec: true,
        statusHistory: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    return order;
  }

  async create(data: CreateOrderInput): Promise<OrderWithRelations> {
    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });

    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }

    const orderNumber = generateOrderNumber();

    // Multi-item order
    if (data.items && data.items.length > 0) {
      const frameIds = data.items.map((item) => item.frameId);
      const frames = await prisma.frame.findMany({
        where: { id: { in: frameIds } },
      });

      const frameMap = new Map(frames.map((f) => [f.id, f]));

      for (const item of data.items) {
        const frame = frameMap.get(item.frameId);
        if (!frame) {
          throw ApiError.notFound(`Frame not found: ${item.frameId}`);
        }
        if (!frame.isActive) {
          throw ApiError.badRequest(`Frame is not available: ${frame.modelName}`);
        }
      }

      return prisma.order.create({
        data: {
          orderNumber,
          employeeId: data.employeeId,
          status: data.status || 'draft',
          prescriptionUrl: data.prescriptionUrl || null,
          notes: data.notes || null,
          items: {
            create: data.items.map((item) => {
              const frame = frameMap.get(item.frameId)!;
              return {
                frameId: item.frameId,
                quantity: item.quantity || 1,
                price: item.price ?? frame.price ?? null,
                color: item.color || frame.color || null,
                size: item.size || frame.size || null,
                notes: item.notes || null,
              };
            }),
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              company: { select: { id: true, corporateName: true } },
            },
          },
          items: {
            include: {
              frame: {
                select: { id: true, modelName: true, color: true, size: true, image1Url: true },
              },
            },
          },
        },
      });
    }

    // Legacy single-frame order (backward compat)
    if (!data.frameId) {
      throw ApiError.badRequest('Either frameId or items array is required');
    }

    const frame = await prisma.frame.findUnique({ where: { id: data.frameId } });

    if (!frame) {
      throw ApiError.notFound('Frame not found');
    }

    if (!frame.isActive) {
      throw ApiError.badRequest('Selected frame is not available');
    }

    return prisma.order.create({
      data: {
        orderNumber,
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

  async update(id: string, data: UpdateOrderInput): Promise<OrderWithRelations> {
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
        items: {
          include: {
            frame: {
              select: { id: true, modelName: true, color: true, size: true, image1Url: true },
            },
          },
        },
      },
    });
  }

  async addItems(orderId: string, data: AddOrderItemsInput): Promise<OrderItem[]> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const frameIds = data.items.map((item) => item.frameId);
    const frames = await prisma.frame.findMany({
      where: { id: { in: frameIds } },
    });

    const frameMap = new Map(frames.map((f) => [f.id, f]));

    for (const item of data.items) {
      const frame = frameMap.get(item.frameId);
      if (!frame) {
        throw ApiError.notFound(`Frame not found: ${item.frameId}`);
      }
      if (!frame.isActive) {
        throw ApiError.badRequest(`Frame is not available: ${frame.modelName}`);
      }
    }

    const createdItems = await Promise.all(
      data.items.map((item) => {
        const frame = frameMap.get(item.frameId)!;
        return prisma.orderItem.create({
          data: {
            orderId,
            frameId: item.frameId,
            quantity: item.quantity || 1,
            price: item.price ?? frame.price ?? null,
            color: item.color || frame.color || null,
            size: item.size || frame.size || null,
            notes: item.notes || null,
          },
          include: {
            frame: {
              select: { id: true, modelName: true, color: true, size: true, image1Url: true },
            },
          },
        });
      })
    );

    return createdItems;
  }

  async updateItem(orderId: string, itemId: string, data: UpdateOrderItemInput): Promise<OrderItem> {
    const orderItem = await prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
    });

    if (!orderItem) {
      throw ApiError.notFound('Order item not found');
    }

    return prisma.orderItem.update({
      where: { id: itemId },
      data: {
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.size !== undefined && { size: data.size }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        frame: {
          select: { id: true, modelName: true, color: true, size: true, image1Url: true },
        },
      },
    });
  }

  async removeItem(orderId: string, itemId: string): Promise<void> {
    const orderItem = await prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
    });

    if (!orderItem) {
      throw ApiError.notFound('Order item not found');
    }

    await prisma.orderItem.delete({ where: { id: itemId } });
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

  async transitionStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId: string,
    userRole: Role,
    note?: string
  ): Promise<OrderWithRelations> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const currentStatus = order.status as OrderStatus;
    const validation = validateStatusTransition(currentStatus, newStatus, userRole);

    if (!validation.allowed) {
      throw ApiError.badRequest(validation.message || 'Status transition not allowed');
    }

    if (validation.requiresNote && !note) {
      throw ApiError.badRequest('A note is required for this status transition');
    }

    // Update status and record history in a transaction
    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
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
          items: {
            include: {
              frame: {
                select: { id: true, modelName: true, color: true, size: true, image1Url: true },
              },
            },
          },
          statusHistory: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          userId,
          fromStatus: currentStatus,
          toStatus: newStatus,
          note: note || null,
        },
      }),
    ]);

    return updatedOrder;
  }

  async getAvailableStatusTransitions(orderId: string, userRole: Role) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const currentStatus = order.status as OrderStatus;
    return {
      currentStatus,
      availableTransitions: getAvailableTransitions(currentStatus, userRole),
    };
  }

  async getStatusHistory(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    return prisma.orderStatusHistory.findMany({
      where: { orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const orderService = new OrderService();
