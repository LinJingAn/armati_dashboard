import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  Star,
  Grid3X3,
  LayoutGrid,
  SlidersHorizontal,
  ShoppingCart,
  Check,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import UserLayout from '@/components/UserLayout';
import { useCart } from '@/contexts/CartContext';
import client from '@/lib/api';

interface Frame {
  id: string;
  modelName: string;
  sku?: string;
  color?: string;
  size?: string;
  category?: string;
  brand?: string;
  price?: number;
  image1Url?: string;
  image2Url?: string;
  isActive: boolean;
  reviewCount?: number;
  averageRating?: number;
}

const BRANDS = ['SafeVision', '3M', 'Honeywell', 'Uvex', 'Bollé', 'MSA'];
const CATEGORIES = ['Safety Glasses', 'Prescription Safety', 'Goggles', 'Face Shields'];
const SIZES = ['Small', 'Medium', 'Large', 'XL'];
const ITEMS_PER_PAGE = 9;

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, isInCart } = useCart();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [totalFrames, setTotalFrames] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [, setHoveredFrame] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const handleAddToCart = (e: React.MouseEvent, frame: Frame) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInCart(frame.id)) {
      toast.info('Item already in cart', {
        description: 'This product is already in your shopping cart.',
      });
      return;
    }

    setAddingToCart(frame.id);
    
    addToCart({
      id: frame.id,
      frameId: frame.id,
      name: frame.modelName,
      price: frame.price || 149,
      image: frame.image1Url || '',
      color: frame.color,
      size: frame.size,
    });
    
    toast.success('Added to cart!', {
      description: `${frame.modelName} has been added to your cart.`,
    });
    
    setTimeout(() => setAddingToCart(null), 1000);
  };

  const categoryFromUrl = searchParams.get('category');
  const searchFromUrl = searchParams.get('search');
  const [searchTerm, setSearchTerm] = useState(searchFromUrl || '');

  useEffect(() => {
    if (categoryFromUrl) {
      const categoryMap: Record<string, string> = {
        'safety': 'Safety Glasses',
        'prescription': 'Prescription Safety',
        'goggles': 'Goggles',
        'shields': 'Face Shields',
      };
      const mappedCategory = categoryMap[categoryFromUrl] || categoryFromUrl;
      if (CATEGORIES.includes(mappedCategory) && !selectedCategories.includes(mappedCategory)) {
        setSelectedCategories([mappedCategory]);
      }
    }
  }, [categoryFromUrl]);

  useEffect(() => {
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
      setCurrentPage(1);
    }
  }, [searchFromUrl]);

  const fetchFrames = useCallback(async () => {
    setLoading(true);
    
    const queryParams: Record<string, unknown> = {
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
      isActive: 'true',
    };

    if (searchTerm) {
      queryParams.search = searchTerm;
    }

    if (selectedCategories.length === 1) {
      queryParams.category = selectedCategories[0];
    }

    if (selectedBrands.length === 1) {
      queryParams.brand = selectedBrands[0];
    }

    if (selectedSizes.length === 1) {
      queryParams.size = selectedSizes[0];
    }

    if (priceRange[0] > 0) {
      queryParams.minPrice = priceRange[0];
    }
    if (priceRange[1] < 500) {
      queryParams.maxPrice = priceRange[1];
    }

    const result = await client.entities.frames.query(queryParams);
    
    if (result.data) {
      let items = result.data.items as Frame[];
      
      if (selectedCategories.length > 1) {
        items = items.filter(f => f.category && selectedCategories.includes(f.category));
      }
      if (selectedBrands.length > 1) {
        items = items.filter(f => f.brand && selectedBrands.includes(f.brand));
      }
      if (selectedSizes.length > 1) {
        items = items.filter(f => f.size && selectedSizes.includes(f.size));
      }
      
      setFrames(items);
      setTotalFrames(result.data.total);
    }
    
    setLoading(false);
  }, [currentPage, selectedCategories, selectedBrands, selectedSizes, priceRange, searchTerm]);

  useEffect(() => {
    fetchFrames();
  }, [fetchFrames]);

  const totalPages = Math.ceil(totalFrames / ITEMS_PER_PAGE);

  const toggleFilter = (
    value: string,
    _selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedSizes([]);
    setPriceRange([0, 500]);
    setSearchTerm('');
    setCurrentPage(1);
    setSearchParams({});
  };

  const clearSearch = () => {
    setSearchTerm('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const hasFilters =
    selectedBrands.length > 0 ||
    selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 500 ||
    searchTerm.length > 0;

  const FilterSidebar = () => (
    <div className="space-y-6">
      {hasFilters && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearFilters} 
          className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}

      {/* Price Filter */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">Price Range</h3>
        <Slider
          value={priceRange}
          onValueChange={(value) => {
            setPriceRange(value);
            setCurrentPage(1);
          }}
          max={500}
          step={10}
          className="mb-4"
        />
        <div className="flex justify-between items-center">
          <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 shadow-sm border border-gray-200">
            ${priceRange[0]}
          </span>
          <div className="h-px flex-1 bg-gray-300 mx-2" />
          <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 shadow-sm border border-gray-200">
            ${priceRange[1]}
          </span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">Categories</h3>
        <div className="space-y-3">
          {CATEGORIES.map((category) => (
            <label key={category} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => toggleFilter(category, selectedCategories, setSelectedCategories)}
                className="rounded-md data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brand Filter */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">Brand</h3>
        <div className="space-y-3">
          {BRANDS.map((brand) => (
            <label key={brand} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleFilter(brand, selectedBrands, setSelectedBrands)}
                className="rounded-md data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Size Filter */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">Size</h3>
        <div className="grid grid-cols-2 gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleFilter(size, selectedSizes, setSelectedSizes)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedSizes.includes(size)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <UserLayout>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a0f1a] via-[#111827] to-[#0a0f1a] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-2">Safety Glasses Collection</h1>
          <p className="text-gray-400">
            Discover our premium selection of {totalFrames} safety eyewear products
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Result Indicator */}
        {searchTerm && (
          <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-700 text-sm">
                Showing results for: <span className="font-semibold">"{searchTerm}"</span>
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden rounded-xl">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {hasFilters && (
                    <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                      {selectedBrands.length + selectedCategories.length + selectedSizes.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterSidebar />
                </div>
              </SheetContent>
            </Sheet>

            <span className="text-gray-500 text-sm hidden sm:inline">
              Showing <span className="font-semibold text-gray-900">{frames.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalFrames}</span> products
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'compact' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid3X3 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'}`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border-0 shadow-lg rounded-xl overflow-hidden">
                    <CardContent className="p-5">
                      <Skeleton className="aspect-square rounded-xl mb-4" />
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : frames.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <Filter className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters to find what you're looking for.</p>
                <Button onClick={clearFilters} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'}`}>
                  {frames.map((frame, index) => (
                    <Link key={frame.id} to={`/shop/product/${frame.id}`}>
                      <Card 
                        className="group h-full bg-white border-0 shadow-lg hover:shadow-2xl rounded-xl overflow-hidden transition-all duration-500 transform hover:-translate-y-2"
                        onMouseEnter={() => setHoveredFrame(frame.id)}
                        onMouseLeave={() => setHoveredFrame(null)}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <CardContent className={viewMode === 'grid' ? 'p-5' : 'p-3'}>
                          {/* Image */}
                          <div className={`relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden ${viewMode === 'grid' ? 'aspect-square mb-4' : 'aspect-square mb-3'}`}>
                            {frame.image1Url ? (
                              <img
                                src={client.storage.getFullUrl(frame.image1Url)}
                                alt={frame.modelName}
                                className="w-full h-full object-contain p-4 transition-all duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                No Image
                              </div>
                            )}
                            
                            {/* Category Badge */}
                            {frame.category && viewMode === 'grid' && (
                              <div className="absolute top-2 left-2">
                                <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded-md">
                                  {frame.category}
                                </span>
                              </div>
                            )}
                            
                            {/* Quick Add Button */}
                            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                              <Button 
                                size="sm" 
                                className={`w-full rounded-lg shadow-lg transition-all ${
                                  isInCart(frame.id)
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : addingToCart === frame.id
                                    ? 'bg-green-600'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                }`}
                                onClick={(e) => handleAddToCart(e, frame)}
                                disabled={addingToCart === frame.id}
                              >
                                {isInCart(frame.id) ? (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    In Cart
                                  </>
                                ) : addingToCart === frame.id ? (
                                  <>
                                    <Check className="h-4 w-4 mr-2 animate-bounce" />
                                    Added!
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Quick Add
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Product Info */}
                          {frame.brand && viewMode === 'grid' && (
                            <p className="text-xs text-blue-600 font-medium mb-1">{frame.brand}</p>
                          )}
                          
                          <h3 className={`font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 ${viewMode === 'grid' ? 'text-base mb-2' : 'text-sm mb-1'}`}>
                            {frame.modelName}
                          </h3>
                          
                          {frame.color && viewMode === 'grid' && (
                            <p className="text-sm text-gray-500 mb-2">{frame.color}</p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <p className={`font-bold text-gray-900 ${viewMode === 'grid' ? 'text-lg' : 'text-base'}`}>
                              ${(frame.price || 149).toFixed(2)}
                            </p>
                            {viewMode === 'grid' && (
                              <div className="flex items-center gap-1">
                                <div className="flex items-center gap-0.5">
                                  {[1,2,3,4,5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={`h-3.5 w-3.5 ${
                                        star <= Math.round(frame.averageRating || 0)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'fill-gray-200 text-gray-200'
                                      }`} 
                                    />
                                  ))}
                                </div>
                                {(frame.reviewCount || 0) > 0 && (
                                  <span className="text-xs text-gray-500">({frame.reviewCount})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>

                        {/* 3D Glow Effect */}
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500/30" />
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-xl h-10 px-4"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page = i + 1;
                        if (totalPages > 5) {
                          if (currentPage > 3) {
                            page = currentPage - 2 + i;
                          }
                          if (currentPage > totalPages - 2) {
                            page = totalPages - 4 + i;
                          }
                        }
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-xl ${
                              currentPage === page 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-xl h-10 px-4"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
