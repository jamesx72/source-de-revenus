import React from 'react';
import { useLanguage, AVAILABLE_LANGUAGES, Language } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'compact' | 'pills' | 'minimal';
  showGlobe?: boolean;
}

export function LanguageSwitcher({ 
  className = '', 
  variant = 'pills',
  showGlobe = false
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center gap-1 bg-slate-100/80 dark:bg-white/10 backdrop-blur-md p-1 rounded-full border border-slate-200/60 dark:border-white/10 ${className}`}>
        {AVAILABLE_LANGUAGES.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              title={lang.label}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <span className="mr-0.5">{lang.flag}</span>
              <span>{lang.code.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 bg-black/40 hover:bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-sm transition-colors ${className}`}>
        {AVAILABLE_LANGUAGES.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              title={lang.label}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm scale-105'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-[10px]">{lang.flag}</span>
              <span>{lang.code.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {showGlobe && <Globe size={14} className="text-slate-400" />}
      <div className="flex items-center p-0.5 bg-slate-100/80 dark:bg-white/10 rounded-lg border border-slate-200/60 dark:border-white/10 backdrop-blur-sm">
        {AVAILABLE_LANGUAGES.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              title={lang.label}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                isActive 
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <span className="text-[11px]">{lang.flag}</span>
              <span>{lang.code.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
