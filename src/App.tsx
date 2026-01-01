import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PaymentPage from './pages/PaymentPage';
import Dashboard from './pages/Dashboard';
import ProductSalesPage from './pages/ProductSalesPage';
import NotFound from './pages/NotFound';
import Maintenance from './pages/Maintenance';
import AccessDenied from './pages/AccessDenied';
import { useAffiliateTracker } from './hooks/useAffiliateTracker';

function AppContent() {
  useAffiliateTracker(); // Use hook inside Router context or just generally

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/payment" element={<PaymentPage />} />
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
      </Router>
    </ErrorBoundary>
  );
}

export default App;
