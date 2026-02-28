import { z } from 'zod';

const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

export const createCompanySchema = z.object({
  body: z.object({
    cnpj: z.string().regex(cnpjRegex, 'Invalid CNPJ format (XX.XXX.XXX/XXXX-XX)'),
    corporateName: z.string().min(1, 'Corporate name is required'),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const updateCompanySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    cnpj: z.string().regex(cnpjRegex, 'Invalid CNPJ format').optional(),
    corporateName: z.string().min(1).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const getCompanySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>['body'];
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>['body'];
