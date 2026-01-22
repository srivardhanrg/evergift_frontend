
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeType, Theme } from '../types';
import { THEMES } from '../constants';
import { ChevronLeft, ChevronRight, Sparkles, Tag } from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';

// Responsive CSS to override Shopify theme conflicts
const ResponsiveStyles = () => (
  <style>{`
    #sg-scroll-left, #sg-scroll-right { display: none !important; }
    #sg-divider-1, #sg-divider-2 { display: none !important; }
    @media (min-width: 640px) {
      #sg-scroll-left, #sg-scroll-right { display: flex !important; }
    }
    @media (min-width: 768px) {
      #sg-divider-1, #sg-divider-2 { display: block !important; }
    }
  `}</style>
);

const Home: React.FC = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with the "In-Code" stored covers from constants
  const [covers] = useState<Record<ThemeType, string>>(
    THEMES.reduce((acc, theme) => {
      acc[theme.id] = theme.defaultCover;
      return acc;
    }, {} as Record<ThemeType, string>)
  );

  // Navigate to create page with selected theme
  const handleThemeSelect = (themeId: ThemeType) => {
    navigate("/create", { state: { selectedTheme: themeId } });
  };

  // Carousel scroll handlers
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Approximate card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
    <ResponsiveStyles />
    <div className="bg-white min-h-screen">
      {/* Compressed Hero Section */}
      <section className="relative py-10 bg-gradient-to-br from-softPink via-white to-purple-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-black text-primary mb-4 uppercase tracking-[0.15em] shadow-sm border border-primary/10">
              ✨ AI-Powered Storybooks
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading text-gray-900 leading-tight mb-4">
              Your Child as the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Hero</span>
            </h1>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Choose an adventure below and watch AI create a personalized storybook with your child as the star.
            </p>
          </div>
        </div>

        {/* Subtle background decorations */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>
      </section>

      {/* Netflix-Style Horizontal Theme Carousel */}
      <section className="py-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading text-gray-900">Pick Your Adventure</h2>
              <p className="text-gray-600 text-sm mt-1">{THEMES.length} magical worlds await your hero</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-primary font-semibold text-xs sm:text-sm bg-primary/5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-primary/10">
                <Sparkles className="w-4 h-4" />
                ₹599 Complete Book
              </span>
            </div>
          </div>

          {/* Carousel Container */}
          <div className="relative group">
            {/* Left Arrow */}
            <button
              id="sg-scroll-left"
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/95 backdrop-blur-sm rounded-full shadow-lg items-center justify-center text-gray-700 hover:text-primary hover:scale-110 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Scrollable Cards */}
            <div
              ref={scrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-5 pb-4 px-1"
              style={{ scrollPaddingLeft: '4px', scrollPaddingRight: '4px' }}
            >
              {THEMES.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  coverUrl={covers[theme.id]}
                  onSelect={() => handleThemeSelect(theme.id)}
                />
              ))}
            </div>

            {/* Right Arrow */}
            <button
              id="sg-scroll-right"
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/95 backdrop-blur-sm rounded-full shadow-lg items-center justify-center text-gray-700 hover:text-primary hover:scale-110 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Quick Features Strip */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="🎨"
              title="AI Illustrations"
              description="Every page features unique art with your child's likeness"
            />
            <FeatureCard
              icon="📖"
              title="20+ Pages"
              description="A complete story arc with beginning, adventure, and happy ending"
            />
            <FeatureCard
              icon="🔒"
              title="Privacy First"
              description="Photos processed securely and never shared"
            />
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 mb-10">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-heading text-primary">2,847+</p>
              <p className="text-gray-500 text-sm">Stories Created</p>
            </div>
            <div id="sg-divider-1" className="w-px h-12 bg-gray-200"></div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5 text-amber-400 mb-1">
                {'★★★★★'.split('').map((star, i) => (
                  <span key={i} className="text-lg">{star}</span>
                ))}
              </div>
              <p className="text-gray-500 text-sm">4.9 Parent Rating</p>
            </div>
            <div id="sg-divider-2" className="w-px h-12 bg-gray-200"></div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-heading text-primary">30 sec</p>
              <p className="text-gray-500 text-sm">To Start Creating</p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <TestimonialCard
              quote="My daughter's face when she saw herself as the hero... priceless! We've read it every night for a week."
              name="Priya M."
              location="Mumbai"
              avatar="PM"
            />
            <TestimonialCard
              quote="Best birthday gift ever! The quality is amazing and my son thinks he's famous now 😂"
              name="Rahul K."
              location="Bangalore"
              avatar="RK"
              featured={true}
            />
            <TestimonialCard
              quote="Ordered for my niece and now every parent in the family wants one. Ordering my 4th book!"
              name="Ananya S."
              location="Delhi"
              avatar="AS"
            />
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-gray-400 text-sm">
            <span className="flex items-center gap-2">
              <span className="text-green-500">🔒</span> Secure Payments
            </span>
            <span className="flex items-center gap-2">
              <span>🇮🇳</span> Made in India
            </span>
            <span className="flex items-center gap-2">
              <span>📧</span> Instant PDF Delivery
            </span>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

// Theme Card Component
interface ThemeCardProps {
  theme: Theme;
  coverUrl: string;
  onSelect: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, coverUrl, onSelect }) => {
  return (
    <div
      className="flex-shrink-0 w-64 sm:w-72 snap-start cursor-pointer group"
      onClick={onSelect}
    >
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary/20 hover:-translate-y-1">
        {/* Cover Image */}
        <div className="relative overflow-hidden bg-gray-100">
          <OptimizedImage
            src={coverUrl}
            alt={`Cover illustration for ${theme.title} adventure story`}
            aspectRatio="4/3"
            className="transition-transform duration-500 group-hover:scale-105"
            priority={true}
          />

          {/* Age Badge */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm z-10">
            {theme.ageRange}
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

          {/* Icon */}
          <div className="absolute bottom-3 left-3 text-3xl drop-shadow-lg group-hover:scale-110 transition-transform z-10">
            {theme.icon}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4">
          <h3 className="text-lg font-heading text-gray-900 mb-1">{theme.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">{theme.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {theme.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          {/* CTA Button */}
          <button
            className="w-full bg-gradient-to-r from-primary to-pink-400 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all group-hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            Create Preview
          </button>
        </div>
      </div>
    </div>
  );
};

// Feature Card Component
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
      <div className="text-3xl">{icon}</div>
      <div>
        <h4 className="font-heading text-gray-900 mb-1">{title}</h4>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

// Testimonial Card Component
interface TestimonialCardProps {
  quote: string;
  name: string;
  location: string;
  avatar: string;
  featured?: boolean;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, name, location, avatar, featured = false }) => {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border ${featured ? 'border-primary/30 ring-1 ring-primary/10' : 'border-gray-100'} hover:shadow-md transition-shadow`}>
      {/* Stars */}
      <div className="flex items-center gap-0.5 text-amber-400 mb-3">
        {'★★★★★'.split('').map((star, i) => (
          <span key={i} className="text-sm">{star}</span>
        ))}
      </div>

      {/* Quote */}
      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        "{quote}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${featured ? 'bg-gradient-to-br from-primary to-pink-400' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
          {avatar}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{name}</p>
          <p className="text-gray-400 text-xs">{location}</p>
        </div>
        {featured && (
          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            Verified
          </span>
        )}
      </div>
    </div>
  );
};

export default Home;

