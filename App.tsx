import React, { useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import AnnouncementBar from './components/AnnouncementBar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './src/components/Toast';
// Eagerly load Home (first visible page) and CreateStory (next step)
import Home from './pages/Home';
import CreateStory from './pages/CreateStory';
// Lazy-load remaining pages to reduce initial bundle parse time
const PreviewStoryV2 = lazy(() => import('./pages/PreviewStoryV2'));
const GenerationFeed = lazy(() => import('./pages/GenerationFeed'));
const About = lazy(() => import('./pages/About'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const MyCreations = lazy(() => import('./pages/MyCreations'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Feedback = lazy(() => import('./pages/Feedback'));

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);
import { api, isShopifyCustomerLoggedIn, getPendingCheckout, clearPendingCheckout, getLoginRedirect, clearLoginRedirect } from './src/api/client';
import { initAnalytics, trackPageView, identifyUser } from './src/services/analytics';

/**
 * ScrollToTop - Scrolls to top on every route change
 * Fixes the issue where navigating to a new page keeps the scroll position.
 * Uses manual scroll restoration to prevent iOS Safari from overriding scrollTo(0,0).
 *
 * Multiple retry attempts to handle lazy-loaded components (GenerationFeed, etc.)
 * which need time to mount and paint before scroll position stabilizes.
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  // Disable browser scroll restoration once on mount so our explicit scrollTo
  // is never overridden by iOS Safari / Chrome on pushState navigation.
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Scroll to top function - hits all known scroll containers
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Immediate scroll
    scrollToTop();

    // Retry after next paint (~16ms) - catches fast renders
    const raf = requestAnimationFrame(() => {
      scrollToTop();
    });

    // Retry at 100ms - catches lazy-loaded component mount
    const timeout100 = setTimeout(() => {
      scrollToTop();
    }, 100);

    // Final retry at 300ms - catches slow mobile devices + momentum scrolling
    const timeout300 = setTimeout(() => {
      scrollToTop();
    }, 300);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout100);
      clearTimeout(timeout300);
    };
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
      '/refund-policy': 'Refund Policy',
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
                <Suspense fallback={<PageLoader />}>
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
                    <Route path="/refund-policy" element={<RefundPolicy />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Suspense>
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
