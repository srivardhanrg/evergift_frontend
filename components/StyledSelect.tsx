import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
}

interface StyledSelectProps {
    value: string | number;
    onChange: (value: string | number) => void;
    options: Option[];
    placeholder?: string;
    icon?: React.ReactNode;
    className?: string;
}

/**
 * StyledSelect - Custom dropdown with fully styled menu
 * 
 * Uses React Portal to render dropdown at body level, allowing it to
 * escape parent overflow:hidden containers.
 */
const StyledSelect: React.FC<StyledSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    icon,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Find selected option label
    const selectedOption = options.find(opt => opt.value === value);

    // Estimate menu height (options * item height + padding)
    const estimatedMenuHeight = Math.min(options.length * 36, 208) + 8;

    // Calculate menu position - ALWAYS open above the trigger
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.top + window.scrollY - estimatedMenuHeight - 4,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    }, [isOpen, estimatedMenuHeight]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
                menuRef.current && !menuRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const handleSelect = (optValue: string | number) => {
        onChange(optValue);
        setIsOpen(false);
    };

    // Dropdown menu rendered via Portal
    const dropdownMenu = isOpen ? createPortal(
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
            style={{
                top: menuPosition.top,
                left: menuPosition.left,
                width: menuPosition.width,
            }}
        >
            <div className="max-h-52 overflow-y-auto">
                {options.map((option) => {
                    const isSelected = option.value === value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={`
                                w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                                transition-colors
                                ${isSelected
                                    ? 'bg-gradient-to-r from-primary to-pink-400 text-white font-medium'
                                    : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
                                }
                            `}
                        >
                            <span className="flex-1">{option.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                        </button>
                    );
                })}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center gap-2 px-2.5 py-2 
                    border-2 rounded-lg bg-white font-medium text-sm text-gray-900
                    transition-all outline-none cursor-pointer
                    ${isOpen
                        ? 'border-primary ring-2 ring-primary/10'
                        : 'border-gray-200 hover:border-primary/40'
                    }
                `}
            >
                {/* Icon */}
                {icon && <span className="text-base flex-shrink-0">{icon}</span>}

                {/* Selected Value */}
                <span className="flex-1 text-left truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                {/* Chevron */}
                <ChevronDown
                    className={`w-3.5 h-3.5 text-primary/70 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Portal-rendered dropdown */}
            {dropdownMenu}
        </div>
    );
};

export default StyledSelect;

