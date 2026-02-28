import { z } from 'zod';

const whatsappRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    role: z.enum(['ADMIN', 'COMPANY_MANAGER', 'USER']).optional(),
    companyId: z.string().uuid().optional().nullable(),
    phone: z.string().optional().nullable(),
    whatsapp: z.string().regex(whatsappRegex, 'Invalid WhatsApp format').optional().nullable(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    name: z.string().min(1).optional(),
    role: z.enum(['ADMIN', 'COMPANY_MANAGER', 'USER']).optional(),
    companyId: z.string().uuid().optional().nullable(),
    phone: z.string().optional().nullable(),
    whatsapp: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
