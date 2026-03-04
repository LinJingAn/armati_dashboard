import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../config/database.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { emailService } from '../../services/email.service.js';
import type { LoginInput, RegisterInput, SignupInput, ResendVerificationInput, ChangePasswordInput } from './auth.schema.js';
import { formatCnpj } from '../../utils/cnpj.js';

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export class AuthService {
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { company: true },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is deactivated');
    }

    if (!user.password) {
      throw ApiError.unauthorized('This account uses Google Sign-In. Please sign in with Google.');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        company: user.company,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    if (data.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: data.companyId },
      });
      if (!company) {
        throw ApiError.notFound('Company not found');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'USER',
        companyId: data.companyId || null,
        phone: data.phone,
        whatsapp: data.whatsapp,
        isEmailVerified: true,
      },
      include: { company: true },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        company: user.company,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async signup(data: SignupInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    let companyId: string | null = null;
    let role: 'USER' | 'COMPANY_MANAGER' = 'USER';

    if (data.cnpj) {
      const cnpjFormatted = formatCnpj(data.cnpj);
      const company = await prisma.company.findFirst({
        where: { cnpj: cnpjFormatted },
      });
      if (company) {
        companyId = company.id;
        role = 'COMPANY_MANAGER';
      } else {
        throw ApiError.badRequest(
          'Company with this CNPJ not found. Please contact admin to register your company first.'
        );
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const verifyToken = generateVerificationToken();
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role,
        companyId,
        phone: data.phone,
        isEmailVerified: false,
        emailVerifyToken: verifyToken,
        emailVerifyExpires: verifyExpires,
      },
    });

    // Send verification email (non-blocking)
    emailService.sendVerificationEmail(user.email, user.name, verifyToken).catch((err) => {
      console.error('[Auth] Failed to send verification email:', err);
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        isEmailVerified: user.isEmailVerified,
      },
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error('[Auth] Failed to send welcome email:', err);
    });

    const jwtToken = this.generateToken(user.id, user.email, user.role);
    return {
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        isEmailVerified: true,
      },
      message: 'Email verified successfully!',
    };
  }

  async resendVerificationEmail(data: ResendVerificationInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Return success even if not found to prevent email enumeration
      return { message: 'If that email exists, a verification link has been sent.' };
    }

    if (user.isEmailVerified) {
      throw ApiError.badRequest('Email is already verified');
    }

    const verifyToken = generateVerificationToken();
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: verifyToken,
        emailVerifyExpires: verifyExpires,
      },
    });

    // Send verification email (non-blocking)
    emailService.sendVerificationEmail(user.email, user.name, verifyToken).catch((err) => {
      console.error('[Auth] Failed to resend verification email:', err);
    });

    return { message: 'Verification email sent. Please check your inbox.' };
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.password) {
      throw ApiError.badRequest('This account uses Google Sign-In. Password cannot be changed.');
    }

    const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValidPassword) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async googleCallback(profile: {
    id: string;
    emails?: { value: string }[];
    displayName: string;
  }) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw ApiError.badRequest('No email associated with this Google account');
    }

    // Check if user exists by Google ID or email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.id }, { email }] },
      include: { company: true },
    });

    if (user) {
      // Link Google ID if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: profile.id,
            isEmailVerified: true,
            emailVerifyToken: null,
            emailVerifyExpires: null,
          },
          include: { company: true },
        });
      }
    } else {
      // Create new user from Google
      user = await prisma.user.create({
        data: {
          email,
          name: profile.displayName,
          googleId: profile.id,
          role: 'USER',
          isEmailVerified: true,
        },
        include: { company: true },
      });
    }

    const token = this.generateToken(user.id, user.email, user.role);
    return { token, user };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      company: user.company,
      phone: user.phone,
      whatsapp: user.whatsapp,
      isEmailVerified: user.isEmailVerified,
      googleId: user.googleId,
      createdAt: user.createdAt,
    };
  }

  private generateToken(userId: string, email: string, role: string): string {
    const options: jwt.SignOptions = { expiresIn: '24h' };
    return jwt.sign(
      { userId, email, role },
      env.JWT_SECRET,
      options
    );
  }
}

export const authService = new AuthService();
