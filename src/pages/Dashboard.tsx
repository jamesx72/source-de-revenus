import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Menu, Wifi, Users, DollarSign, Activity, Settings, Bell, Search, LayoutDashboard, Plus, MoreHorizontal, ArrowUpRight, ArrowRight, Smartphone, Gift, Coffee, Sparkles, Star, Award, Edit3, ShieldCheck, X, CheckCircle2, LogOut, ChevronRight, ChevronLeft, QrCode, Download, MessageSquare } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

const REVENUE_DATA = [
  { name: 'Lun', sales: 4000, ads: 2400 },
  { name: 'Mar', sales: 3000, ads: 1398 },
  { name: 'Mer', sales: 2000, ads: 9800 },
  { name: 'Jeu', sales: 2780, ads: 3908 },
  { name: 'Ven', sales: 1890, ads: 4800 },
  { name: 'Sam', sales: 2390, ads: 3800 },
  { name: 'Dim', sales: 3490, ads: 4300 },
];

const REDEMPTION_DATA = [
  { name: 'Lun', premium: 12, coffee: 5 },
  { name: 'Mar', premium: 19, coffee: 8 },
  { name: 'Mer', premium: 15, coffee: 12 },
  { name: 'Jeu', premium: 22, coffee: 9 },
  { name: 'Ven', premium: 30, coffee: 15 },
  { name: 'Sam', premium: 45, coffee: 25 },
  { name: 'Dim', premium: 35, coffee: 30 },
];

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [ratioConfig, setRatioConfig] = useState({ hours: 1, points: 10 });
  const [wifiConfig, setWifiConfig] = useState({ timeLimit: 'unlimited', customTimeLimit: 120, bandwidth: '10' });
  const [portalConfig, setPortalConfig] = useState<{ themeColor: string; logoUrl: string | null }>({ themeColor: '#6366f1', logoUrl: null });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isEditingRatio, setIsEditingRatio] = useState(false);
  const [users, setUsers] = useState([
    { id: 1, name: 'Jean Martin', email: 'jean.m@email.com',  time: 'Aujourd\'hui, 14:30', pts: 240, status: 'VIP', color: 'bg-purple-500/20 text-purple-400' },
    { id: 2, name: 'Alice Dupont', email: 'alice.d@email.com', time: 'Hier, 10:15', pts: 80, status: 'Régulier', color: 'bg-blue-500/20 text-blue-400' },
    { id: 3, name: 'Sophie Bernard', email: 'sophie.b@email.com', time: 'Il y a 3 jours', pts: 50, status: 'Nouveau', color: 'bg-emerald-500/20 text-emerald-400' },
    { id: 4, name: 'Luc Tremblay', email: 'luc.t@email.com', time: 'Il y a 1 sem.', pts: 120, status: 'Régulier', color: 'bg-blue-500/20 text-blue-400' },
  ]);

  useEffect(() => {
    // Simulate bandwidth hit notification
    const interval = setInterval(() => {
      if (wifiConfig.bandwidth !== 'unlimited') {
        const usagePattern = Math.random();
        // 30% chance every 15 seconds to trigger the warning if bandwidth is restricted
        if (usagePattern > 0.7) {
          toast.warning('Alerte de Congestion Réseau', {
            description: `85% de vos sessions actives atteignent la limite configurée de ${wifiConfig.bandwidth} Mbps. Pensez à ajuster le plafond pour optimiser l'expérience.`,
            duration: 8000,
          });
        }
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [wifiConfig.bandwidth]);
  const [redeemModal, setRedeemModal] = useState<{ isOpen: boolean; userId: number | null }>({ isOpen: false, userId: null });
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  const [rewards, setRewards] = useState([
    { id: 'premium', name: 'Wi-Fi Premium 2h', points: 50, icon: Gift, color: 'text-emerald-400', desc: 'Sans publicité, haut débit', active: true },
    { id: 'coffee', name: 'Café Gratuit', points: 100, icon: Coffee, color: 'text-orange-400', desc: 'Au comptoir', active: true },
    { id: 'discount', name: '-20% sur l\'addition', points: 200, icon: DollarSign, color: 'text-blue-400', desc: 'Valable une fois', active: false },
  ]);

  const [createModalState, setCreateModalState] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('onboardingCompleted'));
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [newRewardData, setNewRewardData] = useState({ name: '', desc: '', points: 100, icon: 'Star' });
  const ICON_OPTIONS = [
    { id: 'Gift', label: 'Cadeau', icon: Gift, color: 'text-emerald-400' },
    { id: 'Coffee', label: 'Café', icon: Coffee, color: 'text-orange-400' },
    { id: 'DollarSign', label: 'Réduction', icon: DollarSign, color: 'text-blue-400' },
    { id: 'Star', label: 'Spécial', icon: Star, color: 'text-purple-400' },
    { id: 'Award', label: 'Privilège', icon: Award, color: 'text-yellow-400' },
  ];

  const activeRewards = rewards.filter(r => r.active);

  const handleRedeem = () => {
    if (redeemModal.userId && selectedRewardId) {
      const reward = activeRewards.find(r => r.id === selectedRewardId);
      if (reward) {
        setUsers(users.map(u => 
          u.id === redeemModal.userId ? { ...u, pts: u.pts - reward.points } : u
        ));
        setRedeemModal({ isOpen: false, userId: null });
        setSelectedRewardId(null);
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-[#050614] flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#050614] text-slate-900 dark:text-white font-sans relative overflow-hidden">
      {/* Mesh Background Blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#050614] lg:dark:bg-white/5 backdrop-blur-xl border-r border-slate-200 dark:border-white/10 flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/10 shrink-0">
          <Link to="/" className="flex items-center gap-3 text-slate-900 dark:text-white hover:text-slate-900 dark:hover:text-white">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
               <Wifi size={18} className="text-slate-900 dark:text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">WiFiCash</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 tracking-wider uppercase">Menu Principal</div>
          <nav className="space-y-1 px-2">
            {[
              { id: 'overview', icon: LayoutDashboard, label: 'Tableau de bord' },
              { id: 'wifi', icon: Wifi, label: 'Forfaits Wi-Fi' },
              { id: 'users', icon: Users, label: 'Visiteurs & CRM' },
              { id: 'ads', icon: DollarSign, label: 'PublicitÃ©s & Revenus' },
              { id: 'analytics', icon: Activity, label: 'Statistiques & IA' },
              { id: 'support', icon: MessageSquare, label: 'Support Technique' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === item.id 
                    ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-indigo-300' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-white/10 shrink-0 mt-auto">
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-4">
            <p className="text-xs text-indigo-300 font-medium uppercase tracking-wider mb-2">Plan Business</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">Renouvellement: 01 Juil.</p>
          </div>
          <button 
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Settings size={18} />
            Paramètres
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 mt-2 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-white dark:bg-white/5 hover:text-red-300 transition-colors">
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden z-10 w-full">
        {/* Header */}
        <header className="h-auto min-h-[5rem] py-4 lg:py-0 lg:h-20 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold">Tableau de bord</h1>
              <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">Établissement: <span className="text-indigo-400 font-medium">Le Café Central</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-4 ml-auto">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></span>
              <span className="text-xs lg:text-sm font-medium hidden sm:inline">Point d'accès Online</span>
              <span className="text-xs lg:text-sm font-medium sm:hidden">Online</span>
            </div>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-500 w-48 lg:w-64 transition-all"
              />
            </div>
            <ThemeToggle />
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-slate-300 dark:border-white/20 p-0.5 lg:ml-2">
              <img src={user.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pt-2 lg:pt-4">
          <div className="max-w-6xl mx-auto space-y-8">
            {activeTab === 'overview' && (
              <>
                   {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Revenus du jour', value: '1,245 €', trend: '+14% ce mois', trendColor: 'text-green-400' },
                { label: 'Visiteurs Uniques', value: '842', trend: '+5% vs hier', trendColor: 'text-green-400' },
                { label: 'Sessions Wi-Fi Actives', value: '56', trend: '+12% vs hier', trendColor: 'text-green-400' },
                { label: 'Temps Moyen', value: '45 min',  trend: '-2 min vs moyenne', trendColor: 'text-slate-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-3xl backdrop-blur-md">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl lg:text-4xl font-bold">{stat.value}</p>
                  <div className={`text-xs mt-2 ${stat.trendColor}`}>{stat.trend}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Évolution des Revenus</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Abonnements Wi-Fi et Publicité</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-3 py-1 bg-white/10 text-slate-900 dark:text-white rounded-full">Semaine</span>
                    <span className="px-3 py-1 text-slate-500">Mois</span>
                  </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '14px', fontWeight: 500, color: '#f8fafc' }}
                      />
                      <Area type="monotone" name="Forfaits Wi-Fi" dataKey="sales" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                      <Area type="monotone" name="Publicités" dataKey="ads" stroke="#c084fc" strokeWidth={3} fillOpacity={1} fill="url(#colorAds)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex flex-col gap-8">
                {/* Active Plans */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-6 shrink-0">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Forfaits Actifs</h3>
                    <button className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-1.5 transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    {[
                      { name: 'Pass Gratuit (Pub)', duration: '30 min', price: '0 €', color: 'text-green-400' },
                      { name: 'Pass Express', duration: '2 heures', price: '2 €', color: 'text-indigo-400' },
                      { name: 'Daily Premium', duration: '24 heures', price: '5 €', color: 'text-purple-400' },
                      { name: 'Nomad Week', duration: '7 jours', price: '15 €', color: 'text-orange-400' },
                    ].map((plan, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3 last:border-0 last:pb-0">
                        <div>
                          <h4 className="font-medium text-sm text-slate-900 dark:text-white">{plan.name}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">{plan.duration}</p>
                        </div>
                        <div className={`font-bold font-mono text-sm ${plan.color}`}>
                          {plan.price}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button className="w-full mt-6 py-2 text-xs text-indigo-400 font-semibold hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                    Gérer les forfaits
                  </button>
                </div>

                {/* System Health */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-6 shrink-0">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                       <Activity size={20} className="text-indigo-500" />
                       État du Système
                    </h3>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-semibold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      En ligne
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Passerelle Wi-Fi</span>
                        <span className="text-[10px] text-slate-500">Ping: 12ms</span>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">Connectée</span>
                    </div>
                    
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Dernier redémarrage</span>
                        <span className="text-[10px] text-slate-500">Uptime: 45 jours</span>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">12 Mai 2026</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Bande passante</span>
                        <span className="text-[10px] text-slate-500">Saturée à 85%</span>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">85 / 100 Mbps</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent visitors table */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl backdrop-blur-md shadow-sm overflow-hidden flex flex-col">
               <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Connexions récentes</h3>
                  <button className="text-indigo-400 text-sm font-medium hover:text-indigo-300 flex items-center gap-1">
                    Voir tout <ArrowRight size={16} />
                  </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5">
                      <tr>
                        <th className="px-6 py-4 font-medium">Utilisateur</th>
                        <th className="px-6 py-4 font-medium">Session</th>
                        <th className="px-6 py-4 font-medium">Forfait</th>
                        <th className="px-6 py-4 font-medium shrink-0">Statut</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-600 dark:text-slate-300">
                      {[
                        { name: 'Alice Dupont', device: 'iPhone 14 Pro', time: 'Il y a 5 min', plan: 'Pass Gratuit (Pub)', status: 'Actif', color: 'bg-green-500/20 text-green-400' },
                        { name: 'Jean Martin', device: 'MacBook Air', time: 'Il y a 12 min', plan: 'Daily Premium', status: 'Actif', color: 'bg-green-500/20 text-green-400' },
                        { name: 'Anonyme (MAC: a1:b2:...)', device: 'Android Phone', time: 'Il y a 45 min', plan: 'Pass Express', status: 'Expiré', color: 'bg-white/10 text-slate-500 dark:text-slate-400' },
                        { name: 'Sophie Bernard', device: 'iPad Pro', time: 'Il y a 1 h', plan: 'Nomad Week', status: 'Actif', color: 'bg-green-500/20 text-green-400' },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-white dark:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-white">{row.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Smartphone size={12}/> {row.device}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{row.time}</td>
                          <td className="px-6 py-4">{row.plan}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${row.color}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1">
                               <MoreHorizontal size={18} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
              </>
            )}

            {activeTab === 'users' && (
              <div className="space-y-8">
                {/* CRM Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Fidélité & CRM</h2>
                    <p className="text-slate-500 dark:text-slate-400">Gérez vos clients réguliers et votre programme de récompenses.</p>
                  </div>
                  <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                    <Plus size={16} /> Nouvelle Campagne
                  </button>
                </div>

                {/* Loyalty Rules & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                        <Sparkles className="text-indigo-400" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Barème Actuel</h3>
                        <p className="text-sm text-indigo-300">{ratioConfig.hours}h de connexion = {ratioConfig.points} pts</p>
                      </div>
                    </div>
                    {isEditingRatio ? (
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-2">
                           <input 
                             type="number" 
                             value={ratioConfig.hours}
                             onChange={(e) => setRatioConfig({...ratioConfig, hours: parseInt(e.target.value) || 1})}
                             className="w-16 px-2 py-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <span className="text-sm text-slate-600 dark:text-slate-300">Heure(s) = </span>
                           <input 
                             type="number" 
                             value={ratioConfig.points}
                             onChange={(e) => setRatioConfig({...ratioConfig, points: parseInt(e.target.value) || 0})}
                             className="w-20 px-2 py-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <span className="text-sm text-slate-600 dark:text-slate-300">Points</span>
                        </div>
                        <button 
                          onClick={() => setIsEditingRatio(false)}
                          className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/30">
                          Enregistrer
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                          Encouragez vos clients à revenir. Les points sont crédités automatiquement à la fin de leur session Wi-Fi.
                        </p>
                        <button 
                          onClick={() => setIsEditingRatio(true)}
                          className="w-full py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-white/10 text-slate-900 dark:text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                          <Edit3 size={16} /> Modifier le barème
                        </button>
                      </>
                    )}
                  </div>

                  <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-6">Récompenses disponibles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      {activeRewards.map(reward => (
                        <div key={reward.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                            <reward.icon className={reward.color} size={20} />
                            <span className={`text-xl font-bold font-mono ${reward.color}`}>{reward.points} pts</span>
                          </div>
                          <div className="mt-auto">
                            <h4 className="font-medium text-slate-900 dark:text-white mb-1">{reward.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{reward.desc}</p>
                          </div>
                        </div>
                      ))}
                      <div 
                        onClick={() => setCreateModalState(true)}
                        className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl border-dashed border-slate-600 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors cursor-pointer block">
                        <Plus size={24} className="text-slate-500 dark:text-slate-400 mb-2" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Ajouter</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CRM Table */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl backdrop-blur-md shadow-sm overflow-hidden flex flex-col">
                   <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Base Clients & Points</h3>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs font-medium bg-white/10 text-slate-900 dark:text-white rounded-lg hover:bg-white/20 transition-colors">Trier par points</button>
                        <button className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-white transition-colors">Segments</button>
                      </div>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5">
                          <tr>
                            <th className="px-6 py-4 font-medium">Client</th>
                            <th className="px-6 py-4 font-medium">Dernière visite</th>
                            <th className="px-6 py-4 font-medium">Solde Points</th>
                            <th className="px-6 py-4 font-medium shrink-0">Statut</th>
                            <th className="px-6 py-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-600 dark:text-slate-300">
                          {users.map((row) => (
                            <tr key={row.id} className="hover:bg-white dark:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                  {row.name}
                                  {row.pts >= 200 && <Award size={14} className="text-orange-400" />}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">{row.email}</div>
                              </td>
                              <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{row.time}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 font-mono font-bold text-indigo-300">
                                  {row.pts} <Sparkles size={14} />
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${row.color}`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button 
                                   onClick={() => setRedeemModal({ isOpen: true, userId: row.id })}
                                   className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto transition-colors"
                                 >
                                   <Gift size={14} /> Échanger
                                 </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                     </table>
                   </div>
                </div>

                {/* Redemption Trends */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Popularité des récompenses</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Échanges effectués sur les 7 derniers jours</p>
                    </div>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={REDEMPTION_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '14px', fontWeight: 500, color: '#f8fafc' }}
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#94a3b8' }} />
                        <Bar name="Wi-Fi Premium 2h" dataKey="premium" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar name="Café Gratuit" dataKey="coffee" fill="#fb923c" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'wifi' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Forfaits Wi-Fi</h2>
                  <p className="text-slate-500 dark:text-slate-400">Gérez les offres d'accès à votre réseau.</p>
                </div>
                {/* Active Plans Duplicated here for context */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Forfaits Actifs</h3>
                    <button className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-2 transition-colors flex items-center gap-2 px-4">
                      <Plus size={16} /> Créer un forfait
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { name: 'Pass Gratuit (Pub)', duration: '30 min', price: '0 €', color: 'text-green-400' },
                      { name: 'Pass Express', duration: '2 heures', price: '2 €', color: 'text-indigo-400' },
                      { name: 'Daily Premium', duration: '24 heures', price: '5 €', color: 'text-purple-400' },
                      { name: 'Nomad Week', duration: '7 jours', price: '15 €', color: 'text-orange-400' },
                    ].map((plan, i) => (
                      <div key={i} className="flex items-center justify-between border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">{plan.name}</h4>
                          <p className="text-sm text-slate-500 mt-1">Limite: {plan.duration}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className={`font-bold font-mono text-lg ${plan.color}`}>
                            {plan.price}
                          </div>
                          <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ads' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Publicités & Revenus</h2>
                  <p className="text-slate-500 dark:text-slate-400">Gérez vos campagnes publicitaires sur le portail captif.</p>
                </div>
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center backdrop-blur-md shadow-sm">
                  <DollarSign size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Module Publicitaire</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                    Affichez des vidéos sponsorisées ou vos propres offres avant la connexion de l'utilisateur pour monétiser l'accès gratuit.
                  </p>
                  <button className="mt-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-6 py-3 sm:py-2.5 w-full sm:w-auto font-medium transition-colors">
                    Activer la régie publicitaire
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Statistiques & IA</h2>
                  <p className="text-slate-500 dark:text-slate-400">Analyse du trafic et recommandations de l'assistant IA.</p>
                </div>
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center backdrop-blur-md shadow-sm">
                  <Activity size={48} className="text-indigo-400 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Analyses Avancées IA</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                    Découvrez des insights précis sur les heures d'affluence et le profil de vos clients grâce à l'analyse IA.
                  </p>
                  <button className="mt-6 bg-purple-500 hover:bg-purple-600 text-white rounded-xl px-6 py-3 sm:py-2.5 w-full sm:w-auto font-medium transition-colors flex justify-center items-center gap-2 sm:mx-auto">
                    <Sparkles size={18} /> Générer un rapport IA
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Paramètres du Portail</h2>
                  <p className="text-slate-500 dark:text-slate-400">Configurez votre programme de fidélité et vos options générales.</p>
                </div>
                
                {/* Customization Section */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Smartphone className="text-indigo-400" size={20} />
                    Personnalisation du Portail
                  </h3>
                  
                  <div className="flex flex-col md:flex-row gap-8">
                     <div className="flex-1 space-y-8">
                       {/* Logo Upload */}
                       <div>
                          <h4 className="font-medium text-slate-900 dark:text-white mb-2">Logo de l'établissement</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Formats acceptés : PNG, JPG, SVG.</p>
                          <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative group">
                              {portalConfig.logoUrl ? (
                                <img src={portalConfig.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                              ) : (
                                <Wifi className="text-slate-300 dark:text-slate-600" size={32} />
                              )}
                              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                <span className="text-white text-xs font-medium">Modifier</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => {
                                    if(e.target.files && e.target.files[0]) {
                                      const url = URL.createObjectURL(e.target.files[0]);
                                      setPortalConfig(prev => ({...prev, logoUrl: url}));
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            <div className="flex flex-col gap-2">
                               <button 
                                 className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                                 onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e: any) => {
                                      if(e.target.files && e.target.files[0]) {
                                        const url = URL.createObjectURL(e.target.files[0]);
                                        setPortalConfig(prev => ({...prev, logoUrl: url}));
                                      }
                                    };
                                    input.click();
                                 }}
                               >
                                 Uploader un logo
                               </button>
                               {portalConfig.logoUrl && (
                                 <button 
                                   onClick={() => setPortalConfig(prev => ({...prev, logoUrl: null}))}
                                   className="text-xs text-red-500 hover:text-red-600 text-left px-1"
                                 >
                                   Supprimer
                                 </button>
                               )}
                            </div>
                          </div>
                       </div>
                       
                       <div className="border-t border-slate-200 dark:border-white/10 my-4"></div>
                       
                       {/* Color Scheme */}
                       <div>
                          <h4 className="font-medium text-slate-900 dark:text-white mb-2">Couleur principale</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Cette couleur sera utilisée pour les boutons et éléments clés du portail.</p>
                          <div className="flex flex-wrap gap-4">
                            {[
                              { label: 'Indigo', hex: '#6366f1' },
                              { label: 'Rose', hex: '#ec4899' },
                              { label: 'Vert', hex: '#10b981' },
                              { label: 'Orange', hex: '#f97316' },
                              { label: 'Noir', hex: '#0f172a' },
                            ].map(color => (
                              <button
                                key={color.hex}
                                onClick={() => setPortalConfig(prev => ({...prev, themeColor: color.hex}))}
                                className={`w-10 h-10 rounded-full border-2 transition-all ${portalConfig.themeColor === color.hex ? 'border-indigo-400 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: color.hex }}
                                title={color.label}
                              />
                            ))}
                            <div className="relative">
                              <input 
                                type="color" 
                                value={portalConfig.themeColor}
                                onChange={(e) => setPortalConfig(prev => ({...prev, themeColor: e.target.value}))}
                                className="w-10 h-10 rounded-full cursor-pointer opacity-0 absolute inset-0 z-10"
                              />
                              <div 
                                className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden relative"
                                style={{ backgroundColor: portalConfig.themeColor }}
                              >
                                <span className="text-[10px] text-white/80 mix-blend-difference font-mono mt-0.5">Roue</span>
                              </div>
                            </div>
                          </div>
                       </div>

                    </div>
                    
                    {/* Live Preview (mini) */}
                    <div className="w-[280px] shrink-0 hidden lg:block border border-slate-200 dark:border-white/10 rounded-[2rem] p-3 bg-slate-50 dark:bg-white/5 relative shadow-inner h-[500px]">
                      <div className="w-full h-full bg-[#050614] rounded-[1.5rem] overflow-hidden relative border border-white/5 flex flex-col items-center p-6 text-center shadow-2xl">
                         {portalConfig.logoUrl ? (
                            <img src={portalConfig.logoUrl} className="w-16 h-16 object-contain mb-8 z-10 mx-auto mt-4" alt="Aperçu Logo" />
                         ) : (
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 z-10 mx-auto text-white mt-4">
                              <Wifi size={24} />
                            </div>
                         )}
                         <h4 className="text-white font-bold text-lg z-10 mb-2">Bienvenue</h4>
                         <p className="text-slate-400 text-xs z-10 mb-8 px-4">Connectez-vous pour accéder au réseau Wi-Fi gratuit.</p>
                         
                         <div className="w-full space-y-3 z-10 mt-auto">
                            <div className="w-full py-2.5 rounded-xl font-medium text-sm text-white flex justify-center items-center gap-2 transition-colors" style={{ backgroundColor: portalConfig.themeColor, opacity: 0.9 }}>
                               Connexion Rapide
                            </div>
                            <div className="w-full py-2.5 rounded-xl font-medium text-sm text-white border border-white/10 flex justify-center items-center gap-2 bg-white/5">
                               Publicité (30s)
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                    <button 
                       onClick={() => setShowPreviewModal(true)}
                       className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors flex justify-center items-center gap-2"
                    >
                       <Smartphone size={18} />
                       Aperçu en direct
                    </button>
                    <button className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2">
                       <CheckCircle2 size={18} />
                       Appliquer la personnalisation
                    </button>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Sparkles className="text-indigo-400" size={20} />
                    Configuration de la Fidélité
                  </h3>
                  
                  <div className="space-y-8">
                    {/* Ratio Setting */}
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">Barème d'acquisition des points</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Définissez combien de points un client gagne par heure de connexion au réseau Wi-Fi.</p>
                      
                      <div className="flex items-center gap-4 bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 inline-flex">
                        <div className="flex items-center gap-2">
                           <input 
                             type="number" 
                             value={ratioConfig.hours}
                             onChange={(e) => setRatioConfig({...ratioConfig, hours: parseInt(e.target.value) || 1})}
                             className="w-16 px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <span className="text-slate-600 dark:text-slate-300 font-medium">Heure(s) de session</span>
                        </div>
                        <ArrowRight size={16} className="text-slate-500" />
                        <div className="flex items-center gap-2">
                           <input 
                             type="number" 
                             value={ratioConfig.points}
                             onChange={(e) => setRatioConfig({...ratioConfig, points: parseInt(e.target.value) || 0})}
                             className="w-20 px-3 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-300 font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <span className="text-slate-600 dark:text-slate-300 font-medium">Points offerts</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/10 my-4"></div>

                    {/* Rewards Settings */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white mb-1">Catalogue de Récompenses</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Activez et définissez la valeur des récompenses disponibles pour vos clients.</p>
                        </div>
                        <button 
                          onClick={() => setCreateModalState(true)}
                          className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          <Plus size={16} /> Créer une récompense
                        </button>
                      </div>

                      <div className="space-y-3">
                        {rewards.map(reward => (
                          <div key={reward.id} className={`flex items-center border rounded-2xl p-4 transition-colors ${reward.active ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10' : 'bg-transparent border-slate-100 dark:border-white/5 opacity-60'}`}>
                            <div className={`p-3 rounded-xl mr-4 ${reward.color.replace('text-', 'bg-')}/10 ${reward.color}`}>
                                <reward.icon size={24} />
                            </div>
                            <div className="flex-1 mr-4">
                              <input 
                                type="text"
                                value={reward.name}
                                onChange={(e) => setRewards(rewards.map(r => r.id === reward.id ? {...r, name: e.target.value} : r))}
                                disabled={!reward.active}
                                className={`font-medium text-slate-900 dark:text-white w-full bg-transparent border border-transparent hover:border-slate-200 dark:border-white/10 focus:border-slate-300 dark:border-white/20 focus:bg-white dark:bg-white/5 focus:outline-none rounded px-2 -ml-2 transition-colors ${!reward.active && 'opacity-60 cursor-not-allowed'}`}
                              />
                              <input 
                                type="text"
                                value={reward.desc}
                                onChange={(e) => setRewards(rewards.map(r => r.id === reward.id ? {...r, desc: e.target.value} : r))}
                                disabled={!reward.active}
                                className={`text-xs text-slate-500 dark:text-slate-400 w-full bg-transparent border border-transparent hover:border-slate-200 dark:border-white/10 focus:border-slate-300 dark:border-white/20 focus:bg-white dark:bg-white/5 focus:outline-none rounded px-2 -ml-2 mt-1 transition-colors ${!reward.active && 'opacity-60 cursor-not-allowed'}`}
                              />
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Coût:</span>
                                <input 
                                  type="number" 
                                  value={reward.points}
                                  onChange={(e) => setRewards(rewards.map(r => r.id === reward.id ? {...r, points: parseInt(e.target.value) || 0} : r))}
                                  disabled={!reward.active}
                                  className="w-20 px-2 py-1 bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                />
                                <span className="text-xs text-slate-500">pts</span>
                              </div>

                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={reward.active}
                                  onChange={() => setRewards(rewards.map(r => r.id === reward.id ? {...r, active: !r.active} : r))}
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                    <button className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2">
                      <CheckCircle2 size={18} />
                      Enregistrer les modifications
                    </button>
                  </div>
                </div>
                
                {/* Wi-Fi Configuration Section */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Wifi className="text-indigo-400" size={20} />
                    Configuration Wi-Fi
                  </h3>
                  
                  <div className="space-y-8">
                    {/* Time limit */}
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">Limite de temps de session</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Combien de temps un utilisateur peut-il rester connecté en une seule session ?</p>
                      <div className="flex flex-wrap gap-4">
                        {['unlimited', '30', '60', '120', 'custom'].map(limit => (
                          <label key={limit} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${wifiConfig.timeLimit === limit ? 'bg-indigo-500/20 border-indigo-400' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-white/10'}`}>
                            <input type="radio" name="timeLimit" value={limit} checked={wifiConfig.timeLimit === limit} onChange={() => setWifiConfig({...wifiConfig, timeLimit: limit})} className="hidden" />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {limit === 'unlimited' ? 'Illimité' : limit === 'custom' ? 'Personnalisé' : `${limit} min`}
                            </span>
                          </label>
                        ))}
                      </div>
                      {wifiConfig.timeLimit === 'custom' && (
                        <div className="mt-4 flex items-center gap-2">
                           <input type="number" value={wifiConfig.customTimeLimit} onChange={e => setWifiConfig({...wifiConfig, customTimeLimit: parseInt(e.target.value) || 0})} className="w-20 px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                           <span className="text-sm text-slate-600 dark:text-slate-300">minutes</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-slate-200 dark:border-white/10 my-4"></div>
                    
                    {/* Bandwidth Limit */}
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">Limite de bande passante</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Réduisez la vitesse du réseau par utilisateur pour éviter la saturation du réseau.</p>
                      <div className="flex flex-wrap gap-4">
                        {['unlimited', '5', '10', '25', '50'].map(bw => (
                          <label key={bw} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${wifiConfig.bandwidth === bw ? 'bg-indigo-500/20 border-indigo-400' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-white/10'}`}>
                            <input type="radio" name="bandwidth" value={bw} checked={wifiConfig.bandwidth === bw} onChange={() => setWifiConfig({...wifiConfig, bandwidth: bw})} className="hidden" />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {bw === 'unlimited' ? 'Sans limite' : `${bw} Mbps`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                    <button className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                      <CheckCircle2 size={18} />
                      Enregistrer la configuration Wi-Fi
                    </button>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <QrCode className="text-indigo-400" size={20} />
                      QR Code d'Accès
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                      Imprimez ce QR Code et placez-le sur vos tables, à l'accueil ou sur vos menus. Vos clients n'auront qu'à le scanner pour être instantanément redirigés vers votre portail captif personnalisé et se connecter au réseau.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={() => {
                          const svg = document.getElementById('portal-qrcode');
                          if (svg) {
                            const svgData = new XMLSerializer().serializeToString(svg);
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const img = new Image();
                            img.onload = () => {
                              canvas.width = img.width;
                              canvas.height = img.height;
                              ctx?.drawImage(img, 0, 0);
                              const pngFile = canvas.toDataURL('image/png');
                              const downloadLink = document.createElement('a');
                              downloadLink.download = 'wifi-qrcode.png';
                              downloadLink.href = pngFile;
                              downloadLink.click();
                            };
                            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                          }
                        }}
                        className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white rounded-xl text-sm font-medium transition-colors border border-slate-200 dark:border-white/10 flex items-center gap-2"
                      >
                        <Download size={16} /> Télécharger l'image (PNG)
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl shrink-0 shadow-xl ring-1 ring-white/20">
                    <QRCodeSVG 
                      id="portal-qrcode"
                      value={`${window.location.origin}/portal`} 
                      size={180} 
                      bgColor={"#ffffff"} 
                      fgColor={"#050614"} 
                      level={"M"} 
                      includeMargin={false} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Support Technique</h2>
                  <p className="text-slate-500 dark:text-slate-400">Si vous rencontrez un problème, contactez notre équipe technique.</p>
                </div>
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <MessageSquare className="text-indigo-400" size={20} />
                    Nouveau Ticket
                  </h3>
                  <form className="space-y-6" onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const subject = (form.elements.namedItem('subject') as HTMLInputElement).value;
                    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;
                    
                    try {
                      const { doc, setDoc, collection, serverTimestamp } = await import('firebase/firestore');
                      const { db, auth } = await import('../firebase');
                      if(!auth.currentUser) return alert('Non authentifié');
                      
                      const ref = doc(collection(db, 'support_tickets'));
                      await setDoc(ref, {
                        subject,
                        message,
                        status: 'open',
                        userId: auth.currentUser.uid,
                        userEmail: auth.currentUser.email,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                      });
                      
                      alert('Votre demande a été envoyée. Nos équipes vous répondront rapidement.');
                      form.reset();
                    } catch(err) {
                      console.error(err);
                      alert('Erreur: ' + (err instanceof Error ? err.message : String(err)));
                    }
                  }}>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Sujet de votre demande</label>
                      <input 
                        id="subject"
                        name="subject"
                        type="text" 
                        required
                        placeholder="Ex: Problème d'accès au portail captif, question facturation..." 
                        className="w-full px-4 py-3 sm:py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Détails (Que se passe-t-il ?)</label>
                      <textarea 
                        id="message"
                        name="message"
                        required
                        rows={5}
                        placeholder="Veuillez décrire votre problème en détails..." 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-500 resize-none"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                       <button 
                         type="submit"
                         className="w-full sm:w-auto px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2"
                       >
                         Envoyer au Support
                       </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Redeem Modal */}
      {redeemModal.isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-[#050614]/60 backdrop-blur-md p-4 mt-0">
          <div className="bg-white/60 dark:bg-[#0b0c21]/60 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => { setRedeemModal({ isOpen: false, userId: null }); setSelectedRewardId(null); }}
              className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Échanger des points</h3>
            {(() => {
              const user = users.find(u => u.id === redeemModal.userId);
              if (!user) return null;
              return (
                <>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Sélectionnez une récompense pour <span className="text-slate-900 dark:text-white font-semibold">{user.name}</span> (Solde : <span className="text-indigo-400 font-bold">{user.pts} pts</span>)</p>
                  
                  <div className="space-y-3 mb-6">
                    {activeRewards.map(reward => {
                      const canAfford = user.pts >= reward.points;
                      const isSelected = selectedRewardId === reward.id;
                      // Determine the specific color to use slightly adjusted for icons/backgrounds
                      const bgColor = reward.color.replace('text-', 'bg-').concat('/10');
                      
                      return (
                        <div 
                          key={reward.id}
                          onClick={() => canAfford && setSelectedRewardId(reward.id)}
                          className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${!canAfford ? 'opacity-50 cursor-not-allowed border-slate-100 dark:border-white/5 bg-white dark:bg-white/5' : isSelected ? 'border-indigo-400 bg-indigo-500/10 cursor-pointer' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-white/10 cursor-pointer'}`}
                        >
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-xl ${bgColor} ${reward.color}`}>
                               <reward.icon size={20} />
                             </div>
                             <div>
                               <p className="font-semibold text-slate-900 dark:text-white">{reward.name}</p>
                               <p className="text-xs text-slate-500 dark:text-slate-400">{reward.desc}</p>
                             </div>
                          </div>
                          <div className={`font-mono font-bold ${canAfford ? 'text-indigo-300' : 'text-slate-500'}`}>
                            {reward.points} pts
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={handleRedeem}
                    disabled={!selectedRewardId}
                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/30"
                  >
                    Confirmer l'échange
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
      {/* Create Reward Modal */}
      {createModalState && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-[#050614]/60 backdrop-blur-md p-4 mt-0">
          <div className="bg-white/60 dark:bg-[#0b0c21]/60 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setCreateModalState(false)}
              className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Créer une récompense</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Ajoutez une nouvelle option au catalogue de fidélité.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nom de la récompense</label>
                  <input 
                  type="text" 
                  placeholder="ex: Pâtisserie offerte"
                  value={newRewardData.name}
                  onChange={(e) => setNewRewardData({...newRewardData, name: e.target.value})}
                  className="w-full px-3 py-3 sm:py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Description (optionnelle)</label>
                <input 
                  type="text" 
                  placeholder="ex: Valable tous les matins"
                  value={newRewardData.desc}
                  onChange={(e) => setNewRewardData({...newRewardData, desc: e.target.value})}
                  className="w-full px-3 py-3 sm:py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Coût en points</label>
                <input 
                  type="number" 
                  value={newRewardData.points}
                  onChange={(e) => setNewRewardData({...newRewardData, points: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-3 sm:py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Icône</label>
                <div className="grid grid-cols-5 gap-2">
                  {ICON_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setNewRewardData({...newRewardData, icon: opt.id})}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-colors ${newRewardData.icon === opt.id ? 'bg-white/10 border-indigo-400' : 'bg-white dark:bg-white/5 border-transparent hover:bg-white/10'}`}
                    >
                      <opt.icon size={20} className={opt.color} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                const selectedIcon = ICON_OPTIONS.find(i => i.id === newRewardData.icon) || ICON_OPTIONS[0];
                setRewards([...rewards, {
                    id: `custom-${Date.now()}`,
                    name: newRewardData.name || 'Nouvelle récompense',
                    desc: newRewardData.desc,
                    points: newRewardData.points,
                    icon: selectedIcon.icon,
                    color: selectedIcon.color,
                    active: true
                }]);
                setCreateModalState(false);
                setNewRewardData({ name: '', desc: '', points: 100, icon: 'Star' });
              }}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/30"
            >
              Ajouter au catalogue
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-50 dark:bg-[#050614]/80 backdrop-blur-md p-4">
          <div className="bg-white/80 dark:bg-[#0b0c21]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative">
            <button 
              onClick={() => {
                setShowOnboarding(false);
                localStorage.setItem('onboardingCompleted', 'true');
              }}
              className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            
            {onboardingStep === 1 && (
              <div className="text-center py-6 text-slate-900 dark:text-white space-y-4">
                <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wifi size={32} />
                </div>
                <h2 className="text-2xl font-bold">Bienvenue sur WiFiCash</h2>
                <p className="text-slate-500 dark:text-slate-400">Configurez votre portail captif en quelques étapes pour offrir un réseau Wi-Fi sécurisé, collecter des contacts et fidéliser vos clients.</p>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="text-center py-6 text-slate-900 dark:text-white space-y-4">
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Settings size={32} />
                </div>
                <h2 className="text-2xl font-bold">Configuration Wi-Fi</h2>
                <p className="text-slate-500 dark:text-slate-400">Rendez-vous dans la section <strong>Paramètres</strong> pour personnaliser la limite de temps par session, ainsi que la bande passante maximale allouée par utilisateur et éviter la saturation.</p>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="text-center py-6 text-slate-900 dark:text-white space-y-4">
                <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={32} />
                </div>
                <h2 className="text-2xl font-bold">Fidélité & Monétisation</h2>
                <p className="text-slate-500 dark:text-slate-400">Attribuez des points proportionnels au temps de connexion, et créez des récompenses sur-mesure (ex: Un café après 5 heures cumulées). Vos clients s'inscriront d'eux-mêmes !</p>
              </div>
            )}

            {onboardingStep === 4 && (
              <div className="text-center py-6 text-slate-900 dark:text-white space-y-4">
                <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-bold">Vous êtes prêt !</h2>
                <p className="text-slate-500 dark:text-slate-400">Les configurations s'appliquent immédiatement. Vous pourrez suivre l'évolution des visites et de vos revenus directement depuis ce tableau de bord.</p>
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(step => (
                  <div key={step} className={`w-2 h-2 rounded-full ${onboardingStep === step ? 'bg-indigo-500' : 'bg-white/20'}`}></div>
                ))}
              </div>
              <div className="flex gap-3">
                {onboardingStep > 1 && (
                  <button 
                    onClick={() => setOnboardingStep(s => s - 1)}
                    className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-white/10 text-slate-900 dark:text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Retour
                  </button>
                )}
                {onboardingStep < 4 ? (
                  <button 
                    onClick={() => setOnboardingStep(s => s + 1)}
                    className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                  >
                    Suivant <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setShowOnboarding(false);
                      localStorage.setItem('onboardingCompleted', 'true');
                    }}
                    className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                  >
                    Terminer <CheckCircle2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm shadow-2xl">
          <div className="relative w-full max-w-[400px] bg-[#050614] rounded-[2.5rem] p-4 border-4 border-slate-800 shadow-2xl h-[800px] flex flex-col">
            <button 
              onClick={() => setShowPreviewModal(false)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-lg z-50 border border-slate-200 dark:border-slate-700"
            >
              <X size={20} />
            </button>
            <div className="flex-1 w-full relative rounded-[2rem] overflow-hidden border border-white/5 flex flex-col items-center pt-16 p-8 text-center bg-slate-900 shadow-inner">
               <div className="absolute top-0 inset-x-0 h-40 bg-indigo-500/20 blur-[50px] pointer-events-none"></div>
               {portalConfig.logoUrl ? (
                  <img src={portalConfig.logoUrl} className="w-24 h-24 object-contain mb-8 z-10 mx-auto" alt="Aperçu Logo" />
               ) : (
                  <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 z-10 mx-auto text-white shadow-xl shadow-white/5">
                    <Wifi size={40} />
                  </div>
               )}
               <h4 className="text-white font-bold text-2xl z-10 mb-3 tracking-tight">Bienvenue</h4>
               <p className="text-slate-400 text-sm z-10 mb-12">Connectez-vous pour accéder au réseau Wi-Fi gratuit de l'établissement.</p>
               
               <div className="w-full space-y-4 z-10 mt-auto">
                  <button className="w-full py-3.5 rounded-xl font-medium text-base text-white flex justify-center items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]" style={{ backgroundColor: portalConfig.themeColor }}>
                     <Sparkles size={18} />
                     Connexion Rapide
                  </button>
                  <button className="w-full py-3.5 rounded-xl font-medium text-base text-white border border-white/10 flex justify-center items-center gap-2 bg-white/5 hover:bg-white/10 transition-colors">
                     Publicité (30s)
                  </button>
               </div>
               <div className="mt-8 z-10 text-[10px] text-slate-500 underline decoration-slate-600 underline-offset-4 cursor-pointer hover:text-slate-400">
                  Conditions d'utilisation
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
