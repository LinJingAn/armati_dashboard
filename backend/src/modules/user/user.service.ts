import bcrypt from 'bcryptjs';
import prisma from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePaginationParams, parseOrderBy, PaginatedResponse } from '../../utils/pagination.js';
import type { CreateUserInput, UpdateUserInput } from './user.schema.js';
import type { User } from '@prisma/client';

type UserWithoutPassword = Omit<User, 'password'>;

export class UserService {
  async findAll(query: Record<string, unknown>): Promise<PaginatedResponse<UserWithoutPassword>> {
    const { limit, offset, sort } = parsePaginationParams(query);
    const orderBy = parseOrderBy(sort);

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        take: Number(limit) || 50,
        skip: Number(offset) || 0,
        orderBy,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          whatsapp: true,
          role: true,
          companyId: true,
          company: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    return { items: items as unknown as UserWithoutPassword[], total, limit, offset };
  }

  async findById(id: string): Promise<UserWithoutPassword> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        whatsapp: true,
        role: true,
        companyId: true,
        company: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user as unknown as UserWithoutPassword;
  }

  async create(data: CreateUserInput): Promise<UserWithoutPassword> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
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
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        whatsapp: true,
        role: true,
        companyId: true,
        company: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user as unknown as UserWithoutPassword;
  }

  async update(id: string, data: UpdateUserInput): Promise<UserWithoutPassword> {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        throw ApiError.conflict('Another user with this email already exists');
      }
    }

    if (data.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: data.companyId },
      });
      if (!company) {
        throw ApiError.notFound('Company not found');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.email) updateData.email = data.email;
    if (data.name) updateData.name = data.name;
    if (data.role) updateData.role = data.role;
    if (data.companyId !== undefined) updateData.companyId = data.companyId;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        whatsapp: true,
        role: true,
        companyId: true,
        company: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser as unknown as UserWithoutPassword;
  }

  async delete(id: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const userService = new UserService();
