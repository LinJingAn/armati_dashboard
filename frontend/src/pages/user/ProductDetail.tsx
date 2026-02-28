import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Check, 
  ChevronLeft,
  ChevronRight,
  Star,
  Shield,
  Truck,
  RotateCcw,
  Heart,
  Share2,
  Zap,
  Award,
  Package,
  ThumbsUp,
  User,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import UserLayout from '@/components/UserLayout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import client, { Review, ReviewStats } from '@/lib/api';

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
  image3Url?: string;
  image4Url?: string;
  isActive: boolean;
}

const FEATURES = [
  { icon: Shield, label: 'ANSI Z87.1+ Certified' },
  { icon: Zap, label: 'Impact Resistant' },
  { icon: Award, label: '5-Year Warranty' },
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [frame, setFrame] = useState<Frame | null>(null);
  const [relatedFrames, setRelatedFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [prevImage, setPrevImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { addToCart, isInCart } = useCart();

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());

  const handleImageChange = useCallback((newIndex: number) => {
    setPrevImage(selectedImage);
    setSelectedImage(newIndex);
  }, [selectedImage]);

  useEffect(() => {
    const fetchFrame = async () => {
      if (!id) return;
      setLoading(true);
      const result = await client.entities.frames.get(id);
      if (result.data) {
        setFrame(result.data as Frame);
      }

      const allFrames = await client.entities.frames.query({ limit: 10 });
      if (allFrames.data?.items) {
        setRelatedFrames(
          (allFrames.data.items as Frame[])
            .filter((f) => f.id !== id && f.isActive)
            .slice(0, 4)
        );
      }
      setLoading(false);
    };
    fetchFrame();
    setSelectedImage(0);
    setQuantity(1);
  }, [id]);

  // Fetch reviews for the product
  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const result = await client.reviews.getByFrameId(id, { limit: 50, sort: '-createdAt' });
      if (result.data) {
        setReviews(result.data.items);
        setReviewStats(result.data.stats);
      }
      
      // Check if user has already reviewed this product
      if (user) {
        const userReviewResult = await client.reviews.getUserReview(id);
        if (userReviewResult.data?.review) {
          setUserReview(userReviewResult.data.review);
        } else {
          setUserReview(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
    setReviewsLoading(false);
  }, [id, user]);

  useEffect(() => {
    if (id) {
      fetchReviews();
    }
  }, [id, fetchReviews]);

  // Reset review form when dialog closes
  useEffect(() => {
    if (!isReviewDialogOpen) {
      setEditingReview(null);
      setReviewFormData({ rating: 5, title: '', comment: '' });
    }
  }, [isReviewDialogOpen]);

  const handleOpenReviewDialog = (existingReview?: Review) => {
    if (!user) {
      toast.error('Please sign in to write a review');
      return;
    }
    if (existingReview) {
      setEditingReview(existingReview);
      setReviewFormData({
        rating: existingReview.rating,
        title: existingReview.title || '',
        comment: existingReview.comment || '',
      });
    }
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!id || !user) return;
    
    if (reviewFormData.rating < 1 || reviewFormData.rating > 5) {
      toast.error('Please select a rating between 1 and 5');
      return;
    }

    setIsSubmittingReview(true);
    try {
      if (editingReview) {
        const result = await client.reviews.update(editingReview.id, {
          rating: reviewFormData.rating,
          title: reviewFormData.title || undefined,
          comment: reviewFormData.comment || undefined,
        });
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Review updated successfully!');
          setIsReviewDialogOpen(false);
          fetchReviews();
        }
      } else {
        const result = await client.reviews.create({
          frameId: id,
          rating: reviewFormData.rating,
          title: reviewFormData.title || undefined,
          comment: reviewFormData.comment || undefined,
        });
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Thank you for your review!');
          setIsReviewDialogOpen(false);
          fetchReviews();
        }
      }
    } catch (error) {
      toast.error('Failed to submit review');
    }
    setIsSubmittingReview(false);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete your review?')) return;
    
    const result = await client.reviews.delete(reviewId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Review deleted');
      fetchReviews();
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (helpfulClicked.has(reviewId)) return;
    
    const result = await client.reviews.markHelpful(reviewId);
    if (result.data) {
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful: result.data!.helpful } : r));
      setHelpfulClicked(prev => new Set(prev).add(reviewId));
      toast.success('Thanks for your feedback!');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md', interactive = false, onChange?: (r: number) => void) => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-8 w-8';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <Star
              className={`${sizeClass} ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const images = frame
    ? [frame.image1Url, frame.image2Url, frame.image3Url, frame.image4Url].filter(Boolean)
    : [];

  // Auto-carousel effect - advances every 2 seconds
  const nextImage = useCallback(() => {
    if (images.length > 1) {
      const next = (selectedImage + 1) % images.length;
      handleImageChange(next);
    }
  }, [images.length, selectedImage, handleImageChange]);

  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;

    const interval = setInterval(() => {
      nextImage();
    }, 2000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length, nextImage]);

  const handleAddToCart = () => {
    if (!frame) return;
    addToCart(
      {
        id: frame.id,
        frameId: frame.id,
        name: frame.modelName,
        price: frame.price || 149,
        image: frame.image1Url || '',
        color: frame.color,
        size: frame.size,
      },
      quantity
    );
    toast.success(`Added ${quantity} item(s) to cart`, {
      description: `${frame.modelName} has been added to your shopping cart.`,
    });
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="flex gap-3">
                <Skeleton className="w-24 h-24 rounded-xl" />
                <Skeleton className="w-24 h-24 rounded-xl" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (!frame) {
    return (
      <UserLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Link to="/shop/catalog">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Catalog
              </Button>
            </Link>
          </div>
        </div>
      </UserLayout>
    );
  }

  const alreadyInCart = isInCart(frame.id);

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Link
          to="/shop/catalog"
          className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 mb-8 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Catalog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery with Carousel */}
          <div className="space-y-4">
            <Card 
              className="border-0 shadow-xl rounded-2xl overflow-hidden"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <CardContent className="p-0">
                <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative group">
                  {/* Main Image with Slide Animation - Always flows left */}
                  <div className="w-full h-full relative overflow-hidden">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                          selectedImage === idx 
                            ? 'opacity-100 translate-x-0' 
                            : idx === prevImage
                              ? 'opacity-0 -translate-x-full'
                              : 'opacity-0 translate-x-full'
                        }`}
                      >
                        <img
                          src={client.storage.getFullUrl(img as string)}
                          alt={`${frame.modelName} ${idx + 1}`}
                          className="w-full h-full object-contain p-8"
                        />
                      </div>
                    ))}
                    {images.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image Available
                      </div>
                    )}
                  </div>

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => handleImageChange(selectedImage === 0 ? images.length - 1 : selectedImage - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 backdrop-blur-sm"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => handleImageChange(selectedImage === images.length - 1 ? 0 : selectedImage + 1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 backdrop-blur-sm"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}
                  
                  {/* Quick Actions */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button 
                      onClick={() => setIsWishlisted(!isWishlisted)}
                      className={`w-10 h-10 rounded-xl shadow-lg flex items-center justify-center transition-all hover:scale-110 ${
                        isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all hover:scale-110">
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Dot Indicators */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleImageChange(idx)}
                          className={`transition-all duration-300 rounded-full ${
                            selectedImage === idx 
                              ? 'w-8 h-3 bg-blue-600' 
                              : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                          }`}
                          aria-label={`Go to image ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 justify-center">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleImageChange(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 ${
                      selectedImage === idx
                        ? 'ring-2 ring-blue-600 ring-offset-2 shadow-lg scale-105'
                        : 'border border-gray-200 hover:border-blue-400 hover:shadow-md opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={client.storage.getFullUrl(img as string)}
                      alt={`${frame.modelName} thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain p-2 bg-gray-50"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-6">
              {frame.sku && (
                <p className="text-sm text-gray-500 mb-2">SKU: {frame.sku}</p>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{frame.modelName}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-5 w-5 ${
                        star <= Math.round(reviewStats?.averageRating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => document.querySelector('[value="reviews"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}>
                  ({reviewStats?.totalReviews || 0} review{(reviewStats?.totalReviews || 0) !== 1 ? 's' : ''})
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {frame.color && (
                  <Badge className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1">{frame.color}</Badge>
                )}
                {frame.size && (
                  <Badge className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1">{frame.size}</Badge>
                )}
                <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1">In Stock</Badge>
              </div>

              <p className="text-4xl font-bold text-gray-900 mb-2">${(frame.price || 149).toFixed(2)}</p>
              <p className="text-sm text-gray-500">Tax included. Shipping calculated at checkout.</p>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-4 mb-8">
              {FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <feature.icon className="h-4 w-4 text-blue-600" />
                  {feature.label}
                </div>
              ))}
            </div>

            <p className="text-gray-600 mb-8 leading-relaxed">
              High-quality industrial safety glasses designed for maximum protection and comfort.
              Features impact-resistant polycarbonate lenses and adjustable temples for a secure fit.
            </p>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-white"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-14 text-center font-semibold text-lg">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-white"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl h-14 text-lg shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] transition-all"
                onClick={handleAddToCart}
              >
                {alreadyInCart ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Add More to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-100">
              {[
                { icon: Truck, label: 'Free Shipping', desc: 'Orders $50+' },
                { icon: RotateCcw, label: 'Easy Returns', desc: '30 Days' },
                { icon: Shield, label: 'Warranty', desc: '5 Years' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                    <item.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="description" className="w-full mt-6">
              <TabsList className="w-full bg-gray-100 rounded-xl p-1">
                <TabsTrigger value="description" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow">
                  Description
                </TabsTrigger>
                <TabsTrigger value="specs" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow">
                  Specifications
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow">
                  Reviews ({reviewStats?.totalReviews || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <div className="prose prose-sm max-w-none text-gray-600">
                  <p>
                    Experience superior eye protection with our premium safety glasses.
                    Engineered for industrial environments, these glasses combine
                    cutting-edge lens technology with ergonomic design.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" />
                      Impact-resistant polycarbonate lenses
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" />
                      99.9% UV protection
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" />
                      Anti-fog and scratch-resistant coating
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" />
                      Adjustable temples for custom fit
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" />
                      Meets ANSI Z87.1+ safety standards
                    </li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-6">
                <div className="space-y-3">
                  {[
                    { label: 'Model', value: frame.modelName },
                    { label: 'Color', value: frame.color || 'N/A' },
                    { label: 'Size', value: frame.size || 'N/A' },
                    { label: 'Lens Material', value: 'Polycarbonate' },
                    { label: 'Safety Rating', value: 'ANSI Z87.1+' },
                    { label: 'UV Protection', value: '99.9%' },
                    { label: 'Warranty', value: '5 Years' },
                  ].map((spec, i) => (
                    <div key={i} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                      <span className="text-gray-500">{spec.label}</span>
                      <span className="font-medium text-gray-900">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Review Summary */}
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Overall Rating */}
                        <div className="text-center md:text-left">
                          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            {renderStars(Math.round(reviewStats?.averageRating || 0), 'lg')}
                          </div>
                          <p className="text-3xl font-bold text-gray-900 mb-1">
                            {(reviewStats?.averageRating || 0).toFixed(1)} out of 5
                          </p>
                          <p className="text-gray-500">
                            Based on {reviewStats?.totalReviews || 0} review{(reviewStats?.totalReviews || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Rating Distribution */}
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((stars) => {
                            const count = reviewStats?.ratingDistribution?.[stars as 1|2|3|4|5] || 0;
                            const percentage = reviewStats?.totalReviews 
                              ? (count / reviewStats.totalReviews) * 100 
                              : 0;
                            return (
                              <div key={stars} className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 w-12">{stars} star</span>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-500 w-8">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Write a Review Button */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        {userReview ? (
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-emerald-600">
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-medium">You've reviewed this product</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="rounded-xl"
                                onClick={() => handleOpenReviewDialog(userReview)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Review
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteReview(userReview.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-gray-600 mb-4">Share your experience with this product</p>
                            <Button 
                              onClick={() => handleOpenReviewDialog()}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Write a Review
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reviews List */}
                    {reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <Card key={review.id} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                                    {review.user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <span className="font-semibold text-gray-900">{review.user.name}</span>
                                      {review.isVerified && (
                                        <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Verified Purchase
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      {renderStars(review.rating, 'sm')}
                                      <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                                {user?.id === review.userId && (
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={() => handleOpenReviewDialog(review)}
                                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteReview(review.id)}
                                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {review.title && (
                                <h4 className="font-semibold text-gray-900 mt-4">{review.title}</h4>
                              )}
                              
                              {review.comment && (
                                <p className="text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                              )}

                              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <button
                                  onClick={() => handleMarkHelpful(review.id)}
                                  disabled={helpfulClicked.has(review.id)}
                                  className={`flex items-center gap-2 text-sm transition-colors ${
                                    helpfulClicked.has(review.id)
                                      ? 'text-blue-600 cursor-default'
                                      : 'text-gray-500 hover:text-blue-600'
                                  }`}
                                >
                                  <ThumbsUp className={`h-4 w-4 ${helpfulClicked.has(review.id) ? 'fill-current' : ''}`} />
                                  <span>Helpful ({review.helpful})</span>
                                </button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
                        <p className="text-gray-500 mb-6">Be the first to share your experience with this product</p>
                        <Button 
                          onClick={() => handleOpenReviewDialog()}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                        >
                          Write the First Review
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Write Review Dialog */}
            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
              <DialogContent className="sm:max-w-[500px] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {editingReview ? 'Edit Your Review' : 'Write a Review'}
                  </DialogTitle>
                  <DialogDescription>
                    Share your experience with {frame.modelName}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Rating Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Your Rating *</Label>
                    <div className="flex items-center gap-2">
                      {renderStars(
                        reviewFormData.rating, 
                        'lg', 
                        true, 
                        (r) => setReviewFormData(prev => ({ ...prev, rating: r }))
                      )}
                      <span className="text-lg font-semibold text-gray-700 ml-2">
                        {reviewFormData.rating}/5
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {reviewFormData.rating === 5 && 'Excellent!'}
                      {reviewFormData.rating === 4 && 'Very Good'}
                      {reviewFormData.rating === 3 && 'Good'}
                      {reviewFormData.rating === 2 && 'Fair'}
                      {reviewFormData.rating === 1 && 'Poor'}
                    </p>
                  </div>

                  {/* Review Title */}
                  <div className="space-y-2">
                    <Label htmlFor="reviewTitle">Review Title (Optional)</Label>
                    <Input
                      id="reviewTitle"
                      placeholder="Summarize your review in a few words"
                      value={reviewFormData.title}
                      onChange={(e) => setReviewFormData(prev => ({ ...prev, title: e.target.value }))}
                      maxLength={100}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Review Comment */}
                  <div className="space-y-2">
                    <Label htmlFor="reviewComment">Your Review (Optional)</Label>
                    <Textarea
                      id="reviewComment"
                      placeholder="Tell others about your experience with this product..."
                      value={reviewFormData.comment}
                      onChange={(e) => setReviewFormData(prev => ({ ...prev, comment: e.target.value }))}
                      maxLength={1000}
                      rows={5}
                      className="rounded-xl resize-none"
                    />
                    <p className="text-xs text-gray-400 text-right">
                      {reviewFormData.comment.length}/1000
                    </p>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsReviewDialogOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                  >
                    {isSubmittingReview ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {editingReview ? 'Update Review' : 'Submit Review'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Related Products */}
        {relatedFrames.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedFrames.map((related, index) => (
                <Link key={related.id} to={`/shop/product/${related.id}`}>
                  <Card 
                    className="group h-full bg-white border-0 shadow-lg hover:shadow-xl rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-4 overflow-hidden">
                        {related.image1Url ? (
                          <img
                            src={client.storage.getFullUrl(related.image1Url)}
                            alt={related.modelName}
                            className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                            No Image
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                        {related.modelName}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-gray-900">${(related.price || 149).toFixed(2)}</p>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map((star) => (
                            <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
