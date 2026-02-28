import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6 text-center">
      <h1 className="text-6xl font-bold text-[#1E293B]">404</h1>
      <p className="text-lg text-gray-500 mt-4">Page not found</p>
      <p className="text-sm text-gray-400 mt-2">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="mt-6">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}