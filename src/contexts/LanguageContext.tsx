import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'fr' | 'en' | 'es';

export interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
}

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, any>) => string;
  languages: LanguageOption[];
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Portal - Navigation & Header
    'portal.back_to_site': 'Retour au site',
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
    'portal.or_connect_with': 'Ou se connecter avec',
    'portal.connect_with': 'Se connecter avec {provider}',
    'portal.enter_email': 'Entrez votre adresse email',
    'portal.connect': 'Se connecter',
    'portal.connect_now': 'Se connecter maintenant',
    'portal.continue_to_site': 'Continuer vers le site',
    'portal.terms_default': 'En vous connectant, vous acceptez les conditions générales d\'utilisation de ce réseau.',

    // Passes & Durations
    'portal.available_passes': 'Forfaits disponibles',
    'portal.duration': 'Durée',
    'portal.day': 'jour',
    'portal.days': 'jours',
    'portal.hour_short': 'h',
    'portal.min_short': 'min',
    'portal.free_badge': 'Gratuit',
    'portal.pass_2h_title': 'Premium 2 Heures',
    'portal.pass_2h_desc': 'Haut débit sans publicité',
    'portal.pass_24h_title': 'Pass Journée (24h)',
    'portal.pass_24h_desc': 'Accès illimité pour toute la journée',

    // Promo code
    'portal.promo_code': 'Code promo ?',
    'portal.apply': 'Appliquer',
    'portal.applying': 'Vérification...',
    'portal.applied_code': 'Code appliqué',

    // Ads & Connection
    'portal.watch_ad': 'Regarder la publicité ({timeLeft}s)',
    'portal.ad_badge': 'Publicité',
    'portal.ad_space': 'Espace Publicitaire',
    'portal.your_ad_here': 'Votre annonce ici',
    'portal.connecting': 'Connexion en cours...',

    // Payment & Success
    'portal.payment_title': 'Paiement sécurisé',
    'portal.pay': 'Payer',
    'portal.processing': 'Traitement en cours...',
    'portal.error_occurred': 'Une erreur est survenue.',
    'portal.promo_invalid': 'Code promo invalide ou expiré.',
    'portal.promo_limit': 'Ce code a atteint sa limite d\'utilisation.',
    'portal.promo_error': 'Erreur lors de la vérification.',
    'portal.payment_session_error': 'Erreur lors de la création de la session de paiement',
    'portal.card_stripe': 'Carte Bancaire (Stripe)',
    'portal.payment_success_title': 'Paiement Réussi',
    'portal.payment_success_sub': 'Merci pour votre achat ! Voici votre code de connexion.',
    'portal.internet_active': 'Accès Internet Activé',
    'portal.wifi_access_code': 'Code d\'accès Wi-Fi',
    'portal.download_receipt': 'Télécharger Reçu PDF',
    'portal.generating_receipt': 'Génération...',
    'portal.preview_receipt': 'Aperçu',
    'portal.receipt_note': 'Modèle professionnel avec TVA, date & note de frais',
    'portal.receipt_downloaded': 'Reçu PDF officiel généré et téléchargé !',
    'portal.receipt_error': 'Erreur lors du téléchargement du reçu',

    // Receipt Modal & Print
    'receipt.modal_title': 'Reçu d\'Achat Wi-Fi',
    'receipt.modal_subtitle': 'Modèle professionnel prêt à imprimer ou télécharger',
    'receipt.print': 'Imprimer',
    'receipt.download_pdf': 'Télécharger PDF',
    'receipt.downloading': 'Téléchargement...',
    'receipt.gateway_tag': 'Passerelle d\'accès internet sécurisée',
    'receipt.paid_badge': '✓ PAYÉ',
    'receipt.ref': 'Réf',
    'receipt.seller_header': 'Établissement / Vendeur',
    'receipt.wifi_network': 'Réseau Wi-Fi',
    'receipt.payment_details': 'Détails du règlement',
    'receipt.date': 'Date',
    'receipt.client': 'Client',
    'receipt.col_desc': 'Description',
    'receipt.col_duration': 'Durée',
    'receipt.col_qty': 'Qté',
    'receipt.col_unit_ht': 'P.U. HT',
    'receipt.col_total_ttc': 'Total TTC',
    'receipt.plan_item': 'Forfait Wi-Fi',
    'receipt.plan_sub': 'Connexion haut débit illimitée & sécurisée',
    'receipt.discount_applied': 'Remise appliquée (Code promo: {code})',
    'receipt.subtotal_ht': 'Sous-total HT',
    'receipt.vat': 'TVA',
    'receipt.total_paid': 'TOTAL PAYÉ (TTC)',
    'receipt.credentials_title': 'Vos Identifiants de Connexion Wi-Fi',
    'receipt.credentials_help': 'Connectez-vous au réseau {ssid} et saisissez ce code sur la page de connexion.',
    'receipt.scan_qr': 'Scan Wi-Fi',
    'receipt.legal_title': 'Preuve d\'achat & Note de frais',
    'receipt.legal_body': 'Ce document atteste du paiement du forfait Wi-Fi pour la durée indiquée. Conservez-le pour votre justificatif comptable.',
    'receipt.email_copy_title': 'Recevoir une copie du reçu par e-mail',
    'receipt.email_sent': 'E-mail envoyé avec succès !',
    'receipt.email_placeholder': 'votre.email@exemple.com',
    'receipt.send': 'Envoyer',
    'receipt.sending': 'Envoi...',
    'receipt.close': 'Fermer',
    'receipt.code_copied': 'Code Wi-Fi copié dans le presse-papier !',
    'receipt.print_error': 'Impossible d\'ouvrir la boîte d\'impression.',
    'receipt.footer_note': 'Format A4 haute résolution • Prêt pour archivage',

    // Expiry & Feedback
    'portal.session_expiry_title': 'Session bientôt expirée',
    'portal.session_expiry_msg': 'Votre session Wi-Fi expire dans moins de 5 minutes.',
    'portal.session_critical_title': 'Attention : Dernière minute de connexion !',
    'portal.session_critical_msg': 'Votre accès Internet va être interrompu dans quelques instants. Prolongez immédiatement pour rester en ligne.',
    'portal.session_expired_title': 'Session Wi-Fi Expirée',
    'portal.session_expired_msg': 'Votre forfait Wi-Fi est arrivé à expiration. Veuillez renouveler votre connexion ou prolonger.',
    'portal.reconnect': 'Renouveler ma connexion',
    'portal.status_active': 'Session active',
    'portal.status_expiring': 'Expire bientôt',
    'portal.status_critical': 'Dernière minute',
    'portal.status_expired': 'Session expirée',
    'portal.extend_session': 'Prolonger la session (+2h)',
    'portal.rate_exp': 'Comment évaluez-vous notre établissement ?',
    'portal.rate_experience': 'Comment évaluez-vous votre expérience ?',
    'portal.send_feedback': 'Envoyer et se connecter',
    'portal.send': 'Envoyer',
    'portal.thank_you_feedback': 'Merci pour votre retour ! 🎉',
    'portal.feedback_help': 'Votre avis nous aide à nous améliorer.',
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
    // Portal - Navigation & Header
    'portal.back_to_site': 'Back to site',
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
    'portal.or_connect_with': 'Or connect with',
    'portal.connect_with': 'Connect with {provider}',
    'portal.enter_email': 'Enter your email address',
    'portal.connect': 'Connect',
    'portal.connect_now': 'Connect now',
    'portal.continue_to_site': 'Continue to website',
    'portal.terms_default': 'By connecting, you agree to the terms and conditions of this network.',

    // Passes & Durations
    'portal.available_passes': 'Available Passes',
    'portal.duration': 'Duration',
    'portal.day': 'day',
    'portal.days': 'days',
    'portal.hour_short': 'h',
    'portal.min_short': 'min',
    'portal.free_badge': 'Free',
    'portal.pass_2h_title': 'Premium 2 Hours',
    'portal.pass_2h_desc': 'High speed without ads',
    'portal.pass_24h_title': 'Day Pass (24h)',
    'portal.pass_24h_desc': 'Unlimited access for the entire day',

    // Promo code
    'portal.promo_code': 'Promo code?',
    'portal.apply': 'Apply',
    'portal.applying': 'Checking...',
    'portal.applied_code': 'Applied code',

    // Ads & Connection
    'portal.watch_ad': 'Watch ad ({timeLeft}s)',
    'portal.ad_badge': 'Advertisement',
    'portal.ad_space': 'Advertising Space',
    'portal.your_ad_here': 'Your ad here',
    'portal.connecting': 'Connecting...',

    // Payment & Success
    'portal.payment_title': 'Secure Payment',
    'portal.pay': 'Pay',
    'portal.processing': 'Processing...',
    'portal.error_occurred': 'An error occurred.',
    'portal.promo_invalid': 'Invalid or expired promo code.',
    'portal.promo_limit': 'This code has reached its usage limit.',
    'portal.promo_error': 'Error verifying promo code.',
    'portal.payment_session_error': 'Error initializing payment session',
    'portal.card_stripe': 'Credit Card (Stripe)',
    'portal.payment_success_title': 'Payment Successful',
    'portal.payment_success_sub': 'Thank you for your purchase! Here is your access code.',
    'portal.internet_active': 'Internet Access Activated',
    'portal.wifi_access_code': 'Wi-Fi Access Code',
    'portal.download_receipt': 'Download PDF Receipt',
    'portal.generating_receipt': 'Generating...',
    'portal.preview_receipt': 'Preview',
    'portal.receipt_note': 'Professional template with VAT, date & expense report',
    'portal.receipt_downloaded': 'Official PDF receipt generated and downloaded!',
    'portal.receipt_error': 'Error downloading receipt',

    // Receipt Modal & Print
    'receipt.modal_title': 'Wi-Fi Purchase Receipt',
    'receipt.modal_subtitle': 'Professional template ready to print or download',
    'receipt.print': 'Print',
    'receipt.download_pdf': 'Download PDF',
    'receipt.downloading': 'Generating...',
    'receipt.gateway_tag': 'Secure Internet Access Gateway',
    'receipt.paid_badge': '✓ PAID',
    'receipt.ref': 'Ref',
    'receipt.seller_header': 'Establishment / Merchant',
    'receipt.wifi_network': 'Wi-Fi Network',
    'receipt.payment_details': 'Payment Details',
    'receipt.date': 'Date',
    'receipt.client': 'Customer',
    'receipt.col_desc': 'Description',
    'receipt.col_duration': 'Duration',
    'receipt.col_qty': 'Qty',
    'receipt.col_unit_ht': 'Unit Ex-Tax',
    'receipt.col_total_ttc': 'Total Inc-Tax',
    'receipt.plan_item': 'Wi-Fi Pass',
    'receipt.plan_sub': 'Unlimited high-speed & secure connection',
    'receipt.discount_applied': 'Discount applied (Promo code: {code})',
    'receipt.subtotal_ht': 'Subtotal (Ex-Tax)',
    'receipt.vat': 'VAT',
    'receipt.total_paid': 'TOTAL PAID (Inc-Tax)',
    'receipt.credentials_title': 'Your Wi-Fi Login Credentials',
    'receipt.credentials_help': 'Connect to network {ssid} and enter this code on the captive portal page.',
    'receipt.scan_qr': 'Scan Wi-Fi',
    'receipt.legal_title': 'Proof of Purchase & Expense Report',
    'receipt.legal_body': 'This document certifies payment for the Wi-Fi package for the indicated duration. Keep it for your accounting records.',
    'receipt.email_copy_title': 'Receive a copy of receipt via email',
    'receipt.email_sent': 'Email sent successfully!',
    'receipt.email_placeholder': 'your.email@example.com',
    'receipt.send': 'Send',
    'receipt.sending': 'Sending...',
    'receipt.close': 'Close',
    'receipt.code_copied': 'Wi-Fi code copied to clipboard!',
    'receipt.print_error': 'Unable to open print dialog.',
    'receipt.footer_note': 'High-resolution A4 format • Ready for archival',

    // Expiry & Feedback
    'portal.session_expiry_title': 'Session expiring soon',
    'portal.session_expiry_msg': 'Your Wi-Fi session expires in less than 5 minutes.',
    'portal.session_critical_title': 'Warning: Last minute of access!',
    'portal.session_critical_msg': 'Your internet connection will be disconnected in a few seconds. Extend your session now to avoid interruption.',
    'portal.session_expired_title': 'Wi-Fi Session Expired',
    'portal.session_expired_msg': 'Your Wi-Fi access time has expired. Please renew your connection or purchase an extension.',
    'portal.reconnect': 'Renew my connection',
    'portal.status_active': 'Active session',
    'portal.status_expiring': 'Expiring soon',
    'portal.status_critical': 'Last minute',
    'portal.status_expired': 'Session expired',
    'portal.extend_session': 'Extend session (+2h)',
    'portal.rate_exp': 'How would you rate our establishment?',
    'portal.rate_experience': 'How would you rate your experience?',
    'portal.send_feedback': 'Send and connect',
    'portal.send': 'Submit',
    'portal.thank_you_feedback': 'Thank you for your feedback! 🎉',
    'portal.feedback_help': 'Your feedback helps us improve.',
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
  },
  es: {
    // Portal - Navigation & Header
    'portal.back_to_site': 'Volver al sitio',
    'portal.welcome': 'Bienvenido a {location}',
    'portal.stay_connected': 'Manténgase conectado',
    'portal.remaining': 'Restante',
    'portal.connect_free': 'Conectarse gratis',
    'portal.connect_auto': 'Conexión Automática',
    'portal.buy_pass': 'Comprar un pase',
    'portal.connected': '¡Conectado!',
    'portal.internet_access': 'Ahora tiene acceso a Internet.',
    'portal.time_remaining': 'Tiempo restante',
    'portal.premium_extension': 'Extensión Premium',
    'portal.hours': 'Horas',
    'portal.minutes': 'Mins',
    'portal.free_wifi_msg': 'Inicie sesión para acceder al Wi-Fi gratuito.',
    'portal.free_wifi_duration_msg': 'Inicie sesión para disfrutar de {duration} de Wi-Fi gratuito.',
    'portal.sec_conn': 'Conexión segura por WiFiCash',
    'portal.or_connect_with': 'O iniciar sesión con',
    'portal.connect_with': 'Conectarse con {provider}',
    'portal.enter_email': 'Introduzca su correo electrónico',
    'portal.connect': 'Conectar',
    'portal.connect_now': 'Conectarse ahora',
    'portal.continue_to_site': 'Continuar al sitio web',
    'portal.terms_default': 'Al conectarse, acepta las condiciones generales de uso de esta red.',

    // Passes & Durations
    'portal.available_passes': 'Pases disponibles',
    'portal.duration': 'Duración',
    'portal.day': 'día',
    'portal.days': 'días',
    'portal.hour_short': 'h',
    'portal.min_short': 'min',
    'portal.free_badge': 'Gratis',
    'portal.pass_2h_title': 'Premium 2 Horas',
    'portal.pass_2h_desc': 'Alta velocidad sin publicidad',
    'portal.pass_24h_title': 'Pase de un día (24h)',
    'portal.pass_24h_desc': 'Acceso ilimitado durante todo el día',

    // Promo code
    'portal.promo_code': '¿Código promocional?',
    'portal.apply': 'Aplicar',
    'portal.applying': 'Comprobando...',
    'portal.applied_code': 'Código aplicado',

    // Ads & Connection
    'portal.watch_ad': 'Ver anuncio ({timeLeft}s)',
    'portal.ad_badge': 'Publicidad',
    'portal.ad_space': 'Espacio Publicitario',
    'portal.your_ad_here': 'Su anuncio aquí',
    'portal.connecting': 'Conectando...',

    // Payment & Success
    'portal.payment_title': 'Pago Seguro',
    'portal.pay': 'Pagar',
    'portal.processing': 'Procesando...',
    'portal.error_occurred': 'Ocurrió un error.',
    'portal.promo_invalid': 'Código promocional inválido o expirado.',
    'portal.promo_limit': 'Este código ha alcanzado su límite de uso.',
    'portal.promo_error': 'Error durante la verificación.',
    'portal.payment_session_error': 'Error al iniciar la sesión de pago',
    'portal.card_stripe': 'Tarjeta de Crédito (Stripe)',
    'portal.payment_success_title': 'Pago Exitoso',
    'portal.payment_success_sub': '¡Gracias por su compra! Aquí está su código de conexión.',
    'portal.internet_active': 'Acceso a Internet Activado',
    'portal.wifi_access_code': 'Código de acceso Wi-Fi',
    'portal.download_receipt': 'Descargar Recibo PDF',
    'portal.generating_receipt': 'Generando...',
    'portal.preview_receipt': 'Vista previa',
    'portal.receipt_note': 'Plantilla profesional con IVA, fecha y nota de gastos',
    'portal.receipt_downloaded': '¡Recibo PDF oficial generado y descargado!',
    'portal.receipt_error': 'Error al descargar el recibo',

    // Receipt Modal & Print
    'receipt.modal_title': 'Recibo de Compra Wi-Fi',
    'receipt.modal_subtitle': 'Plantilla profesional lista para imprimir o descargar',
    'receipt.print': 'Imprimir',
    'receipt.download_pdf': 'Descargar PDF',
    'receipt.downloading': 'Descargando...',
    'receipt.gateway_tag': 'Pasarela de acceso a internet segura',
    'receipt.paid_badge': '✓ PAGADO',
    'receipt.ref': 'Ref',
    'receipt.seller_header': 'Establecimiento / Vendedor',
    'receipt.wifi_network': 'Red Wi-Fi',
    'receipt.payment_details': 'Detalles del Pago',
    'receipt.date': 'Fecha',
    'receipt.client': 'Cliente',
    'receipt.col_desc': 'Descripción',
    'receipt.col_duration': 'Duración',
    'receipt.col_qty': 'Cant.',
    'receipt.col_unit_ht': 'P.U. sin IVA',
    'receipt.col_total_ttc': 'Total con IVA',
    'receipt.plan_item': 'Pase Wi-Fi',
    'receipt.plan_sub': 'Conexión de alta velocidad ilimitada y segura',
    'receipt.discount_applied': 'Descuento aplicado (Código: {code})',
    'receipt.subtotal_ht': 'Subtotal sin IVA',
    'receipt.vat': 'IVA',
    'receipt.total_paid': 'TOTAL PAGADO (con IVA)',
    'receipt.credentials_title': 'Sus Credenciales de Conexión Wi-Fi',
    'receipt.credentials_help': 'Conéctese a la red {ssid} e ingrese este código en la página de inicio.',
    'receipt.scan_qr': 'Escanear Wi-Fi',
    'receipt.legal_title': 'Comprobante de compra y nota de gastos',
    'receipt.legal_body': 'Este documento certifica el pago del paquete Wi-Fi por la duración indicada. Consérvelo para su registro contable.',
    'receipt.email_copy_title': 'Recibir una copia del recibo por correo',
    'receipt.email_sent': '¡Correo enviado con éxito!',
    'receipt.email_placeholder': 'su.correo@ejemplo.com',
    'receipt.send': 'Enviar',
    'receipt.sending': 'Enviando...',
    'receipt.close': 'Cerrar',
    'receipt.code_copied': '¡Código Wi-Fi copiado al portapapeles!',
    'receipt.print_error': 'No se pudo abrir el cuadro de impresión.',
    'receipt.footer_note': 'Formato A4 de alta resolución • Listo para archivo',

    // Expiry & Feedback
    'portal.session_expiry_title': 'Sesión por expirar',
    'portal.session_expiry_msg': 'Su sesión de Wi-Fi expira en menos de 5 minutos.',
    'portal.session_critical_title': '¡Atención: Último minuto de conexión!',
    'portal.session_critical_msg': 'Su acceso a Internet se interrumpirá en unos instantes. Extienda ahora mismo para seguir en línea.',
    'portal.session_expired_title': 'Sesión Wi-Fi Expirada',
    'portal.session_expired_msg': 'Su tiempo de acceso Wi-Fi ha terminado. Renueve su conexión o contrate una extensión.',
    'portal.reconnect': 'Renovar mi conexión',
    'portal.status_active': 'Sesión activa',
    'portal.status_expiring': 'Expira pronto',
    'portal.status_critical': 'Último minuto',
    'portal.status_expired': 'Sesión expirada',
    'portal.extend_session': 'Extender sesión (+2h)',
    'portal.rate_exp': '¿Cómo califica nuestro establecimiento?',
    'portal.rate_experience': '¿Cómo califica su experiencia?',
    'portal.send_feedback': 'Enviar y conectar',
    'portal.send': 'Enviar',
    'portal.thank_you_feedback': '¡Gracias por su opinión! 🎉',
    'portal.feedback_help': 'Su opinión nos ayuda a mejorar continuamente.',
    'portal.skip': 'Omitir',

    // Landing
    'landing.hero_title': 'Monetice su red Wi-Fi',
    'landing.hero_subtitle': 'Para Cafeterías, Hoteles y Espacios de Coworking. Convierta su Wi-Fi gratuito en una fuente de ingresos con nuestro portal cautivo inteligente.',
    'landing.start_free': 'Comenzar gratis',
    'landing.demo': 'Ver demostración',
    'landing.features': 'Funciones V2.0',
    'landing.login': 'Iniciar sesión',
    'landing.dashboard': 'Panel de control',
    'landing.pricing': 'Precios',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  setLanguage: () => {},
  t: (key) => key,
  languages: AVAILABLE_LANGUAGES,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'fr' || saved === 'en' || saved === 'es')) {
      setLanguageState(saved);
    } else {
      // Automatic browser language detection for international travelers
      const browserLang = navigator.language.slice(0, 2);
      if (browserLang === 'es') {
        setLanguageState('es');
      } else if (browserLang === 'en') {
        setLanguageState('en');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, variables?: Record<string, any>) => {
    let text = translations[language]?.[key] || translations['fr']?.[key] || key;
    if (variables) {
      Object.keys(variables).forEach(varKey => {
        text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), variables[varKey]);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: AVAILABLE_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
