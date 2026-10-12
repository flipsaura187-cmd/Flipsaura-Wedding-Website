import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Public pages
import HomePage from "@/pages/home";
import AboutPage from "@/pages/about";
import AccountPage from "@/pages/account";
import BlogsPage from "@/pages/blogs";
import BlogDetail from "@/pages/blog-detail";
import CategoryPage from "@/pages/category";
import CheckoutPage from "@/pages/checkout";
import ContactPage from "@/pages/contact";
import ForgotPasswordPage from "@/pages/forgot-password";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ResetPasswordPage from "@/pages/reset-password";
import ProductPage from "@/pages/product";
import PrivacyPolicy from "@/pages/privacy-policy";
import RefundPolicy from "@/pages/refund-cancellation-policy";
import ShippingPolicy from "@/pages/shipping-policy";
import Terms from "@/pages/terms-of-service";
import EventsPage from "@/pages/events";
import EventDetailPage from "@/pages/event-detail";
import EventRegisterPage from "@/pages/event-register";
import EventSuccessPage from "@/pages/event-success";
import EventFailedPage from "@/pages/event-failed";

// Admin pages
import AdminLayout from "@/pages/admin/layout";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminEvents from "@/pages/admin/events";
import AdminEventForm from "@/pages/admin/event-form";
import AdminEventRegistrations from "@/pages/admin/event-registrations";
import AdminVendors from "@/pages/admin/vendors";
import AdminCategories from "@/pages/admin/categories";
import AdminItems from "@/pages/admin/items";
import AdminBookings from "@/pages/admin/bookings";
import AdminBlogs from "@/pages/admin/blogs";
import AdminBlogCreate from "@/pages/admin/blog-create";
import AdminUsers from "@/pages/admin/users";

// Vendor pages
import VendorLayout from "@/pages/vendor/layout";
import VendorDashboard from "@/pages/vendor/dashboard";
import VendorOnboardingPage from "@/pages/vendor/onboarding";
import VendorItems from "@/pages/vendor/items";
import VendorBookings from "@/pages/vendor/bookings";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <main>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/blogs/:slug" element={<BlogDetail />} />
            <Route path="/categories/:slug" element={<CategoryPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/refund-cancellation-policy" element={<RefundPolicy />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/terms-of-service" element={<Terms />} />

            {/* FlipsAura Events Public routes */}
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:slug" element={<EventDetailPage />} />
            <Route path="/events/:slug/register" element={<EventRegisterPage />} />
            <Route path="/events/registration/success" element={<EventSuccessPage />} />
            <Route path="/events/registration/payment-failed" element={<EventFailedPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="events/new" element={<AdminEventForm />} />
              <Route path="events/:id/edit" element={<AdminEventForm />} />
              <Route path="events/:id/registrations" element={<AdminEventRegistrations />} />
              <Route path="vendors" element={<AdminVendors />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="items" element={<AdminItems />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="blogs" element={<AdminBlogs />} />
              <Route path="blogs/create" element={<AdminBlogCreate />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>

            {/* Vendor routes */}
            <Route path="/vendor" element={<VendorLayout />}>
              <Route path="dashboard" element={<VendorDashboard />} />
              <Route path="onboarding" element={<VendorOnboardingPage />} />
              <Route path="items" element={<VendorItems />} />
              <Route path="bookings" element={<VendorBookings />} />
            </Route>
          </Routes>
        </main>

        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
