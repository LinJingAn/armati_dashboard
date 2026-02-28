import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck,
  Truck,
  CreditCard,
  Gift,
  ChevronLeft,
  Lock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import UserLayout from '@/components/UserLayout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import client from '@/lib/api';

export default function Cart() {
  const navigate = useNavigate();
  const { items, total, itemCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please login to checkout');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsCheckingOut(true);
    try {
      const orderItems = items.map((item) => ({
        frameId: item.frameId,
        quantity: item.quantity,
        price: item.price,
        color: item.color || null,
        size: item.size || null,
      }));

      const result = await client.userOrders.create({
        items: orderItems,
        paymentMethod: 'card',
      });

      if (result.error) {
        toast.error(result.error || 'Failed to place order');
        return;
      }

      toast.success('Order placed successfully! Redirecting to orders...');
      clearCart();
      navigate('/shop/orders');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <UserLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
            <p className="text-gray-500 mb-8">
              Looks like you haven't added any items to your cart yet. Let's change that!
            </p>
            <Link to="/shop/catalog">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-105 transition-all"
              >
                Explore Products
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a0f1a] via-[#111827] to-[#0a0f1a] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-2">Shopping Cart</h1>
          <p className="text-gray-400">{itemCount} items in your cart</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Back Link */}
            <Link 
              to="/shop/catalog" 
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Continue Shopping
            </Link>

            {items.map((item, index) => (
              <Card 
                key={item.id} 
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex gap-5">
                    {/* Image */}
                    <div className="w-28 h-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                      {item.image ? (
                        <img
                          src={client.storage.getFullUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/shop/product/${item.frameId}`}
                        className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-1 transition-colors"
                      >
                        {item.name}
                      </Link>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.color && (
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-600">
                            {item.color}
                          </span>
                        )}
                        {item.size && (
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-600">
                            {item.size}
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-gray-900 mt-3">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        onClick={() => {
                          removeFromCart(item.id);
                          toast.success('Item removed from cart');
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-white"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-10 text-center font-semibold text-gray-900">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-white"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Clear Cart */}
            <div className="flex justify-end pt-2">
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                onClick={() => {
                  clearCart();
                  toast.success('Cart cleared');
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="border-0 shadow-xl rounded-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({itemCount} items)</span>
                    <span className="font-medium">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-green-600 font-medium">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax (10%)</span>
                    <span className="font-medium">${(total * 0.1).toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">${(total * 1.1).toFixed(2)}</span>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl h-12 text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed" 
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Secure Checkout
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    SSL Encrypted & Secure Payment
                  </p>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <Card className="border-0 shadow-lg rounded-xl">
                <CardContent className="p-5">
                  <div className="space-y-4">
                    {[
                      { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
                      { icon: CreditCard, title: 'Secure Payment', desc: 'All cards accepted' },
                      { icon: Gift, title: 'Easy Returns', desc: '30-day money back' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <item.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
