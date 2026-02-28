import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  HeadsetIcon, 
  Search, 
  Eye, 
  Upload,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Wrench,
  User,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import client from '@/lib/api';
import Layout from '@/components/Layout';

interface SupportTicket {
  id: number;
  company_id: number;
  employee_id: number;
  employee_name: string;
  issue_description: string;
  damaged_photo_key: string;
  status: string;
  resolution_notes: string;
  created_at: string;
}

interface Employee {
  id: number;
  name: string;
  company_id: number;
}

interface Company {
  id: number;
  corporate_name: string;
}

const TICKET_STATUSES = [
  'under_analysis', 'waiting_for_shipment', 'received',
  'in_repair', 'returning', 'completed',
];

const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType; gradient: string }> = {
  under_analysis: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertCircle, gradient: 'from-yellow-500 to-yellow-600' },
  waiting_for_shipment: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock, gradient: 'from-orange-500 to-orange-600' },
  received: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle2, gradient: 'from-blue-500 to-blue-600' },
  in_repair: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Wrench, gradient: 'from-purple-500 to-purple-600' },
  returning: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Truck, gradient: 'from-indigo-500 to-indigo-600' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2, gradient: 'from-emerald-500 to-emerald-600' },
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [damagedFile, setDamagedFile] = useState<File | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const [form, setForm] = useState({
    company_id: '',
    employee_id: '',
    issue_description: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, empRes, compRes] = await Promise.all([
        client.entities.support_tickets.query({ limit: 100, sort: '-created_at' }),
        client.entities.employees.query({ limit: 100 }),
        client.entities.companies.query({ limit: 100 }),
      ]);
      setTickets((ticketsRes.data?.items || []) as SupportTicket[]);
      setEmployees((empRes.data?.items || []) as Employee[]);
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

  const filteredEmployees = form.company_id
    ? employees.filter((e) => e.company_id === Number(form.company_id))
    : employees;

  const openDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setDetailOpen(true);
  };

  const handleSave = async () => {
    if (!form.company_id || !form.employee_id || !form.issue_description) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const emp = employees.find((e) => e.id === Number(form.employee_id));
      const now = new Date().toISOString();

      let damagedPhotoKey = '';
      if (damagedFile) {
        try {
          const result = await client.storage.upload({ file: damagedFile, folder: 'damaged' });
          damagedPhotoKey = result.data?.url || '';
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
        }
      }

      await client.entities.support_tickets.create({
        data: {
          company_id: Number(form.company_id),
          employee_id: Number(form.employee_id),
          employee_name: emp?.name || '',
          issue_description: form.issue_description,
          damaged_photo_key: damagedPhotoKey,
          status: 'under_analysis',
          resolution_notes: '',
          created_at: now,
          updated_at: now,
        },
      });
      toast.success('Support ticket created successfully');
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create ticket');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (ticketId: number, newStatus: string) => {
    try {
      await client.entities.support_tickets.update({
        id: String(ticketId),
        data: { status: newStatus, updated_at: new Date().toISOString() },
      });
      toast.success('Status updated');
      fetchData();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const filtered = tickets.filter(
    (t) =>
      t.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.issue_description?.toLowerCase().includes(search.toLowerCase()) ||
      t.status?.includes(search.toLowerCase())
  );

  const openCount = tickets.filter(t => ['under_analysis', 'waiting_for_shipment'].includes(t.status)).length;
  const inProgressCount = tickets.filter(t => ['received', 'in_repair', 'returning'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => t.status === 'completed').length;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-rose-500 blur-xl opacity-30 animate-pulse" />
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-500/30">
                <HeadsetIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Support Tickets</h2>
              <p className="text-gray-500 mt-1">Manage technical support and repair requests</p>
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Tickets</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{tickets.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-rose-100 to-rose-50">
                  <HeadsetIcon className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Open</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{openCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{inProgressCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50">
                  <Wrench className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Resolved</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{resolvedCount}</p>
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
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-white shadow-lg shadow-gray-200/50 border-0 focus:ring-2 focus:ring-rose-500/20 transition-all duration-300"
          />
        </div>

        {/* Tickets Grid */}
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
                    <div className="w-full h-12 bg-gray-100 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-50 flex items-center justify-center">
                <HeadsetIcon className="h-10 w-10 text-rose-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No support tickets found</h3>
              <p className="text-gray-500">Support tickets are submitted by users and employees</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((ticket, index) => {
              const status = statusConfig[ticket.status] || statusConfig.under_analysis;
              const StatusIcon = status.icon;
              return (
                <Card
                  key={ticket.id}
                  className={`border-0 bg-white/80 backdrop-blur-sm overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl ${
                    hoveredCard === ticket.id ? 'shadow-2xl shadow-rose-500/20 scale-[1.02]' : 'shadow-xl shadow-gray-200/50'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onMouseEnter={() => setHoveredCard(ticket.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => openDetail(ticket)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${status.gradient} shadow-lg`}>
                          <StatusIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <span className="text-lg font-bold text-gray-900">#{ticket.id}</span>
                          <p className="text-xs text-gray-500">
                            {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${status.bg} ${status.text} border-0 text-xs font-medium px-3 py-1`}>
                        {formatStatus(ticket.status || 'under_analysis')}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{ticket.employee_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{ticket.issue_description || 'No description'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={(e) => { e.stopPropagation(); openDetail(ticket); }}
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

        {/* Create Ticket Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600">
                  <HeadsetIcon className="h-5 w-5 text-white" />
                </div>
                New Support Ticket
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Company *</Label>
                <select 
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all" 
                  value={form.company_id} 
                  onChange={(e) => setForm({ ...form, company_id: e.target.value, employee_id: '' })}
                >
                  <option value="">Select company</option>
                  {companies.map((c) => (<option key={c.id} value={c.id}>{c.corporate_name}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Employee *</Label>
                <select 
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all" 
                  value={form.employee_id} 
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                >
                  <option value="">Select employee</option>
                  {filteredEmployees.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Issue Description *</Label>
                <Textarea
                  value={form.issue_description}
                  onChange={(e) => setForm({ ...form, issue_description: e.target.value })}
                  placeholder="Describe the issue with the glasses..."
                  rows={4}
                  className="rounded-xl resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Damaged Glasses Photo</Label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50/50 transition-all duration-300"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-100 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-rose-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {damagedFile ? damagedFile.name : 'Click to upload photo'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setDamagedFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-lg shadow-rose-500/30"
              >
                {saving ? 'Creating...' : 'Create Ticket'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ticket Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600">
                  <HeadsetIcon className="h-5 w-5 text-white" />
                </div>
                Ticket #{selectedTicket?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Employee</p>
                    <p className="font-semibold text-gray-900">{selectedTicket.employee_name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="font-semibold text-gray-900">
                      {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Issue Description</p>
                  <p className="text-sm text-gray-700">{selectedTicket.issue_description}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <Badge className={`${statusConfig[selectedTicket.status]?.bg || 'bg-gray-100'} ${statusConfig[selectedTicket.status]?.text || 'text-gray-700'} border-0 text-xs`}>
                    {formatStatus(selectedTicket.status || 'under_analysis')}
                  </Badge>
                </div>
                {selectedTicket.resolution_notes && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Resolution Notes</p>
                    <p className="text-sm text-gray-700">{selectedTicket.resolution_notes}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Update Status</Label>
                  <select
                    className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    value={selectedTicket.status}
                    onChange={(e) => updateStatus(selectedTicket.id, e.target.value)}
                  >
                    {TICKET_STATUSES.map((s) => (
                      <option key={s} value={s}>{formatStatus(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
