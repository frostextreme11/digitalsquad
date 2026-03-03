import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAffiliateTracker } from './hooks/useAffiliateTracker';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProductSalesPage = lazy(() => import('./pages/ProductSalesPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const AccessDenied = lazy(() => import('./pages/AccessDenied'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));
const BlogListPage = lazy(() => import('./pages/BlogListPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const SitemapGenerator = lazy(() => import('./pages/SitemapGenerator'));

// Fallback component while pages load
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-950">
    <div className="w-8 h-8 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
  </div>
);

function AppContent() {
  useAffiliateTracker(); // Use hook inside Router context or just generally

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/50" element={<LandingPage showBasicOnly={true} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/buy/:productId" element={<ProductSalesPage />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/admin/sitemap-generator" element={<SitemapGenerator />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
        <Toaster position="top-right" />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
