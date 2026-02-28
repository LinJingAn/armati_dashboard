import { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiShoppingCart, 
  FiUser, 
  FiPackage, 
  FiLogOut, 
  FiMenu, 
  FiX, 
  FiPhone, 
  FiMail, 
  FiMapPin, 
  FiShield,
  FiChevronRight,
  FiSearch,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';
import { FaGlasses, FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationBannerDismissed, setVerificationBannerDismissed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const navLinks = [
    { href: '/shop', label: 'Shop' },
    { href: '/shop/catalog', label: 'Catalog' },
    { href: '/shop/orders', label: 'My Orders' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResendingVerification(true);
    const { default: client } = await import('@/lib/api');
    const result = await client.auth.resendVerification(user.email);
    setResendingVerification(false);
    if (result.error) {
      const { toast } = await import('sonner');
      toast.error(result.error);
    } else {
      const { toast } = await import('sonner');
      toast.success('Verification email sent! Please check your inbox.');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showVerificationBanner = user && !user.isEmailVerified && !user.googleId && !verificationBannerDismissed;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Email Verification Banner */}
      {showVerificationBanner && (
        <div className="bg-amber-500 text-white px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">
                Please verify your email address to unlock all features.
                Check your inbox at <strong>{user.email}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="text-sm font-semibold underline underline-offset-2 hover:no-underline disabled:opacity-70 whitespace-nowrap"
              >
                {resendingVerification ? 'Sending...' : 'Resend email'}
              </button>
              <button
                onClick={() => setVerificationBannerDismissed(true)}
                className="p-1 hover:bg-amber-600 rounded transition-colors"
                aria-label="Dismiss"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-10">
              <Link to="/shop" className="flex items-center gap-2.5 group">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                  <FaGlasses className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">SafeVision</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      pathname === link.href
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <button 
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-500 text-sm transition-colors"
              >
                <FiSearch className="h-4 w-4" />
                <span>Search...</span>
                <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-mono text-gray-500">
                  ⌘K
                </kbd>
              </button>

              {/* Mobile Search */}
              <button 
                onClick={() => setSearchOpen(true)}
                className="sm:hidden p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
              >
                <FiSearch className="h-5 w-5 text-gray-600" />
              </button>

              {/* Cart */}
              <Link 
                to="/shop/cart" 
                className="relative p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <FiShoppingCart className="h-5 w-5 text-gray-600" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 border-2 border-white">
                    {itemCount}
                  </Badge>
                )}
              </Link>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-3 py-2 h-auto rounded-xl hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-blue-500/20">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:inline text-gray-700 font-medium">{user?.name?.split(' ')[0] || 'Account'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-0 p-2">
                  <div className="px-3 py-2 mb-2">
                    <p className="font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/shop/profile')} className="rounded-lg cursor-pointer">
                    <FiUser className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/shop/orders')} className="rounded-lg cursor-pointer">
                    <FiPackage className="h-4 w-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {user?.role === 'ADMIN' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/dashboard')} className="rounded-lg cursor-pointer">
                        Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {user?.role === 'COMPANY_MANAGER' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/manager')} className="rounded-lg cursor-pointer">
                        Product Management
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                    <FiLogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md">
            <nav className="flex flex-col p-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0 rounded-2xl overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b bg-gray-50">
            <DialogTitle className="text-base font-medium flex items-center gap-2">
              <FiSearch className="h-4 w-4 text-gray-500" />
              Search Products
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch} className="p-4">
            <div className="relative">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search for safety glasses, goggles, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-4 pr-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg"
              >
                Search
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500">Popular:</span>
              {['Safety Glasses', 'Goggles', '3M', 'Prescription'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    navigate(`/shop/catalog?search=${encodeURIComponent(term)}`);
                    setSearchOpen(false);
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="relative mt-auto overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/footer-bg.png)' }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-[#0a0f1a]/85 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 to-transparent" />
        
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              {/* Company Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
                    <FaGlasses className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">SAFEVISION</span>
                </div>
                <p className="text-blue-400 font-medium">Prescription Safety Glasses</p>
                <div className="space-y-3 text-gray-400 text-sm">
                  <p className="flex items-start gap-3">
                    <FiMapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                    <span>123 Industrial Ave, Suite 100<br />Safety District, CA 90210</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <FiPhone className="h-4 w-4 text-gray-500" />
                    Tel. (555) 123-4567
                  </p>
                  <p className="flex items-center gap-3">
                    <FiMail className="h-4 w-4 text-gray-500" />
                    contact@safevision.com
                  </p>
                </div>
              </div>

              {/* Products */}
              <div>
                <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Products</h3>
                <ul className="space-y-3 text-sm">
                  {['Safety Glasses', 'Prescription Safety', 'Anti-Fog Lenses', 'UV Protection', 'Impact Resistant', 'Adjustable Frames'].map((item) => (
                    <li key={item}>
                      <Link to="/shop/catalog" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                        <FiChevronRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Categories</h3>
                <ul className="space-y-3 text-sm">
                  {['Wrap Around', 'Full Frame', 'Semi-Rimless', 'Goggles', 'Face Shields', 'Over-Glasses'].map((item) => (
                    <li key={item}>
                      <Link to="/shop/catalog" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                        <FiChevronRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Certification */}
              <div className="flex flex-col items-center md:items-end">
                <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex flex-col items-center justify-center p-4 shadow-xl">
                  <FiShield className="h-10 w-10 text-blue-500 mb-2" />
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">ANSI Z87.1+</span>
                  <span className="text-sm font-bold text-white mt-1">CERTIFIED</span>
                </div>
                
                {/* Social Links */}
                <div className="flex items-center gap-3 mt-6">
                  {[FaFacebookF, FaInstagram, FaTwitter, FaYoutube].map((Icon, i) => (
                    <a 
                      key={i}
                      href="#" 
                      className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-500">
                  © 2026 SafeVision. All rights reserved.
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-white transition-colors">Contact</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
