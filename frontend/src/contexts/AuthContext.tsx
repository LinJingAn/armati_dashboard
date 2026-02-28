import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import client from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  companyId?: string | null;
  company?: { id: string; corporateName: string } | null;
  phone?: string | null;
  isEmailVerified?: boolean;
  googleId?: string | null;
  createdAt?: string;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (data: SignupData) => Promise<AuthResult>;
  loginWithToken: (token: string) => Promise<User | null>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const result = await client.auth.me();
      setUser(result.data as User | null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    const result = await client.auth.me();
    if (result.data) {
      setUser(result.data as User);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const result = await client.auth.login({ email, password });
    if (result.data) {
      setUser(result.data.user as User);
      return { success: true, user: result.data.user as User };
    }
    return { success: false, error: result.error };
  };

  const signup = async (data: SignupData): Promise<AuthResult> => {
    const result = await client.auth.signup(data);
    if (result.data) {
      setUser(result.data.user as User);
      return {
        success: true,
        user: result.data.user as User,
        message: (result.data as { message?: string }).message,
      };
    }
    return { success: false, error: result.error };
  };

  // Called after Google OAuth redirect - token already stored, just fetch user
  const loginWithToken = async (token: string): Promise<User | null> => {
    client.auth.loginWithToken(token);
    const result = await client.auth.me();
    if (result.data) {
      setUser(result.data as User);
      return result.data as User;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    client.auth.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithToken,
        logout,
        checkAuth,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
