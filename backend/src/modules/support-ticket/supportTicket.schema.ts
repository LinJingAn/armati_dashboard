import { z } from 'zod';

const ticketStatuses = ['under_analysis', 'in_progress', 'resolved', 'closed'] as const;

export const createSupportTicketSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
    description: z.string().min(1, 'Description is required'),
    imageUrl: z.string().url().optional().nullable(),
  }),
});

export const updateSupportTicketSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(ticketStatuses).optional(),
    description: z.string().min(1).optional(),
    imageUrl: z.string().url().optional().nullable(),
    resolution: z.string().optional().nullable(),
  }),
});

export const getSupportTicketSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>['body'];
export type UpdateSupportTicketInput = z.infer<typeof updateSupportTicketSchema>['body'];
