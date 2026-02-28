import { z } from 'zod';

export const createFrameSchema = z.object({
  body: z.object({
    modelName: z.string().min(1, 'Model name is required'),
    sku: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    size: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    brand: z.string().optional().nullable(),
    price: z.number().positive().optional().nullable(),
    image1Url: z.string().optional().nullable(),
    image2Url: z.string().optional().nullable(),
    image3Url: z.string().optional().nullable(),
    image4Url: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const updateFrameSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    modelName: z.string().min(1).optional(),
    sku: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    size: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    brand: z.string().optional().nullable(),
    price: z.number().positive().optional().nullable(),
    image1Url: z.string().optional().nullable(),
    image2Url: z.string().optional().nullable(),
    image3Url: z.string().optional().nullable(),
    image4Url: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const getFrameSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateFrameInput = z.infer<typeof createFrameSchema>['body'];
export type UpdateFrameInput = z.infer<typeof updateFrameSchema>['body'];
