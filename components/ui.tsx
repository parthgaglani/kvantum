
import React, { useState } from 'react';
import { HelpCircle, Search } from 'lucide-react';

export const Card = ({ children, className = '', noPadding = false }: { children: React.ReactNode; className?: string; noPadding?: boolean }) => (
  <div className={`
    bg-white/80 dark:bg-neutral-900/60 
    backdrop-blur-md rounded-2xl 
    border border-neutral-200 dark:border-white/5 
    shadow-xl shadow-neutral-200/50 dark:shadow-black/50 
    min-w-0
    ${noPadding ? '' : 'p-6'} 
    ${className}
  `}>
    {children}
  </div>
);

export const SectionHeader = ({ title, icon: Icon }: { title: string; icon?: React.ElementType }) => (
  <div className="flex items-center gap-2 mb-6">
    {Icon && <Icon className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />}
    <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.2em]">{title}</h3>
    <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 to-transparent dark:from-neutral-800 dark:to-transparent ml-2"></div>
  </div>
);

export const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <label className={`block text-[10px] font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-widest mb-2 ${className}`}>
    {children}
  </label>
);

export const Input = ({ 
  value, 
  onChange, 
  type = "number", 
  step = "0.01",
  disabled = false,
  className = ''
}: { 
  value: number; 
  onChange: (val: number) => void; 
  type?: string; 
  step?: string;
  disabled?: boolean;
  className?: string;
}) => (
  <div className="relative group">
    <input
      type={type}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`
        w-full 
        bg-neutral-100 text-neutral-900 
        dark:bg-neutral-800/40 dark:text-neutral-200 
        text-sm rounded-lg 
        border border-transparent 
        focus:border-neutral-300 dark:focus:border-neutral-700 
        focus:bg-white dark:focus:bg-neutral-800 
        focus:ring-0
        placeholder-neutral-400 dark:placeholder-neutral-600
        block px-3 py-3 transition-all duration-300 ease-out
        disabled:opacity-40 disabled:cursor-not-allowed
        font-mono
        ${className}
      `}
    />
    {disabled && (
      <div className="absolute right-2 top-3">
        <span className="flex h-1.5 w-1.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
      </div>
    )}
  </div>
);

export const Select = ({
  value,
  onChange,
  options,
  disabled = false
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
        // Slight delay to ensure render
        setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
        setSearchTerm(''); // Reset search when closed
    }
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);

  // Filter options based on search term
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    opt.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative group" ref={containerRef}>
        <button
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`
                w-full flex items-center justify-between
                bg-neutral-100 text-neutral-900
                dark:bg-neutral-800/40 dark:text-neutral-200
                text-sm rounded-lg
                border border-transparent
                ${isOpen ? 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800' : ''}
                hover:bg-white dark:hover:bg-neutral-800
                focus:ring-0
                px-3 py-3 transition-all duration-300 ease-out
                disabled:opacity-40 disabled:cursor-not-allowed
            `}
        >
            <span className="font-medium tracking-wide truncate">{selectedOption?.label || value}</span>
            <svg
                className={`w-4 h-4 text-neutral-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
        </button>

        {isOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Search Input */}
                <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            placeholder="Search assets..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-md border-none focus:ring-1 focus:ring-black dark:focus:ring-white text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600"
                        />
                    </div>
                </div>

                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`
                                    flex items-center justify-between
                                    px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors
                                    ${opt.value === value
                                        ? 'bg-black text-white dark:bg-white dark:text-black font-medium'
                                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}
                                `}
                            >
                                <span>{opt.label}</span>
                                {opt.value === value && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black"></div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-4 text-center text-xs text-neutral-400 dark:text-neutral-600 italic">
                            No assets found
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export const Slider = ({
  value,
  min,
  max,
  step,
  onChange,
  disabled = false
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}) => {
  return (
    <div className="w-full flex items-center gap-4 py-1">
      <div className="relative w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full group">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
        />
        <div 
            className="absolute left-0 top-0 h-full bg-neutral-800 dark:bg-neutral-500 rounded-full transition-all duration-100" 
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
        <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-black dark:bg-white rounded-full shadow-lg transition-all duration-100 group-hover:scale-110"
            style={{ left: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
      <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 w-10 text-right">{value.toFixed(step.toString().split('.')[1]?.length || 1)}</span>
    </div>
  );
};

export const Switch = ({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) => (
  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onChange(!checked)}>
    <div 
      className={`
        w-9 h-5 rounded-full relative transition-colors duration-300 ease-in-out border border-transparent
        ${checked ? 'bg-black dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'}
      `}
    >
      <div 
        className={`
          absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-300 ease-in-out
          ${checked ? 'translate-x-4 bg-white dark:bg-black' : 'translate-x-0 bg-neutral-400 dark:bg-neutral-400'}
        `}
      />
    </div>
    {label && <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200 transition-colors">{label}</span>}
  </div>
);

export const Button = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  isLoading = false,
  disabled = false,
  className = ''
}: { 
  onClick: () => void; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}) => {
  const baseClasses = "flex items-center justify-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed tracking-wide";
  
  const variants = {
    primary: "text-white bg-black hover:bg-neutral-800 focus:ring-black dark:text-black dark:bg-white dark:hover:bg-neutral-200 dark:focus:ring-white shadow-lg shadow-black/10 dark:shadow-white/10",
    secondary: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50",
    outline: "text-neutral-700 dark:text-neutral-300 bg-transparent border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:ring-neutral-700",
    ghost: "text-neutral-600 dark:text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
  };

  return (
    <button onClick={onClick} disabled={isLoading || disabled} className={`${baseClasses} ${variants[variant]} ${className}`}>
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing
        </span>
      ) : children}
    </button>
  );
};

export const Metric = ({ label, value, subtext, trend, tooltip }: { label: string; value: string | number; subtext?: string; trend?: 'up' | 'down' | 'neutral', tooltip?: string }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex flex-col relative group" 
         onMouseEnter={() => setShowTooltip(true)} 
         onMouseLeave={() => setShowTooltip(false)}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{label}</span>
        {tooltip && (
          <HelpCircle className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-700 dark:group-hover:text-neutral-400 transition-colors cursor-help" />
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-light text-neutral-900 dark:text-white tracking-tight">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'down' ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-600'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '−'}
          </span>
        )}
      </div>
      {subtext && <span className="text-xs text-neutral-500 mt-1 font-light tracking-wide">{subtext}</span>}
      
      {/* Tooltip Popover */}
      {showTooltip && tooltip && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg shadow-xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <p className="text-[10px] text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
            {tooltip}
          </p>
        </div>
      )}
    </div>
  );
};
