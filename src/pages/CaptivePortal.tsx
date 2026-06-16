import { useState, useEffect } from 'react';
import { Wifi, PlayCircle, CreditCard, Facebook, ShieldCheck, CheckCircle2, ChevronLeft, Smartphone, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function CaptivePortal() {
  const [searchParams] = useSearchParams();
  const locationId = searchParams.get('locationId');
  
  const [step, setStep] = useState<'home' | 'ad' | 'success' | 'payment'>('home');
  const [adProgress, setAdProgress] = useState(0);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  const [locationName, setLocationName] = useState('Le Café Central');
  const [portalConfig, setPortalConfig] = useState<any>(null);
  const [locationOwnerId, setLocationOwnerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      // payment handling check
      if (searchParams.get('payment_success') === 'true') {
         setStep('success');
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
                userId: null,
                device: deviceType,
                os,
                duration: 120, // 2H premium
                connectedAt: serverTimestamp(),
                status: 'Connecté'
              });
            } catch (err) {
              console.error("Failed to log connection:", err);
            }
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
        }
      } catch (err) {
        console.error("Error fetching location for portal:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLocation();
  }, [locationId, searchParams]);

  const handleCheckout = async (priceAmount: number, passName: string) => {
    setIsProcessingPayment(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceAmount, passName, locationId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Erreur lors de la création de la session de paiement');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur inconnue');
    } finally {
      setIsProcessingPayment(false);
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
                        onClick={() => handleCheckout(200, "Premium 2 Heures")}
                        disabled={isProcessingPayment}
                        className={`w-full flex items-center justify-between p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors backdrop-blur-sm ${layoutTheme === 'elegant' ? 'rounded-md' : 'rounded-xl'}`}
                      >
                       <div className="text-left">
                          <p className="font-bold text-sm">Premium 2 Heures</p>
                          <p className="text-xs text-slate-500 opacity-80">Haut débit sans publicité</p>
                       </div>
                       <div className="font-bold">2.00 €</div>
                      </button>
                      <button 
                        onClick={() => handleCheckout(500, "Pass Journée")}
                        disabled={isProcessingPayment}
                        className={`w-full flex items-center justify-between p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors backdrop-blur-sm ${layoutTheme === 'elegant' ? 'rounded-md' : 'rounded-xl'}`}
                      >
                       <div className="text-left">
                          <p className="font-bold text-sm">Pass Journée</p>
                          <p className="text-xs text-slate-500 opacity-80">Accès illimité 24h</p>
                       </div>
                       <div className="font-bold">5.00 €</div>
                      </button>
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
                      <button onClick={simulateAd} className="flex-1 p-3 flex justify-center items-center rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/30 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors">
                        <Facebook size={20} />
                      </button>
                      <button onClick={simulateAd} className="flex-1 p-3 flex justify-center items-center rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
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
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{sessionDuration}:00</p>
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
                className="flex flex-col h-full bg-transparent p-6 relative overflow-y-auto"
              >
                <button 
                  onClick={() => setStep('home')}
                  className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/10 transition-colors mb-6 flex-shrink-0"
                >
                  <ChevronLeft size={20} />
                </button>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Paiement sécurisé</h2>

                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex justify-between items-center mb-8 backdrop-blur-sm">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Pass Express (2H)</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Le Café Central</p>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">2,00 €</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Email (pour le reçu)</label>
                    <input type="email" placeholder="client@email.com" className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Carte bancaire</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                      <input type="text" placeholder="0000 0000 0000 0000" className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="MM/AA" className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600" />
                    <input type="text" placeholder="CVC" className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600" />
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/10">
                  <button 
                    onClick={() => setStep('success')}
                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    Payer 2,00 €
                  </button>
                  <div className="flex justify-center items-center gap-2 mt-4 text-xs text-slate-500">
                    <ShieldCheck size={14} /> Paiement sécurisé par Stripe
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
