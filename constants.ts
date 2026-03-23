
import { ThemeType, Theme } from './types';

export const THEMES: Theme[] = [
  {
    id: ThemeType.ENCHANTED_FOREST,
    title: 'Enchanted Forest',
    description: 'A magical journey through whispering woods and singing streams.',
    icon: '🌳',
    ageRange: 'Ages 2-4',
    tags: ['Nature', 'Fantasy'],
    color: 'bg-green-100 border-green-200 text-green-700',
    coverPrompt: 'A magical enchanted forest with sparkling trees, a purple singing stream, and soft pillow mountains in the distance, whimsical children\'s book illustration',
    defaultCover: "https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/Magictales/theme_covers/enchanted_forest_cover.png"
  },
  {
    id: ThemeType.MAGIC_CASTLE,
    title: 'Magic Castle',
    description: 'First day at a magical academy with wizards and dragons.',
    icon: '🏰',
    ageRange: 'Ages 6-10',
    tags: ['School', 'Wizards'],
    color: 'bg-purple-100 border-purple-200 text-purple-700',
    coverPrompt: 'A grand gothic castle magic school with towers disappearing into mist, a wise owl professor, and a baby dragon, cinematic magical atmosphere',
    defaultCover: "https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/Magictales/theme_covers/magic_castle_cover.png"
  },
  {
    id: ThemeType.COSMIC_DREAMER,
    title: 'Cosmic Adventure',
    description: 'Watch your child reach for the stars on an epic space journey.',
    icon: '🚀',
    ageRange: 'Ages 4-7',
    tags: ['Space', 'Discovery'],
    color: 'bg-indigo-100 border-indigo-200 text-indigo-700',
    coverPrompt: 'Child in astronaut suit standing on glowing asteroid with nebula and stars, epic space adventure, cosmic journey',
    defaultCover: "https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/Magictales/theme_covers/space.png"
  },
  {
    id: ThemeType.MIGHTY_GUARDIAN,
    title: 'Mighty Guardian',
    description: 'Every child is a hero—now they can see it.',
    icon: '🦸',
    ageRange: 'Ages 4-7',
    tags: ['Superhero', 'Courage'],
    color: 'bg-red-100 border-red-200 text-red-700',
    coverPrompt: 'Child in superhero costume flying over city skyline at sunset, cape billowing, heroic pose, empowering',
    defaultCover: "https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/Magictales/theme_covers/mighty_guardian.png.png"
  },
  {
    id: ThemeType.OCEAN_EXPLORER,
    title: 'Ocean Explorer',
    description: 'Dive into a world where imagination runs as deep as the ocean.',
    icon: '🐠',
    ageRange: 'Ages 2-4',
    tags: ['Ocean', 'Underwater'],
    color: 'bg-cyan-100 border-cyan-200 text-cyan-700',
    coverPrompt: 'Child swimming underwater with sea turtle, colorful coral reef, tropical fish, magical underwater kingdom',
    defaultCover: "https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/Magictales/theme_covers/underwater.png"
  },
  {
    id: ThemeType.BIRTHDAY_MAGIC,
    title: 'Birthday Magic',
    description: 'The birthday gift that makes their wildest wishes come true.',
    icon: '🎂',
    ageRange: 'Ages 2-4',
    tags: ['Birthday', 'Celebration'],
    color: 'bg-pink-100 border-pink-200 text-pink-700',
    coverPrompt: 'Child with birthday crown making a wish on magical cake, fairy sparkles, balloons, joyful celebration',
    defaultCover: "https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/Magictales/theme_covers/birthday_magic.png"
  },
  {
    id: ThemeType.SAFARI_ADVENTURE,
    title: 'Safari Adventure',
    description: 'Where the wild things know your name—become the Safari Guardian.',
    icon: '🦁',
    ageRange: 'Ages 4-7',
    tags: ['Safari', 'Animals'],
    color: 'bg-amber-100 border-amber-200 text-amber-700',
    coverPrompt: 'Child in safari outfit with elephant and lion in golden African savanna at sunset, epic adventure',
    defaultCover: "https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/Magictales/theme_covers/SAFARI_ADVENTURE.png"
  },
  // {
  //   id: ThemeType.DREAM_WEAVER,
  //   title: 'Dream Weaver',
  //   description: 'Every hero you\'ll ever be already lives inside you.',
  //   icon: '🎭',
  //   ageRange: 'Ages 5-10',
  //   tags: ['Dreams', 'Heroes'],
  //   color: 'bg-violet-100 border-violet-200 text-violet-700',
  //   coverPrompt: 'Child in magical rainbow cloak with hero silhouettes around them, dreamy cloud village, transformation magic',
  //   defaultCover: "https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/Magictales/theme_covers/DREAM_WAEVER.png"
  // },
  {
    id: ThemeType.SECRET_AGENT,
    title: 'Secret Agent',
    description: 'Go undercover as a doctor, police, firefighter, scientist, and more!',
    icon: '🕵️',
    ageRange: 'Ages 6-10',
    tags: ['Spy', 'Adventure'],
    color: 'bg-slate-100 border-slate-200 text-slate-700',
    coverPrompt: 'Child in sleek spy suit on city rooftop at night, holographic screens, secret agent gadgets',
    defaultCover: "https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/Magictales/theme_covers/unwatermarked_Gemini_Generated_Image_bggn0abggn0abggn.png"
  }
];

export const THEME_PROMPT_VARIATIONS: Record<ThemeType, string[]> = {
  [ThemeType.ENCHANTED_FOREST]: [
    "{child_name} discovers a secret map to the Enchanted Forest",
    "{child_name} befriends Pip the squirrel and follows the silver trail",
    "{child_name} crosses the Singing Stream and climbs the Whispering Mountains"
  ],
  [ThemeType.MAGIC_CASTLE]: [
    "{child_name} arrives at the Grand Academy of Arcane Arts",
    "{child_name} meets Professor Hoot and learns to tame baby dragon Sparky",
    "{child_name} masters flying on a broomstick and explores the Ancient Library"
  ],
  [ThemeType.COSMIC_DREAMER]: [
    "{child_name} discovers a magical rocket in the backyard",
    "{child_name} lands on the moon and meets a friendly alien",
    "{child_name} returns home as a brave space explorer"
  ],
  [ThemeType.MIGHTY_GUARDIAN]: [
    "{child_name} discovers a magical crystal that grants superpowers",
    "{child_name} saves a kitten and protects the town from a storm",
    "{child_name} becomes the Mighty Guardian hero"
  ],
  [ThemeType.OCEAN_EXPLORER]: [
    "{child_name} finds a magical shell that transforms them for underwater adventure",
    "{child_name} rides a wise sea turtle through bioluminescent waters",
    "{child_name} visits the underwater palace and meets the Ocean Queen"
  ],
  [ThemeType.BIRTHDAY_MAGIC]: [
    "{child_name} meets Twinkle the Birthday Wish Fairy",
    "{child_name}'s house transforms into a magical party palace",
    "{child_name} discovers the magic of being loved by family"
  ],
  [ThemeType.SAFARI_ADVENTURE]: [
    "{child_name} discovers the magical Heartstone Compass",
    "{child_name} meets Zara the wise elephant and flies over the savanna",
    "{child_name} becomes the Safari Guardian and leads the Great Animal Parade"
  ],
  [ThemeType.DREAM_WEAVER]: [
    "{child_name} meets Lumis the Dream Keeper and visits the Village of Dreams",
    "{child_name} transforms into heroes: Chef, Doctor, Pilot, Builder, Firefighter",
    "{child_name} discovers that every hero already lives inside them"
  ],
  [ThemeType.SECRET_AGENT]: [
    "{child_name} receives a secret mission and trains at spy headquarters",
    "{child_name} goes undercover as a doctor, police officer, firefighter, and scientist",
    "{child_name} saves the day and receives the Golden Star Medal"
  ]
};

export const STORYBOOK_PRICE = 599;

// Physical book pricing (in cents)
export const PHYSICAL_BOOK_SOFTCOVER_PRICE = 2900;  // $29 USD
export const PHYSICAL_BOOK_HARDCOVER_PRICE = 3900;  // $39 USD

// Shopify variant IDs for physical books
export const SHOPIFY_SOFTCOVER_VARIANT_ID = "52264757199124";  // Softcover - $29
export const SHOPIFY_HARDCOVER_VARIANT_ID = "52264757231892";  // Hardcover - $39

export const STORYBOOK_STYLE_KEYWORDS = "Whimsical children's storybook illustration, digital art with soft watercolor textures, vibrant and playful colors, clean lines, professional character design, friendly atmosphere, magical lighting, high quality children's publishing style";
