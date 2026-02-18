# MagicTales Frontend

React-based storefront for AI-personalized children's storybooks. Integrates with Shopify via App Proxy and uses Shadow DOM for CSS isolation.

## Tech Stack

- **React 19** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing (HashRouter for Shopify compatibility)
- **Lucide React** - Icons

## Project Structure

```
Magictales/
├── App.tsx              # Main app with routing
├── index.tsx            # Bootstrap with Shadow DOM support
├── index.css            # Tailwind styles
├── constants.ts         # Story themes, ages, genders
├── types.ts             # TypeScript types
├── components/          # Reusable UI components
│   ├── Navbar.tsx       # Navigation bar
│   ├── Footer.tsx       # Site footer
│   ├── BookPageCard.tsx # Story page display
│   ├── CoverPageCard.tsx# Book cover display
│   ├── CreationCard.tsx # My Creations item
│   ├── StyledSelect.tsx # Custom dropdown (Shadow DOM compatible)
│   ├── OptimizedImage.tsx # Lazy loading images
│   ├── AuthModal.tsx    # Login prompt
│   └── ErrorBoundary.tsx# Error handling
├── pages/               # Route components
│   ├── Home.tsx         # Landing page
│   ├── CreateStory.tsx  # Story creation form
│   ├── GenerationFeed.tsx # Real-time generation progress
│   ├── PreviewStory.tsx # Story preview + purchase
│   ├── MyCreations.tsx  # User's saved stories
│   └── About.tsx        # About page
├── src/
│   ├── api/client.ts    # Backend API client
│   ├── ShadowContext.tsx# Shadow DOM context provider
│   └── utils/           # Utility functions
└── services/            # Business logic
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create `.env` file:

```env
# Backend API URL (for Vite proxy in development)
VITE_API_URL=http://localhost:8000

# Optional: Enable Shopify test mode locally
VITE_SHOPIFY_TEST_MODE=true
```

## User Flow

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│    Home     │────►│ CreateStory  │────►│ GenerationFeed │
│  (Landing)  │     │  (Form)      │     │  (Progress)    │
└─────────────┘     └──────────────┘     └────────┬───────┘
                                                   │
                    ┌──────────────┐     ┌─────────▼───────┐
                    │ MyCreations  │◄────│  PreviewStory   │
                    │  (History)   │     │  (View+Buy)     │
                    └──────────────┘     └─────────────────┘
```

## Key Features

### 1. Story Creation (`/create`)
- Photo upload with face detection validation
- Child details: name, age (2-8), gender
- Theme selection (6 themes available)
- Guest users limited to 1 free creation

### 2. Generation Progress (`/generating/:jobId`)
- Real-time status polling (2s intervals)
- Progress bar with step indicators
- Email capture for notifications
- Auto-redirect on completion

### 3. Story Preview (`/preview/:id`)
- Interactive book-style page display
- Cover + 10 story pages
- Locked pages for unpaid stories (pages 6-10)
- Shopify checkout integration

### 4. My Creations (`/my-creations`)
- View all created stories
- Filter by status (pending, completed)
- 7-day expiration countdown
- Continue where you left off

## Shopify Integration

### How It Works

1. **App Proxy**: Frontend served at `/apps/zelavo/*` on Shopify store
2. **Shadow DOM**: Complete CSS isolation from Shopify theme
3. **Cart Integration**: Add to cart via `/cart/add.js` API
4. **Customer Context**: Shopify customer ID passed via Liquid template

### Liquid Template Setup

The Shopify store uses a Liquid template that:

```liquid
<!-- zelavo-app.liquid -->
<div id="zelavo-app"
     data-customer-id="{{ customer.id }}"
     data-customer-email="{{ customer.email }}"
     data-shop-domain="{{ shop.permanent_domain }}"
     data-backend-url="https://your-backend.onrender.com"
     data-css-url="https://your-cdn.r2.dev/assets/index-xxx.css">
</div>
<script src="https://your-cdn.r2.dev/assets/index-xxx.js"></script>
```

### Shadow DOM

The app uses Shadow DOM to isolate CSS from Shopify's theme:

```tsx
// index.tsx
if (isShopifyEnvironment) {
  shadowRoot = hostElement.attachShadow({ mode: 'open' });
  // Load CSS inside shadow root
  // Render React app inside shadow root
}
```

Components that create portals (modals, dropdowns) must use `usePortalContainer()` hook to render inside the Shadow DOM.

## API Client

Located at `src/api/client.ts`:

```typescript
import { api } from './src/api/client';

// Upload photo
const { photo_id } = await api.uploadPhoto(file);

// Create preview
const { job_id } = await api.createPreview({
  photo_id,
  child_name: 'Emma',
  child_age: 5,
  child_gender: 'girl',
  theme: 'enchanted_forest'
});

// Poll for status
const status = await api.getJobStatus(jobId);

// Get completed preview
const preview = await api.getPreview(previewId);

// Shopify cart
await api.addToShopifyCart(previewId);
api.redirectToShopifyCheckout(previewId);
```

## Session Management

Guest users get a session ID stored in localStorage:

```typescript
// Auto-generated on first visit
localStorage.getItem('magictales_session_id')
// e.g., "session-1705123456789-abc123def"
```

When users log into Shopify, their guest creations are linked to their account via the `linkSession()` API.

## Story Themes

| Theme ID | Name | Description |
|----------|------|-------------|
| `space_adventure` | Space Adventure | Cosmic exploration |
| `underwater_world` | Underwater World | Ocean exploration |
| `enchanted_forest` | Enchanted Forest | Magical woodland |
| `dinosaur_expedition` | Dinosaur Expedition | Prehistoric journey |
| `superhero_academy` | Superhero Academy | Hero training |
| `fairy_tale_kingdom` | Fairy Tale Kingdom | Royal adventure |

## Building for Production

```bash
# Build
npm run build

# Output in dist/
dist/
├── index.html
└── assets/
    ├── index-[hash].js
    └── index-[hash].css
```

### Deployment

1. **Cloudflare R2** (recommended): Upload `dist/assets/*` to R2 bucket
2. **Update Liquid template** with new JS/CSS URLs
3. **Backend** serves the index.html via App Proxy

## Development Tips

### Test Shopify Flow Locally

Add `?shopify_test=true` to URL to simulate Shopify environment:

```
http://localhost:5173/#/create?shopify_test=true
```

### Vite Proxy Config

`vite.config.ts` proxies `/proxy/api/*` to local backend:

```typescript
server: {
  proxy: {
    '/proxy/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/proxy/, '')
    }
  }
}
```

### Debug API Calls

All API calls are logged to console with `[Shopify]`, `[Checkout]`, or `[MagicTales]` prefixes.

## Common Issues

### Dropdowns not showing in Shopify
Ensure `StyledSelect` uses `usePortalContainer()` for portal target instead of `document.body`.

### CSS not loading in Shopify
Check that `data-css-url` attribute is set on `#zelavo-app` element in Liquid template.

### "Not in Shopify environment" error
This is expected in local development. Use `?shopify_test=true` for testing.

### Guest limit reached
Clear localStorage `magictales_session_id` to reset, or log into Shopify.

## Scripts

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
```

## Related

- [magictales_backend](../magictales_backend/README.md) - FastAPI backend
- Shopify Store: storygift-2061.myshopify.com
