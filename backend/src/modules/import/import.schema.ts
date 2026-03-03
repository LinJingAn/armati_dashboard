import { z } from 'zod';

// CNPJ format: XX.XXX.XXX/XXXX-XX
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// CSV row schemas for validation
export const companyRowSchema = z.object({
  cnpj: z.string().regex(cnpjRegex, 'Invalid CNPJ format (XX.XXX.XXX/XXXX-XX)'),
  corporateName: z.string().min(1, 'Corporate name is required'),
  email: z.string().regex(emailRegex, 'Invalid email format').optional().nullable(),
  phone: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const userRowSchema = z.object({
  email: z.string().regex(emailRegex, 'Invalid email format'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'COMPANY_MANAGER', 'USER']).optional().default('USER'),
  companyCnpj: z.string().regex(cnpjRegex, 'Invalid CNPJ format').optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export const employeeRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyCnpj: z.string().regex(cnpjRegex, 'Invalid CNPJ format'),
  department: z.string().optional().nullable(),
  registration: z.string().optional().nullable(),
  shift: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
});

// Query schema for import logs
export const importLogsQuerySchema = z.object({
  query: z.object({
    entityType: z.enum(['company', 'user', 'employee']).optional(),
    status: z.enum(['processing', 'completed', 'failed']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
  }),
});

export const getImportLogSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CompanyRowInput = z.infer<typeof companyRowSchema>;
export type UserRowInput = z.infer<typeof userRowSchema>;
export type EmployeeRowInput = z.infer<typeof employeeRowSchema>;
