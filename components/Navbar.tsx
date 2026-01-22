
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Star, User as UserIcon, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { isShopifyCustomerLoggedIn, getShopifyCustomerContext } from '../src/api/client';

// Get Shopify login URL - redirects to Shopify's customer account login
const getShopifyLoginUrl = (): string => {
  if (typeof window === 'undefined') return '/account/login';
  const shopDomain = getShopifyCustomerContext().shopDomain;
  if (shopDomain) {
    return `https://${shopDomain}/account/login`;
  }
  // Fallback for local development
  return '/account/login';
};

// Get Shopify logout URL
const getShopifyLogoutUrl = (): string => {
  if (typeof window === 'undefined') return '/account/logout';
  const shopDomain = getShopifyCustomerContext().shopDomain;
  if (shopDomain) {
    return `https://${shopDomain}/account/logout`;
  }
  return '/account/logout';
};

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check Shopify login status
  const isLoggedIn = isShopifyCustomerLoggedIn();
  const shopDomain = getShopifyCustomerContext().shopDomain || 'storygift-2061.myshopify.com';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Critical CSS to override Shopify theme conflicts */}
      <style>{`
        #sg-desktop-nav { display: none !important; }
        #sg-mobile-nav { display: flex !important; }
        #sg-mobile-dropdown { display: block !important; }
        @media (min-width: 768px) {
          #sg-desktop-nav { display: flex !important; }
          #sg-mobile-nav { display: none !important; }
          #sg-mobile-dropdown { display: none !important; }
        }
      `}</style>

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2" aria-label="StoryGift home">
              <div className="bg-primary p-1.5 sm:p-2 rounded-lg">
                <Star className="text-white w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              </div>
              <span className="text-xl sm:text-2xl font-heading text-gray-900 tracking-tight">StoryGift</span>
            </Link>

            {/* Desktop Navigation */}
            <div id="sg-desktop-nav" className="items-center space-x-6">
              <Link to="/" className="text-gray-900 hover:text-primary transition font-medium">Home</Link>
              <Link to="/about" className="text-gray-900 hover:text-primary transition font-medium">About</Link>
              <Link to="/my-creations" className="flex items-center space-x-1 text-gray-900 hover:text-primary transition font-medium">
                <LayoutDashboard className="w-4 h-4" />
                <span>My Creations</span>
              </Link>

              {/* Auth Button / Account Dropdown */}
              {isLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                    className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full transition"
                    aria-label="Account menu"
                    aria-expanded={accountDropdownOpen}
                  >
                    <UserIcon className="w-5 h-5 text-gray-600" />
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${accountDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Account Dropdown */}
                  {accountDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <a
                        href={`https://${shopDomain}/account`}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>My Account</span>
                      </a>
                      <Link
                        to="/my-creations"
                        onClick={() => setAccountDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>My Creations</span>
                      </Link>
                      <hr className="my-2 border-gray-100" />
                      <a
                        href={getShopifyLogoutUrl()}
                        className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <a
                  href={getShopifyLoginUrl()}
                  className="flex items-center gap-2 bg-secondary text-white px-5 py-2 rounded-full font-bold hover:bg-opacity-90 transition shadow-sm"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Login</span>
                </a>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div id="sg-mobile-nav" className="items-center gap-3">
              {isLoggedIn && (
                <a
                  href={`https://${getShopifyCustomerContext().shopDomain || 'storygift-2061.myshopify.com'}/account`}
                  className="flex items-center justify-center w-9 h-9 bg-gray-100 rounded-full"
                >
                  <UserIcon className="w-4 h-4 text-gray-600" />
                </a>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div id="sg-mobile-dropdown" className="border-t border-gray-100 py-3 space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-gray-50 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="block px-3 py-2 rounded-lg text-gray-900 hover:bg-gray-50 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/my-creations"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-900 hover:bg-gray-50 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4" />
                My Creations
              </Link>
              {!isLoggedIn && (
                <a
                  href={getShopifyLoginUrl()}
                  className="block mx-3 mt-2 text-center bg-secondary text-white px-4 py-2.5 rounded-full font-bold"
                >
                  Login / Sign Up
                </a>
              )}
              {isLoggedIn && (
                <>
                  <a
                    href={`https://${shopDomain}/account`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-900 hover:bg-gray-50 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserIcon className="w-4 h-4" />
                    My Account
                  </a>
                  <hr className="my-2 border-gray-100 mx-3" />
                  <a
                    href={getShopifyLogoutUrl()}
                    className="flex items-center gap-2 mx-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
