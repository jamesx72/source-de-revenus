import { useState, useEffect } from 'react';
import { Wifi, PlayCircle, CreditCard, Facebook, ShieldCheck, CheckCircle2, ChevronLeft, Smartphone, Sparkles, Star, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLIC_KEY || '');

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
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
        return_url: `${window.location.origin}/portal?locationId=${new URLSearchParams(window.location.search).get('locationId')}&payment_success=true`,
      },
    });

    if (error) {
      setErrorMessage(error.message || 'Une erreur est survenue.');
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
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-bold flex justify-center mt-4"
      >
        {isProcessing ? 'Traitement en cours...' : 'Payer'}
      </button>
    </form>
  );
}

export default function CaptivePortal() {
  const [searchParams] = useSearchParams();
  const locationId = searchParams.get('locationId');
  
  const [step, setStep] = useState<'home' | 'ad' | 'success' | 'payment' | 'payment_success'>('home');
  const [adProgress, setAdProgress] = useState(0);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentCode, setPaymentCode] = useState<string>('');
  
  const [locationName, setLocationName] = useState('Le Café Central');
  const [portalConfig, setPortalConfig] = useState<any>(null);
  const [paymentConfig, setPaymentConfig] = useState({ currency: 'eur', price1h: 2, price24h: 5 });
  const [locationOwnerId, setLocationOwnerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Promo code feature
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      // payment handling check
      if (searchParams.get('payment_success') === 'true') {
         const paymentIntentId = searchParams.get('payment_intent');
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
                        locationName: 'Location Paid',
                        userId: locationOwnerId,
                        device: deviceType,
                        os,
                        duration: 120, // 2H premium approx
                        connectedAt: serverTimestamp(),
                        status: 'Connecté'
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

      if (!locationId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const docRef = doc(db, 'locations', locationId);
        const docSnap = await getDoc(docRef);
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
        }
      } catch (err) {
        console.error("Error fetching location for portal:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLocation();
  }, [locationId, searchParams]);

  const handleCheckout = async (basePriceAmount: number, passName: string) => {
    setIsProcessingPayment(true);
    try {
      const clientMac = searchParams.get('mac') || searchParams.get('client_mac') || searchParams.get('id') || 'unknown-mac';

      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           priceAmount: basePriceAmount, 
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
        setStep('payment');
      } else {
        alert(data.error || 'Erreur lors de la session');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur inconnue');
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
        setPromoError('Code promo invalide ou expiré.');
        setAppliedPromo(null);
      } else {
        const discountDoc = snapshot.docs[0];
        const data = discountDoc.data();
        if (data.maxUses !== null && data.uses >= data.maxUses) {
            setPromoError('Ce code a atteint sa limite d\'utilisation.');
            setAppliedPromo(null);
        } else {
            setAppliedPromo({ id: discountDoc.id, ...data });
        }
      }
    } catch (err) {
       console.error(err);
       setPromoError('Erreur lors de la vérification.');
    } finally {
       setIsApplyingPromo(true);
       setTimeout(() => setIsApplyingPromo(false), 500); // Visual feedback
    }
  };

  const handleSocialLogin = async (providerName: 'google' | 'facebook') => {
    try {
      const provider = providerName === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
      if (providerName === 'google') {
          provider.addScope('email');
          provider.addScope('profile');
      }
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      setStep('success');

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
            status: 'Connecté'
          });
        } catch (err) {
            console.error("Failed to log social connection:", err);
        }
      }
    } catch (error) {
      console.error(`${providerName} login error:`, error);
      alert(`Erreur de connexion avec ${providerName}`);
    }
  };

  const simulateAd = () => {
    setStep('ad');
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setAdProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(async () => {
          setStep('success');
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
                locationName,
                userId: locationOwnerId,
                device: deviceType,
                os,
                duration: portalConfig?.sessionDuration !== undefined ? portalConfig.sessionDuration : 60,
                connectedAt: serverTimestamp(),
                status: 'Connecté'
              });
            } catch (err) {
              console.error("Failed to log connection:", err);
            }
          }
        }, 500);
      }
    }, 500);
  };

  const activeThemeColor = portalConfig?.themeColor || '#6366f1';
  const layoutTheme = portalConfig?.layoutTheme || 'default';
  const logoUrl = portalConfig?.logoUrl;
  const welcomeMessage = portalConfig?.welcomeMessage || `Bienvenue au ${locationName}`;
  const termsOfService = portalConfig?.termsOfService;
  const sessionDuration = portalConfig?.sessionDuration !== undefined ? portalConfig.sessionDuration : 60;
  const redirectUrl = portalConfig?.redirectUrl;

  const handleSuccessClickAndRedirect = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hasShownExpiryWarning, setHasShownExpiryWarning] = useState(false);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);

  useEffect(() => {
    if (step === 'success') {
      if (timeLeft === null) setTimeLeft(sessionDuration * 60);
    } else if (step === 'payment_success') {
      // Premium 120 minutes
      setTimeLeft(120 * 60); 
    }
  }, [step, sessionDuration]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev !== null && prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 300 && timeLeft > 0 && !hasShownExpiryWarning) {
      setShowExpiryWarning(true);
      setHasShownExpiryWarning(true);
    }
  }, [timeLeft, hasShownExpiryWarning]);

  const getDisplayPrice = (baseCents: number) => {
    const symbol = paymentConfig.currency === 'usd' ? '$' : paymentConfig.currency === 'gbp' ? '£' : '€';
    if (!appliedPromo) return (baseCents / 100).toFixed(2) + " " + symbol;
    let newCents = baseCents;
    if (appliedPromo.type === 'percentage') {
       newCents = Math.max(0, Math.round(baseCents * (1 - (appliedPromo.value / 100))));
    } else if (appliedPromo.type === 'flat') {
       newCents = Math.max(0, baseCents - (appliedPromo.value * 100));
    }
    // Stripe minimum handled on backend but for display we can show 0 or exact. Backend caps at 50 cents.
    if (newCents > 0 && newCents < 50) newCents = 50; 
    return (newCents / 100).toFixed(2) + " " + symbol;
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#050614] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
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
          Retour au site
        </Link>
        <ThemeToggle />
      </div>

      {/* Phone Mockup */}
      <div className="bg-slate-50 dark:bg-[#050614]/50 border border-slate-200 dark:border-white/10 rounded-[3rem] p-4 shadow-2xl shadow-indigo-500/20 relative backdrop-blur-xl" style={{ width: '380px', height: '780px' }}>
        {/* Dynamic Island / Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-50 dark:bg-[#050614] rounded-b-2xl z-50 shadow-inner"></div>
        
        {/* Screen */}
        <div className="bg-white/40 dark:bg-[#0b0c21]/40 backdrop-blur-2xl w-full h-full rounded-[2rem] overflow-hidden relative flex flex-col border border-slate-200 dark:border-white/10 shadow-inner">
          
          <AnimatePresence mode="wait">
            {step === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`flex-1 overflow-y-auto flex relative p-6 pt-16 h-full ${layoutTheme === 'modern' ? 'flex-col justify-end pb-8' : 'flex-col items-center'} ${layoutTheme === 'elegant' ? 'bg-slate-900 text-slate-100 font-serif' : 'bg-[#f8fafc] text-slate-900'}`}
              >
                {layoutTheme === 'modern' && logoUrl && (
                  <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${logoUrl})`, filter: 'blur(10px)' }}></div>
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
                       {sessionDuration > 0 ? `Connectez-vous pour profiter de ${sessionDuration >= 60 ? Math.floor(sessionDuration/60) + 'h' + (sessionDuration%60 > 0 ? (sessionDuration%60).toString() : '') : sessionDuration + ' min'} de Wi-Fi gratuit.` : "Connectez-vous pour accéder au Wi-Fi gratuit."}
                    </p>
                  )}

                  <button 
                     onClick={simulateAd}
                     type="button"
                     style={{ backgroundColor: activeThemeColor }}
                     className={`w-full py-4 text-white font-bold text-lg shadow-lg mb-6 transition-transform hover:opacity-90 active:scale-95 ${layoutTheme === 'elegant' ? 'rounded-md uppercase tracking-wider text-sm shadow-black/50' : 'rounded-xl'}`}
                  >
                     {layoutTheme === 'minimal' ? 'Connexion Automatique' : 'Se connecter gratuitement'}
                  </button>

                  {portalConfig?.allowExtension && (
                    <div className="w-full space-y-3 mb-6">
                      <button 
                        onClick={() => handleCheckout((paymentConfig.price1h || 2) * 100, "Premium 2 Heures")}
                        disabled={isProcessingPayment}
                        className={`w-full flex items-center justify-between p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors backdrop-blur-sm ${layoutTheme === 'elegant' ? 'rounded-md' : 'rounded-xl'}`}
                      >
                       <div className="text-left">
                          <p className="font-bold text-sm">Premium 2 Heures</p>
                          <p className="text-xs text-slate-500 opacity-80">Haut débit sans publicité</p>
                       </div>
                       <div className="font-bold flex items-center gap-2">
                        {appliedPromo && <span className="text-sm line-through text-slate-400 font-normal">{(paymentConfig.price1h || 2).toFixed(2)} {paymentConfig.currency === 'usd' ? '$' : paymentConfig.currency === 'gbp' ? '£' : '€'}</span>}
                        {getDisplayPrice((paymentConfig.price1h || 2) * 100)}
                       </div>
                      </button>
                      <button 
                        onClick={() => handleCheckout((paymentConfig.price24h || 5) * 100, "Pass Journée")}
                        disabled={isProcessingPayment}
                        className={`w-full flex items-center justify-between p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors backdrop-blur-sm ${layoutTheme === 'elegant' ? 'rounded-md' : 'rounded-xl'}`}
                      >
                       <div className="text-left">
                          <p className="font-bold text-sm">Pass Journée</p>
                          <p className="text-xs text-slate-500 opacity-80">Accès illimité 24h</p>
                       </div>
                       <div className="font-bold flex items-center gap-2">
                        {appliedPromo && <span className="text-sm line-through text-slate-400 font-normal">{(paymentConfig.price24h || 5).toFixed(2)} {paymentConfig.currency === 'usd' ? '$' : paymentConfig.currency === 'gbp' ? '£' : '€'}</span>}
                        {getDisplayPrice((paymentConfig.price24h || 5) * 100)}
                       </div>
                      </button>
                    </div>
                  )}

                  {portalConfig?.allowExtension && (
                    <div className="w-full mb-6">
                      {appliedPromo ? (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded-xl flex items-center justify-between text-sm">
                          <span className="font-medium">Code appliqué : {appliedPromo.code} (-{appliedPromo.type === 'percentage' ? `${appliedPromo.value}%` : `${appliedPromo.value}€`})</span>
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
                            placeholder="Code promo ?"
                            className="flex-1 px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono"
                          />
                          <button 
                            onClick={handleApplyPromo}
                            disabled={isApplyingPromo || !promoCodeInput.trim()}
                            className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-medium text-sm disabled:opacity-50 transition-colors"
                          >
                            {isApplyingPromo ? '...' : 'Appliquer'}
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
                      <span className="flex-shrink-0 mx-4 text-slate-500 text-xs text-opacity-50">Ou se connecter avec</span>
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
                          <p>En vous connectant, vous acceptez les conditions générales d'utilisation de ce réseau.</p>
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
                className="flex flex-col h-full bg-transparent text-slate-900 dark:text-white"
              >
                <div className="flex-1 relative flex items-center justify-center">
                  <div className="absolute top-6 right-6 text-xs font-bold text-slate-900 dark:text-white/70 bg-black/40 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-full z-10 backdrop-blur-md">
                    Publicité - Ne quittez pas
                  </div>
                  
                  {/* Mock Video Ad Placeholder */}
                  <div className="text-center p-8 z-10 relative">
                    {/* Background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/30 rounded-full blur-[60px]"></div>

                    <div className="w-20 h-20 bg-indigo-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.6)] relative z-10">
                      <Smartphone size={32} className="text-slate-900 dark:text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 relative z-10">Découvrez la nouvelle App</h2>
                    <p className="text-indigo-200 relative z-10">Téléchargez maintenant et obtenez 20% de réduction.</p>
                  </div>

                  <img 
                    src="https://images.unsplash.com/photo-1616077168079-7e09a6a575fd?auto=format&fit=crop&q=80&w=600" 
                    className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
                    alt="Ad Background"
                  />
                  
                  {/* Progress Bar */}
                  <div className="absolute bottom-12 left-8 right-8 z-10">
                    <p className="text-sm font-medium text-center mb-3 text-indigo-300">Connexion en cours...</p>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                      <motion.div 
                        className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                        style={{ width: `${adProgress}%` }}
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
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">Paiement Réussi</h2>
                <p className="text-slate-600 dark:text-slate-400 font-medium px-4 relative z-10 text-sm">Merci pour votre achat ! Voici votre code de connexion.</p>
                
                <div className="mt-8 mb-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm w-full relative z-10 backdrop-blur-md">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-2">Code d'accès Wi-Fi</p>
                  <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5 font-mono text-3xl font-bold text-indigo-500 tracking-widest">
                    {paymentCode}
                  </div>
                </div>
                
                <button 
                  onClick={() => setStep('success')}
                  style={{ backgroundColor: activeThemeColor }}
                  className="w-full py-4 text-white rounded-xl font-bold text-lg transition-transform shadow-lg shadow-indigo-500/20 mt-auto hover:opacity-90 active:scale-95"
                >
                  Se connecter maintenant
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
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">Connecté !</h2>
                <p className="text-indigo-200 font-medium px-4 relative z-10 text-sm">Vous avez désormais accès à Internet.</p>
                
                {sessionDuration > 0 && (
                  <div className="mt-8 mb-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm w-full relative z-10 backdrop-blur-md">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Temps restant</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{timeLeft !== null ? formatTime(timeLeft) : `${sessionDuration}:00`}</p>
                    
                    <button 
                      onClick={() => handleCheckout(200, "Extension Premium 2 Heures")}
                      disabled={isProcessingPayment}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl transition-colors font-medium border border-indigo-100 dark:border-indigo-500/20"
                    >
                      <span>Prolonger (+2h) - 2.00 €</span>
                      {isProcessingPayment && <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>}
                    </button>
                  </div>
                )}
                
                {redirectUrl && (
                  <button 
                    onClick={handleSuccessClickAndRedirect}
                    style={{ backgroundColor: activeThemeColor }}
                    className="w-full py-3 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 mb-6 relative z-10 hover:opacity-90 active:scale-95"
                  >
                    Continuer vers le site
                  </button>
                )}

                <AnimatePresence>
                  {showExpiryWarning && (
                    <motion.div 
                      initial={{ opacity: 0, y: 50, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      className="absolute bottom-4 left-4 right-4 bg-amber-500 text-white rounded-2xl p-5 shadow-2xl z-50 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 font-bold text-lg">
                           <AlertCircle size={20} />
                           Session bientôt expirée
                        </div>
                        <button onClick={() => setShowExpiryWarning(false)} className="p-1 hover:bg-black/10 rounded-lg transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-amber-50 leading-snug text-left">
                        Votre session Wi-Fi expire dans moins de 5 minutes.
                      </p>
                      
                      <button 
                        onClick={() => {
                           setShowExpiryWarning(false);
                           handleCheckout(200, "Extension Premium 2 Heures");
                        }}
                        disabled={isProcessingPayment}
                        className="mt-2 w-full py-3 bg-white text-amber-600 font-bold rounded-xl shadow-sm hover:bg-amber-50 transition-colors flex items-center justify-center gap-2 active:scale-95"
                      >
                        <span>Prolonger la session (+2h)</span>
                        {isProcessingPayment && <div className="w-4 h-4 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin"></div>}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!feedbackSubmitted ? (
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm w-full relative z-10 backdrop-blur-md mb-6 mt-auto">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Comment évaluez-vous votre expérience ?</p>
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
                      Envoyer
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-2xl w-full relative z-10 mb-6"
                  >
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300 mb-1">Merci pour votre retour ! 🎉</p>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 opacity-80">Votre avis nous aide à nous améliorer.</p>
                  </motion.div>
                )}

                <p className="mt-auto text-xs text-slate-500 flex items-center justify-center gap-1 relative z-10 pb-4">
                  <ShieldCheck size={14}/> Connexion sécurisée par WiFiCash
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
                <div className="p-6 relative z-10 bg-white/40 dark:bg-black/20 backdrop-blur-md border-b border-slate-200 dark:border-white/10 flex items-center gap-4 shrink-0">
                   <button 
                     onClick={() => setStep('home')}
                     className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                   >
                     <ChevronLeft size={20} />
                   </button>
                   <h2 className="text-xl font-bold text-slate-900 dark:text-white">Paiement</h2>
                </div>

                <div className="flex-1 w-full overflow-y-auto" id="checkout">
                   {clientSecret ? (
                      <Elements
                        stripe={stripePromise}
                        options={{ clientSecret, appearance: { theme: 'stripe' } }}
                      >
                        <CheckoutForm />
                      </Elements>
                   ) : (
                      <div className="flex items-center justify-center h-full">
                         <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      </div>
                   )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
