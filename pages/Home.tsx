
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ThemeType, Theme } from '../types';
import { THEMES } from '../constants';
import { Sparkles, MessageCircle } from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';
import { trackThemeSelected, trackFunnelStep } from '../src/services/analytics';

// Transformation pairs: child photo + matching theme cover/page
const HERO_PAIRS = [
  {
    childName: 'Sofia',
    childPhoto: 'https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/LandingPage/Kids/whitegirl.png',
    themeImage: 'https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/final/d9bb9f89-c5c1-4fcf-8276-316e343280a5/cover_final.png',
    themeIndex: 0, // Enchanted Forest
  },
  {
    childName: 'Ava',
    childPhoto: 'https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/LandingPage/Kids/blackgirl.png',
    themeImage: 'https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/LandingPage/theme/Screenshot%202026-04-08%20at%201.18.09%20AM.png',
    themeIndex: 2, // Cosmic Dreamer
  },
  {
    childName: 'Liam',
    childPhoto: 'https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/LandingPage/Kids/hispanicboy.png',
    themeImage: 'https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/final/7cc4cce7-60a0-4274-bce2-3316e2e47bea/page_01.jpg',
    themeIndex: 6, // Safari Adventure
  },
  {
    childName: 'Mateo',
    childPhoto: 'https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/LandingPage/Kids/southasian.png',
    themeImage: 'https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/final/b41b5fac-83e8-4782-94b0-68cc97a8af5a/page_04.jpg',
    themeIndex: 3, // Mighty Guardian
  },
  {
    childName: 'Zara',
    childPhoto: 'https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/LandingPage/Kids/whiteboy.png',
    themeImage: 'https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/final/91b99731-c891-4258-b1c0-8e66b8f69f03/page_02.jpg',
    themeIndex: 4, // Ocean Explorer
  },
];

// Responsive CSS to override Shopify theme conflicts
const ResponsiveStyles = () => (
  <style>{`
    @font-face {
      font-family: 'Magical Neverland';
      src: url('/fonts/MagicalNeverland-Regular.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
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
    @keyframes sparkle-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    .animate-sparkle {
      animation: sparkle-pulse 2s ease-in-out infinite;
    }
    @keyframes crossfade-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-crossfade {
      animation: crossfade-in 0.6s ease-out forwards;
    }
    @keyframes draw-arrow {
      from { stroke-dashoffset: 200; }
      to { stroke-dashoffset: 0; }
    }
    .animate-draw-arrow {
      animation: draw-arrow 1s ease-out forwards;
    }
    @keyframes magic-sparkle {
      0% { transform: scale(0) rotate(0deg); opacity: 0; }
      50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
      100% { transform: scale(0) rotate(360deg); opacity: 0; }
    }
    .animate-magic-sparkle {
      animation: magic-sparkle 2s ease-in-out infinite;
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

  // Hero carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);

  // Auto-rotate hero pairs every 4 seconds
  const startAutoRotate = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        setIsTransitioning(true);
        setTimeout(() => {
          setActiveIndex(prev => (prev + 1) % HERO_PAIRS.length);
          setIsTransitioning(false);
        }, 300);
      }
    }, 2000);
  }, []);

  useEffect(() => {
    startAutoRotate();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startAutoRotate]);

  const goToSlide = (index: number) => {
    if (index === activeIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(index);
      setIsTransitioning(false);
    }, 300);
    startAutoRotate();
  };

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
    const themesSection = document.getElementById('theme-grid');
    if (themesSection) {
      themesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Current hero pair
  const currentPair = HERO_PAIRS[activeIndex];
  const currentTheme = THEMES[currentPair.themeIndex];

  return (
    <>
      <ResponsiveStyles />
      <div className="bg-white min-h-screen">

        {/* Hero Section - Photo → Book Transformation Carousel */}
        <section className="relative py-8 md:py-10 bg-gradient-to-b from-softPink via-white to-purple-50/30 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-8 left-6 text-2xl animate-sparkle opacity-70">✦</div>
          <div className="absolute top-20 left-[15%] text-pink-300 text-xl animate-sparkle" style={{ animationDelay: '0.5s' }}>★</div>
          <div className="absolute top-12 right-[10%] text-primary/40 text-3xl animate-sparkle" style={{ animationDelay: '1s' }}>✧</div>
          <div className="absolute bottom-16 left-[8%] text-purple-300 text-lg animate-sparkle" style={{ animationDelay: '0.7s' }}>⋆</div>
          <div className="absolute bottom-24 right-[5%] text-amber-300 text-2xl animate-sparkle" style={{ animationDelay: '1.2s' }}>★</div>
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-80 h-80 bg-primary/8 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-80 h-80 bg-secondary/8 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Headline FIRST - visible immediately */}
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading text-gray-900 leading-tight" style={{ fontStyle: 'italic' }}>
                Turn Your Child Into the Hero
                <br />
                of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Their Own Storybook</span>
              </h1>
            </div>

            {/* Desktop: Side-by-side Photo → Book transformation */}
            <div
              className="hidden md:flex items-center justify-center mb-6 relative"
              onMouseEnter={() => { isPausedRef.current = true; }}
              onMouseLeave={() => { isPausedRef.current = false; }}
            >
              {/* Decorative sparkles - scattered abstractly along edges */}
              <span className="absolute left-2 top-[12%] text-2xl opacity-30 pointer-events-none animate-sparkle" style={{ animationDelay: '0.2s' }}>✨</span>
              <span className="absolute left-6 top-[55%] text-3xl lg:text-4xl opacity-25 pointer-events-none animate-sparkle" style={{ animationDelay: '1.1s' }}>⭐</span>
              <span className="absolute left-1 bottom-[18%] text-lg opacity-35 pointer-events-none animate-sparkle" style={{ animationDelay: '0.6s' }}>🌟</span>
              <span className="absolute right-3 top-[8%] text-xl opacity-30 pointer-events-none animate-sparkle" style={{ animationDelay: '0.8s' }}>💫</span>
              <span className="absolute right-1 top-[42%] text-3xl opacity-20 pointer-events-none animate-sparkle" style={{ animationDelay: '0.3s' }}>✨</span>
              <span className="absolute right-5 bottom-[10%] text-2xl lg:text-3xl opacity-30 pointer-events-none animate-sparkle" style={{ animationDelay: '1.4s' }}>🌟</span>
              <span className="absolute left-10 top-[30%] text-sm opacity-25 pointer-events-none animate-sparkle" style={{ animationDelay: '1.7s' }}>⭐</span>
              <span className="absolute right-8 top-[70%] text-lg opacity-20 pointer-events-none animate-sparkle" style={{ animationDelay: '0.5s' }}>💫</span>

              {/* Left - Child Photo */}
              <div className={`transition-all duration-500 flex-shrink-0 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <div className="relative">
                  <div className="w-60 lg:w-72 rounded-2xl overflow-hidden shadow-xl border-4 border-white transform -rotate-2">
                    <OptimizedImage
                      src={currentPair.childPhoto}
                      alt={`${currentPair.childName}'s photo`}
                      aspectRatio="1/1"
                      priority={true}
                      width={360}
                      height={360}
                      fetchPriority="high"
                    />
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary/10 to-pink-100 px-4 py-1.5 rounded-full shadow-md whitespace-nowrap border border-primary/20">
                    <span className="text-xs font-heading text-gray-700">📸 Your child's photo</span>
                  </div>
                </div>
              </div>

              {/* Center - Clear curved arrow with sparkles */}
              <div className="flex flex-col items-center mx-2 lg:mx-4 flex-shrink-0" style={{ minWidth: '140px' }}>
                <svg width="160" height="100" viewBox="0 0 160 100" className="mb-1">
                  <defs>
                    <linearGradient id="arrowStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FF6B9D" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#4ECDC4" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  {/* Main curved arrow line - bold and clear */}
                  <path
                    d="M 15 70 Q 80 -5 140 50"
                    fill="none"
                    stroke="url(#arrowStroke)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {/* Bold arrowhead - large chevron shape */}
                  <path
                    d="M 125 32 L 150 52 L 128 60"
                    fill="none"
                    stroke="#4ECDC4"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                  />
                  {/* Sparkle dots along the curve */}
                  <circle cx="30" cy="48" r="3" fill="#FFE66D" opacity="0.7" />
                  <circle cx="60" cy="18" r="3.5" fill="#FF6B9D" opacity="0.5" />
                  <circle cx="95" cy="12" r="3" fill="#FFE66D" opacity="0.7" />
                  <circle cx="120" cy="25" r="3.5" fill="#FF6B9D" opacity="0.5" />
                </svg>
                {/* Magic wand circle */}
                <div className="relative -mt-6 bg-white/80 backdrop-blur-sm w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center shadow-lg border border-pink-100">
                  <span className="text-2xl lg:text-3xl">🪄</span>
                  <span className="absolute -top-1 -right-1 text-sm animate-magic-sparkle">✨</span>
                  <span className="absolute -bottom-1 -left-1 text-xs animate-magic-sparkle" style={{ animationDelay: '0.6s' }}>⭐</span>
                </div>
                <p className="text-sm font-heading text-gray-500 mt-2">A Sprinkle of Magic</p>
              </div>

              {/* Right - Book Cover / Theme page — square aspect */}
              <div className={`transition-all duration-500 flex-shrink-0 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <div className="relative">
                  <div className="w-60 lg:w-72 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                    <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-4 border-white">
                      <OptimizedImage
                        src={currentPair.themeImage}
                        alt={`${currentPair.childName}'s ${currentTheme.title} storybook cover`}
                        aspectRatio="1/1"
                        priority={true}
                        width={360}
                        height={360}
                        fetchPriority="high"
                      />
                    </div>
                    {/* Title overlay - hidden for first pair (white girl cover already has text) */}
                    {activeIndex !== 0 && (
                      <div className="absolute top-4 left-4 right-4">
                        <p className="text-xl lg:text-2xl leading-tight tracking-wider uppercase"
                          style={{
                            fontFamily: "'Magical Neverland', 'Fredoka', sans-serif",
                            background: 'linear-gradient(180deg, #F5DC78 0%, #D4AF37 40%, #966E19 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
                            letterSpacing: '2px',
                          }}
                        >
                          {currentPair.childName}'s {currentTheme.title}
                        </p>
                      </div>
                    )}
                    {/* Age badge */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-gray-700 shadow-md">
                      {currentTheme.ageRange}
                    </div>
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary/10 to-pink-100 px-4 py-1.5 rounded-full shadow-md whitespace-nowrap border border-primary/20">
                    <span className="text-xs font-heading text-gray-700">✨ Their own storybook!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: Compact transformation view */}
            <div
              className="md:hidden flex flex-col items-center gap-3 mb-5"
              onClick={() => goToSlide((activeIndex + 1) % HERO_PAIRS.length)}
            >
              <div className={`flex items-center gap-3 transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                {/* Small child photo */}
                <div className="w-32 rounded-xl overflow-hidden shadow-lg border-2 border-white transform -rotate-2">
                  <OptimizedImage
                    src={currentPair.childPhoto}
                    alt={`${currentPair.childName}'s photo`}
                    aspectRatio="1/1"
                    priority={true}
                    width={160}
                    height={160}
                    fetchPriority="high"
                  />
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xl">🪄</span>
                  <span className="text-primary text-lg font-bold">→</span>
                  <span className="text-xs">✨</span>
                </div>

                {/* Book cover */}
                <div className="relative w-32 transform rotate-2">
                  <div className="rounded-xl overflow-hidden shadow-xl border-2 border-white">
                    <OptimizedImage
                      src={currentPair.themeImage}
                      alt={`${currentPair.childName}'s ${currentTheme.title}`}
                      aspectRatio="1/1"
                      priority={true}
                      width={160}
                      height={160}
                      fetchPriority="high"
                    />
                  </div>
                </div>
              </div>

              {/* Labels below */}
              <div className="flex items-center gap-6 text-[10px] font-heading text-gray-500">
                <span>Your Child's Photo</span>
                <span>→</span>
                <span>Their Storybook Cover</span>
              </div>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {HERO_PAIRS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? 'w-6 h-2 bg-primary'
                      : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Show theme ${i + 1}`}
                />
              ))}
            </div>

            {/* CTA Button + subtitle */}
            <div className="text-center">
              <button
                onClick={handleCtaClick}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-heading text-sm md:text-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                Generate Instant Preview - Free!
              </button>
              <div className="mt-2 inline-flex items-center gap-2 bg-softPink/60 border border-pink-100 px-4 py-1.5 rounded-full">
                <span className="text-amber-400 text-xs">✨</span>
                <span className="text-primary font-heading text-xs tracking-wide uppercase">Loved by 1,000+ families worldwide</span>
              </div>
            </div>
          </div>
        </section>

        {/* "Choose your story" Theme Grid */}
        <section id="theme-grid" className="py-10 bg-gray-50/50">
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
