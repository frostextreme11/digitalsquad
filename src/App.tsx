import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccess from './pages/PaymentSuccess';
import Dashboard from './pages/Dashboard';
import ProductSalesPage from './pages/ProductSalesPage';
import NotFound from './pages/NotFound';
import Maintenance from './pages/Maintenance';
import AccessDenied from './pages/AccessDenied';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import { useAffiliateTracker } from './hooks/useAffiliateTracker';
import { Toaster } from 'react-hot-toast';

function AppContent() {
  useAffiliateTracker(); // Use hook inside Router context or just generally

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/update-password" element={<UpdatePasswordPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/dashboard/*" element={<Dashboard />} />
      <Route path="/buy/:productId" element={<ProductSalesPage />} />
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="/access-denied" element={<AccessDenied />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
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
