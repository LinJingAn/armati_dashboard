import prisma from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePaginationParams, parseOrderBy, PaginatedResponse } from '../../utils/pagination.js';
import type { CreateCompanyInput, UpdateCompanyInput } from './company.schema.js';
import type { Company } from '@prisma/client';

export class CompanyService {
  async findAll(query: Record<string, unknown>): Promise<PaginatedResponse<Company>> {
    const { limit, offset, sort } = parsePaginationParams(query);
    const orderBy = parseOrderBy(sort);

    const [items, total] = await Promise.all([
      prisma.company.findMany({
        take: Number(limit) || 50,
        skip: Number(offset) || 0,
        orderBy,
      }),
      prisma.company.count(),
    ]);

    return { items, total, limit, offset };
  }

  async findById(id: string): Promise<Company> {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, employees: true },
        },
      },
    });

    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    return company;
  }

  async create(data: CreateCompanyInput): Promise<Company> {
    const existingCompany = await prisma.company.findUnique({
      where: { cnpj: data.cnpj },
    });

    if (existingCompany) {
      throw ApiError.conflict('Company with this CNPJ already exists');
    }

    return prisma.company.create({
      data: {
        cnpj: data.cnpj,
        corporateName: data.corporateName,
        email: data.email || null,
        phone: data.phone || null,
        status: data.status || 'active',
      },
    });
  }

  async update(id: string, data: UpdateCompanyInput): Promise<Company> {
    const company = await prisma.company.findUnique({ where: { id } });

    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    if (data.cnpj && data.cnpj !== company.cnpj) {
      const existingCompany = await prisma.company.findUnique({
        where: { cnpj: data.cnpj },
      });
      if (existingCompany) {
        throw ApiError.conflict('Another company with this CNPJ already exists');
      }
    }

    return prisma.company.update({
      where: { id },
      data: {
        ...(data.cnpj && { cnpj: data.cnpj }),
        ...(data.corporateName && { corporateName: data.corporateName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.status && { status: data.status }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    const company = await prisma.company.findUnique({ where: { id } });

    if (!company) {
      throw ApiError.notFound('Company not found');
    }

    await prisma.company.delete({ where: { id } });
  }
}

export const companyService = new CompanyService();
