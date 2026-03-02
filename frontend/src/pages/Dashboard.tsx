import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  ShoppingCart, 
  HeadsetIcon, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import client from '@/lib/api';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  companies: number;
  employees: number;
  orders: number;
  supportTickets: number;
}

interface RecentOrder {
  id: number;
  employee_name: string;
  frame_name: string;
  status: string;
  created_at: string;
}

interface RecentTicket {
  id: number;
  employee_name: string;
  status: string;
  issue_description: string;
  created_at: string;
}

const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
  submitted: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Activity },
  under_review: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  awaiting_approval: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock },
  in_production: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Activity },
  shipped: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Activity },
  delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
  under_analysis: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertCircle },
  waiting_for_shipment: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock },
  received: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle2 },
  in_repair: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Activity },
  returning: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Activity },
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    companies: 0,
    employees: 0,
    orders: 0,
    supportTickets: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [companiesRes, employeesRes, ordersRes, ticketsRes] = await Promise.all([
          client.entities.companies.query({ limit: 1 }),
          client.entities.employees.query({ limit: 1 }),
          client.entities.orders.query({ limit: 5, sort: '-created_at' }),
          client.entities.support_tickets.query({ limit: 5, sort: '-created_at' }),
        ]);

        setStats({
          companies: companiesRes.data?.total || 0,
          employees: employeesRes.data?.total || 0,
          orders: ordersRes.data?.total || 0,
          supportTickets: ticketsRes.data?.total || 0,
        });

        setRecentOrders((ordersRes.data?.items || []) as RecentOrder[]);
        setRecentTickets((ticketsRes.data?.items || []) as RecentTicket[]);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    { 
      label: 'Companies', 
      value: stats.companies, 
      icon: Building2, 
      gradient: 'from-blue-500 to-blue-600',
      lightGradient: 'from-blue-50 to-blue-100',
      shadowColor: 'shadow-blue-500/25',
      trend: '+12%',
      trendUp: true,
      link: '/companies',
    },
    { 
      label: 'Employees', 
      value: stats.employees, 
      icon: Users, 
      gradient: 'from-emerald-500 to-emerald-600',
      lightGradient: 'from-emerald-50 to-emerald-100',
      shadowColor: 'shadow-emerald-500/25',
      trend: '+8%',
      trendUp: true,
      link: '/employees',
    },
    { 
      label: 'Orders', 
      value: stats.orders, 
      icon: ShoppingCart, 
      gradient: 'from-orange-500 to-orange-600',
      lightGradient: 'from-orange-50 to-orange-100',
      shadowColor: 'shadow-orange-500/25',
      trend: '+18%',
      trendUp: true,
      link: '/orders',
    },
    { 
      label: 'Support Tickets', 
      value: stats.supportTickets, 
      icon: HeadsetIcon, 
      gradient: 'from-rose-500 to-rose-600',
      lightGradient: 'from-rose-50 to-rose-100',
      shadowColor: 'shadow-rose-500/25',
      trend: '-5%',
      trendUp: false,
      link: '/support',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 lg:p-10">
          {/* Animated background patterns */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-300">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span className="text-sm font-medium">{getGreeting()}</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white">
                Welcome back, {user?.name?.split(' ')[0] || 'Admin'}!
              </h1>
              <p className="text-blue-200/80 text-lg">
                Manage users, companies, orders, and support tickets from your admin portal.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link to="/support">
                <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25">
                  <HeadsetIcon className="h-4 w-4 mr-2" />
                  Support Tickets
                </Button>
              </Link>
              <Link to="/orders">
                <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  View Orders
                </Button>
              </Link>
              <Link to="/companies">
                <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25">
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Companies
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card, index) => (
            <Link key={card.label} to={card.link}>
              <Card 
                className={`relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm cursor-pointer transition-all duration-500 hover:shadow-2xl ${card.shadowColor} group`}
                style={{
                  transform: hoveredCard === index ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                  animationDelay: `${index * 100}ms`,
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.lightGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Decorative elements */}
                <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${card.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-all duration-500 group-hover:scale-150`} />
                
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-500 group-hover:text-gray-600 transition-colors">
                        {card.label}
                      </p>
                      <div className="flex items-end gap-2">
                        <p className="text-4xl font-bold text-gray-900 tabular-nums tracking-tight">
                          {loading ? (
                            <span className="inline-block w-12 h-10 bg-gray-200 rounded animate-pulse" />
                          ) : (
                            card.value.toLocaleString()
                          )}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 text-sm font-medium ${card.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {card.trendUp ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        <span>{card.trend}</span>
                        <span className="text-gray-400 font-normal">vs last month</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg ${card.shadowColor} transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  Recent Orders
                </CardTitle>
                <Link to="/orders">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-orange-600 group-hover:translate-x-1 transition-all duration-300">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="w-24 h-3 bg-gray-100 rounded animate-pulse" />
                      </div>
                      <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-orange-300" />
                  </div>
                  <p className="text-gray-500">No orders yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentOrders.map((order, index) => {
                    const status = statusConfig[order.status] || statusConfig.draft;
                    const StatusIcon = status.icon;
                    return (
                      <div 
                        key={order.id} 
                        className="flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-transparent transition-all duration-300 cursor-pointer group/item"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center shadow-sm group-hover/item:shadow-md group-hover/item:scale-110 transition-all duration-300">
                          <ShoppingCart className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {order.employee_name || 'Employee'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {order.frame_name || 'Frame'} • {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={`${status.bg} ${status.text} border-0 text-xs font-medium px-3 py-1 flex items-center gap-1.5`}>
                          <StatusIcon className="h-3 w-3" />
                          {formatStatus(order.status || 'draft')}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Support Tickets */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/25">
                    <HeadsetIcon className="h-5 w-5 text-white" />
                  </div>
                  Support Tickets
                </CardTitle>
                <Link to="/support">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-rose-600 group-hover:translate-x-1 transition-all duration-300">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="w-48 h-3 bg-gray-100 rounded animate-pulse" />
                      </div>
                      <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : recentTickets.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
                    <HeadsetIcon className="h-8 w-8 text-rose-300" />
                  </div>
                  <p className="text-gray-500">No support tickets yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentTickets.map((ticket, index) => {
                    const status = statusConfig[ticket.status] || statusConfig.under_analysis;
                    const StatusIcon = status.icon;
                    return (
                      <div 
                        key={ticket.id} 
                        className="flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-rose-50/50 hover:to-transparent transition-all duration-300 cursor-pointer group/item"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-rose-50 flex items-center justify-center shadow-sm group-hover/item:shadow-md group-hover/item:scale-110 transition-all duration-300">
                          <HeadsetIcon className="h-5 w-5 text-rose-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {ticket.employee_name || 'Employee'}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {ticket.issue_description || 'No description'}
                          </p>
                        </div>
                        <Badge className={`${status.bg} ${status.text} border-0 text-xs font-medium px-3 py-1 flex items-center gap-1.5`}>
                          <StatusIcon className="h-3 w-3" />
                          {formatStatus(ticket.status || 'under_analysis')}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 bg-gradient-to-r from-slate-900 to-slate-800 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Admin Quick Actions
                </h3>
                <p className="text-gray-400">
                  Manage users, companies, orders and support tickets
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/companies">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50">
                    <Building2 className="h-4 w-4 mr-2" />
                    Companies
                  </Button>
                </Link>
                <Link to="/employees">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/50">
                    <Users className="h-4 w-4 mr-2" />
                    Employees
                  </Button>
                </Link>
                <Link to="/orders">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/50">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Orders
                  </Button>
                </Link>
                <Link to="/support">
                  <Button className="bg-rose-600 hover:bg-rose-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-rose-500/50">
                    <HeadsetIcon className="h-4 w-4 mr-2" />
                    Support
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
