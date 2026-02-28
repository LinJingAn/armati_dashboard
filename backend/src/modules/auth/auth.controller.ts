import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json({
    success: true,
    data: result,
  });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json({
    success: true,
    data: result,
  });
});

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.signup(req.body);
  res.status(201).json({
    success: true,
    data: result,
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query as { token: string };
  const result = await authService.verifyEmail(token);
  res.json({
    success: true,
    data: result,
  });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.resendVerificationEmail(req.body);
  res.json({
    success: true,
    data: result,
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Not authenticated');
  }
  const result = await authService.changePassword(req.user.userId, req.body);
  res.json({
    success: true,
    data: result,
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Not authenticated');
  }
  const user = await authService.getMe(req.user.userId);
  res.json(user);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Google OAuth handlers
export const googleAuth = asyncHandler(async (_req: Request, _res: Response) => {
  // Handled by passport middleware - this is never called
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as { id: string; email: string; name: string; role: string } | undefined;
  
  if (!user) {
    return res.redirect(`${env.FRONTEND_URL}/auth/error?msg=Google+authentication+failed`);
  }

  try {
    const profile = {
      id: (req.user as { googleId?: string })?.googleId || '',
      emails: [{ value: user.email }],
      displayName: user.name,
    };
    const result = await authService.googleCallback(profile);
    res.redirect(`${env.FRONTEND_URL}/auth/google/callback?token=${result.token}`);
  } catch {
    res.redirect(`${env.FRONTEND_URL}/auth/error?msg=Google+authentication+failed`);
  }
});
