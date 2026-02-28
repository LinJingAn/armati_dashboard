import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FiShield, 
  FiUsers, 
  FiShoppingCart, 
  FiHeadphones, 
  FiArrowRight, 
  FiLoader,
  FiLock,
  FiMail,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import { FaGlasses } from 'react-icons/fa';
import { HiSparkles, HiCheckCircle } from 'react-icons/hi';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRouteForRole } from '@/components/ProtectedRoute';
import { toast } from 'sonner';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function Index() {
  const [searchParams] = useSearchParams();
  const [showLogin, setShowLogin] = useState(() => searchParams.get('login') === 'true');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login, isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-blue-600 p-4 rounded-2xl">
            <FaGlasses className="h-10 w-10 text-white animate-pulse" />
          </div>
          <div className="h-1 w-24 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-blue-600 rounded-full animate-[loading_1s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const redirectTo = getDefaultRouteForRole(user.role);
    navigate(redirectTo);
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success && result.user) {
      toast.success('Welcome back!');
      const redirectTo = getDefaultRouteForRole(result.user.role);
      navigate(redirectTo);
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/auth-bg.png)' }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-[#0a0f1a]/80 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-transparent to-indigo-950/50" />
        
        <Card className="relative w-full max-w-md bg-[#111827] border-gray-800/50 shadow-2xl rounded-2xl">
          <CardContent className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="bg-blue-600 p-3.5 rounded-xl mb-4">
                <FaGlasses className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">SafeVision</span>
              <span className="text-sm text-gray-500 mt-1">Industrial Safety Platform</span>
            </div>

            <h2 className="text-lg font-medium text-white text-center mb-6">Welcome back</h2>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-400 text-sm">Email address</Label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@safetyglasses.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-[#1a2332] border-gray-700/50 text-white placeholder:text-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-400 text-sm">Password</Label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-[#1a2332] border-gray-700/50 text-white placeholder:text-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FiLoader className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <FiArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-xs text-gray-600">or</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* Google Sign In */}
            <div className="mt-4">
              <GoogleSignInButton label="Sign in with Google" />
            </div>

            <div className="mt-5 text-center space-y-3">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-500 hover:text-blue-400 transition-colors">
                  Sign up
                </Link>
              </p>
              <button
                onClick={() => setShowLogin(false)}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Back to home
              </button>
            </div>

            <div className="mt-6 p-4 bg-[#1a2332] border border-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <HiSparkles className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs text-gray-400 font-medium">Demo Credentials</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="text-gray-400">Admin:</span> admin@safetyglasses.com / admin123<br />
                <span className="text-gray-400">Manager:</span> manager@democompany.com / manager123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/auth-bg.png)' }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#0a0f1a]/85" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-transparent to-indigo-950/40" />

      {/* Header */}
      <header className="relative flex items-center justify-between px-6 lg:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FaGlasses className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">SafeVision</span>
        </div>
        <Button 
          onClick={() => setShowLogin(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5"
        >
          Sign In
          <FiArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </header>

      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center px-6 pt-16 lg:pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-950/50 border border-blue-900/50 mb-8">
          <FiShield className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-blue-400 font-medium">Enterprise Safety Glasses Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white max-w-4xl leading-tight">
          Safety Glasses for Your{' '}
          <span className="text-blue-500">Entire Workforce</span>
        </h1>

        <p className="mt-6 text-lg text-gray-400 max-w-2xl">
          Streamline company management, employee registration, frame selection, order workflows,
          and technical support — all in one powerful platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Button
            onClick={() => setShowLogin(true)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white text-base px-8 py-6 rounded-xl"
          >
            Get Started
            <FiArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-base px-8 py-6 rounded-xl"
            onClick={() => setShowLogin(true)}
          >
            Watch Demo
          </Button>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-6 mt-12">
          {['ANSI Z87.1+', 'CSA Z94.3', 'EN166'].map((cert, i) => (
            <div key={i} className="flex items-center gap-2 text-gray-500 text-sm">
              <HiCheckCircle className="h-4 w-4 text-blue-500" />
              <span>{cert}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="relative max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { 
              icon: FiUsers, 
              title: 'Company & Employee Management', 
              desc: 'Register companies by CNPJ and manage employees across departments and shifts.',
              color: 'bg-blue-600',
            },
            { 
              icon: FaGlasses, 
              title: 'Frame Catalog', 
              desc: 'Browse safety frames with image preview, specifications, and availability status.',
              color: 'bg-purple-600',
            },
            { 
              icon: FiShoppingCart, 
              title: 'Order Workflow', 
              desc: 'Create orders with employee selection, frame choice, and prescription uploads.',
              color: 'bg-orange-600',
            },
            { 
              icon: FiHeadphones, 
              title: 'Technical Support', 
              desc: 'Submit support tickets with damaged photo uploads and track resolution status.',
              color: 'bg-rose-600',
            },
          ].map((feature, i) => (
            <Card 
              key={i} 
              className="bg-[#111827] border-gray-800/50 rounded-xl hover:border-gray-700/50 transition-colors"
            >
              <CardContent className="p-6">
                <div className={`h-10 w-10 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-white text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-gray-800/50 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded">
              <FaGlasses className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-gray-500">© 2026 SafeVision. All rights reserved.</span>
          </div>
          <p className="text-sm text-gray-600">Industrial Safety Glasses Management Platform</p>
        </div>
      </footer>
    </div>
  );
}
