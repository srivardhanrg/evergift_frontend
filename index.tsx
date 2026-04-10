import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ShadowRootContext } from './src/ShadowContext';

/**
 * EverGift Application Bootstrap
 * 
 * This handles two environments:
 * 1. Shopify (zelavo-app) - Uses Shadow DOM for CSS isolation
 * 2. Local Development (root) - Direct mount without Shadow DOM
 * 
 * The Shadow DOM approach completely isolates our CSS from Shopify's theme,
 * preventing any style conflicts.
 */

// Detect environment
const shopifyContainer = document.getElementById('zelavo-app');
const localContainer = document.getElementById('root');
const hostElement = shopifyContainer || localContainer;

if (!hostElement) {
  throw new Error("Could not find root element (tried 'zelavo-app' and 'root')");
}

// Check if we're in Shopify environment
const isShopifyEnvironment = !!shopifyContainer;

// Get the CSS URL from the build - we'll construct it from the current script URL
function getCssUrl(): string {
  // In production, CSS is deployed alongside JS in R2
  // The JS filename changes with each build, so we derive CSS from the same base
  const scripts = document.querySelectorAll('script[src*="index-"]');
  for (const script of scripts) {
    const src = (script as HTMLScriptElement).src;
    if (src.includes('r2.dev') || src.includes('assets/index-')) {
      // Replace .js with .css in the URL
      // e.g., index-abc123.js -> index-abc123.css (wrong)
      // Actually, we need the actual CSS filename which is different
      // Let's use a data attribute approach instead
      break;
    }
  }

  // Check for data attribute on host element
  const cssUrl = hostElement.dataset?.cssUrl;
  if (cssUrl) {
    return cssUrl;
  }

  // Fallback: construct from known R2 structure
  // This will be updated via Shopify Liquid template
  return '';
}

let shadowRoot: ShadowRoot | null = null;
let renderTarget: HTMLElement;

if (isShopifyEnvironment) {
  console.log('[EverGift] Shopify environment detected, using Shadow DOM isolation');

  // Attach Shadow DOM for complete CSS isolation
  shadowRoot = hostElement.attachShadow({ mode: 'open' });

  // Get CSS URL from data attribute (set in Liquid template)
  const cssUrl = hostElement.dataset?.cssUrl;

  // Add initial loading styles to prevent FOUC
  const loadingStyle = document.createElement('style');
  loadingStyle.id = 'loading-styles';
  loadingStyle.textContent = `
    /* Hide app content until CSS is loaded */
    #shadow-app-root {
      opacity: 0;
      transition: opacity 0.2s ease-in;
    }
    #shadow-app-root.css-loaded {
      opacity: 1;
    }
    
    /* Loading spinner */
    .loading-spinner {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      font-family: 'Open Sans', sans-serif;
      color: #FF6B9D;
    }
    .loading-spinner::before {
      content: '';
      width: 40px;
      height: 40px;
      border: 3px solid #FFF0F5;
      border-top-color: #FF6B9D;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-spinner.hidden {
      display: none;
    }
  `;
  shadowRoot.appendChild(loadingStyle);

  if (cssUrl) {
    // Create link element for CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;

    // Add load handler to reveal content when CSS is ready
    link.onload = () => {
      console.log('[EverGift] CSS loaded, revealing app');
      const appRoot = shadowRoot?.getElementById('shadow-app-root');
      const spinner = shadowRoot?.querySelector('.loading-spinner');
      if (appRoot) appRoot.classList.add('css-loaded');
      if (spinner) spinner.classList.add('hidden');

      // Signal to Liquid template that app is ready (dismiss external loader)
      window.dispatchEvent(new Event('storygift-ready'));
    };

    // Handle CSS load error
    link.onerror = () => {
      console.error('[EverGift] Failed to load CSS, showing app anyway');
      const appRoot = shadowRoot?.getElementById('shadow-app-root');
      const spinner = shadowRoot?.querySelector('.loading-spinner');
      if (appRoot) appRoot.classList.add('css-loaded');
      if (spinner) spinner.classList.add('hidden');

      // Still signal ready so loader doesn't hang
      window.dispatchEvent(new Event('storygift-ready'));
    };

    shadowRoot.appendChild(link);
  } else {
    console.warn('[EverGift] No CSS URL found in data-css-url attribute');
    // No CSS to load, signal ready immediately after render
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('storygift-ready'));
    });
  }

  // Add Google Fonts inside Shadow DOM
  // Fonts need to be available inside the shadow for them to render
  const fontStyle = document.createElement('style');
  fontStyle.textContent = `
    /* Google Fonts - Fredoka & Open Sans */
    @font-face {
      font-family: 'Fredoka';
      font-style: normal;
      font-weight: 300 700;
      font-display: swap;
      src: url(https://fonts.gstatic.com/s/fredoka/v14/X7nP4b87HvSqjb_WIi2yDCRwoQ_k7w1M.woff2) format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    
    @font-face {
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 300 800;
      font-display: swap;
      src: url(https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVI.woff2) format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    
    /* Base styles for Shadow DOM container */
    :host {
      display: block;
      min-height: 100vh;
      width: 100%;
    }
    
    #shadow-app-root {
      min-height: 100vh;
      font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
      background-color: #FAFAFA;
      color: #1f2937;
    }
  `;
  shadowRoot.appendChild(fontStyle);

  // Create loading spinner (shown while CSS loads)
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.textContent = 'Loading...';
  shadowRoot.appendChild(spinner);

  // Create the app container inside Shadow DOM
  renderTarget = document.createElement('div');
  renderTarget.id = 'shadow-app-root';
  shadowRoot.appendChild(renderTarget);

} else {
  console.log('[EverGift] Local development mode, no Shadow DOM');
  renderTarget = hostElement;
  // CSS is loaded via index.html in local development

  // Signal ready for any listeners (no-op in local dev, but consistent)
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event('storygift-ready'));
  });
}

// Create React root and render
const root = ReactDOM.createRoot(renderTarget);
root.render(
  <React.StrictMode>
    <ShadowRootContext.Provider value={shadowRoot}>
      <App />
    </ShadowRootContext.Provider>
  </React.StrictMode>
);
