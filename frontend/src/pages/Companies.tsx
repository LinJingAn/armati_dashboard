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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Building2,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Filter,
  Download,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import client from '@/lib/api';
import Layout from '@/components/Layout';

interface Company {
  id: number;
  cnpj: string;
  corporate_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

const emptyForm = {
  cnpj: '',
  corporate_name: '',
  email: '',
  phone: '',
  status: 'active',
};

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await client.entities.companies.query({ limit: 100, sort: '-created_at' });
      setCompanies(res.data?.items || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openEdit = (company: Company) => {
    setEditingId(company.id);
    setForm({
      cnpj: company.cnpj || '',
      corporate_name: company.corporate_name || '',
      email: company.email || '',
      phone: company.phone || '',
      status: company.status || 'active',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.cnpj || !form.corporate_name) {
      toast.error('CNPJ and Corporate Name are required');
      return;
    }
    if (!editingId) return;
    
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await client.entities.companies.update({
        id: String(editingId),
        data: { ...form, updated_at: now },
      });
      toast.success('Company updated successfully');
      setDialogOpen(false);
      fetchCompanies();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    try {
      await client.entities.companies.delete({ id: String(companyToDelete.id) });
      toast.success('Company deleted successfully');
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
      fetchCompanies();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete company');
    }
  };

  const filtered = companies.filter(
    (c) =>
      c.corporate_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = companies.filter(c => c.status === 'active').length;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30 animate-pulse" />
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/30">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Companies</h2>
              <p className="text-gray-500 mt-1">Manage your business partners and clients</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Companies</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{companies.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Companies</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{activeCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Inactive Companies</p>
                  <p className="text-3xl font-bold text-gray-400 mt-1">{companies.length - activeCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50">
                  <XCircle className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-white shadow-lg shadow-gray-200/50 border-0 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
          />
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-0 bg-white/80 animate-pulse">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-gray-200" />
                    <div className="w-20 h-6 rounded-full bg-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-5 bg-gray-200 rounded" />
                    <div className="w-1/2 h-4 bg-gray-100 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-gray-100 rounded" />
                    <div className="w-2/3 h-4 bg-gray-100 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first company</p>
              <Button 
                onClick={openCreate}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((company, index) => (
              <Card
                key={company.id}
                className={`border-0 bg-white/80 backdrop-blur-sm overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl ${
                  hoveredCard === company.id ? 'shadow-2xl shadow-blue-500/20 scale-[1.02]' : 'shadow-xl shadow-gray-200/50'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onMouseEnter={() => setHoveredCard(company.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                      company.status === 'active' 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25' 
                        : 'bg-gray-200'
                    }`}>
                      <Building2 className={`h-6 w-6 ${company.status === 'active' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`border-0 text-xs font-medium px-3 py-1 ${
                          company.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {company.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openEdit(company)} className="cursor-pointer">
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => confirmDelete(company)} className="cursor-pointer text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {company.corporate_name}
                      </h3>
                      <p className="text-sm text-gray-500 font-mono">{company.cnpj}</p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-gray-100">
                      {company.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{company.email}</span>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{company.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-500">Employees</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300"
                        onClick={() => openEdit(company)}
                      >
                        View Details
                        <ArrowUpRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                Edit Company
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">CNPJ *</Label>
                <Input
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Corporate Name *</Label>
                <Input
                  value={form.corporate_name}
                  onChange={(e) => setForm({ ...form, corporate_name: e.target.value })}
                  placeholder="Company legal name"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="company@example.com"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(00) 0000-0000"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <select
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
              >
                {saving ? 'Saving...' : editingId ? 'Update Company' : 'Create Company'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-100">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                Delete Company
              </DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 py-4">
              Are you sure you want to delete <span className="font-semibold">{companyToDelete?.corporate_name}</span>? 
              This action cannot be undone.
            </p>
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                className="rounded-xl bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
