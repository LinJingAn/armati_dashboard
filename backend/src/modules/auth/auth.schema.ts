import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    role: z.enum(['ADMIN', 'COMPANY_MANAGER', 'USER']).optional(),
    companyId: z.string().uuid().optional().nullable(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
  }),
});

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
  }),
});

export const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type SignupInput = z.infer<typeof signupSchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['query'];
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
