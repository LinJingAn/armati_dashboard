import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaGlasses } from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRouteForRole } from '@/components/ProtectedRoute';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('Authentication failed. No token received.');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    const processToken = async () => {
      try {
        const user = await loginWithToken(token);
        if (user) {
          const redirectTo = getDefaultRouteForRole(user.role);
          navigate(redirectTo, { replace: true });
        } else {
          setError('Failed to load user data.');
          setTimeout(() => navigate('/'), 3000);
        }
      } catch {
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    processToken();
  }, [searchParams, navigate, loginWithToken]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto">
            <FiAlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Authentication Error</h2>
          <p className="text-gray-400 max-w-sm">{error}</p>
          <p className="text-sm text-gray-600">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
      <div className="flex flex-col items-center gap-5">
        <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-600/30">
          <FaGlasses className="h-10 w-10 text-white animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-white font-medium text-lg">Signing you in...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait while we verify your Google account</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
