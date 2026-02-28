import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Glasses,
  Plus,
  Search,
  Grid3X3,
  List,
  Edit2,
  Trash2,
  Eye,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Package,
  Check,
  AlertTriangle,
  Settings,
  Tags,
  Building2,
  X,
  Pencil,
  Save,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import client from '@/lib/api';

interface Frame {
  id: string;
  modelName: string;
  sku: string;
  brand: string;
  category: string;
  color: string;
  size: string;
  price: number;
  image1Url: string;
  image2Url?: string;
  image3Url?: string;
  image4Url?: string;
  isActive: boolean;
}

interface FrameFormData {
  modelName: string;
  sku: string;
  brand: string;
  category: string;
  color: string;
  size: string;
  price: string;
  image1Url: string;
  image2Url: string;
  image3Url: string;
  image4Url: string;
  isActive: boolean;
}

interface CatalogItem {
  id: string;
  name: string;
  productCount?: number;
}

const initialFormData: FrameFormData = {
  modelName: '',
  sku: '',
  brand: '',
  category: '',
  color: '',
  size: '',
  price: '',
  image1Url: '',
  image2Url: '',
  image3Url: '',
  image4Url: '',
  isActive: true,
};

const DEFAULT_CATEGORIES = ['Safety Glasses', 'Goggles', 'Face Shields', 'Prescription Safety', 'Sports Glasses'];
const DEFAULT_BRANDS = ['SafeVision', '3M', 'Honeywell', 'Uvex', 'Bollé', 'MSA'];
const SIZES = ['Small', 'Medium', 'Large', 'XL', 'Universal'];
const COLORS = ['Black', 'Brown', 'Blue', 'Silver', 'Gray', 'Clear', 'Orange', 'Green', 'Red', 'White', 'Yellow'];

export default function ManagerFrames() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFrames, setTotalFrames] = useState(0);
  const itemsPerPage = 12;

  // Catalog Management State
  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [brands, setBrands] = useState<CatalogItem[]>([]);
  const [catalogDialog, setCatalogDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [editingCategory, setEditingCategory] = useState<CatalogItem | null>(null);
  const [editingBrand, setEditingBrand] = useState<CatalogItem | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editBrandName, setEditBrandName] = useState('');

  // Dialog States
  const [createEditDialog, setCreateEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingFrame, setEditingFrame] = useState<Frame | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [frameToDelete, setFrameToDelete] = useState<Frame | null>(null);
  const [formData, setFormData] = useState<FrameFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  
  // Image Upload States
  const [image1File, setImage1File] = useState<File | null>(null);
  const [image2File, setImage2File] = useState<File | null>(null);
  const [image3File, setImage3File] = useState<File | null>(null);
  const [image4File, setImage4File] = useState<File | null>(null);
  const [image1Preview, setImage1Preview] = useState<string>('');
  const [image2Preview, setImage2Preview] = useState<string>('');
  const [image3Preview, setImage3Preview] = useState<string>('');
  const [image4Preview, setImage4Preview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load categories and brands from localStorage and frames
  const loadCatalogData = useCallback((framesData: Frame[]) => {
    // Get saved custom items from localStorage
    const savedCategories = JSON.parse(localStorage.getItem('manager_categories') || '[]');
    const savedBrands = JSON.parse(localStorage.getItem('manager_brands') || '[]');

    // Extract unique categories and brands from frames
    const frameCategoriesSet = new Set(framesData.map(f => f.category).filter(Boolean));
    const frameBrandsSet = new Set(framesData.map(f => f.brand).filter(Boolean));

    // Merge defaults, saved, and from frames
    const allCategories = new Set([...DEFAULT_CATEGORIES, ...savedCategories, ...frameCategoriesSet]);
    const allBrands = new Set([...DEFAULT_BRANDS, ...savedBrands, ...frameBrandsSet]);

    // Create catalog items with product counts
    const categoryItems: CatalogItem[] = Array.from(allCategories).map(name => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      productCount: framesData.filter(f => f.category === name).length,
    }));

    const brandItems: CatalogItem[] = Array.from(allBrands).map(name => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      productCount: framesData.filter(f => f.brand === name).length,
    }));

    setCategories(categoryItems.sort((a, b) => a.name.localeCompare(b.name)));
    setBrands(brandItems.sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const fetchFrames = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.entities.frames.query({
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        search: searchQuery || undefined,
      });
      const framesData = (res.data?.items || []) as Frame[];
      setFrames(framesData);
      setTotalFrames(res.data?.total || 0);

      // Also fetch all frames for catalog data
      const allFramesRes = await client.entities.frames.query({ limit: 1000 });
      loadCatalogData((allFramesRes.data?.items || []) as Frame[]);
    } catch (error) {
      console.error('Failed to fetch frames:', error);
      toast.error('Failed to load products');
    }
    setLoading(false);
  }, [currentPage, searchQuery, loadCatalogData]);

  useEffect(() => {
    fetchFrames();
  }, [fetchFrames]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Catalog Management Functions
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    if (categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast.error('This category already exists');
      return;
    }

    const savedCategories = JSON.parse(localStorage.getItem('manager_categories') || '[]');
    savedCategories.push(newCategoryName.trim());
    localStorage.setItem('manager_categories', JSON.stringify(savedCategories));

    setCategories([...categories, {
      id: newCategoryName.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newCategoryName.trim(),
      productCount: 0,
    }].sort((a, b) => a.name.localeCompare(b.name)));

    setNewCategoryName('');
    toast.success('Category added successfully');
  };

  const handleAddBrand = () => {
    if (!newBrandName.trim()) {
      toast.error('Please enter a brand name');
      return;
    }
    if (brands.some(b => b.name.toLowerCase() === newBrandName.trim().toLowerCase())) {
      toast.error('This brand already exists');
      return;
    }

    const savedBrands = JSON.parse(localStorage.getItem('manager_brands') || '[]');
    savedBrands.push(newBrandName.trim());
    localStorage.setItem('manager_brands', JSON.stringify(savedBrands));

    setBrands([...brands, {
      id: newBrandName.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newBrandName.trim(),
      productCount: 0,
    }].sort((a, b) => a.name.localeCompare(b.name)));

    setNewBrandName('');
    toast.success('Brand added successfully');
  };

  const handleEditCategory = (category: CatalogItem) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
  };

  const handleEditBrand = (brand: CatalogItem) => {
    setEditingBrand(brand);
    setEditBrandName(brand.name);
  };

  const handleSaveCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return;

    const oldName = editingCategory.name;
    const newName = editCategoryName.trim();

    if (oldName === newName) {
      setEditingCategory(null);
      return;
    }

    if (categories.some(c => c.name.toLowerCase() === newName.toLowerCase() && c.id !== editingCategory.id)) {
      toast.error('This category name already exists');
      return;
    }

    try {
      // Update all frames with the old category name to the new name
      const framesToUpdate = frames.filter(f => f.category === oldName);
      for (const frame of framesToUpdate) {
        await client.entities.frames.update({
          id: frame.id,
          data: { category: newName },
        });
      }

      // Update localStorage
      const savedCategories = JSON.parse(localStorage.getItem('manager_categories') || '[]');
      const index = savedCategories.indexOf(oldName);
      if (index > -1) {
        savedCategories[index] = newName;
      } else {
        savedCategories.push(newName);
      }
      localStorage.setItem('manager_categories', JSON.stringify(savedCategories));

      // Update state
      setCategories(categories.map(c =>
        c.id === editingCategory.id ? { ...c, name: newName, id: newName.toLowerCase().replace(/\s+/g, '-') } : c
      ).sort((a, b) => a.name.localeCompare(b.name)));

      setEditingCategory(null);
      toast.success(`Category renamed to "${newName}"`);
      fetchFrames();
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleSaveBrand = async () => {
    if (!editingBrand || !editBrandName.trim()) return;

    const oldName = editingBrand.name;
    const newName = editBrandName.trim();

    if (oldName === newName) {
      setEditingBrand(null);
      return;
    }

    if (brands.some(b => b.name.toLowerCase() === newName.toLowerCase() && b.id !== editingBrand.id)) {
      toast.error('This brand name already exists');
      return;
    }

    try {
      // Update all frames with the old brand name to the new name
      const framesToUpdate = frames.filter(f => f.brand === oldName);
      for (const frame of framesToUpdate) {
        await client.entities.frames.update({
          id: frame.id,
          data: { brand: newName },
        });
      }

      // Update localStorage
      const savedBrands = JSON.parse(localStorage.getItem('manager_brands') || '[]');
      const index = savedBrands.indexOf(oldName);
      if (index > -1) {
        savedBrands[index] = newName;
      } else {
        savedBrands.push(newName);
      }
      localStorage.setItem('manager_brands', JSON.stringify(savedBrands));

      // Update state
      setBrands(brands.map(b =>
        b.id === editingBrand.id ? { ...b, name: newName, id: newName.toLowerCase().replace(/\s+/g, '-') } : b
      ).sort((a, b) => a.name.localeCompare(b.name)));

      setEditingBrand(null);
      toast.success(`Brand renamed to "${newName}"`);
      fetchFrames();
    } catch (error) {
      console.error('Failed to update brand:', error);
      toast.error('Failed to update brand');
    }
  };

  const handleDeleteCategory = (category: CatalogItem) => {
    if (category.productCount && category.productCount > 0) {
      toast.error(`Cannot delete: ${category.productCount} products use this category`);
      return;
    }

    const savedCategories = JSON.parse(localStorage.getItem('manager_categories') || '[]');
    const filtered = savedCategories.filter((c: string) => c !== category.name);
    localStorage.setItem('manager_categories', JSON.stringify(filtered));

    setCategories(categories.filter(c => c.id !== category.id));
    toast.success('Category deleted');
  };

  const handleDeleteBrand = (brand: CatalogItem) => {
    if (brand.productCount && brand.productCount > 0) {
      toast.error(`Cannot delete: ${brand.productCount} products use this brand`);
      return;
    }

    const savedBrands = JSON.parse(localStorage.getItem('manager_brands') || '[]');
    const filtered = savedBrands.filter((b: string) => b !== brand.name);
    localStorage.setItem('manager_brands', JSON.stringify(filtered));

    setBrands(brands.filter(b => b.id !== brand.id));
    toast.success('Brand deleted');
  };

  const openCreateDialog = () => {
    setEditingFrame(null);
    setFormData(initialFormData);
    setImage1File(null);
    setImage2File(null);
    setImage3File(null);
    setImage4File(null);
    setImage1Preview('');
    setImage2Preview('');
    setImage3Preview('');
    setImage4Preview('');
    setCreateEditDialog(true);
  };

  const openEditDialog = (frame: Frame) => {
    setEditingFrame(frame);
    setFormData({
      modelName: frame.modelName || '',
      sku: frame.sku || '',
      brand: frame.brand || '',
      category: frame.category || '',
      color: frame.color || '',
      size: frame.size || '',
      price: frame.price?.toString() || '',
      image1Url: frame.image1Url || '',
      image2Url: frame.image2Url || '',
      image3Url: frame.image3Url || '',
      image4Url: frame.image4Url || '',
      isActive: frame.isActive,
    });
    setImage1File(null);
    setImage2File(null);
    setImage3File(null);
    setImage4File(null);
    setImage1Preview(frame.image1Url ? client.storage.getFullUrl(frame.image1Url) : '');
    setImage2Preview(frame.image2Url ? client.storage.getFullUrl(frame.image2Url) : '');
    setImage3Preview(frame.image3Url ? client.storage.getFullUrl(frame.image3Url) : '');
    setImage4Preview(frame.image4Url ? client.storage.getFullUrl(frame.image4Url) : '');
    setCreateEditDialog(true);
  };

  const openViewDialog = (frame: Frame) => {
    setSelectedFrame(frame);
    setViewDialog(true);
  };

  const openDeleteDialog = (frame: Frame) => {
    setFrameToDelete(frame);
    setDeleteDialog(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2 | 3 | 4) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      switch (imageNumber) {
        case 1:
          setImage1File(file);
          setImage1Preview(preview);
          break;
        case 2:
          setImage2File(file);
          setImage2Preview(preview);
          break;
        case 3:
          setImage3File(file);
          setImage3Preview(preview);
          break;
        case 4:
          setImage4File(file);
          setImage4Preview(preview);
          break;
      }
    }
  };

  const removeImage = (imageNumber: 1 | 2 | 3 | 4) => {
    switch (imageNumber) {
      case 1:
        setImage1File(null);
        setImage1Preview('');
        setFormData({ ...formData, image1Url: '' });
        break;
      case 2:
        setImage2File(null);
        setImage2Preview('');
        setFormData({ ...formData, image2Url: '' });
        break;
      case 3:
        setImage3File(null);
        setImage3Preview('');
        setFormData({ ...formData, image3Url: '' });
        break;
      case 4:
        setImage4File(null);
        setImage4Preview('');
        setFormData({ ...formData, image4Url: '' });
        break;
    }
  };

  const handleSave = async () => {
    if (!formData.modelName) {
      toast.error('Product name is required');
      return;
    }

    setSaving(true);
    try {
      let image1Url = formData.image1Url;
      let image2Url = formData.image2Url;
      let image3Url = formData.image3Url;
      let image4Url = formData.image4Url;

      setUploadingImage(true);

      // Upload images if new files were selected
      if (image1File) {
        const result = await client.storage.upload({ file: image1File, folder: 'frames' });
        image1Url = result.data?.url || '';
      }

      if (image2File) {
        const result = await client.storage.upload({ file: image2File, folder: 'frames' });
        image2Url = result.data?.url || '';
      }

      if (image3File) {
        const result = await client.storage.upload({ file: image3File, folder: 'frames' });
        image3Url = result.data?.url || '';
      }

      if (image4File) {
        const result = await client.storage.upload({ file: image4File, folder: 'frames' });
        image4Url = result.data?.url || '';
      }

      setUploadingImage(false);

      const data = {
        modelName: formData.modelName,
        sku: formData.sku || null,
        brand: formData.brand || null,
        category: formData.category || null,
        color: formData.color || null,
        size: formData.size || null,
        price: parseFloat(formData.price) || 149,
        image1Url: image1Url || null,
        image2Url: image2Url || null,
        image3Url: image3Url || null,
        image4Url: image4Url || null,
        isActive: formData.isActive,
      };

      if (editingFrame) {
        await client.entities.frames.update({ id: editingFrame.id, data });
        toast.success('Product updated successfully');
      } else {
        await client.entities.frames.create({ data });
        toast.success('Product created successfully');
      }

      setCreateEditDialog(false);
      setImage1File(null);
      setImage2File(null);
      setImage3File(null);
      setImage4File(null);
      setImage1Preview('');
      setImage2Preview('');
      setImage3Preview('');
      setImage4Preview('');
      fetchFrames();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save product');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!frameToDelete) return;

    try {
      await client.entities.frames.delete({ id: frameToDelete.id });
      toast.success('Product deleted successfully');
      setDeleteDialog(false);
      fetchFrames();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete product');
    }
  };

  const filtered = frames.filter((f) => {
    const query = searchQuery.toLowerCase();
    return (
      f.modelName?.toLowerCase().includes(query) ||
      f.sku?.toLowerCase().includes(query) ||
      f.brand?.toLowerCase().includes(query) ||
      f.category?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(totalFrames / itemsPerPage);

  // Get category and brand names for select dropdowns
  const categoryNames = categories.map(c => c.name);
  const brandNames = brands.map(b => b.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
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
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/manager/frames" 
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white transition-all"
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
                  <DropdownMenuItem onClick={() => navigate('/manager')} className="rounded-lg cursor-pointer hover:bg-white/10">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Product Catalog</h1>
            </div>
            <p className="text-gray-400">Manage your safety eyewear products</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setCatalogDialog(true)}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Catalog
            </Button>
            <Button
              onClick={openCreateDialog}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 rounded-xl px-6 transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Controls Bar */}
        <Card className="mb-6 bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products by name, SKU, brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-xl">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-lg ${viewMode === 'grid' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            Showing <span className="text-white font-semibold">{filtered.length}</span> of{' '}
            <span className="text-white font-semibold">{totalFrames}</span> products
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm">
            <CardContent className="py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
                <Glasses className="h-10 w-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery ? 'Try adjusting your search query' : 'Get started by adding your first product'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={openCreateDialog}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((frame, index) => (
              <div
                key={frame.id}
                className="group perspective-1000"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="relative bg-gray-900/50 border-gray-800/50 backdrop-blur-sm overflow-hidden transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10">
                  {/* Gradient Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500" />
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>

                  {/* Image Section */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                    {frame.image1Url ? (
                      <img
                        src={client.storage.getFullUrl(frame.image1Url)}
                        alt={frame.modelName}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Glasses className="h-16 w-16 text-gray-600 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        className={`${
                          frame.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}
                      >
                        {frame.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Category Badge */}
                    {frame.category && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          {frame.category}
                        </Badge>
                      </div>
                    )}

                    {/* Quick Actions Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openViewDialog(frame)}
                        className="bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditDialog(frame)}
                        className="bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openDeleteDialog(frame)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg backdrop-blur-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="relative z-10 p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                        {frame.modelName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {frame.brand || 'No brand'} • {frame.sku || 'No SKU'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {frame.color && (
                          <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                            {frame.color}
                          </Badge>
                        )}
                        {frame.size && (
                          <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                            {frame.size}
                          </Badge>
                        )}
                      </div>
                      <span className="text-lg font-bold text-emerald-400">
                        ${frame.price?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </CardContent>

                  {/* 3D Border Effect */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-blue-500/20" />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-semibold">Product</TableHead>
                  <TableHead className="text-gray-400 font-semibold">SKU</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Brand</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Category</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Price</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Status</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((frame, index) => (
                  <TableRow
                    key={frame.id}
                    className="group border-gray-800/50 hover:bg-white/5 transition-colors"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          {frame.image1Url ? (
                            <img
                              src={client.storage.getFullUrl(frame.image1Url)}
                              alt={frame.modelName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Glasses className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {frame.modelName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {frame.color} • {frame.size}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400 font-mono text-sm">{frame.sku || '-'}</TableCell>
                    <TableCell className="text-gray-300">{frame.brand || '-'}</TableCell>
                    <TableCell>
                      {frame.category ? (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          {frame.category}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-emerald-400 font-semibold">
                      ${frame.price?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          frame.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}
                      >
                        {frame.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openViewDialog(frame)}
                          className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(frame)}
                          className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(frame)}
                          className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </main>

      {/* Catalog Management Dialog */}
      <Dialog open={catalogDialog} onOpenChange={setCatalogDialog}>
        <DialogContent className="sm:max-w-[700px] bg-gray-900 border-gray-800 text-white rounded-2xl p-0 overflow-hidden max-h-[85vh]">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-gray-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                Manage Catalog
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Add, edit, or remove categories and brands for your product catalog
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 overflow-y-auto">
            <Tabs defaultValue="categories" className="w-full">
              <TabsList className="w-full bg-gray-800/50 p-1 rounded-xl mb-6">
                <TabsTrigger
                  value="categories"
                  className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 rounded-lg transition-all"
                >
                  <Tags className="h-4 w-4 mr-2" />
                  Categories ({categories.length})
                </TabsTrigger>
                <TabsTrigger
                  value="brands"
                  className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 rounded-lg transition-all"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Brands ({brands.length})
                </TabsTrigger>
              </TabsList>

              {/* Categories Tab */}
              <TabsContent value="categories" className="mt-0">
                <Card className="bg-gray-800/30 border-gray-700/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Tags className="h-5 w-5 text-blue-400" />
                      Product Categories
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Organize your products into categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add New Category */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter new category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl"
                      />
                      <Button
                        onClick={handleAddCategory}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    {/* Categories List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="group flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-all"
                        >
                          {editingCategory?.id === category.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
                                className="flex-1 bg-gray-700 border-gray-600 text-white rounded-lg h-9"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={handleSaveCategory}
                                className="bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingCategory(null)}
                                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                  <Tags className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-white">{category.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditCategory(category)}
                                  className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteCategory(category)}
                                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                  disabled={(category.productCount || 0) > 0}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Brands Tab */}
              <TabsContent value="brands" className="mt-0">
                <Card className="bg-gray-800/30 border-gray-700/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-purple-400" />
                      Product Brands
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Manage the brands available for your products
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add New Brand */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter new brand name..."
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddBrand()}
                        className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl"
                      />
                      <Button
                        onClick={handleAddBrand}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    {/* Brands List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {brands.map((brand) => (
                        <div
                          key={brand.id}
                          className="group flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-all"
                        >
                          {editingBrand?.id === brand.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editBrandName}
                                onChange={(e) => setEditBrandName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveBrand()}
                                className="flex-1 bg-gray-700 border-gray-600 text-white rounded-lg h-9"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={handleSaveBrand}
                                className="bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingBrand(null)}
                                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/20">
                                  <Building2 className="h-4 w-4 text-purple-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-white">{brand.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {brand.productCount} {brand.productCount === 1 ? 'product' : 'products'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditBrand(brand)}
                                  className="text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteBrand(brand)}
                                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                  disabled={(brand.productCount || 0) > 0}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-800/30 border-t border-gray-800">
            <Button
              variant="ghost"
              onClick={() => setCatalogDialog(false)}
              className="text-gray-400 hover:text-white hover:bg-white/10 rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={createEditDialog} onOpenChange={setCreateEditDialog}>
        <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 text-white rounded-2xl p-0 overflow-hidden">
          {/* Dialog Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b border-gray-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                  {editingFrame ? <Edit2 className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
                </div>
                {editingFrame ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingFrame ? 'Update the product details below' : 'Fill in the product details below'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-gray-300 mb-2 block">Product Name *</Label>
                  <Input
                    value={formData.modelName}
                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                    placeholder="e.g., SafeVision Pro"
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">SKU</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g., SVP-001"
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">Price ($)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="149.99"
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">Brand</Label>
                  <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white rounded-xl focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-white rounded-xl">
                      {brandNames.map((brand) => (
                        <SelectItem key={brand} value={brand} className="focus:bg-white/10 rounded-lg">
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white rounded-xl focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-white rounded-xl">
                      {categoryNames.map((cat) => (
                        <SelectItem key={cat} value={cat} className="focus:bg-white/10 rounded-lg">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">Color</Label>
                  <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white rounded-xl focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-white rounded-xl">
                      {COLORS.map((color) => (
                        <SelectItem key={color} value={color} className="focus:bg-white/10 rounded-lg">
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">Size</Label>
                  <Select value={formData.size} onValueChange={(v) => setFormData({ ...formData, size: v })}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white rounded-xl focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-white rounded-xl">
                      {SIZES.map((size) => (
                        <SelectItem key={size} value={size} className="focus:bg-white/10 rounded-lg">
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Images Section */}
                <div className="col-span-2">
                  <Label className="text-gray-300 mb-3 block">Product Images</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Image Upload 1 */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Image 1 (Main)</p>
                      {image1Preview ? (
                        <div className="relative group">
                          <div className="relative h-28 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700">
                            <img src={image1Preview} alt="Preview 1" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <label className="cursor-pointer p-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                                <Edit2 className="h-4 w-4 text-white" />
                                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 1)} className="hidden" />
                              </label>
                              <button type="button" onClick={() => removeImage(1)} className="p-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                                <Trash2 className="h-4 w-4 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-28 bg-gray-800/50 border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl cursor-pointer transition-all group">
                          <Upload className="h-5 w-5 text-gray-400 group-hover:text-blue-400 mb-1" />
                          <span className="text-xs text-gray-400 group-hover:text-blue-400">Upload</span>
                          <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 1)} className="hidden" />
                        </label>
                      )}
                    </div>

                    {/* Image Upload 2 */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Image 2</p>
                      {image2Preview ? (
                        <div className="relative group">
                          <div className="relative h-28 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700">
                            <img src={image2Preview} alt="Preview 2" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <label className="cursor-pointer p-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                                <Edit2 className="h-4 w-4 text-white" />
                                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 2)} className="hidden" />
                              </label>
                              <button type="button" onClick={() => removeImage(2)} className="p-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                                <Trash2 className="h-4 w-4 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-28 bg-gray-800/50 border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl cursor-pointer transition-all group">
                          <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-400 mb-1" />
                          <span className="text-xs text-gray-400 group-hover:text-blue-400">Upload</span>
                          <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 2)} className="hidden" />
                        </label>
                      )}
                    </div>

                    {/* Image Upload 3 */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Image 3</p>
                      {image3Preview ? (
                        <div className="relative group">
                          <div className="relative h-28 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700">
                            <img src={image3Preview} alt="Preview 3" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <label className="cursor-pointer p-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                                <Edit2 className="h-4 w-4 text-white" />
                                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 3)} className="hidden" />
                              </label>
                              <button type="button" onClick={() => removeImage(3)} className="p-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                                <Trash2 className="h-4 w-4 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-28 bg-gray-800/50 border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl cursor-pointer transition-all group">
                          <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-400 mb-1" />
                          <span className="text-xs text-gray-400 group-hover:text-blue-400">Upload</span>
                          <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 3)} className="hidden" />
                        </label>
                      )}
                    </div>

                    {/* Image Upload 4 */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Image 4</p>
                      {image4Preview ? (
                        <div className="relative group">
                          <div className="relative h-28 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700">
                            <img src={image4Preview} alt="Preview 4" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <label className="cursor-pointer p-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                                <Edit2 className="h-4 w-4 text-white" />
                                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 4)} className="hidden" />
                              </label>
                              <button type="button" onClick={() => removeImage(4)} className="p-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                                <Trash2 className="h-4 w-4 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-28 bg-gray-800/50 border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl cursor-pointer transition-all group">
                          <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-400 mb-1" />
                          <span className="text-xs text-gray-400 group-hover:text-blue-400">Upload</span>
                          <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 4)} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                    <div>
                      <Label className="text-white font-medium">Active Status</Label>
                      <p className="text-sm text-gray-400">Make this product visible in the catalog</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                        formData.isActive ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-700'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                          formData.isActive ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-800/30 border-t border-gray-800">
            <Button
              variant="ghost"
              onClick={() => setCreateEditDialog(false)}
              className="text-gray-400 hover:text-white hover:bg-white/10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || uploadingImage}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl px-6"
            >
              {saving || uploadingImage ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {uploadingImage ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {editingFrame ? 'Update Product' : 'Create Product'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] bg-gray-900 border-gray-800 text-white rounded-2xl p-0 overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-gray-800 flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                Product Details
              </DialogTitle>
            </DialogHeader>
          </div>

          {selectedFrame && (
            <div className="p-6 overflow-y-auto flex-1">
              {/* Main Image */}
              <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden mb-6">
                {selectedFrame.image1Url ? (
                  <img
                    src={client.storage.getFullUrl(selectedFrame.image1Url)}
                    alt={selectedFrame.modelName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Glasses className="h-20 w-20 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">{selectedFrame.modelName}</h3>
                  <Badge
                    className={`${
                      selectedFrame.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}
                  >
                    {selectedFrame.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <p className="text-3xl font-bold text-emerald-400">${selectedFrame.price?.toFixed(2) || '0.00'}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-800/30 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">Brand</p>
                    <p className="font-semibold text-white text-sm">{selectedFrame.brand || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-gray-800/30 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">Category</p>
                    <p className="font-semibold text-white text-sm">{selectedFrame.category || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-gray-800/30 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">SKU</p>
                    <p className="font-semibold text-white font-mono text-sm">{selectedFrame.sku || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-gray-800/30 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">Size</p>
                    <p className="font-semibold text-white text-sm">{selectedFrame.size || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-gray-800/30 rounded-xl col-span-2">
                    <p className="text-xs text-gray-400 mb-1">Color</p>
                    <p className="font-semibold text-white text-sm">{selectedFrame.color || 'N/A'}</p>
                  </div>
                </div>

                {/* Additional Images */}
                {(selectedFrame.image2Url || selectedFrame.image3Url || selectedFrame.image4Url) && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-3">Additional Images</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedFrame.image2Url && (
                        <div className="h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden">
                          <img
                            src={client.storage.getFullUrl(selectedFrame.image2Url)}
                            alt={`${selectedFrame.modelName} - 2`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      {selectedFrame.image3Url && (
                        <div className="h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden">
                          <img
                            src={client.storage.getFullUrl(selectedFrame.image3Url)}
                            alt={`${selectedFrame.modelName} - 3`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      {selectedFrame.image4Url && (
                        <div className="h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden">
                          <img
                            src={client.storage.getFullUrl(selectedFrame.image4Url)}
                            alt={`${selectedFrame.modelName} - 4`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-4 bg-gray-800/30 border-t border-gray-800 flex-shrink-0">
            <Button
              variant="ghost"
              onClick={() => setViewDialog(false)}
              className="text-gray-400 hover:text-white hover:bg-white/10 rounded-xl"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setViewDialog(false);
                if (selectedFrame) openEditDialog(selectedFrame);
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="sm:max-w-[400px] bg-gray-900 border-gray-800 text-white rounded-2xl">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <DialogTitle className="text-xl mb-2">Delete Product?</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete <span className="text-white font-semibold">"{frameToDelete?.modelName}"</span>?
              This action cannot be undone.
            </DialogDescription>
          </div>

          <DialogFooter className="flex gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setDeleteDialog(false)}
              className="flex-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
