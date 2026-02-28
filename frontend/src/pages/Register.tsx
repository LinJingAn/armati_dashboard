import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FiArrowRight, 
  FiLoader, 
  FiArrowLeft, 
  FiUser, 
  FiMail, 
  FiLock, 
  FiPhone, 
  FiEye, 
  FiEyeOff,
  FiShield,
  FiCheckCircle,
} from 'react-icons/fi';
import { FaGlasses } from 'react-icons/fa';
import { HiCheckCircle } from 'react-icons/hi';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRouteForRole } from '@/components/ProtectedRoute';
import { toast } from 'sonner';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const navigate = useNavigate();
  const { user, signup, isAuthenticated, isLoading: authLoading } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const result = await signup({ name, email, password, phone: phone || undefined });
    setIsLoading(false);

    if (result.success && result.user) {
      setRegisteredEmail(email);
      setEmailSent(true);
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  const passwordStrength = () => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    if (password.length < 8) return { strength: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (password.length < 12) return { strength: 3, label: 'Good', color: 'bg-blue-500' };
    return { strength: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const pwStrength = passwordStrength();

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0f1a]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-transparent to-indigo-950/40" />
        <Card className="relative w-full max-w-md bg-[#111827] border-gray-800/50 shadow-2xl rounded-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="bg-blue-600 p-3.5 rounded-xl inline-block">
              <FaGlasses className="h-8 w-8 text-white" />
            </div>
            <div className="w-20 h-20 rounded-full bg-emerald-900/30 border border-emerald-700/30 flex items-center justify-center mx-auto">
              <FiMail className="h-9 w-9 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                We've sent a verification link to<br />
                <span className="text-blue-400 font-medium">{registeredEmail}</span>
              </p>
              <p className="text-gray-500 text-xs mt-3">
                Click the link in the email to verify your account. The link expires in 24 hours.
              </p>
            </div>
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                <FiCheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span>You can still browse after signing in — verify later</span>
              </div>
              <Button
                onClick={() => navigate('/?login=true')}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Go to Sign In
                <FiArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-xs text-gray-600">
                Didn't receive it?{' '}
                <button
                  type="button"
                  onClick={async () => {
                    const { default: client } = await import('@/lib/api');
                    const res = await client.auth.resendVerification(registeredEmail);
                    if (res.error) toast.error(res.error);
                    else toast.success('Verification email resent!');
                  }}
                  className="text-blue-500 hover:text-blue-400"
                >
                  Resend email
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <div className="flex flex-col items-center mb-6">
            <div className="bg-blue-600 p-3.5 rounded-xl mb-4">
              <FaGlasses className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">SafeVision</span>
          </div>

          {/* Google Sign Up */}
          <GoogleSignInButton label="Sign up with Google" className="mb-5" />

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600">or sign up with email</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <h2 className="text-lg font-medium text-white text-center mb-5">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-gray-400 text-sm">Full Name *</Label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 bg-[#1a2332] border-gray-700/50 text-white placeholder:text-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-gray-400 text-sm">Email *</Label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-[#1a2332] border-gray-700/50 text-white placeholder:text-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-gray-400 text-sm">Phone (optional)</Label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-11 bg-[#1a2332] border-gray-700/50 text-white placeholder:text-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-gray-400 text-sm">Password *</Label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
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
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          pwStrength.strength >= level ? pwStrength.color : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${pwStrength.color.replace('bg-', 'text-')}`}>
                    {pwStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-gray-400 text-sm">Confirm Password *</Label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 h-11 bg-[#1a2332] border-gray-700/50 text-white placeholder:text-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    confirmPassword && confirmPassword !== password ? 'border-red-500/50' : ''
                  } ${
                    confirmPassword && confirmPassword === password && password.length > 0 ? 'border-emerald-500/50' : ''
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword === password && password.length > 0 && (
                <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                  <HiCheckCircle className="h-3 w-3" />
                  Passwords match
                </p>
              )}
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FiLoader className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <FiArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/?login=true" className="text-blue-500 hover:text-blue-400 transition-colors">
                Sign in
              </Link>
            </p>
            <Link
              to="/"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              <FiArrowLeft className="h-4 w-4 mr-1" />
              Back to home
            </Link>
          </div>

          {/* Security note */}
          <div className="mt-6 p-4 bg-[#1a2332] border border-gray-700/30 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400">
              <FiShield className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium">Your data is secure</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              We use industry-standard encryption to protect your information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
