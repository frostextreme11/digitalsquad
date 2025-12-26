import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PaymentPage from './pages/PaymentPage';
import Dashboard from './pages/Dashboard';
import ProductSalesPage from './pages/ProductSalesPage';
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
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
