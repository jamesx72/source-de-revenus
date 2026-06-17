import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, any>) => string;
}

const translations = {
  fr: {
    // Portal
    'portal.welcome': 'Bienvenue au {location}',
    'portal.stay_connected': 'Restez connecté',
    'portal.remaining': 'Restant',
    'portal.connect_free': 'Se connecter gratuitement',
    'portal.connect_auto': 'Connexion Automatique',
    'portal.buy_pass': 'Acheter un pass',
    'portal.connected': 'Connecté !',
    'portal.internet_access': 'Vous avez désormais accès à Internet.',
    'portal.time_remaining': 'Temps restant',
    'portal.premium_extension': 'Extension Premium',
    'portal.hours': 'Heures',
    'portal.minutes': 'Mins',
    'portal.free_wifi_msg': 'Connectez-vous pour accéder au Wi-Fi gratuit.',
    'portal.free_wifi_duration_msg': 'Connectez-vous pour profiter de {duration} de Wi-Fi gratuit.',
    'portal.sec_conn': 'Connexion sécurisée par WiFiCash',
    'portal.connect_with': 'Se connecter avec {provider}',
    'portal.enter_email': 'Entrez votre adresse email',
    'portal.connect': 'Se connecter',
    'portal.promo_code': 'Code promo ?',
    'portal.apply': 'Appliquer',
    'portal.watch_ad': 'Regarder la publicité ({timeLeft}s)',
    'portal.rate_exp': 'Comment évaluez-vous notre établissement ?',
    'portal.send_feedback': 'Envoyer et se connecter',
    'portal.skip': 'Passer',
    
    // Landing
    'landing.hero_title': 'Monétisez votre réseau Wi-Fi',
    'landing.hero_subtitle': 'Pour les Cafés, Hôtels et Espaces de Coworking. Transformez votre Wi-Fi gratuit en une source de revenus avec notre portail captif intelligent.',
    'landing.start_free': 'Commencer gratuitement',
    'landing.demo': 'Voir la démo',
    'landing.features': 'Fonctionnalités V2.0',
    'landing.login': 'Connexion',
    'landing.dashboard': 'Tableau de bord',
    'landing.pricing': 'Tarifs',
  },
  en: {
    // Portal
    'portal.welcome': 'Welcome to {location}',
    'portal.stay_connected': 'Stay connected',
    'portal.remaining': 'Remaining',
    'portal.connect_free': 'Connect for Free',
    'portal.connect_auto': 'Auto Connect',
    'portal.buy_pass': 'Buy a Pass',
    'portal.connected': 'Connected!',
    'portal.internet_access': 'You now have internet access.',
    'portal.time_remaining': 'Time remaining',
    'portal.premium_extension': 'Premium Extension',
    'portal.hours': 'Hours',
    'portal.minutes': 'Mins',
    'portal.free_wifi_msg': 'Log in to access free Wi-Fi.',
    'portal.free_wifi_duration_msg': 'Log in to enjoy {duration} of free Wi-Fi.',
    'portal.sec_conn': 'Secure connection by WiFiCash',
    'portal.connect_with': 'Connect with {provider}',
    'portal.enter_email': 'Enter your email address',
    'portal.connect': 'Connect',
    'portal.promo_code': 'Promo code?',
    'portal.apply': 'Apply',
    'portal.watch_ad': 'Watch ad ({timeLeft}s)',
    'portal.rate_exp': 'How would you rate our establishment?',
    'portal.send_feedback': 'Send and connect',
    'portal.skip': 'Skip',

    // Landing
    'landing.hero_title': 'Monetize your Wi-Fi network',
    'landing.hero_subtitle': 'For Cafes, Hotels and Coworking Spaces. Turn your free Wi-Fi into a revenue stream with our smart captive portal.',
    'landing.start_free': 'Start for free',
    'landing.demo': 'Watch demo',
    'landing.features': 'V2.0 Features',
    'landing.login': 'Log In',
    'landing.dashboard': 'Dashboard',
    'landing.pricing': 'Pricing',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'fr' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, variables?: Record<string, any>) => {
    let text = (translations as any)[language]?.[key] || (translations as any)['fr']?.[key] || key;
    if (variables) {
      Object.keys(variables).forEach(varKey => {
        text = text.replace(`{${varKey}}`, variables[varKey]);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
