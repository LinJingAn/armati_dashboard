import { Router, Request, Response } from 'express';
import passport from '../../config/passport.js';
import {
  login,
  register,
  signup,
  getMe,
  logout,
  verifyEmail,
  resendVerification,
  changePassword,
} from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  loginSchema,
  registerSchema,
  signupSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changePasswordSchema,
} from './auth.schema.js';
import { env } from '../../config/env.js';

const router = Router();

// Standard auth
router.post('/login', validate(loginSchema), login);
router.post('/signup', validate(signupSchema), signup);
router.post('/register', authenticate, authorize('ADMIN'), validate(registerSchema), register);
router.get('/me', authenticate, getMe);
router.post('/logout', logout);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

// Email verification
router.get('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), resendVerification);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${env.FRONTEND_URL}/auth/error?msg=Google+authentication+failed` }),
  (_req: Request, res: Response) => {
    const user = _req.user as { jwtToken?: string } | undefined;
    if (!user?.jwtToken) {
      return res.redirect(`${env.FRONTEND_URL}/auth/error?msg=Google+authentication+failed`);
    }
    res.redirect(`${env.FRONTEND_URL}/auth/google/callback?token=${user.jwtToken}`);
  }
);

export default router;
