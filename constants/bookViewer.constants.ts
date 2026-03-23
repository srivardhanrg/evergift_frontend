/**
 * Mock data and constants for 24-page book viewer
 * This will be replaced with real API data later
 */

import type { ThemeConfig, TextConfig } from '../types/book.types';

// Default text configuration for story pages
const defaultTextConfig: TextConfig = {
  x: 40,
  y: 380,
  width: 340,
  height: 220,
  font: 'Baloo 2',
  fontSize: 20,
  lineHeight: 1.6,
  color: '#3d3225',
  nameColor: '#e85d75',
  background: 'rgba(255, 250, 240, 0.9)',
  borderRadius: 16,
  padding: 24,
  dropCap: true,
  dropCapColor: '#7c3aed',
  textAlign: 'left',
};

// Dedication page text config (centered, no drop cap)
const dedicationTextConfig: TextConfig = {
  x: 60,
  y: 300,
  width: 280,
  height: 100,
  font: 'Fredoka',
  fontSize: 28,
  lineHeight: 1.4,
  color: '#5b21b6',
  nameColor: '#ec4899',
  background: 'transparent',
  textAlign: 'center',
  dropCap: false,
};

// The End page text config
const theEndTextConfig: TextConfig = {
  x: 80,
  y: 250,
  width: 240,
  height: 150,
  font: 'Fredoka',
  fontSize: 48,
  lineHeight: 1.2,
  color: '#7c3aed',
  nameColor: '#ec4899',
  background: 'transparent',
  textAlign: 'center',
  dropCap: false,
};

/**
 * Mock theme configuration for Safari Adventure
 * In production, this will come from GET /api/theme/{theme_id}/config
 */
export const MOCK_SAFARI_THEME_CONFIG: ThemeConfig = {
  theme: 'Safari Adventure',
  themeTitle: 'Safari Adventure',
  totalPages: 24,
  pages: [
    // Page 1: Inside Cover / Dedication
    {
      pageNumber: 1,
      pageType: 'constant',
      templateUrl: '', // Placeholder - will use colored background
      storyText: 'This magical adventure was made especially for {child_name}',
      textConfig: dedicationTextConfig,
    },
    // Page 2: Generated Story Illustration 1
    {
      pageNumber: 2,
      pageType: 'generated',
    },
    // Page 3: Right-side story page 1
    {
      pageNumber: 3,
      pageType: 'constant',
      templateUrl: '',
      storyText: 'One sunny morning, {child_name} discovered a magical map hidden in the tall grass. The map glowed with golden light, showing a path to the Great Safari Kingdom where animals could talk and dreams came true.',
      textConfig: defaultTextConfig,
    },
    // Page 4: Generated Story Illustration 2
    {
      pageNumber: 4,
      pageType: 'generated',
    },
    // Page 5: Right-side story page 2
    {
      pageNumber: 5,
      pageType: 'constant',
      templateUrl: '',
      storyText: 'With the map in hand, {child_name} set off on an incredible journey. Along the way, a wise elephant named Zara appeared. "Welcome, young explorer," Zara said with a gentle smile. "The animals have been waiting for you!"',
      textConfig: defaultTextConfig,
    },
    // Page 6: Generated Story Illustration 3
    {
      pageNumber: 6,
      pageType: 'generated',
    },
    // Page 7: Right-side story page 3
    {
      pageNumber: 7,
      pageType: 'constant',
      templateUrl: '',
      storyText: '{child_name} climbed onto Zara\'s back, and together they soared over the golden savanna. From high above, {child_name} could see giraffes, zebras, and lions all living together in harmony beneath the bright African sun.',
      textConfig: defaultTextConfig,
    },
    // Page 8: Generated Story Illustration 4
    {
      pageNumber: 8,
      pageType: 'generated',
    },
    // Page 9: Right-side story page 4
    {
      pageNumber: 9,
      pageType: 'constant',
      templateUrl: '',
      storyText: 'At the watering hole, {child_name} met Leo the lion, king of the savanna. "We\'ve been waiting for the Guardian of the Safari," Leo said proudly. "Someone with a kind heart who can help protect our home."',
      textConfig: defaultTextConfig,
    },
    // Page 10: Generated Story Illustration 5
    {
      pageNumber: 10,
      pageType: 'generated',
    },
    // Page 11: Right-side story page 5
    {
      pageNumber: 11,
      pageType: 'constant',
      templateUrl: '',
      storyText: '{child_name} discovered a magical Heartstone Compass that glowed with warmth. "This compass will guide you," Zara explained. "It points not north, but toward kindness, courage, and friendship."',
      textConfig: defaultTextConfig,
    },
    // Page 12: Generated Story Illustration 6
    {
      pageNumber: 12,
      pageType: 'generated',
    },
    // Page 13: Right-side story page 6
    {
      pageNumber: 13,
      pageType: 'constant',
      templateUrl: '',
      storyText: 'Using the compass, {child_name} helped a baby giraffe reach the tallest acacia trees, guided a family of meerkats to their burrow, and showed a shy rhino that friends come in all shapes and sizes.',
      textConfig: defaultTextConfig,
    },
    // Page 14: Generated Story Illustration 7
    {
      pageNumber: 14,
      pageType: 'generated',
    },
    // Page 15: Right-side story page 7
    {
      pageNumber: 15,
      pageType: 'constant',
      templateUrl: '',
      storyText: 'As the sun began to set, painting the sky in shades of orange and pink, all the animals gathered around {child_name}. "You are now the true Safari Guardian," they cheered together.',
      textConfig: defaultTextConfig,
    },
    // Page 16: Generated Story Illustration 8
    {
      pageNumber: 16,
      pageType: 'generated',
    },
    // Page 17: Right-side story page 8
    {
      pageNumber: 17,
      pageType: 'constant',
      templateUrl: '',
      storyText: 'The Great Animal Parade began! {child_name} led the way as elephants trumpeted, lions roared with joy, and zebras danced. Even the stars seemed to twinkle a little brighter that magical night.',
      textConfig: defaultTextConfig,
    },
    // Page 18: Generated Story Illustration 9
    {
      pageNumber: 18,
      pageType: 'generated',
    },
    // Page 19: Right-side story page 9
    {
      pageNumber: 19,
      pageType: 'constant',
      templateUrl: '',
      storyText: 'When it was time to go home, Zara gave {child_name} a special gift—a golden feather. "Whenever you need courage or kindness," she whispered, "just hold this feather and remember your safari friends."',
      textConfig: defaultTextConfig,
    },
    // Page 20: Generated Story Illustration 10
    {
      pageNumber: 20,
      pageType: 'generated',
    },
    // Page 21: Right-side story page 10
    {
      pageNumber: 21,
      pageType: 'constant',
      templateUrl: '',
      storyText: '{child_name} returned home, the Heartstone Compass safely in hand. And though the Great Safari Kingdom was far away, {child_name} knew that the spirit of adventure and kindness would always remain close to the heart.',
      textConfig: defaultTextConfig,
    },
    // Page 22: "The End" page
    {
      pageNumber: 22,
      pageType: 'constant',
      templateUrl: '',
      storyText: 'The End',
      textConfig: theEndTextConfig,
    },
    // Page 23: Closing art (decorative, no text)
    {
      pageNumber: 23,
      pageType: 'constant',
      templateUrl: '',
    },
  ],
  fonts: [
    {
      name: 'Baloo 2',
      url: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700&display=swap',
      weight: 400,
    },
    {
      name: 'Fredoka',
      url: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&display=swap',
      weight: 400,
    },
  ],
};

/**
 * Generate placeholder background colors for template pages
 * Uses warm, safari-themed colors
 */
export const getPlaceholderBackground = (pageNumber: number): string => {
  const colors = [
    '#FFF8F0', // Cream
    '#FFFBEB', // Light yellow
    '#FEF3C7', // Pale gold
    '#FDE68A', // Soft gold
    '#FBBF24', // Golden
  ];
  return colors[pageNumber % colors.length];
};

/**
 * Book configuration constants
 */
export const BOOK_CONFIG = {
  TOTAL_PAGES: 24,
  WATERMARK_PAGE_LIMIT: 12, // Show watermark on pages 1-12
  PAGE_DIMENSIONS: {
    width: 400,  // Base width for mobile
    height: 500, // Base height for mobile
    desktopWidth: 450,
    desktopHeight: 550,
  },
  ANIMATION: {
    duration: 500, // ms
    swipeThreshold: 50, // px
  },
};
