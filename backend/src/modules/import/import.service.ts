import prisma from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { parsePaginationParams, PaginatedResponse } from '../../utils/pagination.js';
import {
  companyRowSchema,
  userRowSchema,
  employeeRowSchema,
  type CompanyRowInput,
  type UserRowInput,
  type EmployeeRowInput,
} from './import.schema.js';
import { Prisma, type ImportLog, type ImportLogEntry } from '@prisma/client';
import Papa from 'papaparse';
import bcrypt from 'bcryptjs';

interface ImportResult {
  importLog: ImportLog;
  summary: {
    total: number;
    success: number;
    errors: number;
    skipped: number;
  };
}

type ImportLogWithEntries = ImportLog & { entries: ImportLogEntry[] };

export class ImportService {
  private parseCSV<T>(csvContent: string): { data: T[]; errors: string[] } {
    const result = Papa.parse<T>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
    });

    const errors: string[] = [];
    if (result.errors.length > 0) {
      result.errors.forEach((err) => {
        errors.push(`Row ${err.row}: ${err.message}`);
      });
    }

    return { data: result.data, errors };
  }

  async importCompanies(csvContent: string, userId: string): Promise<ImportResult> {
    const { data: rows, errors: parseErrors } = this.parseCSV<Record<string, string>>(csvContent);

    const importLog = await prisma.importLog.create({
      data: {
        userId,
        entityType: 'company',
        fileName: `companies_${Date.now()}.csv`,
        status: 'processing',
        totalRows: rows.length,
      },
    });

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because of header row and 1-based indexing

      try {
        const parsed = companyRowSchema.safeParse({
          cnpj: row.cnpj || row.CNPJ,
          corporateName: row.corporateName || row.corporate_name || row.name || row.razao_social,
          email: row.email || row.Email || null,
          phone: row.phone || row.telefone || null,
          status: row.status || 'active',
        });

        if (!parsed.success) {
          const errorMsg = parsed.error.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
          await this.createLogEntry(importLog.id, rowNumber, 'error', null, row, errorMsg);
          errorCount++;
          continue;
        }

        const data: CompanyRowInput = parsed.data;

        // Check for duplicate CNPJ
        const existing = await prisma.company.findUnique({
          where: { cnpj: data.cnpj },
        });

        if (existing) {
          await this.createLogEntry(importLog.id, rowNumber, 'skipped', existing.id, row, `Duplicate CNPJ: ${data.cnpj}`);
          skipCount++;
          continue;
        }

        // Create company
        const company = await prisma.company.create({
          data: {
            cnpj: data.cnpj,
            corporateName: data.corporateName,
            email: data.email || null,
            phone: data.phone || null,
            status: data.status || 'active',
          },
        });

        await this.createLogEntry(importLog.id, rowNumber, 'success', company.id, row, null);
        successCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await this.createLogEntry(importLog.id, rowNumber, 'error', null, row, errorMsg);
        errorCount++;
      }
    }

    // Add parse errors to log
    for (const err of parseErrors) {
      await this.createLogEntry(importLog.id, 0, 'error', null, {}, err);
      errorCount++;
    }

    // Update import log with final counts
    const updatedLog = await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        status: errorCount === rows.length ? 'failed' : 'completed',
        successCount,
        errorCount,
        skipCount,
        completedAt: new Date(),
      },
    });

    return {
      importLog: updatedLog,
      summary: {
        total: rows.length,
        success: successCount,
        errors: errorCount,
        skipped: skipCount,
      },
    };
  }

  async importUsers(csvContent: string, userId: string): Promise<ImportResult> {
    const { data: rows, errors: parseErrors } = this.parseCSV<Record<string, string>>(csvContent);

    const importLog = await prisma.importLog.create({
      data: {
        userId,
        entityType: 'user',
        fileName: `users_${Date.now()}.csv`,
        status: 'processing',
        totalRows: rows.length,
      },
    });

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        const parsed = userRowSchema.safeParse({
          email: row.email || row.Email,
          name: row.name || row.nome || row.Name,
          role: row.role || row.Role || 'USER',
          companyCnpj: row.companyCnpj || row.company_cnpj || row.cnpj || null,
          phone: row.phone || row.telefone || null,
          whatsapp: row.whatsapp || row.Whatsapp || null,
          password: row.password || row.senha || null,
        });

        if (!parsed.success) {
          const errorMsg = parsed.error.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
          await this.createLogEntry(importLog.id, rowNumber, 'error', null, row, errorMsg);
          errorCount++;
          continue;
        }

        const data: UserRowInput = parsed.data;

        // Check for duplicate email
        const existing = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existing) {
          await this.createLogEntry(importLog.id, rowNumber, 'skipped', existing.id, row, `Duplicate email: ${data.email}`);
          skipCount++;
          continue;
        }

        // Find company by CNPJ if provided
        let companyId: string | null = null;
        if (data.companyCnpj) {
          const company = await prisma.company.findUnique({
            where: { cnpj: data.companyCnpj },
          });
          if (!company) {
            await this.createLogEntry(importLog.id, rowNumber, 'error', null, row, `Company not found with CNPJ: ${data.companyCnpj}`);
            errorCount++;
            continue;
          }
          companyId = company.id;
        }

        // Hash password if provided, otherwise generate a random one
        const plainPassword = data.password || this.generateRandomPassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 12);

        // Create user
        const user = await prisma.user.create({
          data: {
            email: data.email,
            name: data.name,
            role: data.role,
            companyId,
            phone: data.phone || null,
            whatsapp: data.whatsapp || null,
            password: hashedPassword,
            isActive: true,
            isEmailVerified: false,
          },
        });

        await this.createLogEntry(importLog.id, rowNumber, 'success', user.id, row, null);
        successCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await this.createLogEntry(importLog.id, rowNumber, 'error', null, row, errorMsg);
        errorCount++;
      }
    }

    for (const err of parseErrors) {
      await this.createLogEntry(importLog.id, 0, 'error', null, {}, err);
      errorCount++;
    }

    const updatedLog = await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        status: errorCount === rows.length ? 'failed' : 'completed',
        successCount,
        errorCount,
        skipCount,
        completedAt: new Date(),
      },
    });

    return {
      importLog: updatedLog,
      summary: {
        total: rows.length,
        success: successCount,
        errors: errorCount,
        skipped: skipCount,
      },
    };
  }

  async importEmployees(csvContent: string, userId: string): Promise<ImportResult> {
    const { data: rows, errors: parseErrors } = this.parseCSV<Record<string, string>>(csvContent);

    const importLog = await prisma.importLog.create({
      data: {
        userId,
        entityType: 'employee',
        fileName: `employees_${Date.now()}.csv`,
        status: 'processing',
        totalRows: rows.length,
      },
    });

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        const parsed = employeeRowSchema.safeParse({
          name: row.name || row.nome || row.Name,
          companyCnpj: row.companyCnpj || row.company_cnpj || row.cnpj,
          department: row.department || row.departamento || null,
          registration: row.registration || row.matricula || row.registro || null,
          shift: row.shift || row.turno || null,
          unit: row.unit || row.unidade || null,
        });

        if (!parsed.success) {
          const errorMsg = parsed.error.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
          await this.createLogEntry(importLog.id, rowNumber, 'error', null, row, errorMsg);
          errorCount++;
          continue;
        }

        const data: EmployeeRowInput = parsed.data;

        // Find company by CNPJ
        const company = await prisma.company.findUnique({
          where: { cnpj: data.companyCnpj },
        });

        if (!company) {
          await this.createLogEntry(importLog.id, rowNumber, 'error', null, row, `Company not found with CNPJ: ${data.companyCnpj}`);
          errorCount++;
          continue;
        }

        // Check for duplicate by registration + companyId (if registration is provided)
        if (data.registration) {
          const existing = await prisma.employee.findFirst({
            where: {
              companyId: company.id,
              registration: data.registration,
            },
          });

          if (existing) {
            await this.createLogEntry(importLog.id, rowNumber, 'skipped', existing.id, row, `Duplicate: registration ${data.registration} already exists in company`);
            skipCount++;
            continue;
          }
        }

        // Create employee
        const employee = await prisma.employee.create({
          data: {
            name: data.name,
            companyId: company.id,
            department: data.department || null,
            registration: data.registration || null,
            shift: data.shift || null,
            unit: data.unit || null,
          },
        });

        await this.createLogEntry(importLog.id, rowNumber, 'success', employee.id, row, null);
        successCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await this.createLogEntry(importLog.id, rowNumber, 'error', null, row, errorMsg);
        errorCount++;
      }
    }

    for (const err of parseErrors) {
      await this.createLogEntry(importLog.id, 0, 'error', null, {}, err);
      errorCount++;
    }

    const updatedLog = await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        status: errorCount === rows.length ? 'failed' : 'completed',
        successCount,
        errorCount,
        skipCount,
        completedAt: new Date(),
      },
    });

    return {
      importLog: updatedLog,
      summary: {
        total: rows.length,
        success: successCount,
        errors: errorCount,
        skipped: skipCount,
      },
    };
  }

  async getImportLogs(query: Record<string, unknown>): Promise<PaginatedResponse<ImportLog>> {
    const { limit, offset } = parsePaginationParams(query);

    const where: Record<string, unknown> = {};

    if (query.entityType) {
      where.entityType = query.entityType;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(query.startDate as string);
      }
      if (query.endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(query.endDate as string);
      }
    }

    const [items, total] = await Promise.all([
      prisma.importLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.importLog.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async getImportLogById(id: string): Promise<ImportLogWithEntries> {
    const importLog = await prisma.importLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        entries: {
          orderBy: { rowNumber: 'asc' },
        },
      },
    });

    if (!importLog) {
      throw ApiError.notFound('Import log not found');
    }

    return importLog;
  }

  private async createLogEntry(
    importLogId: string,
    rowNumber: number,
    status: string,
    entityId: string | null,
    rawData: Record<string, unknown>,
    errorMessage: string | null
  ): Promise<void> {
    await prisma.importLogEntry.create({
      data: {
        importLogId,
        rowNumber,
        status,
        entityId,
        rawData: rawData as Prisma.InputJsonValue,
        errorMessage,
      },
    });
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  getCSVTemplate(entityType: 'company' | 'user' | 'employee'): string {
    switch (entityType) {
      case 'company':
        return 'cnpj,corporateName,email,phone,status\n12.345.678/0001-90,Example Company,contact@example.com,11999999999,active';
      case 'user':
        return 'email,name,role,companyCnpj,phone,whatsapp,password\nuser@example.com,John Doe,USER,12.345.678/0001-90,11999999999,11999999999,password123';
      case 'employee':
        return 'name,companyCnpj,department,registration,shift,unit\nJohn Worker,12.345.678/0001-90,Production,EMP001,Morning,Factory A';
      default:
        throw ApiError.badRequest('Invalid entity type');
    }
  }
}

export const importService = new ImportService();
