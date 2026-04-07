
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ThemeType, Theme } from '../types';
import { THEMES } from '../constants';
import { Sparkles, MessageCircle } from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';
import { trackThemeSelected, trackFunnelStep } from '../src/services/analytics';

// Responsive CSS to override Shopify theme conflicts
const ResponsiveStyles = () => (
  <style>{`
    #sg-divider-1, #sg-divider-2 { display: none !important; }
    @media (min-width: 768px) {
      #sg-divider-1, #sg-divider-2 { display: block !important; }
    }
    @keyframes float-gentle {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    .animate-float-gentle {
      animation: float-gentle 3s ease-in-out infinite;
    }
    @keyframes float-gentle-delayed {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }
    .animate-float-gentle-delayed {
      animation: float-gentle-delayed 3.5s ease-in-out 0.5s infinite;
    }
    @keyframes sparkle-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    .animate-sparkle {
      animation: sparkle-pulse 2s ease-in-out infinite;
    }
  `}</style>
);

const Home: React.FC = () => {
  const navigate = useNavigate();

  // Initialize with the "In-Code" stored covers from constants
  const [covers] = useState<Record<ThemeType, string>>(
    THEMES.reduce((acc, theme) => {
      acc[theme.id] = theme.defaultCover;
      return acc;
    }, {} as Record<ThemeType, string>)
  );

  // Track landing page funnel step
  const landingTracked = useRef(false);
  useEffect(() => {
    if (!landingTracked.current) {
      trackFunnelStep('landing');
      landingTracked.current = true;
    }
  }, []);

  // Navigate to create page with selected theme
  const handleThemeSelect = (themeId: ThemeType) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (theme) {
      trackThemeSelected(themeId, theme.title);
      trackFunnelStep('theme_selected', { theme_id: themeId, theme_name: theme.title });
    }
    navigate("/create", { state: { selectedTheme: themeId } });
  };

  const handleCtaClick = () => {
    navigate("/create");
  };

  // Featured book = Cosmic Adventure, all remaining themes in collage
  const featuredTheme = THEMES[2];
  const collageThemes = THEMES.filter((_, i) => i !== 2);

  return (
    <>
      <ResponsiveStyles />
      <div className="bg-white min-h-screen">

        {/* Trust Bar */}
        <div className="bg-white border-b border-gray-100 py-2">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              {['SM', 'JK', 'ES'].map((initials, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-pink-400 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">
                  {initials}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-0.5 text-amber-400">
              {'★★★★★'.split('').map((s, i) => <span key={i} className="text-sm">{s}</span>)}
            </div>
            <span className="text-sm text-gray-600">
              Trusted by over <strong>1,000+</strong> happy families.{' '}
              <Link to="/feedback" className="text-primary underline underline-offset-2 hover:text-primary/80">See our reviews!</Link>
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative py-8 md:py-14 bg-gradient-to-b from-softPink via-white to-purple-50/30 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-8 left-6 text-2xl animate-sparkle opacity-70">✦</div>
          <div className="absolute top-20 left-[15%] text-pink-300 text-xl animate-sparkle" style={{ animationDelay: '0.5s' }}>★</div>
          <div className="absolute top-12 right-[10%] text-primary/40 text-3xl animate-sparkle" style={{ animationDelay: '1s' }}>✧</div>
          <div className="absolute bottom-16 left-[8%] text-purple-300 text-lg animate-sparkle" style={{ animationDelay: '0.7s' }}>⋆</div>
          <div className="absolute bottom-24 right-[5%] text-amber-300 text-2xl animate-sparkle" style={{ animationDelay: '1.2s' }}>★</div>
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-80 h-80 bg-primary/8 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-80 h-80 bg-secondary/8 rounded-full blur-3xl pointer-events-none"></div>

          {/* Decorative leaves/flowers at edges - bottom left and right */}
          <div className="hidden md:block absolute bottom-0 left-0 text-5xl opacity-30 pointer-events-none">🌿</div>
          <div className="hidden md:block absolute bottom-0 right-0 text-5xl opacity-30 pointer-events-none transform -scale-x-100">🌿</div>
          <div className="hidden md:block absolute bottom-8 left-12 text-3xl opacity-25 pointer-events-none">🌸</div>
          <div className="hidden md:block absolute bottom-8 right-12 text-3xl opacity-25 pointer-events-none">🌺</div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Book Covers Layout */}
            <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10 mb-10">

              {/* Left Side - Featured Book + Annotation */}
              <div className="relative flex-shrink-0 w-full lg:w-[38%] flex flex-col items-center">
                {/* Featured Book Cover */}
                <div className="w-52 sm:w-60 md:w-64 transform -rotate-3 hover:rotate-0 transition-transform duration-500 animate-float-gentle">
                  <div className="rounded-xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-white">
                    <OptimizedImage
                      src={featuredTheme.defaultCover}
                      alt={`${featuredTheme.title} - featured storybook cover`}
                      aspectRatio="4/5"
                      priority={true}
                      width={320}
                      height={400}
                      fetchPriority="high"
                    />
                  </div>
                  {/* Price Badge */}
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-lg text-xs font-heading text-gray-800 z-10">
                    From <span className="text-primary font-bold">$19</span>
                  </div>
                </div>
                {/* "Your Photo → Their Hero!" - BELOW the image */}
                <div className="mt-3 flex items-center gap-2">
                  <p className="font-heading text-gray-700 text-sm leading-tight">
                    Your Photo <span className="text-primary font-bold">→ Their Hero!</span>
                  </p>
                </div>
              </div>

              {/* Right Side - All 7 Book Collage as grid */}
              <div className="flex-1 hidden md:block">
                <div className="grid grid-cols-4 gap-3 lg:gap-4 max-w-xl">
                  {collageThemes.map((theme, i) => {
                    const rotations = [-3, 2, -2, 3, -4, 2, -3];
                    return (
                      <div
                        key={theme.id}
                        className="relative cursor-pointer group animate-fadeInUp"
                        style={{
                          transform: `rotate(${rotations[i]}deg)`,
                          animationDelay: `${i * 0.08}s`,
                        }}
                        onClick={() => handleThemeSelect(theme.id)}
                      >
                        <div className="rounded-lg overflow-hidden shadow-xl border-2 border-white group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300">
                          <OptimizedImage
                            src={theme.defaultCover}
                            alt={`${theme.title} storybook cover`}
                            aspectRatio="4/5"
                            width={160}
                            height={200}
                            sizes="160px"
                          />
                        </div>
                        {/* Age Badge */}
                        <div className="absolute -top-2 -right-2 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[9px] font-bold text-gray-700 shadow-md z-10 border border-gray-100">
                          {theme.ageRange}
                        </div>
                        {/* Title on hover */}
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                          {theme.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile: Show small scrollable row of covers */}
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:hidden w-full">
                {THEMES.filter((_, i) => i !== 2).map((theme) => (
                  <div
                    key={theme.id}
                    className="flex-shrink-0 w-24 cursor-pointer"
                    onClick={() => handleThemeSelect(theme.id)}
                  >
                    <div className="rounded-lg overflow-hidden shadow-lg border-2 border-white">
                      <OptimizedImage
                        src={theme.defaultCover}
                        alt={`${theme.title} cover`}
                        aspectRatio="4/5"
                        width={120}
                        height={150}
                      />
                    </div>
                    <p className="text-[9px] text-gray-600 text-center mt-1 font-medium truncate">{theme.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Text & CTA */}
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading text-gray-900 leading-tight mb-5" style={{ fontStyle: 'italic' }}>
                Turn Your Child Into the Hero
                <br />
                of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Their Own Storybook</span>
              </h1>

              {/* CTA Button */}
              <button
                onClick={handleCtaClick}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white px-8 py-4 rounded-full font-heading text-lg md:text-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Generate Instant Preview - Free! (takes 2 min)
              </button>

              <p className="text-gray-500 text-sm mt-4">
                Loved by 1,000+ families worldwide - no credit card required
              </p>
            </div>
          </div>
        </section>

        {/* "Choose your story" Theme Grid */}
        <section className="py-10 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-heading text-gray-900 mb-2">Choose your story and start personalizing</h2>
              <p className="text-gray-600">{THEMES.length} magical worlds await your hero</p>
            </div>

            {/* Theme Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {THEMES.map((theme, index) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  coverUrl={covers[theme.id]}
                  onSelect={() => handleThemeSelect(theme.id)}
                  index={index}
                />
              ))}
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
                title="24 Illustrated Pages"
                description="A magical gift they'll ask to read every night"
              />
              <FeatureCard
                icon="🔒"
                title="Privacy First"
                description="Photos processed securely and never shared"
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-heading text-gray-900 mb-4">How It Works</h2>
              <p className="text-gray-600">Creating magic takes just 3 simple steps</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <span className="text-2xl">📸</span>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">1</div>
                </div>
                <h3 className="text-xl font-heading text-gray-900 mb-2">Upload a Photo</h3>
                <p className="text-gray-600 text-sm">Just one clear photo of your child's face. We handle the rest.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <span className="text-2xl">🎨</span>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center">2</div>
                </div>
                <h3 className="text-xl font-heading text-gray-900 mb-2">Choose a Theme</h3>
                <p className="text-gray-600 text-sm">Enchanted forests, magic castles, spy missions — pick your adventure!</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <span className="text-2xl">✨</span>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">3</div>
                </div>
                <h3 className="text-xl font-heading text-gray-900 mb-2">Get Your Book</h3>
                <p className="text-gray-600 text-sm">Get your storybook as a digital PDF instantly — or order a beautiful printed book delivered to your door!</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-12 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Stats Bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 mb-10">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-heading text-primary">1000+</p>
                <p className="text-gray-500 text-sm">Stories Created</p>
              </div>
              <div id="sg-divider-1" className="w-px h-12 bg-gray-200"></div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-0.5 text-amber-400 mb-1">
                  {'★★★★★'.split('').map((star, i) => (
                    <span key={i} className="text-lg">{star}</span>
                  ))}
                </div>
                <p className="text-gray-500 text-sm">Loved by Parents</p>
              </div>
              <div id="sg-divider-2" className="w-px h-12 bg-gray-200"></div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-heading text-primary">5 min</p>
                <p className="text-gray-500 text-sm">To Create a Book</p>
              </div>
            </div>

            {/* Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <TestimonialCard
                quote="My daughter's face when she saw herself as the hero... absolutely priceless! We've read it every night for a week."
                name="Sarah M."
                location="California, USA"
                avatar="SM"
                rating={4.8}
              />
              <TestimonialCard
                quote="Best birthday gift we've ever given! The quality exceeded our expectations and our son feels like a star."
                name="James K."
                location="Toronto, Canada"
                avatar="JK"
                featured={true}
                rating={5}
              />
              <TestimonialCard
                quote="Got one for my niece and now every parent in the family wants one. Already ordered our fourth book!"
                name="Emma S."
                location="London, UK"
                avatar="ES"
                rating={4.5}
              />
            </div>

            {/* Feedback CTA */}
            <div className="mt-10 bg-gradient-to-r from-primary/5 via-purple-50 to-primary/5 rounded-2xl p-6 text-center border border-primary/10">
              <p className="text-gray-700 font-heading text-lg mb-2">Got a StoryGift book?</p>
              <p className="text-gray-500 text-sm mb-4">We'd love to hear what your little one thought of their adventure!</p>
              <Link
                to="/feedback"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" />
                Share Your Magic Review
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-gray-400 text-sm">
              <span className="flex items-center gap-2">
                <span className="text-green-500">🔒</span> Secure Checkout
              </span>
              <span className="flex items-center gap-2">
                <span>✨</span> Premium Quality
              </span>
              <span className="flex items-center gap-2">
                <span>📧</span> Digital Download or <span>📦</span> Printed Book
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
  index: number;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, coverUrl, onSelect, index }) => {
  return (
    <div
      className="w-full cursor-pointer group animate-fadeInUp"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={onSelect}
    >
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary/20 hover:-translate-y-1 active:scale-[0.98]">
        {/* Cover Image */}
        <div className="relative overflow-hidden bg-gray-100">
          <OptimizedImage
            src={coverUrl}
            alt={`Cover illustration for ${theme.title} adventure story`}
            aspectRatio="4/3"
            className="transition-transform duration-500 group-hover:scale-105"
            priority={index < 4}
            width={400}
            height={300}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
            fetchPriority={index < 2 ? "high" : "auto"}
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

          {/* CTA Button - Larger tap target for mobile */}
          <button
            className="w-full bg-gradient-to-r from-primary to-pink-400 text-white py-3 sm:py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] min-h-[48px]"
          >
            <Sparkles className="w-4 h-4" />
            Create Free Preview
          </button>

          {/* Pricing micro text */}
          <p className="text-xs text-gray-500 text-center mt-2">
            ✨ Full storybook from $19
          </p>
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
  rating?: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, name, location, avatar, featured = false, rating = 5 }) => {
  const fullStars = Math.floor(rating);
  const partial = Math.round((rating % 1) * 10) / 10; // 0, 0.5, 0.8 etc.
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border ${featured ? 'border-primary/30 ring-1 ring-primary/10' : 'border-gray-100'} hover:shadow-md transition-shadow`}>
      {/* Stars */}
      <div className="flex items-center gap-0.5 text-amber-400 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="text-sm"
            style={{
              opacity: i < fullStars ? 1 : partial > 0 && i === fullStars ? partial : 0.25,
            }}
          >★</span>
        ))}
        {rating < 5 && (
          <span className="text-xs text-amber-500 font-semibold ml-1">{rating.toFixed(1)}</span>
        )}
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
