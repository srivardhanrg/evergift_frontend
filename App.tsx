import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import AnnouncementBar from './components/AnnouncementBar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './src/components/Toast';
import Home from './pages/Home';
import CreateStory from './pages/CreateStory';
import PreviewStoryV2 from './pages/PreviewStoryV2';
import GenerationFeed from './pages/GenerationFeed';
import About from './pages/About';
import ContactUs from './pages/ContactUs';
import MyCreations from './pages/MyCreations';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import FAQ from './pages/FAQ';
import { api, isShopifyCustomerLoggedIn, getPendingCheckout, clearPendingCheckout, getLoginRedirect, clearLoginRedirect } from './src/api/client';
import { initAnalytics, trackPageView, identifyUser } from './src/services/analytics';

/**
 * ScrollToTop - Scrolls to top on every route change
 * Fixes the issue where navigating to a new page keeps the scroll position
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

/**
 * Analytics page tracking on route changes
 */
const AnalyticsTracker: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Map routes to readable page names
    const pageNames: Record<string, string> = {
      '/': 'Home',
      '/about': 'About',
      '/create': 'Create Story',
      '/my-creations': 'My Creations',
      '/privacy-policy': 'Privacy Policy',
      '/terms-of-service': 'Terms of Service',
      '/faq': 'FAQ',
      '/contact': 'Contact Us',
    };

    let pageName = pageNames[pathname] || pathname;

    // Handle dynamic routes
    if (pathname.startsWith('/preview/')) {
      pageName = 'Preview Story';
    } else if (pathname.startsWith('/generating/')) {
      pageName = 'Generation Feed';
    }

    trackPageView(pageName, { path: pathname });
  }, [pathname]);

  return null;
};

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

/**
 * Component to handle post-login redirect
 * If user just logged in and we have a saved redirect destination, navigate there
 * Uses timestamp to prevent stale redirects (only redirects if saved within last 10 minutes)
 */
const PostLoginRedirectHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only run if user is logged in
    if (!isShopifyCustomerLoggedIn()) return;

    // Check for saved redirect destination (with timestamp validation)
    const savedRedirect = getLoginRedirect();
    if (!savedRedirect) return;

    // Clear it immediately to prevent redirect loops
    clearLoginRedirect();

    // Extract the hash route from the saved path
    // Example: /apps/zelavo#/preview/123 -> /preview/123
    const hashMatch = savedRedirect.match(/#(.+)/);
    if (hashMatch) {
      const hashRoute = hashMatch[1];
      // Only redirect if we're not already on that route
      const currentRoute = location.pathname + location.search;
      if (currentRoute !== hashRoute && !currentRoute.startsWith(hashRoute.split('?')[0])) {
        console.log('[PostLoginRedirect] Redirecting to saved destination:', hashRoute);
        navigate(hashRoute, { replace: true });
      }
    }
  }, [navigate, location]);

  return null;
};

const AnnouncementBarWrapper: React.FC = () => {
  const { pathname } = useLocation();
  if (pathname !== '/') return null;
  return <AnnouncementBar />;
};

const App: React.FC = () => {
  // Initialize analytics on app load
  useEffect(() => {
    initAnalytics();
  }, []);

  // Link guest session creations to Shopify customer account after login
  useEffect(() => {
    const linkGuestCreations = async () => {
      if (isShopifyCustomerLoggedIn()) {
        try {
          // Identify user in analytics
          const customerId = (window as any).ShopifyAnalytics?.meta?.page?.customerId;
          if (customerId) {
            identifyUser(customerId);
          }

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
      <ToastProvider>
        {/* Scroll to top on route change */}
        <ScrollToTop />
        {/* Track page views in analytics */}
        <AnalyticsTracker />
        {/* Handle pending checkout redirect (when Shopify ignores return_to) */}
        <PendingCheckoutHandler />
        {/* Handle post-login redirect to original page */}
        <PostLoginRedirectHandler />
        <ErrorBoundary>
          <div className="flex flex-col min-h-screen">
            <AnnouncementBarWrapper />
            <Navbar />
            <main className="flex-grow">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<ContactUs />} />
                  {/* Auth route - always redirect to home (Shopify handles auth) */}
                  <Route path="/auth" element={<Navigate to="/" replace />} />
                  {/* My Creations */}
                  <Route path="/my-creations" element={<MyCreations />} />
                  {/* Redirect old dashboard to my-creations */}
                  <Route path="/dashboard" element={<Navigate to="/my-creations" replace />} />
                  <Route path="/create" element={<CreateStory />} />
                  <Route path="/generating/:jobId" element={<GenerationFeed />} />
                  <Route path="/preview/:id" element={<PreviewStoryV2 />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </ErrorBoundary>
      </ToastProvider>
    </HashRouter>
  );
};

export default App;
