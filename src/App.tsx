import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AdminProvider } from "./contexts/AdminContext";
import { UserAuthProvider } from "./contexts/UserAuthContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { WhatsAppButton } from "./components/WhatsAppButton";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import OrderForm from "./pages/OrderForm";
import OrderSuccess from "./pages/OrderSuccess";
import TrackOrder from "./pages/TrackOrder";
import RequestProduct from "./pages/RequestProduct";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminProductRequests from "./pages/admin/AdminProductRequests";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProductAnalytics from "./pages/admin/AdminProductAnalytics";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminProvider>
        <UserAuthProvider>
          <CartProvider>
            <WishlistProvider>
              <LanguageProvider>
                <Toaster />
                <Sonner />
                <WhatsAppButton />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/order/:id" element={<OrderForm />} />
                    <Route path="/order-success/:trackingId" element={<OrderSuccess />} />
                    <Route path="/track-order" element={<TrackOrder />} />
                    <Route path="/request-product" element={<RequestProduct />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/dashboard" element={<UserDashboard />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
              <Route path="/admin/products" element={<ProtectedAdminRoute><AdminProducts /></ProtectedAdminRoute>} />
              <Route path="/admin/orders" element={<ProtectedAdminRoute><AdminOrders /></ProtectedAdminRoute>} />
              <Route path="/admin/categories" element={<ProtectedAdminRoute><AdminCategories /></ProtectedAdminRoute>} />
              <Route path="/admin/banners" element={<ProtectedAdminRoute><AdminBanners /></ProtectedAdminRoute>} />
              <Route path="/admin/product-requests" element={<ProtectedAdminRoute><AdminProductRequests /></ProtectedAdminRoute>} />
              <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
              <Route path="/admin/analytics" element={<ProtectedAdminRoute><AdminProductAnalytics /></ProtectedAdminRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </LanguageProvider>
          </WishlistProvider>
        </CartProvider>
      </UserAuthProvider>
    </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
