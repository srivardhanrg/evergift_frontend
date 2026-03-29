
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Shield, Lock, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <div className="bg-primary p-2 rounded-lg">
                <Star className="text-white w-5 h-5 fill-current" />
              </div>
              <span className="text-2xl font-heading text-gray-800">StoryGift</span>
            </Link>
            <p className="text-gray-500 mb-6 max-w-md">
              Creating magical, personalized storybooks where every child becomes the hero
              of their own adventure. Trusted by thousands of families worldwide.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-full border border-green-100">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Safe & Secure</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-full border border-blue-100">
                <Lock className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Privacy Protected</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg text-gray-800 mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-500 hover:text-primary transition font-medium">
                  Create Story
                </Link>
              </li>
              <li>
                <Link to="/my-creations" className="text-gray-500 hover:text-primary transition font-medium">
                  My Creations
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-500 hover:text-primary transition font-medium">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="font-heading text-lg text-gray-800 mb-6">Support & Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/contact" className="text-gray-500 hover:text-primary transition font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-500 hover:text-primary transition font-medium">
                  FAQ
                </Link>
              </li>
              <li className="pt-4">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Legal</span>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-gray-500 hover:text-primary transition font-medium">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-gray-500 hover:text-primary transition font-medium">Terms of Service</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-500 text-sm">
                © {currentYear} StoryGift. All rights reserved.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Operated by Juvi Labs LLC
              </p>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-primary fill-current mx-1" />
              <span>for little dreamers everywhere</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
