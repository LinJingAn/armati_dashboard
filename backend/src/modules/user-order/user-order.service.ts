import prisma from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePaginationParams, parseOrderBy, PaginatedResponse } from '../../utils/pagination.js';
import type { CreateUserOrderInput, UpdateUserOrderInput } from './user-order.schema.js';
import type { UserOrder } from '@prisma/client';

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export class UserOrderService {
  async findAll(
    query: Record<string, unknown>,
    userId?: string
  ): Promise<PaginatedResponse<UserOrder>> {
    const { limit, offset, sort } = parsePaginationParams(query);
    const orderBy = parseOrderBy(sort || '-created_at');

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      prisma.userOrder.findMany({
        where,
        take: Number(limit) || 50,
        skip: Number(offset) || 0,
        orderBy,
        include: {
          items: {
            include: {
              frame: {
                select: {
                  id: true,
                  modelName: true,
                  color: true,
                  size: true,
                  brand: true,
                  image1Url: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.userOrder.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findById(id: string, userId?: string): Promise<UserOrder> {
    const where: Record<string, unknown> = { id };
    
    if (userId) {
      where.userId = userId;
    }

    const order = await prisma.userOrder.findFirst({
      where,
      include: {
        items: {
          include: {
            frame: {
              select: {
                id: true,
                modelName: true,
                color: true,
                size: true,
                brand: true,
                category: true,
                image1Url: true,
                image2Url: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    return order;
  }

  async create(userId: string, data: CreateUserOrderInput): Promise<UserOrder> {
    const frameIds = data.items.map((item) => item.frameId);
    const frames = await prisma.frame.findMany({
      where: { id: { in: frameIds }, isActive: true },
    });

    if (frames.length !== frameIds.length) {
      throw ApiError.badRequest('One or more selected frames are not available');
    }

    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.1;
    const shipping = subtotal >= 50 ? 0 : 9.99;
    const total = subtotal + tax + shipping;

    const order = await prisma.userOrder.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: 'pending',
        subtotal,
        tax,
        shipping,
        total,
        shippingAddress: data.shippingAddress || null,
        paymentMethod: data.paymentMethod || 'card',
        notes: data.notes || null,
        items: {
          create: data.items.map((item) => ({
            frameId: item.frameId,
            quantity: item.quantity,
            price: item.price,
            color: item.color || null,
            size: item.size || null,
          })),
        },
      },
      include: {
        items: {
          include: {
            frame: {
              select: {
                id: true,
                modelName: true,
                color: true,
                size: true,
                brand: true,
                image1Url: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return order;
  }

  async update(id: string, data: UpdateUserOrderInput, userId?: string): Promise<UserOrder> {
    const where: Record<string, unknown> = { id };
    
    if (userId) {
      where.userId = userId;
    }

    const order = await prisma.userOrder.findFirst({ where });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      throw ApiError.badRequest('Cannot update a completed or cancelled order');
    }

    return prisma.userOrder.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.shippingAddress !== undefined && { shippingAddress: data.shippingAddress }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        items: {
          include: {
            frame: {
              select: {
                id: true,
                modelName: true,
                color: true,
                size: true,
                brand: true,
                image1Url: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async cancel(id: string, userId: string): Promise<UserOrder> {
    const order = await prisma.userOrder.findFirst({
      where: { id, userId },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      throw ApiError.badRequest('Cannot cancel a shipped or delivered order');
    }

    if (order.status === 'cancelled') {
      throw ApiError.badRequest('Order is already cancelled');
    }

    return prisma.userOrder.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        items: {
          include: {
            frame: {
              select: {
                id: true,
                modelName: true,
                color: true,
                size: true,
                brand: true,
                image1Url: true,
              },
            },
          },
        },
      },
    });
  }

  async getStats(userId: string): Promise<{
    total: number;
    pending: number;
    shipped: number;
    delivered: number;
  }> {
    const [total, pending, shipped, delivered] = await Promise.all([
      prisma.userOrder.count({ where: { userId } }),
      prisma.userOrder.count({ where: { userId, status: { in: ['pending', 'confirmed', 'processing'] } } }),
      prisma.userOrder.count({ where: { userId, status: 'shipped' } }),
      prisma.userOrder.count({ where: { userId, status: 'delivered' } }),
    ]);

    return { total, pending, shipped, delivered };
  }
}

export const userOrderService = new UserOrderService();
