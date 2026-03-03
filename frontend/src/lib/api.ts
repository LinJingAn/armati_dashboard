import axios from 'axios';
import { getAPIBaseURL } from './config';

const TOKEN_KEY = 'auth_token';

const axiosClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.includes('/') || window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  companyId?: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  phone?: string;
  cnpj?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: string;
  [key: string]: unknown;
}

interface QueryResult<T> {
  data: {
    items: T[];
    total: number;
  } | null;
  error?: string;
}

interface CreateOptions<T> {
  data: Partial<T>;
}

interface UpdateOptions<T> {
  id: string;
  data: Partial<T>;
}

interface DeleteOptions {
  id: string;
}

function createEntityClient<T>(entityName: string) {
  return {
    async query(options: QueryOptions = {}): Promise<QueryResult<T>> {
      try {
        const baseURL = getAPIBaseURL();
        const response = await axiosClient.get(`${baseURL}/api/v1/${entityName}`, {
          params: options,
        });
        return { data: response.data };
      } catch (error) {
        console.error(`Failed to query ${entityName}:`, error);
        return { data: { items: [], total: 0 } };
      }
    },
    async get(id: string | number): Promise<{ data: T | null }> {
      try {
        const baseURL = getAPIBaseURL();
        const response = await axiosClient.get(`${baseURL}/api/v1/${entityName}/${id}`);
        return { data: response.data };
      } catch (error) {
        console.error(`Failed to get ${entityName}/${id}:`, error);
        return { data: null };
      }
    },
    async create(options: CreateOptions<T>): Promise<{ data: T | null; error?: string }> {
      try {
        const baseURL = getAPIBaseURL();
        const response = await axiosClient.post(`${baseURL}/api/v1/${entityName}`, options.data);
        return { data: response.data };
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return { data: null, error: err.response?.data?.message || 'Failed to create' };
      }
    },
    async update(options: UpdateOptions<T>): Promise<{ data: T | null; error?: string }> {
      try {
        const baseURL = getAPIBaseURL();
        const response = await axiosClient.put(`${baseURL}/api/v1/${entityName}/${options.id}`, options.data);
        return { data: response.data };
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return { data: null, error: err.response?.data?.message || 'Failed to update' };
      }
    },
    async delete(options: DeleteOptions): Promise<{ success: boolean; error?: string }> {
      try {
        const baseURL = getAPIBaseURL();
        await axiosClient.delete(`${baseURL}/api/v1/${entityName}/${options.id}`);
        return { success: true };
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return { success: false, error: err.response?.data?.message || 'Failed to delete' };
      }
    },
  };
}

const authClient = {
  async me(): Promise<{ data: User | null }> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return { data: null };
    }
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/auth/me`);
      return { data: response.data };
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      return { data: null };
    }
  },
  async login(credentials: LoginCredentials): Promise<{ data: LoginResponse | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.post(`${baseURL}/api/v1/auth/login`, credentials);
      const { token, user } = response.data.data;
      localStorage.setItem(TOKEN_KEY, token);
      return { data: { token, user } };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Login failed' };
    }
  },
  async signup(credentials: SignupCredentials): Promise<{ data: LoginResponse | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.post(`${baseURL}/api/v1/auth/signup`, credentials);
      const { token, user } = response.data.data;
      localStorage.setItem(TOKEN_KEY, token);
      return { data: { token, user } };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Registration failed' };
    }
  },
  async verifyEmail(token: string): Promise<{ data: { message: string; token?: string } | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/auth/verify-email`, { params: { token } });
      const data = response.data?.data;
      if (data?.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      return { data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Verification failed' };
    }
  },
  async resendVerification(email: string): Promise<{ data: { message: string } | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.post(`${baseURL}/api/v1/auth/resend-verification`, { email });
      return { data: response.data?.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to resend verification' };
    }
  },
  loginWithToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<{ data: { message: string } | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.post(`${baseURL}/api/v1/auth/change-password`, {
        currentPassword,
        newPassword,
      });
      return { data: response.data?.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to change password' };
    }
  },
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/';
  },
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

interface UploadOptions {
  file: File;
  folder: string;
}

interface UploadResponse {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export interface Review {
  id: string;
  frameId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateReviewInput {
  frameId: string;
  rating: number;
  title?: string;
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  comment?: string;
}

const reviewsClient = {
  async getByFrameId(
    frameId: string,
    options: QueryOptions = {}
  ): Promise<{ data: { items: Review[]; total: number; stats: ReviewStats } | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/reviews/frame/${frameId}`, {
        params: options,
      });
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Failed to get reviews:', error);
      return { data: null, error: err.response?.data?.message || 'Failed to get reviews' };
    }
  },
  async getStats(frameId: string): Promise<{ data: ReviewStats | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/reviews/frame/${frameId}/stats`);
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to get stats' };
    }
  },
  async getUserReview(frameId: string): Promise<{ data: { review: Review | null } | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/reviews/frame/${frameId}/user`);
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to get user review' };
    }
  },
  async create(data: CreateReviewInput): Promise<{ data: Review | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.post(`${baseURL}/api/v1/reviews`, data);
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to create review' };
    }
  },
  async update(id: string, data: UpdateReviewInput): Promise<{ data: Review | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.put(`${baseURL}/api/v1/reviews/${id}`, data);
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to update review' };
    }
  },
  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      await axiosClient.delete(`${baseURL}/api/v1/reviews/${id}`);
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, error: err.response?.data?.message || 'Failed to delete review' };
    }
  },
  async markHelpful(id: string): Promise<{ data: Review | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.post(`${baseURL}/api/v1/reviews/${id}/helpful`);
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to mark as helpful' };
    }
  },
};

const storageClient = {
  async upload(options: UploadOptions): Promise<{ data: UploadResponse | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const formData = new FormData();
      formData.append('file', options.file);
      formData.append('folder', options.folder);
      
      const response = await axiosClient.post(`${baseURL}/api/v1/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Upload failed' };
    }
  },
  async delete(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      await axiosClient.delete(`${baseURL}/api/v1/upload`, { data: { url } });
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, error: err.response?.data?.message || 'Delete failed' };
    }
  },
  getFullUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseURL = getAPIBaseURL();
    return `${baseURL}${path}`;
  },
};

export interface UserOrderItem {
  id: string;
  frameId: string;
  quantity: number;
  price: number;
  color?: string | null;
  size?: string | null;
  frame: {
    id: string;
    modelName: string;
    color?: string | null;
    size?: string | null;
    brand?: string | null;
    image1Url?: string | null;
  };
}

export interface UserOrder {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: UserOrderItem[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateOrderInput {
  items: {
    frameId: string;
    quantity: number;
    price: number;
    color?: string | null;
    size?: string | null;
  }[];
  shippingAddress?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
}

export interface OrderStats {
  total: number;
  pending: number;
  shipped: number;
  delivered: number;
}

const userOrdersClient = {
  async getAll(
    options: QueryOptions = {}
  ): Promise<{ data: { items: UserOrder[]; total: number } | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/user-orders`, {
        params: options,
      });
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Failed to get orders:', error);
      return { data: null, error: err.response?.data?.message || 'Failed to get orders' };
    }
  },
  async getById(id: string): Promise<{ data: UserOrder | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/user-orders/${id}`);
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to get order' };
    }
  },
  async create(data: CreateOrderInput): Promise<{ data: UserOrder | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.post(`${baseURL}/api/v1/user-orders`, data);
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to create order' };
    }
  },
  async cancel(id: string): Promise<{ data: UserOrder | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.post(`${baseURL}/api/v1/user-orders/${id}/cancel`);
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to cancel order' };
    }
  },
  async getStats(): Promise<{ data: OrderStats | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/user-orders/stats`);
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to get stats' };
    }
  },
};

// Import types and client
export interface ImportLogEntry {
  id: string;
  rowNumber: number;
  status: 'success' | 'error' | 'skipped';
  entityId: string | null;
  rawData: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface ImportLog {
  id: string;
  userId: string;
  entityType: 'company' | 'user' | 'employee';
  fileName: string;
  status: 'processing' | 'completed' | 'failed';
  totalRows: number;
  successCount: number;
  errorCount: number;
  skipCount: number;
  createdAt: string;
  completedAt: string | null;
  user?: { id: string; name: string; email: string };
  entries?: ImportLogEntry[];
}

export interface ImportResult {
  importLog: ImportLog;
  summary: {
    total: number;
    success: number;
    errors: number;
    skipped: number;
  };
}

// Company-Frame mapping client
export interface CompanyFrame {
  id: string;
  companyId: string;
  frameId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FrameBasic {
  id: string;
  modelName: string;
  color?: string | null;
  size?: string | null;
  brand?: string | null;
  category?: string | null;
  price?: number | null;
  image1Url?: string | null;
}

// Prescription types and client
export interface PrescriptionSpec {
  id: string;
  orderId: string;
  odSphere: number | null;
  odCylinder: number | null;
  odAxis: number | null;
  odAddition: number | null;
  osSphere: number | null;
  osCylinder: number | null;
  osAxis: number | null;
  osAddition: number | null;
  pdRight: number | null;
  pdLeft: number | null;
  pdBinocular: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionInput {
  odSphere?: number | null;
  odCylinder?: number | null;
  odAxis?: number | null;
  odAddition?: number | null;
  osSphere?: number | null;
  osCylinder?: number | null;
  osAxis?: number | null;
  osAddition?: number | null;
  pdRight?: number | null;
  pdLeft?: number | null;
  pdBinocular?: number | null;
  notes?: string | null;
}

const prescriptionClient = {
  async get(orderId: string): Promise<{ data: PrescriptionSpec | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/prescriptions/order/${orderId}`);
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status === 404) {
        return { data: null };
      }
      return { data: null, error: err.response?.data?.message || 'Failed to get prescription' };
    }
  },
  async upsert(orderId: string, data: PrescriptionInput): Promise<{ data: PrescriptionSpec | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.patch(`${baseURL}/api/v1/prescriptions/order/${orderId}`, data);
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to save prescription' };
    }
  },
};

// Orders client with multi-item support
export interface OrderItem {
  id: string;
  frameId: string;
  quantity: number;
  price: number | null;
  color: string | null;
  size: string | null;
  notes: string | null;
  frame: {
    id: string;
    modelName: string;
    color?: string | null;
    size?: string | null;
    image1Url?: string | null;
  };
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: string;
  toStatus: string;
  note: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
}

export interface Order {
  id: string;
  orderNumber: string | null;
  employeeId: string;
  frameId: string | null;
  status: string;
  prescriptionUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    name: string;
    department?: string | null;
    registration?: string | null;
    company?: { id: string; corporateName: string; cnpj?: string };
  };
  frame?: { id: string; modelName: string; color?: string | null; size?: string | null; image1Url?: string | null } | null;
  items?: OrderItem[];
  statusHistory?: StatusHistoryEntry[];
}

export interface AvailableTransition {
  status: string;
  requiresNote: boolean;
}

const ordersClient = {
  async getAll(options: QueryOptions = {}): Promise<{ data: { items: Order[]; total: number } | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/orders`, { params: options });
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to get orders' };
    }
  },
  async getById(id: string): Promise<{ data: Order | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/orders/${id}`);
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to get order' };
    }
  },
  async getTransitions(id: string): Promise<{ data: { currentStatus: string; availableTransitions: AvailableTransition[] } | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/orders/${id}/transitions`);
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to get transitions' };
    }
  },
  async getStatusHistory(id: string): Promise<{ data: StatusHistoryEntry[] | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/orders/${id}/status-history`);
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to get status history' };
    }
  },
  async transitionStatus(id: string, status: string, note?: string): Promise<{ data: Order | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.post(`${baseURL}/api/v1/orders/${id}/transition`, { status, note });
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to update status' };
    }
  },
};

const companyFramesClient = {
  async getCompanyFrames(companyId: string): Promise<{ data: FrameBasic[] | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/company-frames/company/${companyId}`);
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to get company frames' };
    }
  },
  async getAvailableFrames(companyId: string): Promise<{ data: FrameBasic[] | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/company-frames/company/${companyId}/available`);
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to get available frames' };
    }
  },
  async assignFrames(companyId: string, frameIds: string[]): Promise<{ data: CompanyFrame[] | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.post(`${baseURL}/api/v1/company-frames/company/${companyId}/assign`, { frameIds });
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to assign frames' };
    }
  },
  async unassignFrames(companyId: string, frameIds: string[]): Promise<{ data: { removed: number } | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.post(`${baseURL}/api/v1/company-frames/company/${companyId}/unassign`, { frameIds });
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to unassign frames' };
    }
  },
  async assignAllFrames(companyId: string): Promise<{ data: { assigned: number } | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.post(`${baseURL}/api/v1/company-frames/company/${companyId}/assign-all`);
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to assign all frames' };
    }
  },
};

const importClient = {
  async importCompanies(file: File): Promise<{ data: ImportResult | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axiosClient.post(`${baseURL}/api/v1/import/companies`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Import failed' };
    }
  },
  async importUsers(file: File): Promise<{ data: ImportResult | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axiosClient.post(`${baseURL}/api/v1/import/users`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Import failed' };
    }
  },
  async importEmployees(file: File): Promise<{ data: ImportResult | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axiosClient.post(`${baseURL}/api/v1/import/employees`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Import failed' };
    }
  },
  async getLogs(options: QueryOptions = {}): Promise<{ data: { items: ImportLog[]; total: number } | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/import/logs`, { params: options });
      return { data: { items: response.data.data, total: response.data.pagination?.total || 0 } };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to get logs' };
    }
  },
  async getLogById(id: string): Promise<{ data: ImportLog | null; error?: string }> {
    try {
      const baseURL = getAPIBaseURL();
      const response = await axiosClient.get(`${baseURL}/api/v1/import/logs/${id}`);
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { data: null, error: err.response?.data?.message || 'Failed to get log' };
    }
  },
  getTemplateUrl(entityType: 'company' | 'user' | 'employee'): string {
    const baseURL = getAPIBaseURL();
    return `${baseURL}/api/v1/import/templates/${entityType}`;
  },
};

export const client = {
  auth: authClient,
  storage: storageClient,
  reviews: reviewsClient,
  userOrders: userOrdersClient,
  import: importClient,
  companyFrames: companyFramesClient,
  orders: ordersClient,
  prescriptions: prescriptionClient,
  entities: {
    companies: createEntityClient('companies'),
    employees: createEntityClient('employees'),
    frames: createEntityClient('frames'),
    orders: createEntityClient('orders'),
    support_tickets: createEntityClient('support-tickets'),
    users: createEntityClient('users'),
  },
};

export { client as default };
