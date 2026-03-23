import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: Toast['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        // Fallback to alert if not in provider (shouldn't happen in normal use)
        return {
            showToast: (message: string) => {
                console.warn('[Toast] Not in ToastProvider, falling back to console:', message);
            }
        };
    }
    return context;
}

// Global toast function for use outside React components (hooks, etc.)
let globalShowToast: ToastContextType['showToast'] | null = null;

export function showToast(message: string, type: Toast['type'] = 'info', duration = 5000) {
    if (globalShowToast) {
        globalShowToast(message, type, duration);
    } else {
        // Fallback - show in console and use a simple DOM notification
        console.log(`[Toast ${type}]`, message);
        showFallbackToast(message, type, duration);
    }
}

function showFallbackToast(message: string, type: Toast['type'], duration: number) {
    // Create a simple DOM-based toast as fallback
    const toast = document.createElement('div');
    toast.className = `toast-fallback toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        max-width: 90%;
        text-align: center;
        z-index: 10000;
        animation: slideUp 0.3s ease;
        background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#3b82f6'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToastInternal = useCallback((message: string, type: Toast['type'] = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    // Register global toast function
    useEffect(() => {
        globalShowToast = showToastInternal;
        return () => {
            globalShowToast = null;
        };
    }, [showToastInternal]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast: showToastInternal }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    return (
        <div style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxWidth: '90%',
            width: 400,
        }}>
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, toast.duration || 5000);
        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onRemove]);

    const bgColor = {
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
    }[toast.type];

    return (
        <div
            style={{
                padding: '12px 16px',
                borderRadius: 8,
                backgroundColor: bgColor,
                color: 'white',
                fontSize: 14,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                animation: 'slideUp 0.3s ease',
                cursor: 'pointer',
            }}
            onClick={() => onRemove(toast.id)}
        >
            {toast.message}
        </div>
    );
}

// Add CSS animation
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}
