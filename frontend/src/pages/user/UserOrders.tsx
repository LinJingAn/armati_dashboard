import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Package, 
  Eye, 
  ShoppingBag, 
  Calendar, 
  ChevronRight,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import UserLayout from '@/components/UserLayout';
import client, { UserOrder, OrderStats } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const getStatusConfig = (status: string) => {
  const configs: Record<string, { icon: typeof Clock; color: string; bg: string; border: string }> = {
    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
    confirmed: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
    processing: { icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' },
    shipped: { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' },
    delivered: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
  };
  return configs[status] || configs.pending;
};

export default function UserOrders() {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<UserOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [ordersResult, statsResult] = await Promise.all([
        client.userOrders.getAll({ limit: 50 }),
        client.userOrders.getStats(),
      ]);
      
      if (ordersResult.data?.items) {
        setOrders(ordersResult.data.items);
      }
      if (statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    
    setCancelling(true);
    try {
      const result = await client.userOrders.cancel(orderToCancel.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Order cancelled successfully');
        fetchOrders();
      }
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setCancelling(false);
      setCancelDialogOpen(false);
      setOrderToCancel(null);
    }
  };

  const filteredOrders =
    statusFilter === 'all'
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  return (
    <UserLayout>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a0f1a] via-[#111827] to-[#0a0f1a] py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Orders</h1>
              <p className="text-gray-400">Track and manage your orders</p>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white rounded-xl">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="rounded-lg">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: stats?.total || 0, color: 'from-blue-600 to-indigo-600' },
            { label: 'Pending', value: stats?.pending || 0, color: 'from-amber-500 to-orange-500' },
            { label: 'Shipped', value: stats?.shipped || 0, color: 'from-purple-600 to-pink-600' },
            { label: 'Delivered', value: stats?.delivered || 0, color: 'from-emerald-600 to-teal-600' },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-lg rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Package className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-lg rounded-xl">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="w-24 h-24 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-500 mb-6">
              {statusFilter === 'all'
                ? "You haven't placed any orders yet. Start shopping now!"
                : `No orders with status "${statusFilter}".`}
            </p>
            <Link to="/shop/catalog">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all">
                Start Shopping
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);
              
              return (
                <Card 
                  key={order.id} 
                  className="border-0 shadow-lg hover:shadow-xl rounded-xl overflow-hidden transition-all duration-300 group hover:-translate-y-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6">
                    {/* Order Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
                      <div>
                        <p className="text-sm text-gray-500">
                          Order <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(order.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border} px-3 py-1 rounded-lg`}>
                          <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        {canCancel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            onClick={() => {
                              setOrderToCancel(order);
                              setCancelDialogOpen(true);
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                            {item.frame?.image1Url ? (
                              <img
                                src={client.storage.getFullUrl(item.frame.image1Url)}
                                alt={item.frame.modelName}
                                className="w-full h-full object-contain p-2"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link 
                              to={`/shop/product/${item.frameId}`}
                              className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
                            >
                              {item.frame?.modelName || 'Unknown Product'}
                            </Link>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {item.color && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                                  {item.color}
                                </span>
                              )}
                              {item.size && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                                  {item.size}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 mt-1">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm text-gray-500">
                        <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                        {order.shipping === 0 && (
                          <span className="ml-3 text-green-600 font-medium">Free Shipping</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Total</p>
                          <p className="text-xl font-bold text-gray-900">${order.total.toFixed(2)}</p>
                        </div>
                        <Link to={`/shop/product/${order.items[0]?.frameId}`}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            View
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Progress Bar for shipped orders */}
                    {order.status === 'shipped' && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-500">Estimated delivery</span>
                          <span className="font-medium text-gray-900">In 2-3 days</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl mb-2">Cancel Order?</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel order{' '}
                <span className="font-semibold">#{orderToCancel?.orderNumber}</span>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
              Keep Order
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={cancelling}>
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Order'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
}
