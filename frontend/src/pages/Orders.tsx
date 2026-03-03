import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ShoppingCart,
  Search,
  Eye,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Calendar,
  User,
  Glasses,
} from 'lucide-react';
import { toast } from 'sonner';
import client from '@/lib/api';
import Layout from '@/components/Layout';
import OrderDetailDialog from '@/components/OrderDetailDialog';

interface Order {
  id: number;
  company_id: number;
  employee_id: number;
  frame_id: number;
  employee_name: string;
  frame_name: string;
  status: string;
  prescription_image_key: string;
  notes: string;
  created_at: string;
}

interface Employee {
  id: number;
  name: string;
  company_id: number;
}

interface Frame {
  id: number;
  model_name: string;
  image_url_1: string;
  color: string;
  size: string;
  status?: string;
}

interface Company {
  id: number;
  corporate_name: string;
}

const ORDER_STATUSES = [
  'draft', 'submitted', 'under_review', 'awaiting_approval',
  'in_production', 'shipped', 'delivered', 'completed',
];

const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType; gradient: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock, gradient: 'from-gray-500 to-gray-600' },
  submitted: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Package, gradient: 'from-blue-500 to-blue-600' },
  under_review: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Eye, gradient: 'from-yellow-500 to-yellow-600' },
  awaiting_approval: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock, gradient: 'from-orange-500 to-orange-600' },
  in_production: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Package, gradient: 'from-purple-500 to-purple-600' },
  shipped: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Truck, gradient: 'from-indigo-500 to-indigo-600' },
  delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2, gradient: 'from-green-500 to-green-600' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2, gradient: 'from-emerald-500 to-emerald-600' },
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [, setSaving] = useState(false);
  const [prescriptionFile] = useState<File | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const [form] = useState({
    company_id: '',
    employee_id: '',
    frame_id: '',
    notes: '',
    status: 'draft',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, empRes, framesRes, compRes] = await Promise.all([
        client.entities.orders.query({ limit: 100, sort: '-created_at' }),
        client.entities.employees.query({ limit: 100 }),
        client.entities.frames.query({ limit: 100 }),
        client.entities.companies.query({ limit: 100 }),
      ]);
      setOrders((ordersRes.data?.items || []) as Order[]);
      setEmployees((empRes.data?.items || []) as Employee[]);
      setFrames((framesRes.data?.items || []) as Frame[]);
      setCompanies((compRes.data?.items || []) as Company[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const openNewDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  const handleSave = async () => {
    if (!form.company_id || !form.employee_id || !form.frame_id) {
      toast.error('Please select company, employee, and frame');
      return;
    }
    setSaving(true);
    try {
      const emp = employees.find((e) => e.id === Number(form.employee_id));
      const frame = frames.find((f) => f.id === Number(form.frame_id));
      const now = new Date().toISOString();

      let prescriptionKey = '';
      if (prescriptionFile) {
        try {
          const result = await client.storage.upload({ file: prescriptionFile, folder: 'prescriptions' });
          prescriptionKey = result.data?.url || '';
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
        }
      }

      await client.entities.orders.create({
        data: {
          company_id: Number(form.company_id),
          employee_id: Number(form.employee_id),
          frame_id: Number(form.frame_id),
          employee_name: emp?.name || '',
          frame_name: frame?.model_name || '',
          status: form.status,
          notes: form.notes,
          prescription_image_key: prescriptionKey,
          created_at: now,
          updated_at: now,
        },
      });
      toast.success('Order created successfully');
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      await client.entities.orders.update({
        id: String(orderId),
        data: { status: newStatus, updated_at: new Date().toISOString() },
      });
      toast.success('Status updated');
      fetchData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const filtered = orders.filter(
    (o) =>
      o.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.frame_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.status?.includes(search.toLowerCase())
  );

  const pendingCount = orders.filter(o => ['draft', 'submitted', 'under_review'].includes(o.status)).length;
  const processingCount = orders.filter(o => ['awaiting_approval', 'in_production', 'shipped'].includes(o.status)).length;
  const completedCount = orders.filter(o => ['delivered', 'completed'].includes(o.status)).length;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 blur-xl opacity-30 animate-pulse" />
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl shadow-orange-500/30">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Orders</h2>
              <p className="text-gray-500 mt-1">Track and manage glasses order requests</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="hidden sm:flex gap-2 hover:bg-gray-50 transition-all duration-300">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="hidden sm:flex gap-2 hover:bg-gray-50 transition-all duration-300">
              <Download className="h-4 w-4" />
              Export
            </Button>
            {/* handleSave reserved for future Create order dialog */}
            <Button type="button" onClick={handleSave} className="hidden" aria-hidden />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{orders.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Processing</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{processingCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{completedCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-white shadow-lg shadow-gray-200/50 border-0 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300"
          />
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-0 bg-white/80 animate-pulse">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-20 h-6 bg-gray-200 rounded" />
                    <div className="w-24 h-6 rounded-full bg-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-5 bg-gray-200 rounded" />
                    <div className="w-1/2 h-4 bg-gray-100 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-50 flex items-center justify-center">
                <ShoppingCart className="h-10 w-10 text-orange-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500">Orders are created by users through the shop checkout</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.draft;
              const StatusIcon = status.icon;
              return (
                <Card
                  key={order.id}
                  className={`border-0 bg-white/80 backdrop-blur-sm overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl ${
                    hoveredCard === order.id ? 'shadow-2xl shadow-orange-500/20 scale-[1.02]' : 'shadow-xl shadow-gray-200/50'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onMouseEnter={() => setHoveredCard(order.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => openDetail(order)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${status.gradient} shadow-lg`}>
                          <StatusIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <span className="text-lg font-bold text-gray-900">#{order.id}</span>
                          <p className="text-xs text-gray-500">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${status.bg} ${status.text} border-0 text-xs font-medium px-3 py-1`}>
                        {formatStatus(order.status || 'draft')}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{order.employee_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Glasses className="h-4 w-4 text-gray-400" />
                        <span>{order.frame_name || 'Unknown Frame'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={(e) => { e.stopPropagation(); openNewDetail(String(order.id)); }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Order Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                Order #{selectedOrder?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Employee</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.employee_name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Frame</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.frame_name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="font-semibold text-gray-900">
                      {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <Badge className={`${statusConfig[selectedOrder.status]?.bg || 'bg-gray-100'} ${statusConfig[selectedOrder.status]?.text || 'text-gray-700'} border-0 text-xs`}>
                      {formatStatus(selectedOrder.status || 'draft')}
                    </Badge>
                  </div>
                </div>
                {selectedOrder.notes && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Update Status</Label>
                  <select
                    className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    value={selectedOrder.status}
                    onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{formatStatus(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* New Order Detail Dialog with multi-item, history, and workflow support */}
        <OrderDetailDialog
          orderId={selectedOrderId}
          open={!!selectedOrderId}
          onOpenChange={(open) => !open && setSelectedOrderId(null)}
          onOrderUpdated={fetchData}
        />
      </div>
    </Layout>
  );
}
