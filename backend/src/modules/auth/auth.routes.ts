import { Router, Request, Response, NextFunction } from 'express';
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

// Google OAuth — show account chooser then consent ("You're signing back in to [domain]")
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    // Space-delimited: select_account = account chooser; consent = "Sign in to [domain]" with Continue/Cancel
    prompt: 'select_account consent',
  })
);

router.get('/google/callback', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    'google',
    { session: false },
    (err: Error | null, user?: { jwtToken?: string }, info?: { message?: string }) => {
      if (err) {
        console.error('[Google OAuth] Callback error:', err.message);
        if (err.name === 'InternalOAuthError' && (err as { oauthError?: unknown }).oauthError) {
          console.error('[Google OAuth] OAuth error detail:', (err as { oauthError?: unknown }).oauthError);
        }
        const msg = encodeURIComponent('Google sign-in failed. Please try again.');
        return res.redirect(`${env.FRONTEND_URL}/auth/error?msg=${msg}`);
      }
      if (!user?.jwtToken) {
        const msg = encodeURIComponent(info?.message || 'Google authentication failed');
        return res.redirect(`${env.FRONTEND_URL}/auth/error?msg=${msg}`);
      }
      res.redirect(`${env.FRONTEND_URL}/auth/google/callback?token=${user.jwtToken}`);
    }
  )(req, res, next);
});

export default router;
