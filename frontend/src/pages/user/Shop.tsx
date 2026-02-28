import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiTruck, 
  FiRefreshCcw, 
  FiHeadphones,
  FiArrowRight,
  FiShield,
  FiZap,
  FiAward,
} from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import UserLayout from '@/components/UserLayout';
import client from '@/lib/api';

interface Frame {
  id: string;
  modelName: string;
  color?: string;
  category?: string;
  brand?: string;
  price?: number;
  image1Url?: string;
  isActive: boolean;
}

const BENEFITS = [
  { icon: FiAward, text: 'Best prices guaranteed' },
  { icon: FiZap, text: 'Easy to use platform' },
  { icon: FiShield, text: '5 Years Warranty' },
  { icon: AiFillStar, text: 'Premium quality' },
];

const CATEGORIES = [
  {
    title: 'Wide Vision',
    description: 'Standard safety eyewear for everyday protection',
    image: '/safety-glasses.png',
    link: '/shop/catalog?category=safety',
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    title: 'Prescription Safety',
    description: 'Custom prescription lenses with safety rating',
    image: '/graduates-glasses.png',
    link: '/shop/catalog?category=prescription',
    gradient: 'from-purple-600 to-pink-700',
  },
  {
    title: 'Flat Lens',
    description: 'Full seal protection for hazardous environments',
    image: '/flatlens-glasses.png',
    link: '/shop/catalog?category=goggles',
    gradient: 'from-emerald-600 to-teal-700',
  },
];

const FEATURES = [
  { icon: FiTruck, title: 'Free Shipping', desc: 'On all orders over $50' },
  { icon: FiRefreshCcw, title: '30-Day Returns', desc: 'Money back guarantee' },
  { icon: FiHeadphones, title: '24/7 Support', desc: 'Expert assistance anytime' },
];

export default function Shop() {
  const [newProducts, setNewProducts] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const result = await client.entities.frames.query({ limit: 12 });
      if (result.data?.items) {
        setNewProducts((result.data.items as Frame[]).filter((f) => f.isActive));
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const itemsPerPage = 4;
  const maxIndex = Math.max(0, newProducts.length - itemsPerPage);

  const nextSlide = () => setCarouselIndex((prev) => Math.min(prev + 1, maxIndex));
  const prevSlide = () => setCarouselIndex((prev) => Math.max(prev - 1, 0));

  const visibleProducts = newProducts.slice(carouselIndex, carouselIndex + itemsPerPage);

  return (
    <UserLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0a0f1a] via-[#111827] to-[#0a0f1a] py-16 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Benefits Card - 3D Style */}
            <Card className="relative bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="relative p-6">
                <h3 className="font-bold text-xl text-white mb-6">Why Choose Us</h3>
                <ul className="space-y-4">
                  {BENEFITS.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <benefit.icon className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="text-gray-300 text-sm">{benefit.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Category Cards - 3D Style */}
            {CATEGORIES.map((category, i) => (
              <Link key={i} to={category.link} className="group perspective-1000">
                <Card 
                  className="relative h-full overflow-hidden border-0 bg-gray-900 transform transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-blue-500/20"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                  onMouseEnter={() => setHoveredCard(category.title)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Image */}
                  <div 
                    className="absolute inset-0 bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
                    style={{ 
                      backgroundImage: `url(${category.image})`,
                      backgroundSize: '100% 100%',
                    }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${category.gradient} opacity-75`} />
                  
                  {/* Content */}
                  <CardContent className="relative z-10 p-6 h-full flex flex-col justify-end min-h-[220px]">
                    <h3 className="font-bold text-xl text-white mb-2">{category.title}</h3>
                    <p className="text-white/80 text-sm mb-4">{category.description}</p>
                    <div className="flex items-center text-white text-sm font-medium group-hover:gap-2 transition-all">
                      <span>VIEW MORE</span>
                      <FiArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Products Section */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">New Products</h2>
            <p className="text-gray-500">Discover our latest safety eyewear collection</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardContent className="p-5">
                    <Skeleton className="aspect-square rounded-xl mb-4" />
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {visibleProducts.map((frame, index) => (
                  <Link key={frame.id} to={`/shop/product/${frame.id}`}>
                    <Card 
                      className="group h-full bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
                      style={{ 
                        animationDelay: `${index * 100}ms`,
                        transformStyle: 'preserve-3d',
                      }}
                      onMouseEnter={() => setHoveredCard(frame.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <CardContent className="p-5">
                        {/* Image Container with 3D effect */}
                        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-4 overflow-hidden">
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
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-blue-600/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
                            <span className="text-white font-medium text-sm">View Details</span>
                          </div>
                        </div>
                        
                        {/* Product Info */}
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                          {frame.modelName}
                        </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-gray-900">${(frame.price || 149).toFixed(2)}</p>
                          <div className="flex items-center gap-1">
{[1,2,3,4,5].map((star) => (
                                              <AiFillStar key={star} className="h-3 w-3 text-yellow-400" />
                                            ))}
                          </div>
                        </div>
                      </CardContent>

                      {/* 3D Border Effect */}
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute inset-0 rounded-xl border-2 border-blue-500/50" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Carousel Controls */}
              {newProducts.length > itemsPerPage && (
                <div className="flex justify-center items-center gap-4 mt-10">
                  <button
                    onClick={prevSlide}
                    disabled={carouselIndex === 0}
                    className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 border border-gray-100"
                  >
                    <FiChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: Math.ceil(newProducts.length / itemsPerPage) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIndex(i * itemsPerPage)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          Math.floor(carouselIndex / itemsPerPage) === i
                            ? 'bg-blue-600 w-8'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextSlide}
                    disabled={carouselIndex >= maxIndex}
                    className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 border border-gray-100"
                  >
                    <FiChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                </div>
              )}

              {/* View All Button */}
              <div className="text-center mt-10">
                <Link to="/shop/catalog">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:scale-105">
                    View All Products
                    <FiArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, i) => (
              <div 
                key={i} 
                className="group flex items-center gap-5 p-6 rounded-2xl bg-gray-50 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
