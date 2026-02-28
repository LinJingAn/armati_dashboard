import prisma from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePaginationParams, parseOrderBy, PaginatedResponse } from '../../utils/pagination.js';
import type { CreateSupportTicketInput, UpdateSupportTicketInput } from './supportTicket.schema.js';
import type { SupportTicket } from '@prisma/client';

export class SupportTicketService {
  async findAll(
    query: Record<string, unknown>,
    userCompanyId?: string | null,
    userRole?: string
  ): Promise<PaginatedResponse<SupportTicket>> {
    const { limit, offset, sort } = parsePaginationParams(query);
    const orderBy = parseOrderBy(sort);

    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (userRole !== 'ADMIN' && userCompanyId) {
      where.employee = { companyId: userCompanyId };
    }

    const [items, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        take: Number(limit) || 50,
        skip: Number(offset) || 0,
        orderBy,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              company: { select: { id: true, corporateName: true } },
            },
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findById(id: string): Promise<SupportTicket> {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            department: true,
            registration: true,
            company: { select: { id: true, corporateName: true, cnpj: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw ApiError.notFound('Support ticket not found');
    }

    return ticket;
  }

  async create(data: CreateSupportTicketInput): Promise<SupportTicket> {
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }

    return prisma.supportTicket.create({
      data: {
        employeeId: data.employeeId,
        description: data.description,
        imageUrl: data.imageUrl || null,
        status: 'under_analysis',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            company: { select: { id: true, corporateName: true } },
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateSupportTicketInput): Promise<SupportTicket> {
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });

    if (!ticket) {
      throw ApiError.notFound('Support ticket not found');
    }

    return prisma.supportTicket.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.description && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.resolution !== undefined && { resolution: data.resolution }),
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            company: { select: { id: true, corporateName: true } },
          },
        },
      },
    });
  }

  async checkAccess(ticketId: string, userCompanyId?: string | null, userRole?: string): Promise<boolean> {
    if (userRole === 'ADMIN') return true;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { employee: { select: { companyId: true } } },
    });

    if (!ticket) return false;

    return ticket.employee.companyId === userCompanyId;
  }
}

export const supportTicketService = new SupportTicketService();
