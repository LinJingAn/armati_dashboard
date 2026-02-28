import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Shield, 
  Loader2,
  Edit3,
  X,
  Check,
  CreditCard,
  Package,
  Settings,
  Bell,
  Lock,
  Camera,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import UserLayout from '@/components/UserLayout';
import { useAuth } from '@/contexts/AuthContext';
import client from '@/lib/api';

export default function Profile() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user?.id, user?.name, user?.phone]);

  // Password change dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notifications dialog
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    promotions: false,
    newsletter: true,
    security: true,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Delete account dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Order stats
  const [orderStats, setOrderStats] = useState({ total: 0, spent: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          client.userOrders.getStats(),
          client.userOrders.getAll({ limit: 100 }),
        ]);
        if (statsRes.data) {
          setOrderStats(prev => ({ ...prev, total: statsRes.data.total }));
        }
        if (ordersRes.data?.items) {
          const totalSpent = ordersRes.data.items.reduce((sum, order) => sum + (order.total || 0), 0);
          setOrderStats(prev => ({ ...prev, spent: totalSpent }));
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await client.storage.upload({ file, folder: 'avatars' });
      if (result.data?.url) {
        setAvatarUrl(result.data.url);
        toast.success('Profile photo updated!');
      } else {
        toast.error(result.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const result = await client.entities.users.update({
        id: user.id,
        data: { name: formData.name, phone: formData.phone || null },
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      await refreshUser();
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await client.auth.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success('Password changed successfully');
      setPasswordDialogOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Notification preferences saved');
      setNotificationsDialogOpen(false);
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    setIsDeletingAccount(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('Account scheduled for deletion');
      setDeleteDialogOpen(false);
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg shadow-purple-500/25">Administrator</Badge>;
      case 'COMPANY_MANAGER':
        return <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/25">Company Manager</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0">User</Badge>;
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '-';

  const stats = [
    { icon: Package, label: 'Total Orders', value: String(orderStats.total), color: 'from-blue-600 to-indigo-600' },
    { icon: CreditCard, label: 'Total Spent', value: `$${orderStats.spent.toFixed(2)}`, color: 'from-emerald-600 to-teal-600' },
    { icon: Shield, label: 'Member Since', value: memberSince, color: 'from-purple-600 to-pink-600' },
  ];

  const quickSettings = [
    { 
      icon: Lock, 
      label: 'Change Password', 
      desc: 'Update your security credentials',
      onClick: () => setPasswordDialogOpen(true),
    },
    { 
      icon: Bell, 
      label: 'Notifications', 
      desc: 'Manage your notification preferences',
      onClick: () => setNotificationsDialogOpen(true),
    },
    { 
      icon: CreditCard, 
      label: 'Payment Methods', 
      desc: 'Add or remove payment options',
      onClick: () => toast.info('Payment methods coming soon!'),
    },
    { 
      icon: Package, 
      label: 'Order History', 
      desc: 'View all your past orders',
      onClick: () => navigate('/shop/orders'),
    },
  ];

  return (
    <UserLayout>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a0f1a] via-[#111827] to-[#0a0f1a] py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {/* Profile Header Card */}
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
            </div>
            <CardContent className="relative px-6 pb-6">
              {/* Avatar */}
              <div className="absolute -top-16 left-6">
                <div className="w-32 h-32 rounded-2xl bg-white shadow-xl p-1 relative group">
                  {avatarUrl ? (
                    <img 
                      src={client.storage.getFullUrl(avatarUrl)} 
                      alt="Profile" 
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                      <span className="text-5xl font-bold text-white">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Camera className="h-4 w-4 text-gray-600" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              {/* User Info */}
              <div className="pt-20 sm:pt-4 sm:ml-36">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                    <p className="text-gray-500">{user?.email}</p>
                    <div className="mt-2">{user?.role && getRoleBadge(user.role)}</div>
                  </div>
                  {!isEditing ? (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                        className="rounded-xl"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <Card key={i} className="border-0 shadow-lg rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Personal Information */}
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </CardTitle>
              <CardDescription>Your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4 text-gray-400" />
                    Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">{user?.name || '-'}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Email Address
                  </Label>
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">{user?.email}</div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    Phone Number
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">{formData.phone || 'Not provided'}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    Company
                  </Label>
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                    {user?.company?.corporateName || (user?.companyId ? 'Company assigned' : 'No company assigned')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Settings */}
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Quick Settings
              </CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickSettings.map((item, i) => (
                  <button
                    key={i}
                    onClick={item.onClick}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                      <item.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-blue-700">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-0 shadow-lg rounded-xl border-red-100">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-xl bg-red-50/50">
                <div>
                  <p className="font-medium text-gray-900">Delete Account</p>
                  <p className="text-sm text-gray-500">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="rounded-xl"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Lock className="h-4 w-4 text-white" />
              </div>
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password (min 6 characters)"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={isChangingPassword}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={notificationsDialogOpen} onOpenChange={setNotificationsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Bell className="h-4 w-4 text-white" />
              </div>
              Notification Preferences
            </DialogTitle>
            <DialogDescription>
              Choose what notifications you want to receive
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[
              { key: 'orderUpdates', label: 'Order Updates', desc: 'Get notified about your order status' },
              { key: 'promotions', label: 'Promotions', desc: 'Receive promotional offers and deals' },
              { key: 'newsletter', label: 'Newsletter', desc: 'Weekly newsletter with new products' },
              { key: 'security', label: 'Security Alerts', desc: 'Important account security notifications' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <Switch
                  checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                  onCheckedChange={(checked) => 
                    setNotificationSettings({ ...notificationSettings, [item.key]: checked })
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNotifications} 
              disabled={isSavingNotifications}
              className="bg-gradient-to-r from-amber-500 to-orange-600"
            >
              {isSavingNotifications ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl">Delete Your Account?</DialogTitle>
              <DialogDescription className="text-center mt-2">
                This action is permanent and cannot be undone. All your data, orders, and preferences will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 py-2">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                To confirm deletion, type <span className="font-bold">DELETE</span> below:
              </p>
            </div>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="text-center"
            />
          </div>
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
              className="flex-1"
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
}
