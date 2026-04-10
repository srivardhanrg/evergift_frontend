import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration for EverGift
 *
 * Build Modes:
 * - Development (npm run dev): Local development with Vite proxy to backend
 * - Production (npm run build): Build for Shopify deployment
 *
 * Shopify Deployment Architecture:
 * - React bundle hosted on Cloudflare R2 CDN
 * - Embedded in Shopify via Liquid template
 * - API calls go through Shopify App Proxy → Backend
 *
 * Environment Variables:
 * - VITE_R2_PUBLIC_URL: R2 CDN URL for assets (e.g., https://pub-xxx.r2.dev/Magictales)
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';

  // R2 CDN URL for production assets (set in .env or CI/CD)
  // Example: https://pub-eab76058d817412b9c6c9726ff8ae49e.r2.dev/Magictales
  const r2PublicUrl = env.VITE_R2_PUBLIC_URL || '';

  // Base path for assets:
  // - Production: R2 CDN URL (absolute) for assets loaded from CDN
  // - Development: '/' for local serving
  // Note: When app runs in Shopify, it loads assets from R2 but routing uses /apps/zelavo/
  const base = isProd && r2PublicUrl ? `${r2PublicUrl}/` : '/';

  return {
    base,

    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
      // Proxy /proxy/api to backend during development
      proxy: {
        '/proxy/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          // DO NOT rewrite - backend expects /proxy/api/* paths
        }
      }
    },

    plugins: [react()],

    define: {
      // Supabase Configuration (anon key is safe to expose - it's a public key)
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      // Development mode flag - only true when running locally with npm run dev
      '__DEV_MODE__': JSON.stringify(!isProd),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      // Configure asset file naming for cache busting
      rollupOptions: {
        output: {
          // Use content hash for long-term caching
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          // Split vendor libraries into separate cached chunks
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/posthog-js') || id.includes('node_modules/@supabase')) {
              return 'vendor-services';
            }
          },
        }
      }
    }
  };
});
