import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FaGlasses } from 'react-icons/fa';
import { FiCheckCircle, FiAlertCircle, FiLoader, FiArrowRight } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import client from '@/lib/api';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please check your email link.');
      return;
    }

    const verify = async () => {
      const result = await client.auth.verifyEmail(token);
      if (result.error) {
        setStatus('error');
        setMessage(result.error);
      } else {
        setStatus('success');
        setMessage(result.data?.message || 'Your email has been verified!');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0f1a] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-transparent to-indigo-950/40" />

      <div className="relative w-full max-w-md bg-[#111827] border border-gray-800/50 rounded-2xl shadow-2xl p-8 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-600/30">
            <FaGlasses className="h-8 w-8 text-white" />
          </div>
        </div>

        {status === 'loading' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-900/30 flex items-center justify-center mx-auto">
              <FiLoader className="h-8 w-8 text-blue-400 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-white">Verifying your email...</h2>
            <p className="text-gray-500 text-sm">Please wait a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-900/30 border border-emerald-700/30 flex items-center justify-center mx-auto">
              <FiCheckCircle className="h-10 w-10 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
              <p className="text-gray-400">{message}</p>
            </div>
            <Link to="/">
              <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                Continue to SafeVision
                <FiArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-900/30 border border-red-700/30 flex items-center justify-center mx-auto">
              <FiAlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-gray-400">{message}</p>
            </div>
            <Link to="/">
              <Button variant="outline" className="w-full h-11 border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg font-medium">
                Back to Home
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
