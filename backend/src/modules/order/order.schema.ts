import { z } from 'zod';

export const orderStatuses = ['draft', 'pending', 'approved', 'in_production', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = typeof orderStatuses[number];

// Order item schema for multi-item orders
const orderItemSchema = z.object({
  frameId: z.string().uuid('Invalid frame ID'),
  quantity: z.number().int().min(1).default(1),
  price: z.number().optional().nullable(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Legacy single-frame create (backward compat)
export const createOrderSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
    // Legacy single-frame support (optional now)
    frameId: z.string().uuid('Invalid frame ID').optional(),
    // Multi-item support (optional, use instead of frameId)
    items: z.array(orderItemSchema).optional(),
    status: z.enum(orderStatuses).optional(),
    prescriptionUrl: z.string().url().optional().nullable(),
    notes: z.string().optional().nullable(),
  }).refine(
    (data) => data.frameId || (data.items && data.items.length > 0),
    { message: 'Either frameId or items array is required' }
  ),
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

// Schema for adding items to an existing order
export const addOrderItemsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  }),
});

// Schema for updating an order item
export const updateOrderItemSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    itemId: z.string().uuid(),
  }),
  body: z.object({
    quantity: z.number().int().min(1).optional(),
    price: z.number().optional().nullable(),
    color: z.string().optional().nullable(),
    size: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

// Schema for removing an order item
export const removeOrderItemSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    itemId: z.string().uuid(),
  }),
});

// Schema for status transition (workflow)
export const transitionStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(orderStatuses),
    note: z.string().optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>['body'];
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type AddOrderItemsInput = z.infer<typeof addOrderItemsSchema>['body'];
export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>['body'];
export type TransitionStatusInput = z.infer<typeof transitionStatusSchema>['body'];
