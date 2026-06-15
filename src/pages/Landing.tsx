import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wifi, BarChart3, Megaphone, Smartphone, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { AuthModal } from '../components/AuthModal';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleDashboardClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050614] font-sans text-slate-900 dark:text-white relative overflow-hidden">
      {/* Mesh Background Blobs */}

      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Wifi size={20} className="text-slate-900 dark:text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">WiFiCash</span>
            </div>
            <div className="hidden md:flex items-center gap-8 font-medium text-sm">
              <a href="#features" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Fonctionnalités</a>
              <a href="#pricing" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Tarifs</a>
              <a href="#demo" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Portail Captif</a>
              <div className="h-4 w-px bg-white/10"></div>
              <ThemeToggle />
              <Link to="/portal" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Démo Client</Link>
              <button onClick={handleDashboardClick} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 text-sm font-semibold rounded-full transition-colors">
                {user ? 'Mon Espace' : 'Connexion gérant'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Plateforme SaaS N°1
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight"
            >
              Transformez votre Wi-Fi en <span className="text-indigo-400">source de revenus</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-slate-600 dark:text-slate-300 mb-10 tracking-wide"
            >
              Pour les cafés, restaurants et hôtels. Monétisez votre connexion Internet via la vente de forfaits, la publicité sponsorisée et collectez des données marketing précieuses.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button onClick={handleDashboardClick} className="inline-flex items-center justify-center gap-2 bg-indigo-500 text-white px-8 py-3.5 rounded-full font-medium text-lg hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/30 cursor-pointer">
                Lancer mon Wi-Fi <ArrowRight size={20} />
              </button>
              <Link to="/portal" className="inline-flex items-center justify-center gap-2 bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 px-8 py-3.5 rounded-full font-medium text-lg hover:bg-white/10 transition-all backdrop-blur-md">
                Voir la démo client <Smartphone size={20} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative z-10 border-y border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Un écosystème complet pour votre établissement</h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">Générez des revenus tout en offrant une expérience fluide à vos visiteurs.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-3xl backdrop-blur-md">
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-6">
                <Wifi size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Portail Captif</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Offrez une page de connexion à votre image. Authentifiez vos clients via réseaux sociaux ou e-mail en un clic.</p>
            </div>
            
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-3xl backdrop-blur-md">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-6">
                <Megaphone size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Régie Publicitaire</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Affichez des publicités vidéos ou bannières géolocalisées avant la connexion pour offrir le Wi-Fi gratuitement.</p>
            </div>

            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-3xl backdrop-blur-md">
              <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Analyses Visiteurs</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Collectez des statistiques détaillées, fidélisez vos clients et lancez des campagnes SMS/Email ciblées.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Des tarifs adaptés à votre croissance</h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">Sans engagement. Résiliez ou changez de forfait à tout moment.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Starter</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Pour les petits cafés</p>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">9</span>
                <span className="text-lg text-slate-500 dark:text-slate-400"> €</span>
                <span className="text-slate-500 dark:text-slate-400"> /mois</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Check size={18} className="text-indigo-400 shrink-0" />
                  <span>Jusqu'à 500 connexions/mois</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Check size={18} className="text-indigo-400 shrink-0" />
                  <span>Portail captif standard</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Check size={18} className="text-indigo-400 shrink-0" />
                  <span>Acceptation de paiement Stripe</span>
                </li>
              </ul>
              <button className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-medium hover:bg-white/10 transition-colors">
                Commencer
              </button>
            </div>

            {/* Pro */}
            <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-md shadow-xl flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-full shadow-lg shadow-indigo-500/30">
                  Populaire
                </span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Pro</h3>
              <p className="text-indigo-200 mt-2 text-sm">Pour les restaurants & espaces de coworking</p>
              <div className="my-6 text-slate-900 dark:text-white">
                <span className="text-4xl font-extrabold">29</span>
                <span className="text-lg text-indigo-300"> €</span>
                <span className="text-indigo-300"> /mois</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-900 dark:text-white">
                  <Check size={18} className="text-indigo-400 shrink-0" />
                  <span>Connexions illimitées</span>
                </li>
                <li className="flex items-center gap-3 text-slate-900 dark:text-white">
                  <Check size={18} className="text-indigo-400 shrink-0" />
                  <span>Portail captif personnalisé</span>
                </li>
                <li className="flex items-center gap-3 text-slate-900 dark:text-white">
                  <Check size={18} className="text-indigo-400 shrink-0" />
                  <span>Monétisation publicitaire</span>
                </li>
                <li className="flex items-center gap-3 text-slate-900 dark:text-white">
                  <Check size={18} className="text-indigo-400 shrink-0" />
                  <span>Tableau de bord analytique</span>
                </li>
                <li className="flex items-center gap-3 text-slate-900 dark:text-white">
                  <Check size={18} className="text-indigo-400 shrink-0" />
                  <span>Connexion via Réseaux Sociaux</span>
                </li>
              </ul>
              <button className="w-full py-3 px-4 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/30">
                Essai gratuit 14 jours
              </button>
            </div>

            {/* Business */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Business</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Pour les hôtels & réseaux de franchises</p>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">99</span>
                <span className="text-lg text-slate-500 dark:text-slate-400"> €</span>
                <span className="text-slate-500 dark:text-slate-400"> /mois</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Check size={18} className="text-indigo-400 shrink-0" />
                  <span>Multi-sites (jusqu'à 10 établissements)</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Check size={18} className="text-indigo-400 shrink-0" />
                  <span>Programme de fidélité intégré</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Check size={18} className="text-indigo-400 shrink-0" />
                  <span>IA: Prédictions d'affluence</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Check size={18} className="text-indigo-400 shrink-0" />
                  <span>Campagnes SMS et Email Marketing</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Check size={18} className="text-indigo-400 shrink-0" />
                  <span>API d'intégration</span>
                </li>
              </ul>
              <button className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-medium hover:bg-white/10 transition-colors">
                Contacter les ventes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md text-slate-500 dark:text-slate-400 py-12 border-t border-slate-100 dark:border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                 <Wifi size={16} className="text-slate-900 dark:text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">WiFiCash</span>
            </div>
            <p className="text-sm">Transformez votre Wi-Fi en source de revenus rÃ©currents grÃ¢ce Ã  la monÃ©tisation par abonnements ou publicitÃ© intelligente.</p>
          </div>
          <div>
            <h4 className="text-slate-900 dark:text-white font-medium mb-4">Produit</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Portail Captif</a></li>
              <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">RÃ©gie Publicitaire</a></li>
              <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">FidÃ©litÃ© & CRM</a></li>
              <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Tarifs</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 dark:text-white font-medium mb-4">Mentions</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><ShieldCheck size={14} /> <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">RGPD Compliant</a></li>
              <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">SÃ©curitÃ© SSL & Chiffrement</a></li>
              <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Conditions GÃ©nÃ©rales</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 dark:text-white font-medium mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>contact@wificash.com</li>
              <li>1-800-WIFI-CASH</li>
            </ul>
          </div>
        </div>
      </footer>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={handleAuthSuccess} 
        />
      )}
    </div>
  );
}
