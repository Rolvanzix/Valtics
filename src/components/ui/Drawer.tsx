import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'md',
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[width];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${widthStyles} h-full bg-[#140130] border-l border-[#670CDC]/30 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200 ${className}`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#670CDC]/20 flex items-start justify-between gap-3 bg-[#100126]/90">
          <div className="space-y-1 min-w-0">
            {title && (
              <h3 className="font-semibold text-base text-[#F7F3FF] tracking-tight">{title}</h3>
            )}
            {description && (
              <p className="text-xs text-[#B8A9CC] leading-normal">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#B8A9CC] hover:text-[#F7F3FF] p-1.5 rounded-md hover:bg-[#1C0142] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>

        {/* Drawer Footer */}
        {footer && (
          <div className="p-4 border-t border-[#670CDC]/20 bg-[#100126]/95 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
