import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage('fr')}
        className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
          language === 'fr' 
            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' 
            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
          language === 'en' 
            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' 
            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
        }`}
      >
        EN
      </button>
    </div>
  );
}
