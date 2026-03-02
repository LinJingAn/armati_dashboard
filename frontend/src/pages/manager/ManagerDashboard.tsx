import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Glasses,
  Package,
  LogOut,
  User,
  TrendingUp,
  Plus,
  List,
  Tags,
  ShoppingBag,
  ChevronRight,
  Sparkles,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import client from '@/lib/api';

interface DashboardStats {
  totalFrames: number;
  activeFrames: number;
  categories: number;
  brands: number;
}

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalFrames: 0,
    activeFrames: 0,
    categories: 0,
    brands: 0,
  });
  const [recentFrames, setRecentFrames] = useState<Array<{
    id: string;
    name: string;
    brand: string;
    price: number;
    category: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const framesRes = await client.entities.frames.query({ limit: 100 });

        type FrameItem = { id: string; modelName: string; brand: string; price: number; category: string; isActive?: boolean };
        const frames = (framesRes.data?.items || []) as FrameItem[];
        const uniqueBrands = new Set(frames.map((f) => f.brand).filter(Boolean));
        const uniqueCategories = new Set(frames.map((f) => f.category).filter(Boolean));

        setStats({
          totalFrames: framesRes.data?.total || 0,
          activeFrames: frames.filter((f) => f.isActive !== false).length,
          categories: uniqueCategories.size,
          brands: uniqueBrands.size,
        });

        setRecentFrames(
          frames.slice(0, 5).map((f) => ({
            id: f.id,
            name: f.modelName,
            brand: f.brand || 'N/A',
            price: f.price || 149,
            category: f.category || 'N/A',
          }))
        );
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalFrames,
      icon: Package,
      gradient: 'from-blue-500 to-indigo-600',
      shadowColor: 'shadow-blue-500/25',
    },
    {
      title: 'Active Products',
      value: stats.activeFrames,
      icon: Glasses,
      gradient: 'from-emerald-500 to-teal-600',
      shadowColor: 'shadow-emerald-500/25',
    },
    {
      title: 'Categories',
      value: stats.categories,
      icon: Tags,
      gradient: 'from-purple-500 to-violet-600',
      shadowColor: 'shadow-purple-500/25',
    },
    {
      title: 'Brands',
      value: stats.brands,
      icon: ShoppingBag,
      gradient: 'from-orange-500 to-amber-600',
      shadowColor: 'shadow-orange-500/25',
    },
  ];

  const quickActions = [
    {
      title: 'View All Products',
      description: 'Browse and manage your product catalog',
      icon: List,
      href: '/manager/frames',
      gradient: 'from-gray-700 to-gray-800',
    },
    {
      title: 'Add New Product',
      description: 'Create a new product listing',
      icon: Plus,
      href: '/manager/frames',
      gradient: 'from-blue-600 to-indigo-600',
      primary: true,
    },
    {
      title: 'Manage Categories',
      description: 'Organize your product categories',
      icon: Tags,
      href: '/manager/frames',
      gradient: 'from-gray-700 to-gray-800',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl">
                  <Glasses className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold text-white">SafeVision</span>
                <Badge className="ml-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30">
                  Product Manager
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-1">
                <Link 
                  to="/manager" 
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white transition-all"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/manager/frames" 
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Products
                </Link>
              </nav>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-white hover:bg-white/10 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || 'M'}
                    </div>
                    <span className="hidden sm:inline text-gray-200">{user?.name?.split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800 text-white rounded-xl p-2">
                  <div className="px-3 py-2 mb-2">
                    <p className="font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem onClick={() => navigate('/shop/profile')} className="rounded-lg cursor-pointer hover:bg-white/10">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/shop')} className="rounded-lg cursor-pointer hover:bg-white/10">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Go to Shop
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-400">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-6 w-6 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Manager'}!
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Manage your product catalog and keep your inventory up to date.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((stat, index) => (
            <div
              key={stat.title}
              className="group perspective-1000"
              onMouseEnter={() => setHoveredCard(stat.title)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card 
                className={`relative bg-gray-900/50 border-gray-800/50 backdrop-blur-sm overflow-hidden transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl ${stat.shadowColor}`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: hoveredCard === stat.title ? 'translateY(-8px) rotateX(5deg)' : 'translateY(0) rotateX(0)',
                }}
              >
                {/* Gradient Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>

                <CardContent className="relative z-10 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-1">{stat.title}</p>
                      <p className="text-4xl font-bold text-white">
                        {loading ? (
                          <span className="inline-block w-12 h-10 bg-gray-800 rounded animate-pulse" />
                        ) : (
                          stat.value
                        )}
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.shadowColor}`}>
                      <stat.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>

                {/* 3D Border Effect */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className={`absolute inset-0 rounded-xl ring-1 ring-inset bg-gradient-to-br ${stat.gradient} opacity-20`} />
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <Card className="lg:col-span-1 bg-gray-900/50 border-gray-800/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-white">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                Quick Actions
              </CardTitle>
              <CardDescription className="text-gray-400">Manage your product catalog</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {quickActions.map((action, index) => (
                <Link key={action.title} to={action.href}>
                  <div 
                    className={`group relative p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                      action.primary 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25' 
                        : 'bg-gray-800/50 hover:bg-gray-800'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${action.primary ? 'bg-white/20' : 'bg-gray-700'}`}>
                        <action.icon className={`h-5 w-5 ${action.primary ? 'text-white' : 'text-gray-300'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${action.primary ? 'text-white' : 'text-white'}`}>
                          {action.title}
                        </h4>
                        <p className={`text-sm ${action.primary ? 'text-blue-100' : 'text-gray-400'}`}>
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className={`h-5 w-5 transform group-hover:translate-x-1 transition-transform ${action.primary ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    
                    {/* Shine Effect */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent Products */}
          <Card className="lg:col-span-2 bg-gray-900/50 border-gray-800/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    Recent Products
                  </CardTitle>
                  <CardDescription className="text-gray-400">Recently added or updated products</CardDescription>
                </div>
                <Link to="/manager/frames">
                  <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400 mt-3">Loading products...</p>
                </div>
              ) : recentFrames.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <Glasses className="h-8 w-8 text-gray-600" />
                  </div>
                  <p className="text-gray-400 mb-4">No products found. Add your first product!</p>
                  <Link to="/manager/frames">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-800/50">
                  {recentFrames.map((frame, index) => (
                    <div
                      key={frame.id}
                      className="group flex items-center justify-between p-4 hover:bg-white/5 transition-all duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Glasses className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">{frame.name}</p>
                          <p className="text-sm text-gray-400">
                            {frame.brand} • {frame.category}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30 font-bold">
                        ${frame.price.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Permissions Card */}
        <Card className="mt-8 bg-gray-900/50 border-gray-800/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-gray-800/50">
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Settings className="h-5 w-5 text-white" />
              </div>
              Your Role & Permissions
            </CardTitle>
            <CardDescription className="text-gray-400">What you can manage as a Product Manager</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h4 className="font-semibold text-emerald-400">You Can</h4>
                </div>
                <ul className="space-y-2 text-sm text-emerald-300/80">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Add new products to the catalog
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Edit existing product details
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Update product prices and stock
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Manage product categories
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Delete products from catalog
                  </li>
                </ul>
              </div>
              <div className="group p-6 rounded-2xl bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20 hover:border-gray-500/40 transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gray-500/20">
                    <Settings className="h-5 w-5 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-400">Admin Only</h4>
                </div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    Manage users and employees
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    Manage companies
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    Process and update orders
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    Handle support tickets
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    System administration
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
