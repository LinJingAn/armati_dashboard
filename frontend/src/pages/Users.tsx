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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  Pencil,
  Trash2,
  MoreVertical,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building2,
  Crown,
  User,
  AlertTriangle,
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

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  role: 'ADMIN' | 'COMPANY_MANAGER' | 'USER';
  isActive: boolean;
  companyId?: string;
  createdAt: string;
}

interface Company {
  id: string;
  corporateName: string;
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  whatsapp: '',
  role: 'USER' as const,
  companyId: '',
  isActive: true,
};

const roleConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ADMIN: { label: 'Admin', color: 'text-purple-700', bg: 'bg-purple-100', icon: Crown },
  COMPANY_MANAGER: { label: 'Manager', color: 'text-blue-700', bg: 'bg-blue-100', icon: Shield },
  USER: { label: 'User', color: 'text-gray-700', bg: 'bg-gray-100', icon: User },
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, compRes] = await Promise.all([
        client.entities.users.query({ limit: 100, sort: '-created_at' }),
        client.entities.companies.query({ limit: 100 }),
      ]);
      setUsers((usersRes.data?.items || []) as UserData[]);
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

  const handleOpenEdit = (user: UserData) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      whatsapp: user.whatsapp || '',
      role: user.role,
      companyId: user.companyId || '',
      isActive: user.isActive,
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (user: UserData) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!editingId) return;

    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        role: form.role,
        companyId: form.companyId || null,
        isActive: form.isActive,
      };

      if (form.password) {
        data.password = form.password;
      }

      await client.entities.users.update({ id: editingId, data });
      toast.success('User updated successfully');

      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      await client.entities.users.delete({ id: userToDelete.id });
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user');
    }
  };

  const handleToggleActive = async (user: UserData) => {
    try {
      await client.entities.users.update({
        id: user.id,
        data: { isActive: !user.isActive },
      });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return 'No Company';
    const company = companies.find((c) => c.id === companyId);
    return company?.corporateName || 'Unknown';
  };

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    managers: users.filter((u) => u.role === 'COMPANY_MANAGER').length,
    regularUsers: users.filter((u) => u.role === 'USER').length,
    active: users.filter((u) => u.isActive).length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <Users className="h-6 w-6 text-white" />
              </div>
              User Management
            </h1>
            <p className="text-gray-500 mt-1">Manage all system users and their roles</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Users', value: stats.total, color: 'from-gray-500 to-gray-600' },
            { label: 'Admins', value: stats.admins, color: 'from-purple-500 to-purple-600' },
            { label: 'Managers', value: stats.managers, color: 'from-blue-500 to-blue-600' },
            { label: 'Users', value: stats.regularUsers, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Active', value: stats.active, color: 'from-green-500 to-green-600' },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200 rounded-xl"
            />
          </div>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="w-24 h-3 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {search ? 'Try adjusting your search' : 'Add your first user to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const role = roleConfig[user.role] || roleConfig.USER;
              const RoleIcon = role.icon;
              return (
                <Card
                  key={user.id}
                  className={`border-0 bg-white/80 backdrop-blur-sm shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden ${
                    hoveredCard === user.id ? 'shadow-xl scale-[1.02]' : ''
                  }`}
                  onMouseEnter={() => setHoveredCard(user.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full ${role.bg} flex items-center justify-center`}>
                          <RoleIcon className={`h-6 w-6 ${role.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <Badge className={`${role.bg} ${role.color} border-0 text-xs`}>
                            {role.label}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                            {user.isActive ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleOpenDelete(user)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span>{getCompanyName(user.companyId)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <Badge
                        className={
                          user.isActive
                            ? 'bg-green-100 text-green-700 border-0'
                            : 'bg-red-100 text-red-700 border-0'
                        }
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                  <Pencil className="h-4 w-4 text-white" />
                </div>
                Edit User
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{editingId ? 'New Password (optional)' : 'Password *'}</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editingId ? 'Leave blank to keep' : 'Enter password'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v as typeof form.role })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="COMPANY_MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Enter phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="Enter WhatsApp"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Company (optional)</Label>
                <Select
                  value={form.companyId || 'none'}
                  onValueChange={(v) => setForm({ ...form, companyId: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Company</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.corporateName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editingId && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Label className="flex-1">Account Status</Label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
                      form.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                        form.isActive ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {saving ? 'Saving...' : 'Update User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <DialogTitle className="text-xl mb-2">Delete User?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{' '}
                <span className="font-semibold">{userToDelete?.name}</span>? This action cannot be
                undone.
              </DialogDescription>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
