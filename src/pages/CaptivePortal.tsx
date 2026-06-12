import { useState } from 'react';
import { Wifi, PlayCircle, CreditCard, Facebook, Mail, ShieldCheck, CheckCircle2, ChevronLeft, Smartphone, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';

export default function CaptivePortal() {
  const [step, setStep] = useState<'home' | 'ad' | 'success' | 'payment'>('home');
  const [adProgress, setAdProgress] = useState(0);

  const simulateAd = () => {
    setStep('ad');
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setAdProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep('success'), 500);
      }
    }, 500);
  };

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
                className="flex flex-col h-full"
              >
                {/* Header Image */}
                <div className="h-48 bg-slate-200 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=600" 
                    alt="Cafe interior" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c21] via-[#0b0c21]/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-6 right-6">
                    <h2 className="text-slate-900 dark:text-white text-2xl font-bold">Le Café Central</h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm flex items-center gap-1 mt-1">
                      <Wifi size={14} className="text-indigo-400" /> WiFiCash Network
                    </p>
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col overflow-y-auto pb-8">
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Bon retour, Alex ! 👋</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Vous avez accumulé <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md">120 points</span>. Choisissez votre accès :</p>
                  </div>

                  {/* Options */}
                  <div className="space-y-4 mb-8">
                    {/* Free Option */}
                    <button 
                      onClick={simulateAd}
                      className="w-full flex items-center p-4 border border-indigo-500/30 bg-indigo-500/10 rounded-2xl hover:bg-indigo-500/20 transition-colors group relative overflow-hidden backdrop-blur-sm"
                    >
                      <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm">
                        POPULAIRE
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-indigo-300">30 min Gratuites</h4>
                        </div>
                        <p className="text-xs text-indigo-200/70">10 sec de publicité</p>
                      </div>
                      <PlayCircle size={28} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                    </button>

                    {/* Loyalty Option */}
                    <button 
                      onClick={() => setStep('success')}
                      className="w-full flex items-center p-4 border border-indigo-500/50 bg-indigo-500/20 rounded-2xl hover:bg-indigo-500/30 transition-colors backdrop-blur-sm relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm">
                        FIDÉLITÉ
                      </div>
                      <div className="flex-1 text-left">
                         <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white">Premium 2 Heures</h4>
                        </div>
                        <p className="text-xs text-indigo-300">Offert pour votre fidélité</p>
                      </div>
                      <div className="font-bold text-lg text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-lg">
                        50 <Sparkles size={14} />
                      </div>
                    </button>

                    {/* Paid Option */}
                    <button 
                      onClick={() => setStep('payment')}
                      className="w-full flex items-center p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-2xl hover:bg-white/10 transition-colors backdrop-blur-sm"
                    >
                      <div className="flex-1 text-left">
                         <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white">Premium 2 Heures</h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Haut débit sans pub</p>
                      </div>
                      <div className="font-bold text-lg text-slate-900 dark:text-white px-3 py-1 bg-white/10 rounded-lg">2 €</div>
                    </button>
                    
                    {/* Paid Option */}
                    <button 
                      onClick={() => setStep('payment')}
                      className="w-full flex items-center p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-2xl hover:bg-white/10 transition-colors backdrop-blur-sm"
                    >
                      <div className="flex-1 text-left">
                         <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white">Pass Journée</h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Illimité 24h</p>
                      </div>
                      <div className="font-bold text-lg text-slate-900 dark:text-white px-3 py-1 bg-white/10 rounded-lg">5 €</div>
                    </button>
                  </div>

                  {/* Social Login info */}
                  <div className="mt-auto">
                    <div className="relative flex items-center py-4">
                      <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                      <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">Ou se connecter avec</span>
                      <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                    </div>
                    <div className="flex gap-4 max-w-[200px] mx-auto">
                      <button className="flex-1 p-3 flex justify-center items-center rounded-xl bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] hover:bg-[#1877F2]/30 transition-colors">
                        <Facebook size={20} />
                      </button>
                      <button className="flex-1 p-3 flex justify-center items-center rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      </button>
                    </div>
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
                className="flex flex-col h-full items-center justify-center p-8 bg-transparent text-center relative"
              >
                {/* Background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px]"></div>

                <div className="w-24 h-24 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-6 relative z-10 border border-indigo-500/30">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">Connecté !</h2>
                <p className="text-indigo-200 font-medium px-4 relative z-10">Vous avez désormais accès à Internet.</p>
                
                <div className="mt-8 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm w-full max-w-[280px] relative z-10 backdrop-blur-md">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Temps restant</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">29:59</p>
                </div>

                <p className="mt-auto text-xs text-slate-500 flex items-center gap-1 relative z-10">
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
