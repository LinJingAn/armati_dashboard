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

export const client = {
  auth: authClient,
  storage: storageClient,
  reviews: reviewsClient,
  userOrders: userOrdersClient,
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
