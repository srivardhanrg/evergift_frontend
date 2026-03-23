# Agent Context: MagicTales Frontend

> **Traceability**: This document describes the *actual* implementation of the `Magictales` React codebase as of Jan 2026. It is the Source of Truth for agents.

## 1. System Architecture

**Framework**: React 18 + Vite
**Styling**: Tailwind CSS
**Routing**: `react-router-dom` (HashRouter)
**State**: Local React State (useState/Context) + URL Params
**Backend Integration**: Direct usage of `magictales_backend` via `src/api/client.ts`.

### Shopify Integration: Embedded App
The app runs **inside** a Shopify Storefront (via App Proxy or direct embed).
*   **Routing**: We use `HashRouter` (`/#/create`) because Shopify controls the main URL.
*   **Context**:
    *   **Customer ID/Email**: Injected via Liquid into `window.shopifyCustomer` or read from data attributes.
    *   **Store Domain**: `myshopify.com` domain detected in `client.ts`.

## 2. Core Workflows (Deep Trace)

### A. Story Creation Wizard (`CreateStory.tsx`)
**Route**: `/create`
**Flow**:
1.  **Upload**: User selects photo -> `api.uploadPhoto`.
    *   *UX*: Validates face counts immediately using backend response.
2.  **Configuration**: Name, Gender, Theme Selection.
3.  **Submission**: "Generate" button -> `api.createPreview`.
    *   *Guard*: Checks Guest Limit (Local Storage / API 403).
    *   *Output*: Receives `job_id`.
4.  **Transition**: Navigate to `/generating/:job_id`.

### B. Generation Feed (`GenerationFeed.tsx`)
**Route**: `/generating/:jobId`
**Role**: The "Waiting Room" visualization.
**Mechanism**:
*   **Polling**: Calls `api.getJobStatus(jobId)` every ~1.5s.
*   **Progress**: Updates progress bar (0-100%).
*   **Completion**:
    *   When `status === 'COMPLETED'`, it fetches `api.getPreview(previewId)`.
    *   **Auto-Redirect**: Pushes to `/preview/:previewId`.

### C. Preview & Unlocking (`PreviewStory.tsx`)
**Route**: `/preview/:id`
**Role**: The Sales Page.
**States**:
1.  **Preview (Unpaid)**:
    *   Shows Pages 1-5 (Watermarked).
    *   Shows Pages 6-10 (Locked/Blurred).
    *   **Action**: "Buy Now" -> `buyNowWithShopify` (Redirects to `/cart/add.js`).
2.  **Generating Full (Paid)**:
    *   *Trigger*: User returns from checkout with `?checkout_success=true`.
    *   *UI*: `UnlockingOverlay` component activates.
    *   *Polling*: Polls `api.getPreview` until `generation_phase === 'complete'`.
3.  **Complete (Download Ready)**:
    *   **Wait Loop**: Even after `complete`, it polls `api.getDownload` to ensure PDF exists on R2.
    *   **Action**: "Download PDF" button active.

## 3. Critical Files Map

| File Path | Responsibility | Key Notes |
| :--- | :--- | :--- |
| `src/api/client.ts` | Backend Comms | **Crucial**. Handles `fetch`, CORS, Shop Context, Endpoint mapping. |
| `pages/CreateStory.tsx` | Wizard Logic | validation, state, file handling. |
| `pages/GenerationFeed.tsx` | Progress UI | Polling logic, "Fun Messages", Error handling. |
| `pages/PreviewStory.tsx` | Sales/View UI | **Most Complex**. Handles Unlocking Overlay + PDF Polling loops. |
| `components/AuthModal.tsx` | Guest Auth | Captures emails for guests before they lose their session. |
| `constants.ts` | Config | Theme IDs (`storygift_...`) and Price constants. |

## 4. Implementation Patterns & Gotchas

### API Client (`client.ts`)
*   **Environment Detection**: Checks `window.location.hostname` to decide if `isShopify`.
*   **Base URL**:
    *   **Dev**: `/proxy/api` (Vite Proxy).
    *   **Prod**: *Direct URL* (e.g., `https://backend.zelavokids.com`).
*   **Headers**:
    *   Adds `X-Shopify-Customer-Id` if found in DOM/Window.

### State Persistence
*   **Storage**: Uses `localStorage` for:
    *   `magictales_current_job`: Resuming generation if user closes tab.
    *   `magictales_guest_session`: Tracking guest usage locally.

### PDF Download UX
*   **The Race Condition**: PDF generation takes time (images large, upload slow).
*   **Solution**: `PreviewStory.tsx` has a dedicated `pollPdfReady` function. It DOES NOT allow clicking "Download" until the backend explicitly returns `status: ready`. This prevents 404s.

## 5. Development Cheat Sheet

### Common Tasks
*   **Adding a Theme**:
    1.  Add to `constants.ts` (`THEMES` array).
    2.  Add to Backend `enums.py`.
*   **Testing Payment Flow Locally**:
    *   Use `?checkout_success=true` in URL to simulate return from Shopify.
    *   This triggers the `pollPaymentStatus` loop in `PreviewStory.tsx`.
