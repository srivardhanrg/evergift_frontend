
export enum ThemeType {
  ENCHANTED_FOREST = 'Enchanted Forest',
  MAGIC_CASTLE = 'Magic Castle',
  COSMIC_DREAMER = 'Cosmic Adventure',
  MIGHTY_GUARDIAN = 'Mighty Guardian',
  OCEAN_EXPLORER = 'Ocean Explorer',
  BIRTHDAY_MAGIC = 'Birthday Magic',
  SAFARI_ADVENTURE = 'Safari Adventure',
  DREAM_WEAVER = 'Dream Weaver'
}

export interface Theme {
  id: ThemeType;
  title: string;
  description: string;
  icon: string;
  ageRange: string;
  tags: string[];
  color: string;
  coverPrompt: string;
  defaultCover: string;
}

export interface ChildDetails {
  name: string;
  age: number;
  gender: string;
  interests?: string;
  elements?: string;
  dedication?: string;
}

export interface StoryPage {
  id?: string;
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface Storybook {
  id: string;
  userId: string;
  childName: string;
  childAge: number;
  childGender: string;
  theme: ThemeType;
  coverUrl?: string; // Cover page image URL
  storyTitle?: string; // Story title for cover display
  pages: StoryPage[];
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
  pdfUrl?: string; // PDF-only mode: URL to the stored PDF
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  child_name?: string;
  child_age?: number;
  child_gender?: string;
}

export interface PhysicalOrder {
  id: string;
  orderId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  fulfillmentStatus: 'queued' | 'printing' | 'shipped' | 'delivered';
}
