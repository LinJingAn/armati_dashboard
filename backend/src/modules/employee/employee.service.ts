import prisma from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePaginationParams, parseOrderBy, PaginatedResponse } from '../../utils/pagination.js';
import type { CreateEmployeeInput, UpdateEmployeeInput } from './employee.schema.js';
import type { Employee } from '@prisma/client';

export class EmployeeService {
  async findAll(
    query: Record<string, unknown>,
    userCompanyId?: string | null,
    userRole?: string
  ): Promise<PaginatedResponse<Employee>> {
    const { limit, offset, sort } = parsePaginationParams(query);
    const orderBy = parseOrderBy(sort);

    const where: Record<string, unknown> = {};

    if (query.companyId) {
      where.companyId = query.companyId;
    } else if (userRole !== 'ADMIN' && userCompanyId) {
      where.companyId = userCompanyId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: String(query.search), mode: 'insensitive' } },
        { registration: { contains: String(query.search), mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        take: Number(limit) || 50,
        skip: Number(offset) || 0,
        orderBy,
        include: {
          company: {
            select: { id: true, corporateName: true },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findById(id: string): Promise<Employee> {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, corporateName: true, cnpj: true },
        },
        _count: {
          select: { orders: true, supportTickets: true },
        },
      },
    });

    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }

    return employee;
  }

  async create(data: CreateEmployeeInput): Promise<Employee> {
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    return prisma.employee.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        department: data.department || null,
        registration: data.registration || null,
        shift: data.shift || null,
        unit: data.unit || null,
        photoUrl: data.photoUrl || null,
      },
      include: {
        company: {
          select: { id: true, corporateName: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateEmployeeInput): Promise<Employee> {
    const employee = await prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }

    return prisma.employee.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.registration !== undefined && { registration: data.registration }),
        ...(data.shift !== undefined && { shift: data.shift }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      },
      include: {
        company: {
          select: { id: true, corporateName: true },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    const employee = await prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }

    await prisma.employee.delete({ where: { id } });
  }

  async checkAccess(employeeId: string, userCompanyId?: string | null, userRole?: string): Promise<boolean> {
    if (userRole === 'ADMIN') return true;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { companyId: true },
    });

    if (!employee) return false;

    return employee.companyId === userCompanyId;
  }
}

export const employeeService = new EmployeeService();
