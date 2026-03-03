import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env.js';
import { authService } from '../modules/auth/auth.service.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
      // Use OpenID Connect userinfo endpoint (current Google recommendation; avoids deprecated APIs)
      userProfileURL: 'https://openidconnect.googleapis.com/v1/userinfo',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const result = await authService.googleCallback(profile);
        const u = result.user;
        done(null, {
          userId: u.id,
          email: u.email,
          role: u.role,
          companyId: u.companyId ?? undefined,
          jwtToken: result.token,
        });
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user as Express.User);
});

export default passport;
