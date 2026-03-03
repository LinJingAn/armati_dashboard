import { z } from 'zod';

export const assignFramesSchema = z.object({
  params: z.object({
    companyId: z.string().uuid(),
  }),
  body: z.object({
    frameIds: z.array(z.string().uuid()).min(1, 'At least one frame ID is required'),
  }),
});

export const unassignFramesSchema = z.object({
  params: z.object({
    companyId: z.string().uuid(),
  }),
  body: z.object({
    frameIds: z.array(z.string().uuid()).min(1, 'At least one frame ID is required'),
  }),
});

export const getCompanyFramesSchema = z.object({
  params: z.object({
    companyId: z.string().uuid(),
  }),
});

export const getFrameCompaniesSchema = z.object({
  params: z.object({
    frameId: z.string().uuid(),
  }),
});

export const toggleCompanyFrameSchema = z.object({
  params: z.object({
    companyId: z.string().uuid(),
    frameId: z.string().uuid(),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

export type AssignFramesInput = z.infer<typeof assignFramesSchema>['body'];
export type UnassignFramesInput = z.infer<typeof unassignFramesSchema>['body'];
export type ToggleCompanyFrameInput = z.infer<typeof toggleCompanyFrameSchema>['body'];
