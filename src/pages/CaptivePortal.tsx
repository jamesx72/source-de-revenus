import React, { useState, useEffect } from 'react';
import { Wifi, PlayCircle, CreditCard, Facebook, ShieldCheck, CheckCircle2, ChevronLeft, Smartphone, Sparkles, Star, AlertCircle, AlertTriangle, Clock, RefreshCw, Bell, X, Download, FileText, Printer, DollarSign, Coins, Copy, Check, Ticket, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { QRCodeSVG } from 'qrcode.react';
import { 
  getStoredGatewaysConfig, 
  sanitizeGatewaysConfig, 
  isValidSolanaAddress,
  VALID_DEMO_SOLANA_ADDRESS,
  PaymentGatewaysConfig 
} from '../components/PaymentGatewaysSettings';
import { ReceiptModal } from '../components/ReceiptModal';
import { downloadReceiptPdf } from '../utils/generateReceiptPdf';
import { WifiReceipt } from '../types';
import { toast } from 'sonner';

const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLIC_KEY || '');

function CheckoutForm({ duration }: { duration: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/portal?locationId=${new URLSearchParams(window.location.search).get('locationId')}&payment_success=true&duration=${duration}`,
      },
    });

    if (error) {
      setErrorMessage(error.message || t('portal.error_occurred'));
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <PaymentElement />
      {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
      <button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-bold flex justify-center mt-4 transition-colors disabled:opacity-50"
      >
        {isProcessing ? t('portal.processing') : t('portal.pay')}
      </button>
    </form>
  );
}

interface CountdownTimerProps {
  timeLeft: number | null;
  maxTime: number;
  onExtend?: () => void;
  isProcessing?: boolean;
}

function CountdownTimer({ timeLeft, maxTime, onExtend, isProcessing }: CountdownTimerProps) {
  const { t } = useLanguage();
  if (timeLeft === null) return null;
  const percentage = Math.max(0, Math.min(100, (timeLeft / (maxTime || 1)) * 100));
  
  const format = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft === 0;
  const isCritical = timeLeft <= 60 && timeLeft > 0;
  const isWarning = timeLeft <= 300 && timeLeft > 60;

  const circumference = 88 * 2 * Math.PI;

  return (
    <div className="flex flex-col items-center mb-6">
      {/* Dynamic Status Badge */}
      <div className="mb-3">
        {isExpired ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {t('portal.status_expired')}
          </span>
        ) : isCritical ? (
          <motion.span 
            animate={{ scale: [1, 1.06, 1] }} 
            transition={{ repeat: Infinity, duration: 0.9 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <AlertTriangle size={13} className="text-rose-500" />
            <span>{t('portal.status_critical')} ({timeLeft}s)</span>
          </motion.span>
        ) : isWarning ? (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <Clock size={13} className="text-amber-500" />
            <span>{t('portal.status_expiring')}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{t('portal.status_active')}</span>
          </span>
        )}
      </div>

      {/* Circular Progress Gauge */}
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            className="text-slate-200 dark:text-white/10"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="88"
            cx="96"
            cy="96"
          />
          <motion.circle
            className={`transition-colors duration-500 ${
              isExpired 
                ? 'text-rose-400/40' 
                : isCritical 
                ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' 
                : isWarning 
                ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                : 'text-indigo-500'
            }`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="88"
            cx="96"
            cy="96"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - percentage / 100) }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </svg>

        <div className="flex flex-col items-center justify-center z-10">
          <motion.p 
            animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.9 }}
            className={`text-4xl font-bold font-mono tracking-tight transition-colors ${
              isExpired 
                ? 'text-slate-400 dark:text-slate-500' 
                : isCritical 
                ? 'text-rose-600 dark:text-rose-400' 
                : isWarning 
                ? 'text-amber-600 dark:text-amber-400' 
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {format(timeLeft)}
          </motion.p>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
            {isExpired ? t('portal.status_expired') : t('portal.remaining')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CaptivePortal() {
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const locationId = searchParams.get('locationId');
  const isDemo = searchParams.get('demo') === 'true';
  
  const [step, setStep] = useState<'home' | 'ad' | 'success' | 'payment' | 'payment_success'>('home');
  const [adProgress, setAdProgress] = useState(0);
  const [activeAd, setActiveAd] = useState<any>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentCode, setPaymentCode] = useState<string>('');
  const [purchasedPass, setPurchasedPass] = useState<{ name: string; price: number; duration: number } | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  
  const [locationName, setLocationName] = useState('Le Café Central');
  const [portalConfig, setPortalConfig] = useState<any>(null);
  const [wifiConfig, setWifiConfig] = useState<any>(null);
  const [paymentConfig, setPaymentConfig] = useState({ currency: 'eur', price1h: 2, price24h: 5 });
  const [locationOwnerId, setLocationOwnerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [portalPaymentGateway, setPortalPaymentGateway] = useState<'card' | 'paypal' | 'solana'>('paypal');
  const [portalPaymentMethodUsed, setPortalPaymentMethodUsed] = useState<string>('PayPal Express');
  const [portalGatewaysConfig, setPortalGatewaysConfig] = useState<PaymentGatewaysConfig>(getStoredGatewaysConfig);
  const [stripeAvailable, setStripeAvailable] = useState<boolean>(Boolean((import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY));
  const [stripeInitError, setStripeInitError] = useState<string | null>(null);
  const [selectedCryptoToken, setSelectedCryptoToken] = useState<'SOL' | 'USDC'>('SOL');
  const [cryptoTxSignature, setCryptoTxSignature] = useState<string>('');
  const [solanaCopied, setSolanaCopied] = useState(false);
  const [amountCopied, setAmountCopied] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [maxTime, setMaxTime] = useState<number>(0);
  const [hasShown5MinWarning, setHasShown5MinWarning] = useState(false);
  const [hasShown1MinWarning, setHasShown1MinWarning] = useState(false);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const generateSecurePortalCode = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randomBytes = new Uint32Array(8);
    window.crypto.getRandomValues(randomBytes);
    let out = '';
    for (let i = 0; i < 8; i++) {
      out += alphabet[randomBytes[i] % alphabet.length];
    }
    return out;
  };

  const handleDirectPortalPaymentSuccess = async (
    method: string,
    gatewayKey: 'paypal' | 'solana',
    extra?: { cryptoAmount?: string; token?: 'SOL' | 'USDC' }
  ) => {
    setIsProcessingPayment(true);
    try {
      const passPrice = purchasedPass?.price ?? (paymentConfig.price1h || 2);
      const passName = purchasedPass?.name || 'Pass Wi-Fi';
      const durationMinutes = purchasedPass?.duration || selectedDuration || 120;
      const currencyUpper = (paymentConfig.currency || 'eur').toUpperCase();

      let paymentRef = '';

      if (gatewayKey === 'paypal') {
        const createRes = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: passPrice.toFixed(2),
            currency: currencyUpper,
            clientId: portalGatewaysConfig.paypalClientId,
            merchantEmail: portalGatewaysConfig.paypalMerchantEmail,
            mode: portalGatewaysConfig.paypalMode || 'sandbox',
            description: `${locationName} - ${passName}`,
          }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) {
          throw new Error(createData.error || "Impossible d'initialiser le paiement PayPal.");
        }

        const capRes = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: createData.orderId,
            clientId: portalGatewaysConfig.paypalClientId,
            mode: portalGatewaysConfig.paypalMode || 'sandbox',
          }),
        });
        const capData = await capRes.json();
        if (!capRes.ok) {
          throw new Error(capData.error || 'La confirmation PayPal a échoué.');
        }
        paymentRef = capData.orderId || createData.orderId || '';
      } else if (gatewayKey === 'solana') {
        const safeWallet = isValidSolanaAddress(portalGatewaysConfig.solanaWalletAddress)
          ? portalGatewaysConfig.solanaWalletAddress
          : VALID_DEMO_SOLANA_ADDRESS;
        const verifyRes = await fetch('/api/crypto/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: safeWallet,
            amount: extra?.cryptoAmount || '0.02',
            token: extra?.token || selectedCryptoToken,
            network: portalGatewaysConfig.solanaNetwork || 'mainnet',
            txHash: cryptoTxSignature.trim() || undefined,
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyData.error || 'Vérification du paiement Crypto refusée.');
        }
        paymentRef = verifyData.reference || '';
      }

      const code = generateSecurePortalCode();
      setPaymentCode(code);
      setPortalPaymentMethodUsed(method);

      try {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const ua = navigator.userAgent;
        let os = "Inconnu";
        let deviceType = "Appareil";
        if (ua.includes("Win")) { os = "Windows"; deviceType = "PC"; }
        else if (ua.includes("Mac")) { os = "macOS"; deviceType = "Mac"; }
        else if (ua.includes("Linux")) { os = "Linux"; deviceType = "PC"; }
        if (ua.includes("iPhone")) { os = "iOS"; deviceType = "iPhone"; }
        else if (ua.includes("iPad")) { os = "iPadOS"; deviceType = "iPad"; }
        else if (ua.includes("Android")) { os = "Android"; deviceType = "Mobile Android"; }

        const safeLocId = locationId || 'default';
        const nowIso = new Date().toISOString();

        // Record transaction for Admin Dashboard revenue & analytics
        await addDoc(collection(db, 'transactions'), {
          locationId: safeLocId,
          locationName: locationName || 'WiFiCash Hotspot',
          userId: locationOwnerId || null,
          amount: passPrice,
          currency: currencyUpper,
          cryptoAmount: extra?.cryptoAmount ? parseFloat(extra.cryptoAmount) : null,
          cryptoToken: gatewayKey === 'solana' ? (extra?.token || selectedCryptoToken) : null,
          status: 'paid',
          paymentMethod: method,
          gateway: gatewayKey,
          paymentReference: paymentRef || null,
          passName,
          duration: durationMinutes,
          voucherCode: code,
          discountCode: appliedPromo?.code || null,
          createdAt: nowIso,
        });

        // Record active connection
        await addDoc(collection(db, 'connections'), {
          locationId: safeLocId,
          locationName: locationName || 'WiFiCash Hotspot',
          userId: locationOwnerId || null,
          device: deviceType,
          os,
          duration: durationMinutes,
          connectedAt: serverTimestamp(),
          status: 'Connecté',
          paymentStatus: 'paid',
          paymentMethod: method,
          paymentReference: paymentRef || null,
          code
        });
      } catch (e) {
        console.warn("Firestore payment/connection log warning:", e);
      }

      // Initialize session countdown timer & localStorage persistence
      const totalSec = durationMinutes * 60;
      setTimeLeft(totalSec);
      setMaxTime(totalSec);
      setHasShown5MinWarning(false);
      setHasShown1MinWarning(false);
      setShowExpiryWarning(false);
      setShowExpiredModal(false);

      const storageKey = `wificash_session_${locationId || 'default'}`;
      localStorage.setItem(storageKey, JSON.stringify({
        expiresAt: Date.now() + totalSec * 1000,
        maxTime: totalSec,
        startedAt: Date.now(),
        voucherCode: code,
        durationMinutes
      }));

      // Authorize UniFi client if hardware MAC parameters present
      if (!isDemo) {
        const unifiId = searchParams.get('id');
        const unifiAp = searchParams.get('ap');
        if (unifiId && locationId) {
          fetch('/api/router/unifi/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mac: unifiId, ap: unifiAp, locationId, minutes: durationMinutes })
          }).catch(() => {});
        }
      }

      setStep('payment_success');
      toast.success(`Paiement validé via ${method} ! Accès Wi-Fi activé.`);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la validation du paiement.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Promo code feature
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Secure Voucher Redemption feature
  const [voucherCodeInput, setVoucherCodeInput] = useState(() => (searchParams.get('code') || '').toUpperCase());
  const [isRedeemingVoucher, setIsRedeemingVoucher] = useState(false);
  const [voucherRedeemError, setVoucherRedeemError] = useState('');

  // Keep voucher input in sync with URL ?code=...
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !voucherCodeInput) {
      setVoucherCodeInput(urlCode.toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UPDATE_PORTAL_CONFIG') {
        if (event.data.config) {
          setPortalConfig(event.data.config);
        }
        if (event.data.name) {
          setLocationName(event.data.name);
        }
        if (event.data.paymentConfig) {
          setPaymentConfig(event.data.paymentConfig);
        }
        if (event.data.paymentGateways) {
          setPortalGatewaysConfig(sanitizeGatewaysConfig(event.data.paymentGateways));
        }
      } else if (event.data?.type === 'TEST_AD_FLOW') {
        window.dispatchEvent(new CustomEvent('t_test_ad_flow'));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};

    const fetchLocation = async () => {
      // payment handling check
      if (searchParams.get('payment_success') === 'true') {
         const paymentIntentId = searchParams.get('payment_intent');
         const urlDuration = parseInt(searchParams.get('duration') || '120', 10);
         if (paymentIntentId) {
            try {
               const res = await fetch('/api/verify-payment', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ payment_intent: paymentIntentId })
               });
               const data = await res.json();
               if (data.voucherCode) {
                 setPaymentCode(data.voucherCode);
                 setStep('payment_success');

                 // We do not run simulate ad, we manually log it.
                 if (locationId) {
                    try {
                      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                      const { db } = await import('../firebase');
                      const ua = navigator.userAgent;
                      let os = "Inconnu";
                      let deviceType = "Appareil";
                      if (ua.includes("Win")) { os = "Windows"; deviceType = "PC"; }
                      else if (ua.includes("Mac")) { os = "macOS"; deviceType = "Mac"; }
                      else if (ua.includes("Linux")) { os = "Linux"; deviceType = "PC"; }
                      
                      if (ua.includes("iPhone")) { os = "iOS"; deviceType = "iPhone"; }
                      else if (ua.includes("iPad")) { os = "iPadOS"; deviceType = "iPad"; }
                      else if (ua.includes("Android")) { os = "Android"; deviceType = "Mobile Android"; }

                      await addDoc(collection(db, 'connections'), {
                        locationId,
                        locationName: locationName || 'Location Paid',
                        userId: locationOwnerId,
                        device: deviceType,
                        os,
                        duration: urlDuration, 
                        connectedAt: serverTimestamp(),
                        status: 'Connecté',
                        paymentStatus: 'paid'
                      });
                    } catch (err) {
                      console.error("Failed to log connection:", err);
                    }
                 }
               }
            } catch (err) {
               console.error("Failed to verify payment intent", err);
            }
         } else {
             // Fallback if no payment_intent (for embedded checkout logic)
             setPaymentCode(Math.random().toString(36).substring(2, 10).toUpperCase());
             setStep('payment_success');
         }
      }

      if (!locationId && !isDemo) {
        setIsLoading(false);
        return;
      }

      if (isDemo) {
        setLocationName("Café Démo de Paris");
        setPortalConfig({
           layoutTemplate: 'modern',
           primaryColor: '#6366f1',
           logoUrl: '',
           welcomeMessage: 'Bienvenue au Café Démo ! Profitez de notre réseau haut débit.',
           allowFree: true,
           allowPremium: true,
           allowExtension: true,
           freeDuration: 30,
           authMethods: ['email', 'google', 'facebook']
        });
        setPaymentConfig({
           currency: 'eur',
           price1h: 2.5,
           price24h: 5,
           passes: [
             { 
               id: 'demo-free', 
               name: 'Pass Découverte', 
               price: 0, 
               duration: 30, 
               badge: 'Gratuit', 
               isAdSupported: true, 
               downloadSpeedLimit: 15,
               description: 'Session sponsorisée avec 1 courte annonce',
               stripePriceId: '' 
             },
             { 
               id: 'demo-2h', 
               name: 'Pass Coffee & Work (2h)', 
               price: 2.5, 
               duration: 120, 
               badge: 'Populaire', 
               isAdSupported: false, 
               downloadSpeedLimit: 40,
               description: 'Haut débit prioritaire sans publicité',
               stripePriceId: '' 
             },
             { 
               id: 'demo-24h', 
               name: 'Pass Journée Complète (24h)', 
               price: 5, 
               duration: 1440, 
               badge: 'Meilleure Offre', 
               isAdSupported: false, 
               downloadSpeedLimit: 60,
               description: 'Accès illimité 24h multi-appareils',
               stripePriceId: '' 
             }
           ]
        });
        setIsLoading(false);
        return;
      }
      
      try {
        const { doc, onSnapshot } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const docRef = doc(db, 'locations', locationId);
        
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setLocationName(data.name || 'Le Café Central');
            if (data.userId) {
              setLocationOwnerId(data.userId);
            }
            if (data.portalConfig) {
              setPortalConfig(data.portalConfig);
            }
            if (data.paymentConfig) {
              setPaymentConfig(data.paymentConfig);
            }
            if (data.wifiConfig) {
              setWifiConfig(data.wifiConfig);
            }
            if (data.paymentGateways) {
              setPortalGatewaysConfig(sanitizeGatewaysConfig(data.paymentGateways));
            }
          }
          setIsLoading(false);
        }, (err) => {
          console.error("Error with onSnapshot for location:", err);
          setIsLoading(false);
        });
      } catch (err) {
        console.error("Error setting up snapshot:", err);
        setIsLoading(false);
      }
    };
    
    fetchLocation();

    return () => unsubscribe();
  }, [locationId, searchParams]);

  const [selectedDuration, setSelectedDuration] = useState<number>(120);

  const handleCheckout = async (basePriceAmount: number, passName: string, duration?: number, _stripePriceId?: string) => {
    setIsProcessingPayment(true);
    const effectiveDuration = duration || 120;
    setSelectedDuration(effectiveDuration);

    // Apply promo discount accurately in cents
    let discountedCents = basePriceAmount;
    if (appliedPromo) {
      if (appliedPromo.type === 'percentage') {
        discountedCents = Math.max(0, Math.round(basePriceAmount * (1 - (appliedPromo.value / 100))));
      } else if (appliedPromo.type === 'flat') {
        discountedCents = Math.max(0, basePriceAmount - Math.round(appliedPromo.value * 100));
      }
      if (discountedCents > 0 && discountedCents < 50) {
        discountedCents = 50;
      }
    }

    setPurchasedPass({
      name: passName,
      price: discountedCents / 100,
      duration: effectiveDuration,
    });
    setCryptoTxSignature('');
    setStripeInitError(null);
    setClientSecret(null);

    const hasStripePubKey = Boolean((import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY) &&
      (import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY !== 'pk_test_...';
    const canUsePaypal = portalGatewaysConfig.paypalEnabled !== false;
    const canUseCrypto = portalGatewaysConfig.cryptoEnabled !== false;
    const canUseCard = portalGatewaysConfig.stripeEnabled !== false && hasStripePubKey && !isDemo;

    // Pick initial gateway tab cleanly
    if (canUsePaypal) {
      setPortalPaymentGateway('paypal');
    } else if (canUseCrypto) {
      setPortalPaymentGateway('solana');
    } else {
      setPortalPaymentGateway('card');
    }

    // Open checkout step so guest can always pay via PayPal or Crypto
    setStep('payment');

    if (!canUseCard) {
      setStripeAvailable(false);
      if (!hasStripePubKey && !isDemo) {
        setStripeInitError("Le paiement CB Stripe n'est pas configuré sur cet établissement. Réglez en 1 clic via PayPal ou Crypto.");
      }
      setIsProcessingPayment(false);
      return;
    }

    try {
      const clientMac = searchParams.get('mac') || searchParams.get('client_mac') || searchParams.get('id') || 'unknown-mac';

      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           priceAmount: discountedCents, 
           currency: paymentConfig.currency || 'eur',
           passName, 
           locationId, 
           userId: locationOwnerId,
           discountCode: appliedPromo?.code || '',
           clientMac
        })
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStripeAvailable(true);
      } else {
        setStripeAvailable(false);
        setStripeInitError(data.error || "Stripe CB indisponible. Utilisez PayPal ou Crypto.");
        if (canUsePaypal) {
          setPortalPaymentGateway('paypal');
        } else if (canUseCrypto) {
          setPortalPaymentGateway('solana');
        }
      }
    } catch (err) {
      console.warn("Stripe intent fallback to PayPal/Crypto:", err);
      setStripeAvailable(false);
      setStripeInitError("Serveur Stripe indisponible. Veuillez régler via PayPal ou Crypto.");
      if (canUsePaypal) {
        setPortalPaymentGateway('paypal');
      } else if (canUseCrypto) {
        setPortalPaymentGateway('solana');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setIsApplyingPromo(true);
    setPromoError('');
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const discountsRef = collection(db, 'discounts');
      const q = query(discountsRef, where('code', '==', promoCodeInput.trim().toUpperCase()), where('locationId', '==', locationId), where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setPromoError(t('portal.promo_invalid'));
        setAppliedPromo(null);
      } else {
        const discountDoc = snapshot.docs[0];
        const data = discountDoc.data();
        if (data.maxUses !== null && data.uses >= data.maxUses) {
            setPromoError(t('portal.promo_limit'));
            setAppliedPromo(null);
        } else {
            setAppliedPromo({ id: discountDoc.id, ...data });
        }
      }
    } catch (err) {
       console.error(err);
       setPromoError(t('portal.promo_error'));
    } finally {
       setIsApplyingPromo(true);
       setTimeout(() => setIsApplyingPromo(false), 500); // Visual feedback
    }
  };

  const handleRedeemVoucher = async (codeToUse?: string) => {
    const cleanCode = (codeToUse || voucherCodeInput).trim().toUpperCase();
    if (!cleanCode) {
      setVoucherRedeemError("Veuillez saisir votre code voucher.");
      toast.error("Veuillez saisir votre code voucher.");
      return;
    }

    setIsRedeemingVoucher(true);
    setVoucherRedeemError('');

    try {
      const { collection, query, where, getDocs, runTransaction, addDoc, serverTimestamp } = await import('firebase/firestore');
      const ua = navigator.userAgent;
      let os = "Inconnu";
      let deviceType = "Appareil";
      if (ua.includes("Win")) { os = "Windows"; deviceType = "PC"; }
      else if (ua.includes("Mac")) { os = "macOS"; deviceType = "Mac"; }
      else if (ua.includes("Linux")) { os = "Linux"; deviceType = "PC"; }
      if (ua.includes("iPhone")) { os = "iOS"; deviceType = "iPhone"; }
      else if (ua.includes("iPad")) { os = "iPadOS"; deviceType = "iPad"; }
      else if (ua.includes("Android")) { os = "Android"; deviceType = "Mobile Android"; }

      const vouchersRef = collection(db, 'vouchers');
      const q = query(vouchersRef, where('code', '==', cleanCode));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error("Code voucher introuvable ou invalide.");
      }

      const targetDocRef = snapshot.docs[0].ref;
      const nowIso = new Date().toISOString();

      const redeemedResult = await runTransaction(db, async (transaction) => {
        const freshSnap = await transaction.get(targetDocRef);
        if (!freshSnap.exists()) {
          throw new Error("Code voucher introuvable.");
        }
        const voucher = freshSnap.data() as any;

        if (voucher.status === 'used') {
          const usedDate = voucher.usedAt ? new Date(voucher.usedAt).toLocaleString('fr-FR') : '';
          throw new Error(`Ce voucher a déjà été utilisé${usedDate ? ' le ' + usedDate : ''}.`);
        }
        if (voucher.status === 'revoked') {
          throw new Error("Ce voucher a été révoqué par l'administrateur.");
        }
        if (voucher.status === 'expired') {
          throw new Error("Ce voucher a expiré.");
        }

        if (voucher.expiresAt && new Date(voucher.expiresAt).getTime() < Date.now()) {
          transaction.update(targetDocRef, { status: 'expired', updatedAt: nowIso });
          throw new Error("Ce voucher a dépassé sa date limite de validité.");
        }

        if (voucher.locationId && voucher.locationId !== 'all' && locationId && voucher.locationId !== locationId) {
          throw new Error("Ce voucher n'est pas utilisable dans cet établissement.");
        }

        // Compute duration in minutes (default 60 min = 1h pass)
        let durationMinutes = 60;
        const dStr = String(voucher.duration || '1h').toLowerCase();
        if (voucher.durationMinutes && Number(voucher.durationMinutes) > 0) {
          durationMinutes = Number(voucher.durationMinutes);
        } else if (dStr.includes('30m') || dStr.includes('30 min')) {
          durationMinutes = 30;
        } else if (dStr === '1h' || dStr.includes('1 heure') || dStr === '60') {
          durationMinutes = 60;
        } else if (dStr === '2h' || dStr.includes('2 heure') || dStr === '120') {
          durationMinutes = 120;
        } else if (dStr === '4h' || dStr.includes('4 heure') || dStr === '240') {
          durationMinutes = 240;
        } else if (dStr === '8h' || dStr.includes('8 heure') || dStr === '480') {
          durationMinutes = 480;
        } else if (dStr === '24h' || dStr.includes('jour') || dStr === '1440') {
          durationMinutes = 1440;
        } else if (dStr === '7d' || dStr.includes('semaine') || dStr.includes('7 jour') || dStr === '10080') {
          durationMinutes = 10080;
        } else if (dStr === '30d' || dStr.includes('mois') || dStr.includes('30 jour') || dStr === '43200') {
          durationMinutes = 43200;
        } else {
          const parsed = parseInt(dStr, 10);
          if (!isNaN(parsed) && parsed > 0) {
            durationMinutes = parsed;
          }
        }

        transaction.update(targetDocRef, {
          status: 'used',
          usedAt: nowIso,
          usedByMac: searchParams.get('id') || searchParams.get('mac') || 'guest-client',
          usedByDevice: `${deviceType} (${os})`,
          updatedAt: nowIso
        });

        return { voucher, durationMinutes };
      });

      const { voucher, durationMinutes } = redeemedResult;
      const totalSec = durationMinutes * 60;
      const passTitle = voucher.duration || formatPassDuration(durationMinutes);

      // Log active connection in Firestore for real-time Admin Dashboard monitoring
      try {
        const effectiveLocId = (voucher.locationId && voucher.locationId !== 'all')
          ? voucher.locationId
          : (locationId || 'global');
        await addDoc(collection(db, 'connections'), {
          locationId: effectiveLocId,
          locationName: voucher.locationName || locationName || 'WiFiCash Hotspot',
          userId: voucher.createdBy || locationOwnerId || null,
          device: deviceType,
          os,
          duration: durationMinutes,
          connectedAt: serverTimestamp(),
          status: 'Connecté',
          paymentStatus: 'voucher',
          paymentMethod: 'Code Voucher Sécurisé',
          voucherCode: cleanCode,
          speedLimit: voucher.speedLimit || null,
          dataLimit: voucher.dataLimit || null
        });
      } catch (connErr) {
        console.warn("Connection log notice:", connErr);
      }

      setPurchasedPass({
        name: `Pass Voucher (${passTitle})`,
        price: 0,
        duration: durationMinutes
      });
      setPaymentCode(cleanCode);
      setPortalPaymentMethodUsed("Code Voucher Sécurisé");

      // Set accurate ticking session countdown
      setTimeLeft(totalSec);
      setMaxTime(totalSec);
      const storageKey = `wificash_session_${locationId || 'default'}`;
      localStorage.setItem(storageKey, JSON.stringify({
        expiresAt: Date.now() + totalSec * 1000,
        maxTime: totalSec,
        startedAt: Date.now(),
        voucherCode: cleanCode,
        durationMinutes
      }));

      // Trigger MikroTik / UniFi router authorization if hardware params present
      if (!isDemo) {
        const unifiId = searchParams.get('id');
        const unifiAp = searchParams.get('ap');
        if (unifiId && locationId) {
          fetch('/api/router/unifi/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mac: unifiId, ap: unifiAp, locationId, minutes: durationMinutes })
          }).catch(() => {});
        }
      }

      setStep('payment_success');
      toast.success(`Code voucher validé ! Accès Wi-Fi activé pour ${formatPassDuration(durationMinutes)}.`);
    } catch (err: any) {
      console.error("Voucher redemption error:", err);
      const msg = err.message || "Erreur de validation du voucher.";
      setVoucherRedeemError(msg);
      toast.error(msg);
    } finally {
      setIsRedeemingVoucher(false);
    }
  };

  let sessionDuration = portalConfig?.sessionDuration !== undefined ? portalConfig.sessionDuration : 60;
  if (wifiConfig) {
    if (wifiConfig.timeLimit === 'unlimited') {
      sessionDuration = 0;
    } else if (wifiConfig.timeLimit === 'custom') {
      sessionDuration = wifiConfig.customTimeLimit || 60;
    } else if (wifiConfig.timeLimit) {
      sessionDuration = parseInt(wifiConfig.timeLimit) || 60;
    }
  }

  const handleAuthSuccess = () => {
    setStep('success');
    if (isDemo) return;

    const linkLoginOnly = searchParams.get('link-login-only'); // MikroTik
    const linkLogin = searchParams.get('link-login'); // MikroTik
    const unifiId = searchParams.get('id'); // UniFi
    const unifiAp = searchParams.get('ap'); // UniFi
    
    // MikroTik RouterOS Configuration Logic
    if (linkLoginOnly || linkLogin) {
        const url = linkLoginOnly || linkLogin;
        if (url) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = url;
            const inputUsername = document.createElement('input');
            inputUsername.name = 'username';
            inputUsername.value = 'T-Hotspot-Guest';
            form.appendChild(inputUsername);
            document.body.appendChild(form);
            form.submit();
        }
    } 
    // Ubiquiti UniFi Configuration Logic
    else if (unifiId && locationId) {
       fetch('/api/router/unifi/auth', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ mac: unifiId, ap: unifiAp, locationId })
       }).catch(console.error);
    }
  };

  const handleSocialLogin = async (providerName: 'google' | 'facebook') => {
    if (isDemo) {
      handleAuthSuccess();
      return;
    }
    
    try {
      const provider = providerName === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
      if (providerName === 'google') {
          provider.addScope('email');
          provider.addScope('profile');
      }
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      handleAuthSuccess();

      if (locationId) {
        try {
          const ua = navigator.userAgent;
          let os = "Inconnu";
          let deviceType = "Appareil";
          if (ua.includes("Win")) { os = "Windows"; deviceType = "PC"; }
          else if (ua.includes("Mac")) { os = "macOS"; deviceType = "Mac"; }
          else if (ua.includes("Linux")) { os = "Linux"; deviceType = "PC"; }
          
          if (ua.includes("iPhone")) { os = "iOS"; deviceType = "iPhone"; }
          else if (ua.includes("iPad")) { os = "iPadOS"; deviceType = "iPad"; }
          else if (ua.includes("Android")) { os = "Android"; deviceType = "Mobile Android"; }

          await addDoc(collection(db, 'connections'), {
            locationId,
            locationName,
            userId: locationOwnerId,
            customerEmail: user.email || null,
            customerName: user.displayName || null,
            authProvider: providerName,
            device: deviceType,
            os,
            duration: sessionDuration,
            connectedAt: serverTimestamp(),
            status: 'Connecté',
            paymentStatus: 'free'
          });
        } catch (err) {
            console.error("Failed to log social connection:", err);
        }
      }
    } catch (error) {
      console.error(`${providerName} login error:`, error);
      toast.error(`Erreur de connexion avec ${providerName}`);
    }
  };

  const simulateAd = () => {
    setStep('ad');
    
    const adsToPlay = (portalConfig?.ads && portalConfig.ads.length > 0) 
      ? portalConfig.ads 
      : [{ mediaType: portalConfig?.adMediaType || 'image', mediaUrl: portalConfig?.adMediaUrl, duration: portalConfig?.adDuration || 5 }];

    let nextAdIndex = parseInt(localStorage.getItem(`lastAdIndex_${locationId || 'demo'}`) || '0', 10);
    if (nextAdIndex >= adsToPlay.length || isNaN(nextAdIndex)) {
       nextAdIndex = 0;
    }
    
    const currentAd = adsToPlay[nextAdIndex];
    setActiveAd(currentAd);
    
    localStorage.setItem(`lastAdIndex_${locationId || 'demo'}`, ((nextAdIndex + 1) % adsToPlay.length).toString());

    const currentAdDurationMs = (currentAd.duration || 5) * 1000;

    let progress = 0;
    const progressInterval = 100; // ms
    const increment = (progressInterval / currentAdDurationMs) * 100;
    
    const interval = setInterval(() => {
      progress += increment;
      if (progress >= 100) progress = 100;
      setAdProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(async () => {
          handleAuthSuccess();
          if (locationId && !isDemo) {
            try {
              const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
              const { db } = await import('../firebase');
              const ua = navigator.userAgent;
              let os = "Inconnu";
              let deviceType = "Appareil";
              if (ua.includes("Win")) { os = "Windows"; deviceType = "PC"; }
              else if (ua.includes("Mac")) { os = "macOS"; deviceType = "Mac"; }
              else if (ua.includes("Linux")) { os = "Linux"; deviceType = "PC"; }
              
              if (ua.includes("iPhone")) { os = "iOS"; deviceType = "iPhone"; }
              else if (ua.includes("iPad")) { os = "iPadOS"; deviceType = "iPad"; }
              else if (ua.includes("Android")) { os = "Android"; deviceType = "Mobile Android"; }

              await addDoc(collection(db, 'connections'), {
                locationId,
                locationName,
                userId: locationOwnerId,
                device: deviceType,
                os,
                duration: sessionDuration,
                connectedAt: serverTimestamp(),
                status: 'Connecté',
                paymentStatus: 'free'
              });
            } catch (err) {
              console.error("Failed to log connection:", err);
            }
          }
        }, 300);
      }
    }, progressInterval);
  };

  useEffect(() => {
    const handleTestAd = () => {
       simulateAd();
    };
    window.addEventListener('t_test_ad_flow', handleTestAd as EventListener);
    return () => window.removeEventListener('t_test_ad_flow', handleTestAd as EventListener);
  }, [portalConfig, locationId, isDemo, locationName, sessionDuration, locationOwnerId]);

  const activeThemeColor = portalConfig?.themeColor || '#6366f1';
  const layoutTheme = portalConfig?.layoutTheme || 'default';
  const logoUrl = portalConfig?.logoUrl;
  const welcomeMessage = portalConfig?.welcomeMessage || t('portal.welcome', { location: locationName });
  const termsOfService = portalConfig?.termsOfService;
  const fontFamily = portalConfig?.fontFamily || 'Inter';
  const backgroundImageUrl = portalConfig?.backgroundImageUrl || null;
  const backgroundVideoUrl = portalConfig?.backgroundVideoUrl || null;
  const redirectUrl = portalConfig?.redirectUrl;

  const handleSuccessClickAndRedirect = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  // Session timer states are declared at top of CaptivePortal component

  // Load from or save to localStorage for persistent session timing across refreshes
  useEffect(() => {
    const storageKey = `wificash_session_${locationId || 'default'}`;
    if (step === 'success' || step === 'payment_success') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const remaining = Math.max(0, Math.floor((parsed.expiresAt - Date.now()) / 1000));
          if (remaining > 0) {
            setTimeLeft(remaining);
            setMaxTime(parsed.maxTime || (sessionDuration * 60));
            return;
          }
        } catch (e) {
          console.error("Failed to parse cached session:", e);
        }
      }

      const effectiveMinutes = step === 'payment_success'
        ? (purchasedPass?.duration || selectedDuration || 60)
        : (sessionDuration > 0 ? sessionDuration : 60);
      const totalSec = effectiveMinutes * 60;
      setTimeLeft(totalSec);
      setMaxTime(totalSec);
      localStorage.setItem(storageKey, JSON.stringify({
        expiresAt: Date.now() + totalSec * 1000,
        maxTime: totalSec,
        startedAt: Date.now()
      }));
    }
  }, [step, sessionDuration, locationId, purchasedPass, selectedDuration]);

  // Accurate ticking countdown with threshold alerts
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0 && (step === 'success' || step === 'payment_success')) {
        setShowExpiryWarning(false);
        setShowExpiredModal(true);
        const storageKey = `wificash_session_${locationId || 'default'}`;
        localStorage.removeItem(storageKey);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) return 0;
        const nextVal = prev - 1;
        
        // 5-minute warning notification
        if (nextVal === 300 && !hasShown5MinWarning) {
          setShowExpiryWarning(true);
          setHasShown5MinWarning(true);
          toast.warning(t('portal.session_expiry_title'), {
            description: t('portal.session_expiry_msg'),
            duration: 8000
          });
        }
        
        // 1-minute critical warning notification
        if (nextVal === 60 && !hasShown1MinWarning) {
          setShowExpiryWarning(true);
          setHasShown1MinWarning(true);
          toast.error(t('portal.session_critical_title'), {
            description: t('portal.session_critical_msg'),
            duration: 8000
          });
        }

        return nextVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, step, hasShown5MinWarning, hasShown1MinWarning, locationId, t]);

  // Initial trigger if timer starts under 300 seconds
  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 300 && timeLeft > 60 && !hasShown5MinWarning) {
      setShowExpiryWarning(true);
      setHasShown5MinWarning(true);
      toast.warning(t('portal.session_expiry_title'), { description: t('portal.session_expiry_msg') });
    } else if (timeLeft !== null && timeLeft <= 60 && timeLeft > 0 && !hasShown1MinWarning) {
      setShowExpiryWarning(true);
      setHasShown1MinWarning(true);
      toast.error(t('portal.session_critical_title'), { description: t('portal.session_critical_msg') });
    }
  }, [timeLeft, hasShown5MinWarning, hasShown1MinWarning, t]);

  const handleExtendSession = async () => {
    setIsProcessingPayment(true);
    try {
      const additionalSeconds = 7200; // +2 hours
      const newRemaining = (timeLeft || 0) + additionalSeconds;
      const newMax = Math.max(maxTime, newRemaining);
      
      setTimeLeft(newRemaining);
      setMaxTime(newMax);
      setHasShown5MinWarning(false);
      setHasShown1MinWarning(false);
      setShowExpiryWarning(false);
      setShowExpiredModal(false);

      const storageKey = `wificash_session_${locationId || 'default'}`;
      localStorage.setItem(storageKey, JSON.stringify({
        expiresAt: Date.now() + newRemaining * 1000,
        maxTime: newMax,
        updatedAt: Date.now()
      }));

      toast.success(t('portal.premium_extension') + ' (+2h) !');
    } catch (err) {
      toast.error(t('portal.error_occurred'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSimulateTime = (seconds: number) => {
    setTimeLeft(seconds);
    if (seconds <= 60 && seconds > 0) {
      setShowExpiryWarning(true);
      setHasShown1MinWarning(true);
      toast.error(t('portal.session_critical_title'), { description: t('portal.session_critical_msg') });
    } else if (seconds <= 300 && seconds > 0) {
      setShowExpiryWarning(true);
      setHasShown5MinWarning(true);
      toast.warning(t('portal.session_expiry_title'), { description: t('portal.session_expiry_msg') });
    } else if (seconds === 0) {
      setShowExpiryWarning(false);
      setShowExpiredModal(true);
      toast.error(t('portal.session_expired_title'), { description: t('portal.session_expired_msg') });
    } else {
      setShowExpiryWarning(false);
      setShowExpiredModal(false);
      setHasShown5MinWarning(false);
      setHasShown1MinWarning(false);
    }
  };

  const getDisplayPrice = (baseCents: number) => {
    if (baseCents <= 0) return t('portal.free_badge');
    const symbol = paymentConfig.currency === 'usd' ? '$' : paymentConfig.currency === 'gbp' ? '£' : '€';
    if (!appliedPromo) return (baseCents / 100).toFixed(2) + " " + symbol;
    let newCents = baseCents;
    if (appliedPromo.type === 'percentage') {
       newCents = Math.max(0, Math.round(baseCents * (1 - (appliedPromo.value / 100))));
    } else if (appliedPromo.type === 'flat') {
       newCents = Math.max(0, baseCents - (appliedPromo.value * 100));
    }
    if (newCents <= 0) return t('portal.free_badge');
    // Stripe minimum handled on backend but for display we can show 0 or exact. Backend caps at 50 cents.
    if (newCents > 0 && newCents < 50) newCents = 50; 
    return (newCents / 100).toFixed(2) + " " + symbol;
  };

  const formatPassDuration = (durationMinutes: number) => {
    if (durationMinutes >= 1440) {
      const days = Math.round(durationMinutes / 1440);
      return `${days} ${days > 1 ? t('portal.days') : t('portal.day')}`;
    }
    if (durationMinutes >= 60) {
      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      return `${hours}${t('portal.hour_short')}${mins > 0 ? ` ${mins}${t('portal.min_short')}` : ''}`;
    }
    return `${durationMinutes} ${t('portal.min_short')}`;
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isPreview = searchParams.get('preview') === 'true';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#050614] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const currentReceipt: WifiReceipt = {
    id: `REC-${(paymentCode || 'WIFI').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}-${Date.now().toString(36).toUpperCase().slice(-4)}`,
    locationName: locationName || 'Le Café Central',
    locationAddress: portalConfig?.address || 'Connexion Hotspot Wi-Fi',
    wifiSsid: wifiConfig?.ssid || `${locationName} Wi-Fi`,
    planName: purchasedPass?.name || (selectedDuration >= 1440 ? 'Pass 24 Heures' : 'Pass 2 Heures'),
    durationMinutes: purchasedPass?.duration || selectedDuration || 120,
    amount: purchasedPass?.price || (selectedDuration >= 1440 ? (paymentConfig.price24h || 5) : (paymentConfig.price1h || 2)),
    currency: paymentConfig?.currency || 'EUR',
    voucherCode: paymentCode || 'DEMO-CODE-1234',
    discountCode: appliedPromo?.code,
    discountAmount: appliedPromo ? (appliedPromo.type === 'flat' ? appliedPromo.value : ((purchasedPass?.price || 2.0) * (appliedPromo.value / 100))) : undefined,
    paymentMethod: portalPaymentMethodUsed || 'Carte Bancaire (Stripe)',
    status: 'paid',
    createdAt: new Date().toISOString(),
  };

  const portalContent = (
    <div 
       className="w-full h-full rounded-[2rem] overflow-hidden relative flex flex-col shadow-inner"
       style={{ fontFamily }}
    >
      {backgroundVideoUrl ? (
        <video 
           src={backgroundVideoUrl} 
           autoPlay muted loop playsInline 
           className="absolute inset-0 w-full h-full object-cover z-0" 
        />
      ) : backgroundImageUrl ? (
         <img 
           src={backgroundImageUrl} 
           alt="Background" 
           className="absolute inset-0 w-full h-full object-cover z-0" 
         />
      ) : (
         <div className="absolute inset-0 z-0 bg-white/40 dark:bg-[#0b0c21]/40 backdrop-blur-2xl"></div>
      )}
      
      {/* Overlay so text remains readable */}
      {(backgroundVideoUrl || backgroundImageUrl) && (
         <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[2px]"></div>
      )}

      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Dynamic In-Portal Language Selector for travelers */}
        <div className="absolute top-3 right-4 z-40">
          <LanguageSwitcher variant="compact" />
        </div>

        <AnimatePresence mode="wait">
          {step === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`flex-1 overflow-y-auto flex relative p-6 pt-16 h-full ${layoutTheme === 'modern' ? 'flex-col justify-end pb-8' : 'flex-col items-center'} ${(backgroundVideoUrl || backgroundImageUrl) ? 'text-white' : layoutTheme === 'elegant' ? 'bg-slate-900 text-slate-100 font-serif' : 'bg-[#f8fafc] text-slate-900'}`}
            >
              {layoutTheme === 'modern' && logoUrl && !(backgroundVideoUrl || backgroundImageUrl) && (
                <div className="absolute inset-0 opacity-20 bg-cover bg-center z-[-1]" style={{ backgroundImage: `url(${logoUrl})`, filter: 'blur(10px)' }}></div>
              )}
            
            <div className={`w-full relative z-10 flex flex-col ${layoutTheme === 'modern' ? 'bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl' : layoutTheme === 'minimal' ? 'items-center flex-1 justify-center' : 'items-center'}`}>
              {layoutTheme !== 'modern' && (
                    <>
                      {logoUrl ? (
                         <img src={logoUrl} alt="Logo" className={`object-contain mb-8 ${layoutTheme === 'minimal' ? 'w-32 h-32' : 'w-24 h-24 rounded-2xl shadow-sm bg-white'}`} style={layoutTheme === 'elegant' ? { borderRadius: '50%' } : {}} />
                      ) : (
                         <div className={`bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 border border-slate-100 ${layoutTheme === 'minimal' ? 'w-32 h-32' : 'w-24 h-24'}`} style={layoutTheme === 'elegant' ? { borderRadius: '50%', backgroundColor: '#1e293b', borderColor: '#334155' } : {}}>
                            <Wifi className={layoutTheme === 'elegant' ? 'text-slate-400' : 'text-slate-300'} size={40} />
                         </div>
                      )}
                    </>
                  )}

                  {layoutTheme === 'modern' && logoUrl && (
                     <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain mb-6 rounded-2xl bg-white shadow-sm self-start" />
                  )}

                  <h2 className={`text-xl font-bold text-center mb-3 ${layoutTheme === 'elegant' ? 'text-white font-serif text-2xl tracking-wide' : 'text-slate-900'} ${layoutTheme === 'modern' ? 'text-left' : ''}`}>
                    {welcomeMessage}
                  </h2>

                  {layoutTheme !== 'minimal' && (
                    <p className={`text-center text-sm mb-8 ${layoutTheme === 'elegant' ? 'text-slate-400' : 'text-slate-500'} ${layoutTheme === 'modern' ? 'text-left mb-6' : ''}`}>
                       {sessionDuration > 0 ? t('portal.free_wifi_duration_msg', { duration: sessionDuration >= 60 ? Math.floor(sessionDuration/60) + 'h' + (sessionDuration%60 > 0 ? (sessionDuration%60).toString() : '') : sessionDuration + ' min' }) : t('portal.free_wifi_msg')}
                    </p>
                  )}

                  <button 
                     onClick={simulateAd}
                     type="button"
                     style={{ backgroundColor: activeThemeColor }}
                     className={`w-full py-4 text-white font-bold text-lg shadow-lg mb-6 transition-transform hover:opacity-90 active:scale-95 ${layoutTheme === 'elegant' ? 'rounded-md uppercase tracking-wider text-sm shadow-black/50' : 'rounded-xl'}`}
                  >
                     {layoutTheme === 'minimal' ? t('portal.connect_auto') : t('portal.connect_free')}
                  </button>

                  {portalConfig?.allowExtension && (
                    <div className="w-full space-y-3 mb-6">
                      {(paymentConfig.passes && paymentConfig.passes.length > 0) ? (
                        paymentConfig.passes
                          .filter((pass: any) => pass.isActive !== false)
                          .map((pass: any) => {
                            const isFree = pass.price === 0 || pass.isAdSupported;
                            return (
                              <button 
                                key={pass.id}
                                onClick={() => {
                                  if (isFree) {
                                    simulateAd();
                                  } else {
                                    handleCheckout(pass.price * 100, pass.name, pass.duration, pass.stripePriceId);
                                  }
                                }}
                                disabled={isProcessingPayment}
                                className={`w-full flex items-center justify-between p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors backdrop-blur-sm ${layoutTheme === 'elegant' ? 'rounded-md' : 'rounded-xl'}`}
                              >
                               <div className="text-left">
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-sm">{pass.name}</p>
                                    {pass.badge && (
                                      <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded">
                                        {pass.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 opacity-80 mt-0.5">
                                    {t('portal.duration')}: {formatPassDuration(pass.duration)}
                                    {pass.downloadSpeedLimit ? ` • ↓ ${pass.downloadSpeedLimit} Mbps` : ''}
                                  </p>
                                  {pass.description && (
                                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{pass.description}</p>
                                  )}
                               </div>
                               <div className="font-bold flex items-center gap-2">
                                {appliedPromo && !isFree && <span className="text-sm line-through text-slate-400 font-normal">{(pass.price).toFixed(2)} {paymentConfig.currency === 'usd' ? '$' : paymentConfig.currency === 'gbp' ? '£' : '€'}</span>}
                                <span className={isFree ? "text-emerald-500 font-semibold" : ""}>
                                  {getDisplayPrice(pass.price * 100)}
                                </span>
                               </div>
                              </button>
                            );
                          })
                      ) : (
                        <>
                          <button 
                            onClick={() => handleCheckout((paymentConfig.price1h || 2) * 100, t('portal.pass_2h_title'), 120)}
                            disabled={isProcessingPayment}
                            className={`w-full flex items-center justify-between p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors backdrop-blur-sm ${layoutTheme === 'elegant' ? 'rounded-md' : 'rounded-xl'}`}
                          >
                           <div className="text-left">
                              <p className="font-bold text-sm">{t('portal.pass_2h_title')}</p>
                              <p className="text-xs text-slate-500 opacity-80">{t('portal.pass_2h_desc')}</p>
                           </div>
                           <div className="font-bold flex items-center gap-2">
                            {appliedPromo && <span className="text-sm line-through text-slate-400 font-normal">{(paymentConfig.price1h || 2).toFixed(2)} {paymentConfig.currency === 'usd' ? '$' : paymentConfig.currency === 'gbp' ? '£' : '€'}</span>}
                            {getDisplayPrice((paymentConfig.price1h || 2) * 100)}
                           </div>
                          </button>
                          <button 
                            onClick={() => handleCheckout((paymentConfig.price24h || 5) * 100, t('portal.pass_24h_title'), 1440)}
                            disabled={isProcessingPayment}
                            className={`w-full flex items-center justify-between p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors backdrop-blur-sm ${layoutTheme === 'elegant' ? 'rounded-md' : 'rounded-xl'}`}
                          >
                           <div className="text-left">
                              <p className="font-bold text-sm">{t('portal.pass_24h_title')}</p>
                              <p className="text-xs text-slate-500 opacity-80">{t('portal.pass_24h_desc')}</p>
                           </div>
                           <div className="font-bold flex items-center gap-2">
                            {appliedPromo && <span className="text-sm line-through text-slate-400 font-normal">{(paymentConfig.price24h || 5).toFixed(2)} {paymentConfig.currency === 'usd' ? '$' : paymentConfig.currency === 'gbp' ? '£' : '€'}</span>}
                            {getDisplayPrice((paymentConfig.price24h || 5) * 100)}
                           </div>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Voucher Card for redeeming time-limited access codes (1-hour pass, etc.) */}
                  <div className={`w-full mb-6 p-4 border border-indigo-200/70 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 backdrop-blur-sm text-left ${layoutTheme === 'elegant' ? 'rounded-md' : 'rounded-2xl'}`}>
                    <div className="flex items-center gap-2 mb-1.5 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                      <Ticket size={18} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Vous avez un code Voucher ?</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Entrez votre code d'accès sécurisé (ex: Pass 1h, Pass 24h) pour débloquer votre connexion Internet.
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={voucherCodeInput}
                        onChange={(e) => {
                          setVoucherCodeInput(e.target.value.toUpperCase());
                          setVoucherRedeemError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && voucherCodeInput.trim() && !isRedeemingVoucher) {
                            e.preventDefault();
                            handleRedeemVoucher();
                          }
                        }}
                        placeholder="EX: PASS1H-K7M4P9X2"
                        className="flex-1 px-3.5 py-2.5 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono tracking-wider"
                      />
                      <button 
                        onClick={() => handleRedeemVoucher()}
                        disabled={isRedeemingVoucher || !voucherCodeInput.trim()}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0"
                      >
                        {isRedeemingVoucher ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <>
                            <span>Valider</span>
                            <CheckCircle2 size={16} />
                          </>
                        )}
                      </button>
                    </div>
                    {voucherRedeemError && (
                      <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={14} />
                        <span>{voucherRedeemError}</span>
                      </p>
                    )}
                  </div>

                  {portalConfig?.allowExtension && (
                    <div className="w-full mb-6">
                      {appliedPromo ? (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded-xl flex items-center justify-between text-sm">
                          <span className="font-medium">{t('portal.applied_code')} : {appliedPromo.code} (-{appliedPromo.type === 'percentage' ? `${appliedPromo.value}%` : `${appliedPromo.value}€`})</span>
                          <button onClick={() => setAppliedPromo(null)} className="opacity-70 hover:opacity-100 flex items-center justify-center p-1">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 mb-4">
                          <input 
                            type="text"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                            placeholder={t('portal.promo_code')}
                            className="flex-1 px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono"
                          />
                          <button 
                            onClick={handleApplyPromo}
                            disabled={isApplyingPromo || !promoCodeInput.trim()}
                            className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-medium text-sm disabled:opacity-50 transition-colors"
                          >
                            {isApplyingPromo ? '...' : t('portal.apply')}
                          </button>
                        </div>
                      )}
                      {promoError && (
                         <p className="text-red-500 text-xs mt-1 text-left px-1 mb-4">{promoError}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Social Login info */}
                  <div className="w-full">
                    <div className="relative flex items-center py-4">
                      <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                      <span className="flex-shrink-0 mx-4 text-slate-500 text-xs text-opacity-50">{t('portal.or_connect_with')}</span>
                      <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                    </div>
                    <div className="flex gap-4 max-w-[200px] mx-auto">
                      <button onClick={() => handleSocialLogin('facebook')} className="flex-1 p-3 flex justify-center items-center rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/30 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors">
                        <Facebook size={20} />
                      </button>
                      <button onClick={() => handleSocialLogin('google')} className="flex-1 p-3 flex justify-center items-center rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className={`text-xs w-full text-center ${layoutTheme === 'elegant' ? 'text-slate-500 mt-8' : 'text-slate-400'} ${layoutTheme === 'modern' ? 'mt-2' : 'mt-auto pt-8 pb-4'}`}>
                      {termsOfService ? (
                          <p className="whitespace-pre-line">{termsOfService}</p>
                      ) : (
                          <p>{t('portal.terms_default')}</p>
                      )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'ad' && (
              <motion.div 
                key="ad"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full bg-slate-900 border border-slate-800 text-white relative overflow-hidden"
              >
                <div className="flex-1 relative flex items-center justify-center bg-black">
                  <div className="absolute top-6 right-6 text-xs font-bold text-white bg-black/60 border border-white/20 px-3 py-1.5 rounded-full z-20 backdrop-blur-md">
                    {t('portal.ad_badge')} - {Math.ceil(((activeAd?.duration || portalConfig?.adDuration || 5) * (1 - adProgress / 100)))}s
                  </div>
                  
                  {(activeAd?.mediaType || portalConfig?.adMediaType) === 'video' ? (
                    <video 
                      src={activeAd?.mediaUrl || portalConfig?.adMediaUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"} 
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                      autoPlay
                      muted
                      playsInline
                      loop
                    />
                  ) : (
                    <img 
                      src={activeAd?.mediaUrl || portalConfig?.adMediaUrl || "https://images.unsplash.com/photo-1616077168079-7e09a6a575fd?auto=format&fit=crop&q=80&w=600"} 
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                      alt="Ad Background"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {!(activeAd?.mediaUrl || portalConfig?.adMediaUrl) && (
                    <div className="text-center p-8 z-10 relative pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/30 rounded-full blur-[60px]"></div>
                      <div className="w-20 h-20 bg-indigo-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.6)] relative z-10">
                        <Smartphone size={32} className="text-white" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2 relative z-10">{t('portal.ad_space')}</h2>
                      <p className="text-indigo-200 relative z-10 font-medium">{t('portal.your_ad_here')}</p>
                    </div>
                  )}
                  
                  {/* Progress Bar */}
                  <div className="absolute bottom-12 left-8 right-8 z-20">
                    <p className="text-sm font-medium text-center mb-3 text-white/90 drop-shadow-md">{t('portal.connecting')}</p>
                    <div className="h-2 w-full bg-black/40 border border-white/10 rounded-full overflow-hidden backdrop-blur-sm shadow-inner relative">
                      <motion.div 
                        className="absolute top-0 left-0 bottom-0 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,1)]"
                        style={{ width: `${adProgress}%` }}
                        transition={{ layout: { duration: 0.1, ease: 'linear' } }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'payment_success' && (
               <motion.div 
                key="payment_success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full items-center p-8 bg-transparent text-center relative overflow-y-auto"
              >
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px]"></div>

                <div className="w-24 h-24 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mt-4 mb-6 relative z-10 border border-indigo-500/30 shrink-0">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">{t('portal.payment_success_title')}</h2>
                <p className="text-slate-600 dark:text-slate-400 font-medium px-4 relative z-10 text-sm">{t('portal.payment_success_sub')}</p>

                <div className="mt-4 mb-4 flex items-center justify-center gap-2 relative z-10">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">{t('portal.internet_active')}</span>
                </div>
                
                <div className="mt-4 mb-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm w-full relative z-10 backdrop-blur-md">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-2">{t('portal.wifi_access_code')}</p>
                  <div className="bg-slate-100 dark:bg-black/20 p-3.5 rounded-xl border border-slate-200 dark:border-white/5 font-mono text-2xl sm:text-3xl font-bold text-indigo-500 tracking-widest">
                    {paymentCode}
                  </div>
                </div>

                {/* Printable PDF Receipt Actions */}
                <div className="w-full space-y-2 mb-6 relative z-10">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        try {
                          setIsDownloadingReceipt(true);
                          downloadReceiptPdf(currentReceipt, language);
                          toast.success(t('portal.receipt_downloaded'));
                        } catch (err) {
                          toast.error(t('portal.receipt_error'));
                        } finally {
                          setTimeout(() => setIsDownloadingReceipt(false), 600);
                        }
                      }}
                      disabled={isDownloadingReceipt}
                      className="flex-1 py-3 px-3 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <Download size={16} className="text-indigo-500" />
                      <span>{isDownloadingReceipt ? t('portal.generating_receipt') : t('portal.download_receipt')}</span>
                    </button>
                    <button 
                      onClick={() => setShowReceiptModal(true)}
                      className="py-3 px-3.5 bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      title="Voir le reçu détaillé et imprimer"
                    >
                      <FileText size={16} />
                      <span>{t('portal.preview_receipt')}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t('portal.receipt_note')}
                  </p>
                </div>
                
                <button 
                  onClick={handleAuthSuccess}
                  style={{ backgroundColor: activeThemeColor }}
                  className="w-full py-4 text-white rounded-xl font-bold text-lg transition-transform shadow-lg shadow-indigo-500/20 mt-auto hover:opacity-90 active:scale-95"
                >
                  {t('portal.connect_now')}
                </button>
              </motion.div>
            )}

            {step === 'success' && (
               <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full items-center p-8 bg-transparent text-center relative overflow-y-auto"
              >
                {/* Background glow */}
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px]"></div>

                <div className="w-24 h-24 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mt-4 mb-6 relative z-10 border border-indigo-500/30 shrink-0">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">{t('portal.connected')}</h2>
                <p className="text-indigo-200 font-medium px-4 relative z-10 text-sm">{t('portal.internet_access')}</p>
                
                {sessionDuration > 0 && (
                  <div className="mt-4 mb-4 p-4 w-full relative z-10 flex flex-col items-center">
                    {/* Compact notification bar if dismissed during warning window */}
                    {!showExpiryWarning && timeLeft !== null && timeLeft <= 300 && timeLeft > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setShowExpiryWarning(true)}
                        className={`w-full mb-3 px-3 py-2 rounded-xl flex items-center justify-between text-xs cursor-pointer border shadow-sm transition-all ${
                          timeLeft <= 60 
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400' 
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                          <AlertTriangle size={13} />
                          <span>{timeLeft <= 60 ? t('portal.status_critical') : t('portal.status_expiring')} : {formatTime(timeLeft)}</span>
                        </div>
                        <span className="font-semibold underline ml-2">{t('portal.extend_session')}</span>
                      </motion.div>
                    )}

                    <CountdownTimer 
                      timeLeft={timeLeft} 
                      maxTime={maxTime} 
                      onExtend={handleExtendSession}
                      isProcessing={isProcessingPayment}
                    />
                    
                    <button 
                      onClick={handleExtendSession}
                      disabled={isProcessingPayment}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl transition-all font-semibold border border-indigo-100 dark:border-indigo-500/20 shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <Sparkles size={16} />
                      <span>{t('portal.premium_extension')} (+2 {t('portal.hours')}) - 2.00 €</span>
                      {isProcessingPayment && <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>}
                    </button>

                    {/* Simulation Controls for testing countdown and alerts */}
                    <div className="mt-3 w-full flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-white/5">
                      <span className="font-medium">Test:</span>
                      <button 
                        onClick={() => handleSimulateTime(299)} 
                        className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold transition-colors"
                      >
                        5 min
                      </button>
                      <button 
                        onClick={() => handleSimulateTime(50)} 
                        className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold transition-colors"
                      >
                        50s
                      </button>
                      <button 
                        onClick={() => handleSimulateTime(0)} 
                        className="px-2 py-0.5 rounded bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 font-semibold transition-colors"
                      >
                        0s
                      </button>
                      <button 
                        onClick={() => handleSimulateTime(sessionDuration * 60)} 
                        className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
                
                {redirectUrl && (
                  <button 
                    onClick={handleSuccessClickAndRedirect}
                    style={{ backgroundColor: activeThemeColor }}
                    className="w-full py-3 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 mb-6 relative z-10 hover:opacity-90 active:scale-95"
                  >
                    {t('portal.continue_to_site')}
                  </button>
                )}

                {/* Expiry Warning Notification Banner / Modal */}
                <AnimatePresence>
                  {showExpiryWarning && timeLeft !== null && timeLeft > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 50, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      className={`absolute bottom-4 left-4 right-4 text-white rounded-2xl p-5 shadow-2xl z-50 flex flex-col gap-3 backdrop-blur-md border ${
                        timeLeft <= 60 
                          ? 'bg-gradient-to-br from-rose-600 to-rose-700 border-rose-400/40 shadow-rose-600/30' 
                          : 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-300/40 shadow-amber-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 font-bold text-base sm:text-lg">
                           <AlertTriangle size={20} className={timeLeft <= 60 ? "animate-bounce" : ""} />
                           <span>
                             {timeLeft <= 60 ? t('portal.session_critical_title') : t('portal.session_expiry_title')}
                           </span>
                        </div>
                        <button onClick={() => setShowExpiryWarning(false)} className="p-1 hover:bg-black/10 rounded-lg transition-colors">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-black/20 p-2.5 rounded-xl font-mono">
                        <span className="text-white/80">{t('portal.time_remaining')} :</span>
                        <span className="font-bold text-sm text-white">{formatTime(timeLeft)}</span>
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-white/90 leading-snug text-left">
                        {timeLeft <= 60 ? t('portal.session_critical_msg') : t('portal.session_expiry_msg')}
                      </p>
                      
                      <button 
                        onClick={handleExtendSession}
                        disabled={isProcessingPayment}
                        className={`mt-1 w-full py-3 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 ${
                          timeLeft <= 60 
                            ? 'bg-white text-rose-600 hover:bg-rose-50 shadow-rose-900/20' 
                            : 'bg-white text-amber-600 hover:bg-amber-50 shadow-amber-900/20'
                        }`}
                      >
                        <Sparkles size={16} />
                        <span>{t('portal.extend_session')}</span>
                        {isProcessingPayment && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Session Expired Overlay */}
                <AnimatePresence>
                  {(showExpiredModal || timeLeft === 0) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-x-4 bottom-4 z-50 bg-slate-900/95 dark:bg-black/95 text-white rounded-3xl p-6 shadow-2xl border border-rose-500/40 backdrop-blur-xl flex flex-col items-center text-center gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                        <AlertTriangle size={30} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">{t('portal.session_expired_title')}</h3>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{t('portal.session_expired_msg')}</p>
                      </div>
                      <div className="w-full flex flex-col gap-2 pt-1">
                        <button
                          onClick={() => {
                            setShowExpiredModal(false);
                            setTimeLeft(null);
                            setStep('home');
                          }}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-indigo-600/30"
                        >
                          <RefreshCw size={15} />
                          <span>{t('portal.reconnect')}</span>
                        </button>
                        <button
                          onClick={handleExtendSession}
                          disabled={isProcessingPayment}
                          className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Sparkles size={13} />
                          <span>{t('portal.extend_session')}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!feedbackSubmitted ? (
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm w-full relative z-10 backdrop-blur-md mb-6 mt-auto">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{t('portal.rate_experience')}</p>
                    <div className="flex justify-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className={`p-2 rounded-full transition-transform hover:scale-110 ${feedbackRating >= star ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-300'}`}
                        >
                          <Star size={24} fill={feedbackRating >= star ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setFeedbackSubmitted(true)}
                      disabled={feedbackRating === 0}
                      className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 disabled:dark:bg-white/10 dark:disabled:text-white/30 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      {t('portal.send')}
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-2xl w-full relative z-10 mb-6"
                  >
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300 mb-1">{t('portal.thank_you_feedback')}</p>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 opacity-80">{t('portal.feedback_help')}</p>
                  </motion.div>
                )}

                <p className="mt-auto text-xs text-slate-500 flex items-center justify-center gap-1 relative z-10 pb-4">
                  <ShieldCheck size={14}/> {t('portal.sec_conn')}
                </p>
              </motion.div>
            )}

            {step === 'payment' && (
               <motion.div 
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full bg-slate-50 dark:bg-[#050614] rounded-[2rem] overflow-hidden"
              >
                <div className="p-4 sm:p-6 relative z-10 bg-white/40 dark:bg-black/20 backdrop-blur-md border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setStep('home')}
                      className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{t('portal.payment_title')}</h2>
                      <p className="text-xs text-slate-500">
                        {purchasedPass?.name || 'Pass Wi-Fi'} · <span className="font-bold text-slate-900 dark:text-white">{(purchasedPass?.price || (paymentConfig.price1h || 2)).toFixed(2)} {paymentConfig.currency === 'usd' ? '$' : paymentConfig.currency === 'gbp' ? '£' : '€'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gateway Switcher */}
                <div className="px-4 pt-3 pb-2 border-b border-slate-200 dark:border-white/10 bg-white/20 dark:bg-black/10 flex gap-1.5 shrink-0">
                  {portalGatewaysConfig.paypalEnabled !== false && (
                    <button
                      type="button"
                      onClick={() => setPortalPaymentGateway('paypal')}
                      className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        portalPaymentGateway === 'paypal'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-white/80'
                      }`}
                    >
                      <DollarSign size={14} />
                      <span>PayPal</span>
                    </button>
                  )}

                  {portalGatewaysConfig.cryptoEnabled !== false && (
                    <button
                      type="button"
                      onClick={() => setPortalPaymentGateway('solana')}
                      className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        portalPaymentGateway === 'solana'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-white/80'
                      }`}
                    >
                      <Coins size={14} />
                      <span>Crypto (SOL / USDC)</span>
                    </button>
                  )}

                  {portalGatewaysConfig.stripeEnabled !== false && (
                    <button
                      type="button"
                      onClick={() => setPortalPaymentGateway('card')}
                      className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        portalPaymentGateway === 'card'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-white/80'
                      }`}
                    >
                      <CreditCard size={14} />
                      <span>Carte CB</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 w-full overflow-y-auto p-4 sm:p-6" id="checkout">
                  {portalPaymentGateway === 'card' && (
                    clientSecret && stripeAvailable ? (
                      <Elements
                        stripe={stripePromise}
                        options={{ clientSecret, appearance: { theme: 'stripe' } }}
                      >
                        <CheckoutForm duration={selectedDuration} />
                      </Elements>
                    ) : stripeInitError || !stripeAvailable ? (
                      <div className="flex flex-col items-center justify-center text-center py-8 px-4 max-w-sm mx-auto space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <AlertCircle size={26} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Paiement Stripe CB non activé
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {stripeInitError || "Utilisez PayPal (avec ou sans compte par carte) ou Crypto Solana / USDC pour activer immédiatement votre Wi-Fi."}
                          </p>
                        </div>
                        <div className="w-full flex flex-col gap-2 pt-2">
                          {portalGatewaysConfig.paypalEnabled !== false && (
                            <button
                              type="button"
                              onClick={() => setPortalPaymentGateway('paypal')}
                              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                              <DollarSign size={15} /> Continuer avec PayPal
                            </button>
                          )}
                          {portalGatewaysConfig.cryptoEnabled !== false && (
                            <button
                              type="button"
                              onClick={() => setPortalPaymentGateway('solana')}
                              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                              <Coins size={15} /> Continuer avec Crypto (SOL / USDC)
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-xs text-slate-500">Initialisation sécurisée Stripe...</p>
                      </div>
                    )
                  )}

                  {portalPaymentGateway === 'paypal' && (() => {
                    const currSymbol = paymentConfig.currency === 'usd' ? '$' : paymentConfig.currency === 'gbp' ? '£' : '€';
                    const finalAmount = (purchasedPass?.price ?? (paymentConfig.price1h || 2));
                    return (
                      <div className="flex flex-col items-center justify-center space-y-5 py-3 max-w-sm mx-auto text-center">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <DollarSign size={30} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Paiement Express PayPal</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Réglez en toute sécurité via votre portefeuille PayPal ou par carte bancaire sans compte.
                          </p>
                        </div>

                        <div className="w-full bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 text-left space-y-2 shadow-sm">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Forfait choisi :</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{purchasedPass?.name || 'Pass Wi-Fi'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Durée d'accès :</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{formatPassDuration(purchasedPass?.duration || selectedDuration)}</span>
                          </div>
                          {appliedPromo && (
                            <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                              <span>Code promo ({appliedPromo.code}) :</span>
                              <span className="font-semibold">Appliqué</span>
                            </div>
                          )}
                          {portalGatewaysConfig.paypalMerchantEmail && (
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Marchand :</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{portalGatewaysConfig.paypalMerchantEmail}</span>
                            </div>
                          )}
                          <div className="border-t border-slate-200 dark:border-white/10 pt-2.5 flex justify-between text-sm font-bold">
                            <span className="text-slate-900 dark:text-white">Total à payer :</span>
                            <span className="text-blue-600 dark:text-blue-400">
                              {finalAmount.toFixed(2)} {currSymbol}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDirectPortalPaymentSuccess('PayPal Express', 'paypal')}
                          disabled={isProcessingPayment}
                          className="w-full py-3.5 px-4 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] disabled:opacity-60 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                          {isProcessingPayment ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <DollarSign size={16} />
                              <span>Payer {finalAmount.toFixed(2)} {currSymbol} avec PayPal</span>
                            </>
                          )}
                        </button>

                        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                          <ShieldCheck size={13} className="text-emerald-500" />
                          Protection PayPal · Activation Wi-Fi instantanée
                        </p>
                      </div>
                    );
                  })()}

                  {portalPaymentGateway === 'solana' && (() => {
                    const priceEur = purchasedPass?.price ?? (paymentConfig.price1h || 2);
                    const solRate = portalGatewaysConfig.solRateEur || 140;
                    const solAmount = Math.max(0.001, priceEur / solRate).toFixed(4);
                    const usdcAmount = Math.max(0.5, paymentConfig.currency === 'usd' ? priceEur : priceEur * 1.08).toFixed(2);
                    const activeAmount = selectedCryptoToken === 'USDC' ? usdcAmount : solAmount;
                    const safeWallet = isValidSolanaAddress(portalGatewaysConfig.solanaWalletAddress)
                      ? portalGatewaysConfig.solanaWalletAddress
                      : VALID_DEMO_SOLANA_ADDRESS;
                    const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
                    const qrUri = selectedCryptoToken === 'USDC'
                      ? `solana:${safeWallet}?amount=${activeAmount}&spl-token=${usdcMint}&label=${encodeURIComponent(locationName || 'WiFiCash')}`
                      : `solana:${safeWallet}?amount=${activeAmount}&label=${encodeURIComponent(locationName || 'WiFiCash')}`;

                    return (
                      <div className="flex flex-col items-center justify-center space-y-4 py-1 max-w-sm mx-auto text-center">
                        {/* Token Switcher: SOL vs USDC */}
                        {portalGatewaysConfig.cryptoUsdcEnabled !== false && (
                          <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-white/10 border border-slate-200 dark:border-white/10">
                            <button
                              type="button"
                              onClick={() => setSelectedCryptoToken('SOL')}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedCryptoToken === 'SOL'
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              SOL (Solana)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedCryptoToken('USDC')}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedCryptoToken === 'USDC'
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              USDC (SPL)
                            </button>
                          </div>
                        )}

                        <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200 dark:border-white/10">
                          <QRCodeSVG value={qrUri} size={136} level="M" />
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                            <Coins size={16} className="text-purple-500" /> Solana Pay ({portalGatewaysConfig.solanaNetwork === 'devnet' ? 'Devnet' : 'Mainnet'})
                          </h3>
                          <div className="flex items-center justify-center gap-1.5 mt-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Montant exact :</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(activeAmount);
                                setAmountCopied(true);
                                toast.success(`Montant (${activeAmount} ${selectedCryptoToken}) copié !`);
                                setTimeout(() => setAmountCopied(false), 2000);
                              }}
                              className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono flex items-center gap-1 hover:underline"
                            >
                              <span>{activeAmount} {selectedCryptoToken}</span>
                              {amountCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>

                        <div className="w-full bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10 text-left space-y-2 shadow-sm">
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                              <span>Adresse réceptrice ({selectedCryptoToken}) :</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(safeWallet);
                                  setSolanaCopied(true);
                                  toast.success('Adresse Solana copiée !');
                                  setTimeout(() => setSolanaCopied(false), 2000);
                                }}
                                className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                              >
                                {solanaCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                Copier
                              </button>
                            </div>
                            <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate bg-slate-50 dark:bg-black/30 p-2 rounded-lg border border-slate-200 dark:border-white/10">
                              {safeWallet}
                            </p>
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              Signature de transaction (optionnel) :
                            </label>
                            <input
                              type="text"
                              value={cryptoTxSignature}
                              onChange={(e) => setCryptoTxSignature(e.target.value)}
                              placeholder="Coller le hash Solana (optionnel)"
                              className="w-full bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleDirectPortalPaymentSuccess(
                              `Crypto Solana (${selectedCryptoToken})`,
                              'solana',
                              { cryptoAmount: activeAmount, token: selectedCryptoToken }
                            )
                          }
                          disabled={isProcessingPayment}
                          className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-sm transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                        >
                          {isProcessingPayment ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <Coins size={16} />
                              <span>Confirmer {activeAmount} {selectedCryptoToken} & Activer le Wi-Fi</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    );

  if (isPreview) {
    return (
      <div className="w-full h-full m-0 p-0 overflow-hidden font-sans text-slate-900 dark:text-white relative bg-transparent">
        {portalContent}
        <ReceiptModal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} receipt={currentReceipt} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050614] font-sans text-slate-900 dark:text-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Mesh Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[30%] w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Back to demo link */}
      <div className="absolute top-6 left-6 flex items-center gap-4 z-10">
        <Link to="/" className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">
          <ChevronLeft size={20} />
          {t('portal.back_to_site')}
        </Link>
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      {/* Phone Mockup */}
      <div className="bg-slate-50 dark:bg-[#050614]/50 border border-slate-200 dark:border-white/10 rounded-[3rem] p-4 shadow-2xl shadow-indigo-500/20 relative backdrop-blur-xl" style={{ width: '380px', height: '780px' }}>
        {/* Dynamic Island / Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-50 dark:bg-[#050614] rounded-b-2xl z-50 shadow-inner"></div>
        {portalContent}
      </div>

      <ReceiptModal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} receipt={currentReceipt} />
    </div>
  );
}
