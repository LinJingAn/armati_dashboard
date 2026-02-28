import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  ShoppingCart,
  HeadsetIcon,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Bell,
  Search,
  Settings,
  Sparkles,
  Glasses,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { path: '/companies', label: 'Companies', icon: Building2, roles: ['ADMIN'] },
  { path: '/employees', label: 'Employees', icon: Users, roles: ['ADMIN'] },
  { path: '/users', label: 'Users', icon: UserCog, roles: ['ADMIN'] },
  { path: '/orders', label: 'Orders', icon: ShoppingCart, roles: ['ADMIN'] },
  { path: '/support', label: 'Support Tickets', icon: HeadsetIcon, roles: ['ADMIN'] },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = allNavItems.filter(item => user && item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = () => {
    if (!user?.name) return user?.email?.charAt(0).toUpperCase() || 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-500 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-[72px]' : 'w-72'}`}
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        }}
      >
        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        
        {/* Animated border glow */}
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />

        {/* Logo */}
        <div className="relative flex items-center justify-between h-20 px-4 border-b border-white/10">
          <div className={`flex items-center gap-3 transition-all duration-300 ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-br from-blue-400 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/25 transform hover:scale-110 transition-transform duration-300">
                <Glasses className="h-6 w-6 text-white" />
              </div>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  SafeVision
                </span>
                <span className="text-[10px] text-blue-400/80 font-medium tracking-widest uppercase">
                  Admin Portal
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 hover:scale-105 hover:border-blue-500/50"
          >
            <ChevronLeft className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <div className="space-y-2">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              const isHovered = hoveredItem === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 transform ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Active/Hover background */}
                  <div
                    className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25'
                        : isHovered
                        ? 'bg-white/10'
                        : ''
                    }`}
                  />
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-indigo-400 rounded-r-full shadow-lg shadow-blue-400/50" />
                  )}

                  {/* Icon with 3D effect */}
                  <div className={`relative z-10 transition-all duration-300 ${isHovered || isActive ? 'scale-110' : ''}`}>
                    <item.icon className={`h-5 w-5 ${isActive ? 'drop-shadow-lg' : ''}`} />
                  </div>
                  
                  {!collapsed && (
                    <span className="relative z-10 transition-all duration-300">
                      {item.label}
                    </span>
                  )}

                  {/* Sparkle effect on hover */}
                  {isHovered && !isActive && (
                    <Sparkles className="absolute right-3 h-4 w-4 text-blue-400 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom */}
        <div className={`p-4 border-t border-white/10 ${collapsed ? 'px-2' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-white/5">
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-slate-900">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-blue-500/50">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-gray-200/50 h-20 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-white shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            
            {/* Search bar */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100 min-w-[300px] transition-all duration-300 focus-within:shadow-xl focus-within:border-blue-200">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
              <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded-md">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-white shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <Bell className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>

            {/* Settings */}
            <button className="flex items-center justify-center h-10 w-10 rounded-xl bg-white shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <Settings className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors group-hover:rotate-90 duration-500" />
            </button>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-gray-200" />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 px-3 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 gap-3">
                  <Avatar className="h-9 w-9 ring-2 ring-blue-500/20 ring-offset-2">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-800">{user?.name || 'User'}</span>
                    <span className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-xl border-0 bg-white/80 backdrop-blur-xl">
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-blue-500/20">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold text-gray-800">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="px-3 py-2.5 rounded-lg text-red-600 cursor-pointer hover:bg-red-50 transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="animate-fadeIn">
            {children}
          </div>
        </main>
      </div>

      {/* Global Styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
