import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const emailService = {
  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    if (!env.EMAIL_ENABLED || !resend) {
      console.log('[Email] Email disabled or Resend not configured. Skipping verification email.');
      console.log(`[Email] Verification token for ${to}: ${token}`);
      return;
    }

    const verifyUrl = `${env.FRONTEND_URL}/auth/verify-email?token=${token}`;

    try {
      const { error } = await resend.emails.send({
        from: `SafeVision <${env.RESEND_FROM}>`,
        to: [to],
        subject: 'Verify your SafeVision email address',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="margin:0;padding:0;background:#0a0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
                    <tr>
                      <td style="padding:32px;text-align:center;background:linear-gradient(135deg,#1e3a8a,#312e81);">
                        <div style="display:inline-flex;align-items:center;gap:10px;">
                          <div style="background:#2563eb;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;">
                            <span style="font-size:24px;">👓</span>
                          </div>
                          <span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">SafeVision</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px 36px;">
                        <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9fafb;">
                          Verify your email address
                        </h1>
                        <p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.6;">
                          Hi ${name}, welcome to SafeVision! Please verify your email to activate your account and get full access to our industrial safety platform.
                        </p>

                        <div style="text-align:center;margin:32px 0;">
                          <a href="${verifyUrl}"
                            style="display:inline-block;padding:14px 36px;background:#2563eb;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                            Verify Email Address
                          </a>
                        </div>

                        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-align:center;">
                          Or copy and paste this link in your browser:
                        </p>
                        <p style="margin:0 0 32px;font-size:12px;color:#4b5563;word-break:break-all;text-align:center;background:#1a2332;padding:12px;border-radius:8px;border:1px solid #1f2937;">
                          ${verifyUrl}
                        </p>

                        <div style="border-top:1px solid #1f2937;padding-top:24px;">
                          <p style="margin:0;font-size:13px;color:#4b5563;text-align:center;">
                            This link expires in <strong style="color:#6b7280;">24 hours</strong>. If you didn't create an account, you can safely ignore this email.
                          </p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 36px;background:#0d1117;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#374151;">
                          © ${new Date().getFullYear()} SafeVision · Industrial Safety Glasses Platform
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('[Email] Resend error:', error);
        throw new Error(error.message);
      }

      console.log(`[Email] Verification email sent to ${to}`);
    } catch (err) {
      console.error('[Email] Failed to send verification email:', err);
      throw err;
    }
  },

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    if (!env.EMAIL_ENABLED || !resend) {
      console.log('[Email] Email disabled or Resend not configured. Skipping welcome email.');
      return;
    }

    try {
      const { error } = await resend.emails.send({
        from: `SafeVision <${env.RESEND_FROM}>`,
        to: [to],
        subject: 'Welcome to SafeVision!',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin:0;padding:0;background:#0a0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
                    <tr>
                      <td style="padding:32px;text-align:center;background:linear-gradient(135deg,#1e3a8a,#312e81);">
                        <span style="font-size:22px;font-weight:700;color:#fff;">👓 SafeVision</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px 36px;text-align:center;">
                        <div style="font-size:48px;margin-bottom:16px;">🎉</div>
                        <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9fafb;">Welcome to SafeVision, ${name}!</h1>
                        <p style="margin:0;font-size:15px;color:#9ca3af;line-height:1.6;">
                          Your account is now verified and ready to use. Explore our full range of industrial safety glasses and manage your team's protection equipment efficiently.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 36px;background:#0d1117;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#374151;">© ${new Date().getFullYear()} SafeVision · Industrial Safety Glasses Platform</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('[Email] Resend error:', error);
        throw new Error(error.message);
      }

      console.log(`[Email] Welcome email sent to ${to}`);
    } catch (err) {
      console.error('[Email] Failed to send welcome email:', err);
      throw err;
    }
  },

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    if (!env.EMAIL_ENABLED || !resend) {
      console.log('[Email] Email disabled or Resend not configured. Skipping password reset email.');
      console.log(`[Email] Password reset token for ${to}: ${token}`);
      return;
    }

    const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?token=${token}`;

    try {
      const { error } = await resend.emails.send({
        from: `SafeVision <${env.RESEND_FROM}>`,
        to: [to],
        subject: 'Reset your SafeVision password',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="margin:0;padding:0;background:#0a0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
                    <tr>
                      <td style="padding:32px;text-align:center;background:linear-gradient(135deg,#1e3a8a,#312e81);">
                        <span style="font-size:22px;font-weight:700;color:#fff;">👓 SafeVision</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px 36px;">
                        <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f9fafb;">
                          Reset your password
                        </h1>
                        <p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.6;">
                          Hi ${name}, we received a request to reset your password. Click the button below to create a new password.
                        </p>

                        <div style="text-align:center;margin:32px 0;">
                          <a href="${resetUrl}"
                            style="display:inline-block;padding:14px 36px;background:#2563eb;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                            Reset Password
                          </a>
                        </div>

                        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-align:center;">
                          Or copy and paste this link in your browser:
                        </p>
                        <p style="margin:0 0 32px;font-size:12px;color:#4b5563;word-break:break-all;text-align:center;background:#1a2332;padding:12px;border-radius:8px;border:1px solid #1f2937;">
                          ${resetUrl}
                        </p>

                        <div style="border-top:1px solid #1f2937;padding-top:24px;">
                          <p style="margin:0;font-size:13px;color:#4b5563;text-align:center;">
                            This link expires in <strong style="color:#6b7280;">1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
                          </p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 36px;background:#0d1117;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#374151;">
                          © ${new Date().getFullYear()} SafeVision · Industrial Safety Glasses Platform
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('[Email] Resend error:', error);
        throw new Error(error.message);
      }

      console.log(`[Email] Password reset email sent to ${to}`);
    } catch (err) {
      console.error('[Email] Failed to send password reset email:', err);
      throw err;
    }
  },

  isConfigured(): boolean {
    return env.EMAIL_ENABLED && !!resend;
  },
};
