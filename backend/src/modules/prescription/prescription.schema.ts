import { z } from 'zod';

// Optical prescription values validation
const sphereSchema = z.number().min(-20).max(20).optional().nullable();
const cylinderSchema = z.number().min(-10).max(10).optional().nullable();
const axisSchema = z.number().int().min(0).max(180).optional().nullable();
const additionSchema = z.number().min(0).max(4).optional().nullable();
const pdSchema = z.number().min(20).max(80).optional().nullable();

export const createPrescriptionSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
  }),
  body: z.object({
    // Right eye (OD - Oculus Dexter)
    odSphere: sphereSchema,
    odCylinder: cylinderSchema,
    odAxis: axisSchema,
    odAddition: additionSchema,
    // Left eye (OS - Oculus Sinister)
    osSphere: sphereSchema,
    osCylinder: cylinderSchema,
    osAxis: axisSchema,
    osAddition: additionSchema,
    // Pupillary distance
    pdRight: pdSchema,
    pdLeft: pdSchema,
    pdBinocular: pdSchema,
    // Notes
    notes: z.string().optional().nullable(),
  }),
});

export const updatePrescriptionSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
  }),
  body: z.object({
    odSphere: sphereSchema,
    odCylinder: cylinderSchema,
    odAxis: axisSchema,
    odAddition: additionSchema,
    osSphere: sphereSchema,
    osCylinder: cylinderSchema,
    osAxis: axisSchema,
    osAddition: additionSchema,
    pdRight: pdSchema,
    pdLeft: pdSchema,
    pdBinocular: pdSchema,
    notes: z.string().optional().nullable(),
  }),
});

export const getPrescriptionSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
  }),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>['body'];
export type UpdatePrescriptionInput = z.infer<typeof updatePrescriptionSchema>['body'];
