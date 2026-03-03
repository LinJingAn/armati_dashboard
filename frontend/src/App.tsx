import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ProtectedRoute, AdminRoute, ManagerRoute } from '@/components/ProtectedRoute';
import Index from './pages/Index';
import Register from './pages/Register';
import GoogleCallback from './pages/GoogleCallback';
import VerifyEmail from './pages/VerifyEmail';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Employees from './pages/Employees';
import Users from './pages/Users';
import Orders from './pages/Orders';
import SupportTickets from './pages/SupportTickets';
import Import from './pages/Import';
import ImportLogs from './pages/ImportLogs';

import Shop from './pages/user/Shop';
import Catalog from './pages/user/Catalog';
import ProductDetail from './pages/user/ProductDetail';
import Cart from './pages/user/Cart';
import Profile from './pages/user/Profile';
import UserOrders from './pages/user/UserOrders';

import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerFrames from './pages/manager/ManagerFrames';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />

              {/* User Shop Routes */}
              <Route
                path="/shop"
                element={
                  <ProtectedRoute>
                    <Shop />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop/catalog"
                element={
                  <ProtectedRoute>
                    <Catalog />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop/product/:id"
                element={
                  <ProtectedRoute>
                    <ProductDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop/cart"
                element={
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop/orders"
                element={
                  <ProtectedRoute>
                    <UserOrders />
                  </ProtectedRoute>
                }
              />

              {/* Manager Routes - Products/Frames management only */}
              <Route
                path="/manager"
                element={
                  <ManagerRoute>
                    <ManagerDashboard />
                  </ManagerRoute>
                }
              />
              <Route
                path="/manager/frames"
                element={
                  <ManagerRoute>
                    <ManagerFrames />
                  </ManagerRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/dashboard"
                element={
                  <AdminRoute>
                    <Dashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/companies"
                element={
                  <AdminRoute>
                    <Companies />
                  </AdminRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <AdminRoute>
                    <Employees />
                  </AdminRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <AdminRoute>
                    <Users />
                  </AdminRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <AdminRoute>
                    <Orders />
                  </AdminRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <AdminRoute>
                    <SupportTickets />
                  </AdminRoute>
                }
              />
              <Route
                path="/import"
                element={
                  <AdminRoute>
                    <Import />
                  </AdminRoute>
                }
              />
              <Route
                path="/import/logs"
                element={
                  <AdminRoute>
                    <ImportLogs />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
