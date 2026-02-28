export interface PaginationParams {
  limit: number;
  offset: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export function parsePaginationParams(query: Record<string, unknown>): PaginationParams {
  const limit = Math.min(Math.max(parseInt(String(query.limit) || '50', 10), 1), 100);
  const offset = Math.max(parseInt(String(query.offset) || '0', 10), 0);
  const sort = query.sort ? String(query.sort) : undefined;
  
  return { limit, offset, sort };
}

export function parseOrderBy(sort?: string): { [key: string]: 'asc' | 'desc' } | undefined {
  if (!sort) return { createdAt: 'desc' };
  
  const direction = sort.startsWith('-') ? 'desc' : 'asc';
  let field = sort.replace(/^-/, '');
  
  // Convert snake_case to camelCase for Prisma compatibility
  const fieldMap: Record<string, string> = {
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'model_name': 'modelName',
    'is_active': 'isActive',
    'image_1_url': 'image1Url',
    'image_2_url': 'image2Url',
    'corporate_name': 'corporateName',
    'company_id': 'companyId',
    'employee_id': 'employeeId',
    'frame_id': 'frameId',
    'prescription_url': 'prescriptionUrl',
    'image_url': 'imageUrl',
  };
  
  if (fieldMap[field]) {
    field = fieldMap[field];
  }
  
  return { [field]: direction };
}
