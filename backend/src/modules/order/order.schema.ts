import { z } from 'zod';

const orderStatuses = ['draft', 'pending', 'approved', 'in_production', 'shipped', 'delivered', 'cancelled'] as const;

export const createOrderSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
    frameId: z.string().uuid('Invalid frame ID'),
    status: z.enum(orderStatuses).optional(),
    prescriptionUrl: z.string().url().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const updateOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    frameId: z.string().uuid().optional(),
    status: z.enum(orderStatuses).optional(),
    prescriptionUrl: z.string().url().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const getOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>['body'];
