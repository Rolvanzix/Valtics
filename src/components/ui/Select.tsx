import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
  subLabel?: string;
  badge?: string;
  icon?: ReactNode;
}

export interface SelectProps<T extends string | number = string> {
  label?: string;
  helperText?: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (val: T) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function Select<T extends string | number = string>({
  label,
  helperText,
  options,
  value,
  onChange,
  disabled = false,
  className = '',
  placeholder = 'Select option...',
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-[#F7F3FF] tracking-tight block font-sans">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between py-2 px-3 rounded-md border text-xs text-left transition-all ${
            isOpen
              ? 'border-[#670CDC] ring-2 ring-[#670CDC]/30 bg-[#140130]'
              : 'border-[#670CDC]/30 bg-[#120128] hover:border-[#670CDC]/60'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-[#140130]/60' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
            <span className="text-[#F7F3FF] font-medium truncate font-sans">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.badge && (
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#1C0142] text-[#B8A9CC] border border-[#670CDC]/30">
                {selectedOption.badge}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#B8A9CC] shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#F99225]' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#670CDC]/35 bg-[#160136] shadow-2xl shadow-[#09011B]/90 overflow-hidden py-1 max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left cursor-pointer ${
                    isSelected
                      ? 'bg-[#3B0489]/60 text-[#F7F3FF] font-semibold border-l-2 border-[#F99225]'
                      : 'text-[#B8A9CC] hover:bg-[#26035A] hover:text-[#F7F3FF]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{option.label}</span>
                        {option.badge && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#1C0142] text-[#B8A9CC] border border-[#670CDC]/30">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {option.subLabel && (
                        <div className="text-[10px] text-[#7E6D96] truncate">{option.subLabel}</div>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#F99225] shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {helperText && <p className="text-[11px] text-[#B8A9CC] leading-normal">{helperText}</p>}
    </div>
  );
}
