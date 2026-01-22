import React, { createContext, useContext } from 'react';

/**
 * Context to provide the Shadow Root to child components
 * This is needed for components that use React Portals (modals, dropdowns, etc.)
 * so they can render inside the Shadow DOM instead of outside it.
 */
export const ShadowRootContext = createContext<ShadowRoot | null>(null);

/**
 * Hook to get the current Shadow Root
 * Returns null in local development (no Shadow DOM)
 * Returns the Shadow Root when running inside Shopify
 */
export function useShadowRoot(): ShadowRoot | null {
    return useContext(ShadowRootContext);
}

/**
 * Hook to get the appropriate container for React Portals
 * Uses shadow root if available, falls back to document.body
 */
export function usePortalContainer(): Element {
    const shadowRoot = useShadowRoot();
    // If we have a shadow root, use its first child as portal container
    // Otherwise fall back to document.body
    if (shadowRoot) {
        return shadowRoot.querySelector('#shadow-app-root') || shadowRoot as unknown as Element;
    }
    return document.body;
}
