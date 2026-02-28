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
  Users,
  Search,
  Pencil,
  Trash2,
  Building2,
  Briefcase,
  Clock,
  MapPin,
  MoreVertical,
  Filter,
  Download,
  UserCheck,
  UserX,
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

interface Employee {
  id: number;
  company_id: number;
  name: string;
  department: string;
  employee_registration: string;
  shift: string;
  unit_location: string;
  status: string;
  created_at: string;
}

interface Company {
  id: number;
  corporate_name: string;
}

const emptyForm = {
  company_id: '',
  name: '',
  department: '',
  employee_registration: '',
  shift: '',
  unit_location: '',
  status: 'active',
};

const shiftConfig: Record<string, { label: string; color: string; bg: string }> = {
  morning: { label: 'Morning', color: 'text-amber-700', bg: 'bg-amber-100' },
  afternoon: { label: 'Afternoon', color: 'text-blue-700', bg: 'bg-blue-100' },
  night: { label: 'Night', color: 'text-indigo-700', bg: 'bg-indigo-100' },
};

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, compRes] = await Promise.all([
        client.entities.employees.query({ limit: 100, sort: '-created_at' }),
        client.entities.companies.query({ limit: 100 }),
      ]);
      setEmployees((empRes.data?.items || []) as Employee[]);
      setCompanies((compRes.data?.items || []) as Company[]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCompanyName = (companyId: number) => {
    return companies.find((c) => c.id === companyId)?.corporate_name || 'Unknown';
  };

  const openEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({
      company_id: String(emp.company_id || ''),
      name: emp.name || '',
      department: emp.department || '',
      employee_registration: emp.employee_registration || '',
      shift: emp.shift || '',
      unit_location: emp.unit_location || '',
      status: emp.status || 'active',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.company_id) {
      toast.error('Name and Company are required');
      return;
    }
    if (!editingId) return;
    
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const data = {
        ...form,
        company_id: Number(form.company_id),
        updated_at: now,
      };
      await client.entities.employees.update({ id: String(editingId), data });
      toast.success('Employee updated successfully');
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (emp: Employee) => {
    setEmployeeToDelete(emp);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await client.entities.employees.delete({ id: String(employeeToDelete.id) });
      toast.success('Employee deleted successfully');
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete employee');
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_registration?.includes(search)
  );

  const activeCount = employees.filter(e => e.status === 'active').length;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-30 animate-pulse" />
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/30">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Employees</h2>
              <p className="text-gray-500 mt-1">Manage your workforce and team members</p>
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
                  <p className="text-sm font-medium text-gray-500">Total Employees</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{employees.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Employees</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{activeCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-green-50">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Inactive Employees</p>
                  <p className="text-3xl font-bold text-gray-400 mt-1">{employees.length - activeCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50">
                  <UserX className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-white shadow-lg shadow-gray-200/50 border-0 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
          />
        </div>

        {/* Employees Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-0 bg-white/80 animate-pulse">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="w-3/4 h-5 bg-gray-200 rounded" />
                      <div className="w-1/2 h-4 bg-gray-100 rounded" />
                    </div>
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
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
                <Users className="h-10 w-10 text-emerald-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-500">Employees are added by company managers</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((emp, index) => (
              <Card
                key={emp.id}
                className={`border-0 bg-white/80 backdrop-blur-sm overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl ${
                  hoveredCard === emp.id ? 'shadow-2xl shadow-emerald-500/20 scale-[1.02]' : 'shadow-xl shadow-gray-200/50'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onMouseEnter={() => setHoveredCard(emp.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg transition-all duration-300 ${
                        emp.status === 'active'
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25'
                          : 'bg-gray-300'
                      }`}>
                        {emp.name?.charAt(0).toUpperCase() || 'E'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{emp.name}</h3>
                        <p className="text-sm text-gray-500">{emp.employee_registration || 'No ID'}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEdit(emp)} className="cursor-pointer">
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => confirmDelete(emp)} className="cursor-pointer text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{getCompanyName(emp.company_id)}</span>
                    </div>
                    {emp.department && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span>{emp.department}</span>
                      </div>
                    )}
                    {emp.unit_location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{emp.unit_location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {emp.shift && shiftConfig[emp.shift] && (
                        <Badge className={`${shiftConfig[emp.shift].bg} ${shiftConfig[emp.shift].color} border-0 text-xs`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {shiftConfig[emp.shift].label}
                        </Badge>
                      )}
                    </div>
                    <Badge
                      className={`border-0 text-xs font-medium px-3 py-1 ${
                        emp.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {emp.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Users className="h-5 w-5 text-white" />
                </div>
                Edit Employee
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Company *</Label>
                <select
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  value={form.company_id}
                  onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                >
                  <option value="">Select a company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.corporate_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Name *</Label>
                <Input 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="Full name"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Department</Label>
                  <Input 
                    value={form.department} 
                    onChange={(e) => setForm({ ...form, department: e.target.value })} 
                    placeholder="Department"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Employee ID</Label>
                  <Input 
                    value={form.employee_registration} 
                    onChange={(e) => setForm({ ...form, employee_registration: e.target.value })} 
                    placeholder="Employee ID"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Shift</Label>
                  <select 
                    className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                    value={form.shift} 
                    onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  >
                    <option value="">Select shift</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="night">Night</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <select 
                    className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                    value={form.status} 
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Unit / Location</Label>
                <Input 
                  value={form.unit_location} 
                  onChange={(e) => setForm({ ...form, unit_location: e.target.value })} 
                  placeholder="Work unit or location"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30"
              >
                {saving ? 'Saving...' : 'Update Employee'}
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
                Delete Employee
              </DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 py-4">
              Are you sure you want to delete <span className="font-semibold">{employeeToDelete?.name}</span>? 
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
