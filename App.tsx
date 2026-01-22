import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import CreateStory from './pages/CreateStory';
import PreviewStory from './pages/PreviewStory';
import GenerationFeed from './pages/GenerationFeed';
import About from './pages/About';
import MyCreations from './pages/MyCreations';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { api, isShopifyCustomerLoggedIn, getPendingCheckout, clearPendingCheckout } from './src/api/client';

/**
 * Component to handle pending checkout redirect
 * Must be inside Router context to use useNavigate
 */
const PendingCheckoutHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if we're already on the preview page with checkout_success
    if (location.pathname.includes('/preview/') && location.search.includes('checkout_success=true')) {
      return;
    }

    const pendingCheckout = getPendingCheckout();
    if (pendingCheckout) {
      console.log('[App] Found pending checkout, redirecting to preview:', pendingCheckout.previewId);
      clearPendingCheckout();
      navigate(`/preview/${pendingCheckout.previewId}?checkout_success=true`, { replace: true });
    }
  }, [navigate, location]);

  return null;
};

const App: React.FC = () => {
  // Link guest session creations to Shopify customer account after login
  useEffect(() => {
    const linkGuestCreations = async () => {
      if (isShopifyCustomerLoggedIn()) {
        try {
          const result = await api.linkSession();
          if (result.linked_count > 0) {
            console.log(`Linked ${result.linked_count} guest creation(s) to account`);
          }
        } catch (err) {
          // Silently fail - not critical
        }
      }
    };
    linkGuestCreations();
  }, []);

  return (
    <HashRouter>
      {/* Handle pending checkout redirect (when Shopify ignores return_to) */}
      <PendingCheckoutHandler />
      <ErrorBoundary>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                {/* Auth route - always redirect to home (Shopify handles auth) */}
                <Route path="/auth" element={<Navigate to="/" replace />} />
                {/* My Creations */}
                <Route path="/my-creations" element={<MyCreations />} />
                {/* Redirect old dashboard to my-creations */}
                <Route path="/dashboard" element={<Navigate to="/my-creations" replace />} />
                <Route path="/create" element={<CreateStory />} />
                <Route path="/generating/:jobId" element={<GenerationFeed />} />
                <Route path="/preview/:id" element={<PreviewStory />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </ErrorBoundary>
    </HashRouter>
  );
};

export default App;
