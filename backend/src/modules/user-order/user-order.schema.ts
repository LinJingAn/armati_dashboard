import { z } from 'zod';

const orderItemSchema = z.object({
  frameId: z.string().uuid('Invalid frame ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().positive('Price must be positive'),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
});

export const createUserOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
    shippingAddress: z.string().optional().nullable(),
    paymentMethod: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const updateUserOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
    shippingAddress: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const getUserOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateUserOrderInput = z.infer<typeof createUserOrderSchema>['body'];
export type UpdateUserOrderInput = z.infer<typeof updateUserOrderSchema>['body'];
