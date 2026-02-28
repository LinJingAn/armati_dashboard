import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Glasses } from 'lucide-react';

export function getDefaultRouteForRole(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard';
    case 'COMPANY_MANAGER':
      return '/manager';
    case 'USER':
    default:
      return '/shop';
  }
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="animate-pulse">
          <Glasses className="h-12 w-12 text-blue-400" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const redirectTo = getDefaultRouteForRole(user.role);
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

interface RouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: RouteProps) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      {children}
    </ProtectedRoute>
  );
}

export function ManagerRoute({ children }: RouteProps) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'COMPANY_MANAGER']}>
      {children}
    </ProtectedRoute>
  );
}

export function UserRoute({ children }: RouteProps) {
  return (
    <ProtectedRoute allowedRoles={['USER', 'COMPANY_MANAGER', 'ADMIN']}>
      {children}
    </ProtectedRoute>
  );
}
