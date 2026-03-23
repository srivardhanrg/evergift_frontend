/**
 * Production-safe logging utility
 *
 * Only logs in development mode to prevent exposing debug info in production.
 * Use this instead of console.log throughout the app.
 */

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Development-only logger
 * All methods are no-ops in production
 */
export const logger = {
    log: (...args: unknown[]) => {
        if (isDev) console.log(...args);
    },
    info: (...args: unknown[]) => {
        if (isDev) console.info(...args);
    },
    warn: (...args: unknown[]) => {
        if (isDev) console.warn(...args);
    },
    error: (...args: unknown[]) => {
        // Errors are always logged (but consider sending to error tracking in production)
        console.error(...args);
    },
    debug: (...args: unknown[]) => {
        if (isDev) console.debug(...args);
    },
    group: (label: string) => {
        if (isDev) console.group(label);
    },
    groupEnd: () => {
        if (isDev) console.groupEnd();
    },
    table: (data: unknown) => {
        if (isDev) console.table(data);
    }
};

/**
 * Show user-friendly notification instead of alert()
 *
 * In production, this should integrate with a toast/notification system.
 * For now, it uses a simple approach that's less disruptive than alert().
 */
export const notify = {
    info: (message: string) => {
        if (isDev) {
            console.info('[Notification]', message);
        }
        // TODO: Integrate with toast notification system
        // For now, don't block UI with alerts in production
    },
    success: (message: string) => {
        if (isDev) {
            console.log('[Success]', message);
        }
        // TODO: Show success toast
    },
    warning: (message: string) => {
        if (isDev) {
            console.warn('[Warning]', message);
        }
        // In production, show a non-blocking notification
        // For critical warnings, we might still need to inform the user
    },
    error: (message: string, showToUser = true) => {
        console.error('[Error]', message);
        if (showToUser && !isDev) {
            // In production, could show a modal or error boundary
            // For now, we rely on error boundaries
        }
    }
};

export default logger;
