
// TypeScript declaration for dev mode flag injected by Vite
declare const __DEV_MODE__: boolean;

// Max file size: 10MB
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeType, ChildDetails, Theme } from '../types';
import { THEMES } from '../constants';
import { Upload, Trash2, ChevronRight, Sparkles, Loader2, ArrowLeft, Camera, AlertCircle } from 'lucide-react';
import { api } from '../src/api/client';
import { Theme as ApiTheme, BookStyle } from '../src/types/api.types';
import AuthModal from '../components/AuthModal';
import OptimizedImage from '../components/OptimizedImage';
import StyledSelect from '../components/StyledSelect';
import { getFriendlyError, isPhotoError, FriendlyError } from '../src/utils/errorMessages';
import { showToast } from '../src/components/Toast';
import {
  trackPhotoUploadStarted,
  trackPhotoUploadCompleted,
  trackPhotoUploadFailed,
  trackFaceDetectionSuccess,
  trackFaceDetectionFailed,
  trackChildDetailsEntered,
  trackArtStyleSelected,
  trackPreviewGenerationStarted,
  trackFunnelStep,
  trackApiError,
} from '../src/services/analytics';

// Responsive CSS to override Shopify theme conflicts
const CreateResponsiveStyles = () => (
  <style>{`
    #sg-mobile-sticky { display: block !important; }
    #sg-mobile-spacer { display: block !important; }
    @media (min-width: 1024px) {
      #sg-mobile-sticky { display: none !important; }
      #sg-mobile-spacer { display: none !important; }
    }
  `}</style>
);

const WHIMSICAL_MESSAGES = [
  "Consulting the Star Atlas...",
  "Painting with Rainbow Brushes...",
  "Stitching Dreams together...",
  "Whispering to the Magic Ink...",
  "Gathering Moonbeams..."
];

const CreateStory: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activePage, setActivePage] = useState<number | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(WHIMSICAL_MESSAGES[0]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [guestLimitReached, setGuestLimitReached] = useState(false);
  const [uploadError, setUploadError] = useState<FriendlyError | null>(null);

  const [photos, setPhotos] = useState<File[]>([]);
  const [childDetails, setChildDetails] = useState<ChildDetails>({
    name: '', age: 5, gender: 'Boy', interests: '', elements: '', dedication: ''
  });

  // Art style selection
  const [artStyle, setArtStyle] = useState<'photorealistic' | 'cartoon_3d'>('photorealistic');

  // Get selected theme from location state, fallback to Enchanted Forest
  const selectedThemeId = (location.state?.selectedTheme as ThemeType) || ThemeType.ENCHANTED_FOREST;

  // Find the full theme object
  const selectedTheme: Theme = useMemo(() => {
    return THEMES.find(t => t.id === selectedThemeId) || THEMES[0];
  }, [selectedThemeId]);

  // Other themes for discovery section
  const otherThemes = useMemo(() => {
    return THEMES.filter(t => t.id !== selectedTheme.id);
  }, [selectedTheme.id]);

  // Switch to a different theme
  const switchTheme = (themeId: ThemeType) => {
    navigate('/create', { state: { selectedTheme: themeId }, replace: true });
  };

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMessage(WHIMSICAL_MESSAGES[Math.floor(Math.random() * WHIMSICAL_MESSAGES.length)]);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Warn user about unsaved changes when navigating away
  useEffect(() => {
    const hasData = photos.length > 0 || childDetails.name.trim().length > 0;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasData && !loading) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
      }
    };

    if (hasData && !loading) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [photos, childDetails.name, loading]);

  // Map frontend ThemeType to backend API Theme
  const mapThemeToApi = (frontendTheme: ThemeType): ApiTheme => {
    const themeMap: Record<string, ApiTheme> = {
      'Enchanted Forest': ApiTheme.STORYGIFT_ENCHANTED_FOREST,
      'Magic Castle': ApiTheme.STORYGIFT_MAGIC_CASTLE,
      'Cosmic Adventure': ApiTheme.STORYGIFT_COSMIC_DREAMER,
      'Mighty Guardian': ApiTheme.STORYGIFT_MIGHTY_GUARDIAN,
      'Ocean Explorer': ApiTheme.STORYGIFT_OCEAN_EXPLORER,
      'Birthday Magic': ApiTheme.STORYGIFT_BIRTHDAY_MAGIC,
      'Safari Adventure': ApiTheme.STORYGIFT_SAFARI_ADVENTURE,
      'Dream Weaver': ApiTheme.STORYGIFT_DREAM_WEAVER,
      'Secret Agent': ApiTheme.STORYGIFT_SECRET_AGENT,
    };
    return themeMap[frontendTheme] || ApiTheme.STORYGIFT_ENCHANTED_FOREST;
  };

  const handleGenerateClick = () => {
    if (!selectedThemeId || photos.length === 0) return;

    // No auth gate - start generation immediately
    // Session ID will be generated/used automatically
    startGeneration();
  };

  const startGeneration = async () => {
    setLoading(true);
    setProgress(5);
    setLoadingMessage("Uploading your hero's photo...");

    const uploadStartTime = Date.now();
    trackPhotoUploadStarted();

    try {
      const uploadResponse = await api.uploadPhoto(photos[0]);
      setProgress(15);
      setLoadingMessage("Photo validated! Starting the magic...");

      // Track successful upload and face detection
      const uploadDuration = Date.now() - uploadStartTime;
      trackPhotoUploadCompleted(photos[0].size, uploadDuration);
      trackFaceDetectionSuccess();
      trackFunnelStep('photo_uploaded', { file_size: photos[0].size });
      trackFunnelStep('face_detected');

      // Track child details
      trackChildDetailsEntered(String(childDetails.age), childDetails.gender);
      trackFunnelStep('details_entered', { age: childDetails.age, gender: childDetails.gender });

      // Track art style
      trackArtStyleSelected(artStyle === 'cartoon_3d' ? '3d_cartoon' : 'photorealistic');

      const mapGender = (g: string): 'male' | 'female' =>
        g.toLowerCase() === 'boy' ? 'male' : 'female';

      // Track generation started
      trackPreviewGenerationStarted(selectedThemeId, artStyle);
      trackFunnelStep('generation_started', { theme_id: selectedThemeId, art_style: artStyle });

      const { job_id, preview_id } = await api.createPreview({
        photo_url: uploadResponse.photo_url,
        child_name: childDetails.name,
        child_age: childDetails.age,
        child_gender: mapGender(childDetails.gender),
        theme: mapThemeToApi(selectedThemeId),
        style: artStyle === 'cartoon_3d' ? BookStyle.CARTOON_3D : BookStyle.PHOTOREALISTIC,
      });

      // Navigate to GenerationFeed for live streaming view
      navigate(`/generating/${job_id}`);
    } catch (error: any) {
      console.error('Story generation failed:', error);

      // Track the error
      trackApiError('create_preview', error.code || 'unknown', error.message || 'Unknown error');

      // Check if guest limit reached - show auth modal instead of generic alert
      if (error.code === 'GUEST_LIMIT_REACHED') {
        setGuestLimitReached(true);
        setShowAuthModal(true);
        setLoading(false);
        return;
      }

      // Get friendly error message
      const friendlyError = getFriendlyError(error.code, error.message);

      // If it's a photo error, track face detection failure and show inline
      if (isPhotoError(error.code)) {
        trackFaceDetectionFailed(error.code, error.message);
        trackPhotoUploadFailed(error.code, error.message);
        setUploadError(friendlyError);
        setPhotos([]); // Clear the photo so user can re-upload
      } else {
        // For non-photo errors, show a toast notification with the friendly message
        showToast(`${friendlyError.title}: ${friendlyError.message}`, 'error', 8000);
      }

      setLoading(false);
    }
  };

  // Called when user chooses "Continue as Guest" in AuthModal
  const handleGuestContinue = () => {
    setShowAuthModal(false);
    startGeneration();
  };



  // Loading State - Compact "Preparing" screen before redirecting to GenerationFeed
  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-16">
      <div className="relative z-10 text-center px-6">
        {/* Animated icon - smaller */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-pink-500 mx-auto flex items-center justify-center shadow-xl">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
        </div>

        {/* Main text - more compact */}
        <h2 className="text-2xl md:text-3xl font-heading text-gray-900 mb-2">
          Preparing Your Adventure
        </h2>
        <p className="text-gray-500 mb-6 max-w-xs mx-auto">
          Setting up the magic canvas for <span className="font-bold text-primary">{childDetails.name}</span>
        </p>

        {/* Animated dots */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <CreateResponsiveStyles />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        {/* Main Container */}
        <div className="max-w-5xl mx-auto">

          {/* Back Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-500 hover:text-primary transition font-semibold group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Themes</span>
            </button>
          </div>

          {/* Main Card - Split Layout */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">

              {/* LEFT COLUMN - Book Preview (Clean Studio Look) */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-5 lg:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-100">
                {/* Theme Title & Description */}
                <div className="text-center mb-3">
                  <div className="inline-flex items-center gap-2 mb-1">
                    <span className="text-2xl">{selectedTheme.icon}</span>
                    <h2 className="text-2xl font-heading text-gray-900">{selectedTheme.title}</h2>
                  </div>
                  <p className="text-gray-500 text-sm max-w-xs">{selectedTheme.description}</p>
                </div>

                {/* Floating Book Cover - With Magical Animations */}
                <div className="relative w-full max-w-[260px] group">
                  {/* Soft Shadow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-300/50 to-gray-400/30 rounded-2xl blur-2xl translate-y-4 scale-90 opacity-60"></div>

                  {/* Book Image */}
                  <OptimizedImage
                    src={selectedTheme.defaultCover}
                    alt={`${selectedTheme.title} Theme Cover`}
                    aspectRatio="4/3"
                    containerClassName="rounded-xl shadow-xl overflow-hidden"
                    className="transform transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-1"
                    priority={true}
                  />

                  {/* Subtle Gloss */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-xl pointer-events-none"></div>

                  {/* Shimmer Animation Overlay */}
                  <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></div>
                  </div>

                  {/* Floating Firefly Particles */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full bg-amber-300 blur-[1px] animate-firefly"
                        style={{
                          top: `${15 + i * 15}%`,
                          left: `${10 + i * 18}%`,
                          animationDelay: `${i * 0.8}s`,
                          animationDuration: `${3 + i * 0.5}s`
                        }}
                      />
                    ))}
                  </div>

                  {/* Magical Pulse Border */}
                  <div className="absolute inset-0 rounded-xl border border-amber-400/20 animate-pulse-slow pointer-events-none"></div>

                  {/* Visual Cue Badge */}
                  <div className="absolute right-1 sm:-right-3 top-6 bg-primary text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap transform rotate-3">
                    <Camera className="w-3 h-3 inline mr-1" />
                    Your Child Here!
                  </div>
                </div>

                {/* Feature Pills */}
                <div className="mt-4 space-y-2 w-full max-w-[260px]">
                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">📸</span>
                    <span>Personalize with your child's photo</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                    <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">👀</span>
                    <span>Preview before purchase</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                    <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">✨</span>
                    <span>{selectedTheme.ageRange}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Form */}
              <div className="p-5 lg:p-6">
                {/* Header */}
                <div className="mb-4">
                  <h1 className="text-xl font-heading text-slate-900 mb-0.5">Meet the Hero</h1>
                  <p className="text-gray-500 text-sm">Tell us who will star in this adventure.</p>
                </div>

                {/* Photo Upload */}
                <div className="mb-4">
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">
                    Hero's Photo
                  </label>

                  <div className="flex items-start gap-4">
                    {/* Photo Preview or Uploader */}
                    {photos.length > 0 ? (
                      <div className="relative group flex-shrink-0">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg ring-4 ring-primary/10">
                          <img
                            src={URL.createObjectURL(photos[0])}
                            alt="Uploaded hero"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => setPhotos([])}
                          className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow">
                          ✓ Ready
                        </div>
                      </div>
                    ) : (
                      <label className="w-20 h-20 rounded-full border-3 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all text-gray-400 hover:text-primary group flex-shrink-0">
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[9px] font-bold uppercase">Add Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          aria-label="Upload child's photo"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            // Clear any previous error
                            setUploadError(null);

                            // Validate file size (10MB max)
                            if (file.size > MAX_FILE_SIZE_BYTES) {
                              setUploadError(getFriendlyError('FILE_TOO_LARGE'));
                              e.target.value = ''; // Reset input
                              return;
                            }

                            setPhotos([file]);
                          }}
                        />
                      </label>
                    )}

                    {/* Tips or Error */}
                    {uploadError ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex-1">
                        <div className="flex items-start space-x-2">
                          <span className="text-lg">{uploadError.icon}</span>
                          <div>
                            <p className="text-red-800 text-xs font-bold mb-0.5">{uploadError.title}</p>
                            <p className="text-red-600 text-xs leading-relaxed">{uploadError.message}</p>
                            {uploadError.suggestion && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <span className="mr-1">💡</span>
                                {uploadError.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setUploadError(null)}
                          className="mt-2 text-red-600 text-xs underline hover:text-red-800"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-3 flex-1">
                        <p className="text-amber-800 text-xs font-bold mb-2">📸 Photo Tips</p>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center space-x-1.5 text-green-700">
                            <span className="text-green-500">✓</span>
                            <span>Clear, front-facing shot</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-green-700">
                            <span className="text-green-500">✓</span>
                            <span>Face fills most of photo</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-amber-700">
                            <span className="text-amber-500">💡</span>
                            <span>Photo clarity directly affects your story quality</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Art Style Selection */}
                <div className="mb-3">
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">
                    Choose Art Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Photorealistic Option */}
                    <button
                      type="button"
                      onClick={() => setArtStyle('photorealistic')}
                      className={`p-2.5 rounded-lg border-2 transition-all text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${artStyle === 'photorealistic'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <span className="text-lg block mb-0.5">📸</span>
                      <p className="font-bold text-gray-900 text-xs">Photorealistic</p>
                    </button>
                    {/* 3D Cartoon Option */}
                    <button
                      type="button"
                      onClick={() => setArtStyle('cartoon_3d')}
                      className={`p-2.5 rounded-lg border-2 transition-all text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${artStyle === 'cartoon_3d'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <span className="text-lg block mb-0.5">🎬</span>
                      <p className="font-bold text-gray-900 text-xs">3D Cartoon</p>
                    </button>
                  </div>
                </div>
                {/* Name Input */}
                <div className="mb-3">
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">
                    Child's Name
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. Oliver"
                    value={childDetails.name}
                    onChange={e => setChildDetails({ ...childDetails, name: e.target.value })}
                    maxLength={30}
                    className="w-full p-2.5 border-2 border-gray-100 rounded-lg bg-gray-50 text-sm text-gray-900 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-300"
                  />
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">Age</label>
                    <StyledSelect
                      value={childDetails.age}
                      onChange={(val) => setChildDetails({ ...childDetails, age: Number(val) })}
                      options={[2, 3, 4, 5, 6, 7, 8, 9, 10].map(a => ({ value: a, label: `${a} Years` }))}
                      icon="🎂"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">Gender</label>
                    <StyledSelect
                      value={childDetails.gender}
                      onChange={(val) => setChildDetails({ ...childDetails, gender: String(val) })}
                      options={[
                        { value: 'Boy', label: 'Boy' },
                        { value: 'Girl', label: 'Girl' },
                      ]}
                      icon={childDetails.gender === 'Boy' ? '👦' : '👧'}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleGenerateClick}
                  disabled={!childDetails.name || photos.length < 1}
                  className="w-full bg-gradient-to-r from-primary to-pink-500 text-white py-3 rounded-xl font-black text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Begin the Magic</span>
                </button>
              </div>
            </div>
          </div>

          {/* Explore More Adventures Section */}
          <div className="mt-10">
            <h2 className="text-xl font-heading text-gray-900 mb-4">Explore More Adventures</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {otherThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => switchTheme(theme.id)}
                  className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all text-left"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <OptimizedImage
                      src={theme.defaultCover}
                      alt={theme.title}
                      aspectRatio="4/3"
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{theme.icon}</span>
                      <span className="font-heading text-gray-900 text-sm">{theme.title}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Sticky Submit (only when form is valid but scrolled) */}
          <div id="sg-mobile-sticky" className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50">
            <button
              onClick={handleGenerateClick}
              disabled={!childDetails.name || photos.length < 1}
              className="w-full bg-gradient-to-r from-primary to-pink-500 text-white py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center space-x-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-5 h-5" />
              <span>Begin the Magic</span>
            </button>
          </div>

          {/* Bottom padding for mobile sticky button */}
          <div id="sg-mobile-spacer" className="h-24"></div>
        </div >

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setGuestLimitReached(false);
          }}
          onGuestContinue={handleGuestContinue}
          title={guestLimitReached
            ? "🎉 You've Created 3 Stories!"
            : "Sign in to save your story"
          }
          subtitle={guestLimitReached
            ? "Sign in or create an account to continue making magical stories. Your existing previews are saved!"
            : "Your magical creations will be saved to your account for 7 days"
          }
          returnPath={window.location.pathname}
          showGuestWarning={!guestLimitReached}
          hideGuestOption={guestLimitReached}
        />
      </div >
    </>
  );
};

export default CreateStory;
