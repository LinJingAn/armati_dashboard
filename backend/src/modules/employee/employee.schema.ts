import { z } from 'zod';

export const createEmployeeSchema = z.object({
  body: z.object({
    companyId: z.string().uuid('Invalid company ID'),
    name: z.string().min(1, 'Name is required'),
    department: z.string().optional().nullable(),
    registration: z.string().optional().nullable(),
    shift: z.string().optional().nullable(),
    unit: z.string().optional().nullable(),
    photoUrl: z.string().url().optional().nullable(),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    department: z.string().optional().nullable(),
    registration: z.string().optional().nullable(),
    shift: z.string().optional().nullable(),
    unit: z.string().optional().nullable(),
    photoUrl: z.string().url().optional().nullable(),
  }),
});

export const getEmployeeSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>['body'];
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>['body'];
