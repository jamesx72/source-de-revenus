import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Wifi, Users, DollarSign, Activity, Settings, Bell, Search, LayoutDashboard, Plus, MoreHorizontal, ArrowUpRight, ArrowRight, Smartphone, Gift, Coffee, Sparkles, Star, Award, Edit3, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [ratioConfig, setRatioConfig] = useState({ hours: 1, points: 10 });
  const [isEditingRatio, setIsEditingRatio] = useState(false);
  const [users, setUsers] = useState([
    { id: 1, name: 'Jean Martin', email: 'jean.m@email.com',  time: 'Aujourd\'hui, 14:30', pts: 240, status: 'VIP', color: 'bg-purple-500/20 text-purple-400' },
    { id: 2, name: 'Alice Dupont', email: 'alice.d@email.com', time: 'Hier, 10:15', pts: 80, status: 'Régulier', color: 'bg-blue-500/20 text-blue-400' },
    { id: 3, name: 'Sophie Bernard', email: 'sophie.b@email.com', time: 'Il y a 3 jours', pts: 50, status: 'Nouveau', color: 'bg-emerald-500/20 text-emerald-400' },
    { id: 4, name: 'Luc Tremblay', email: 'luc.t@email.com', time: 'Il y a 1 sem.', pts: 120, status: 'Régulier', color: 'bg-blue-500/20 text-blue-400' },
  ]);
  const [redeemModal, setRedeemModal] = useState<{ isOpen: boolean; userId: number | null }>({ isOpen: false, userId: null });
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  const [rewards, setRewards] = useState([
    { id: 'premium', name: 'Wi-Fi Premium 2h', points: 50, icon: Gift, color: 'text-emerald-400', desc: 'Sans publicité, haut débit', active: true },
    { id: 'coffee', name: 'Café Gratuit', points: 100, icon: Coffee, color: 'text-orange-400', desc: 'Au comptoir', active: true },
    { id: 'discount', name: '-20% sur l\'addition', points: 200, icon: DollarSign, color: 'text-blue-400', desc: 'Valable une fois', active: false },
  ]);

  const [createModalState, setCreateModalState] = useState(false);
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

  return (
    <div className="flex h-screen bg-[#050614] text-white font-sans relative overflow-hidden">
      {/* Mesh Background Blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Sidebar */}
      <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col shrink-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
          <Link to="/" className="flex items-center gap-3 text-white hover:text-white">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
               <Wifi size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">WiFiCash</span>
          </Link>
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
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === item.id 
                    ? 'bg-white/10 text-indigo-300' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-white/10 shrink-0 mt-auto">
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-4">
            <p className="text-xs text-indigo-300 font-medium uppercase tracking-wider mb-2">Plan Business</p>
            <p className="text-xs text-slate-300">Renouvellement: 01 Juil.</p>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-white/10 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Settings size={18} />
            Paramètres
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden z-10">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Tableau de bord</h1>
            <p className="text-sm text-slate-400">Établissement: <span className="text-indigo-400 font-medium">Le Café Central</span></p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">Point d'accès Online</span>
            </div>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-500 w-64 transition-all"
              />
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 pt-4">
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
                <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
                  <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl lg:text-4xl font-bold">{stat.value}</p>
                  <div className={`text-xs mt-2 ${stat.trendColor}`}>{stat.trend}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-lg text-white">Évolution des Revenus</h3>
                    <p className="text-sm text-slate-400">Abonnements Wi-Fi et Publicité</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-3 py-1 bg-white/10 text-white rounded-full">Semaine</span>
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

              {/* Active Plans */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <h3 className="font-semibold text-lg text-white">Forfaits Actifs</h3>
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
                    <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div>
                        <h4 className="font-medium text-sm text-white">{plan.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{plan.duration}</p>
                      </div>
                      <div className={`font-bold font-mono text-sm ${plan.color}`}>
                        {plan.price}
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-6 py-2 text-xs text-indigo-400 font-semibold hover:bg-white/5 rounded-xl transition-colors">
                  Gérer les forfaits
                </button>
              </div>
            </div>
            
            {/* Recent visitors table */}
            <div className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-sm overflow-hidden flex flex-col">
               <div className="flex items-center justify-between p-6 border-b border-white/5">
                  <h3 className="font-semibold text-lg text-white">Connexions récentes</h3>
                  <button className="text-indigo-400 text-sm font-medium hover:text-indigo-300 flex items-center gap-1">
                    Voir tout <ArrowRight size={16} />
                  </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-slate-400 border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 font-medium">Utilisateur</th>
                        <th className="px-6 py-4 font-medium">Session</th>
                        <th className="px-6 py-4 font-medium">Forfait</th>
                        <th className="px-6 py-4 font-medium shrink-0">Statut</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {[
                        { name: 'Alice Dupont', device: 'iPhone 14 Pro', time: 'Il y a 5 min', plan: 'Pass Gratuit (Pub)', status: 'Actif', color: 'bg-green-500/20 text-green-400' },
                        { name: 'Jean Martin', device: 'MacBook Air', time: 'Il y a 12 min', plan: 'Daily Premium', status: 'Actif', color: 'bg-green-500/20 text-green-400' },
                        { name: 'Anonyme (MAC: a1:b2:...)', device: 'Android Phone', time: 'Il y a 45 min', plan: 'Pass Express', status: 'Expiré', color: 'bg-white/10 text-slate-400' },
                        { name: 'Sophie Bernard', device: 'iPad Pro', time: 'Il y a 1 h', plan: 'Nomad Week', status: 'Actif', color: 'bg-green-500/20 text-green-400' },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-white">{row.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Smartphone size={12}/> {row.device}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{row.time}</td>
                          <td className="px-6 py-4">{row.plan}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${row.color}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button className="text-slate-400 hover:text-white p-1">
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
                    <h2 className="text-2xl font-bold text-white mb-2">Fidélité & CRM</h2>
                    <p className="text-slate-400">Gérez vos clients réguliers et votre programme de récompenses.</p>
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
                        <h3 className="font-bold text-white">Barème Actuel</h3>
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
                             className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <span className="text-sm text-slate-300">Heure(s) = </span>
                           <input 
                             type="number" 
                             value={ratioConfig.points}
                             onChange={(e) => setRatioConfig({...ratioConfig, points: parseInt(e.target.value) || 0})}
                             className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <span className="text-sm text-slate-300">Points</span>
                        </div>
                        <button 
                          onClick={() => setIsEditingRatio(false)}
                          className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/30">
                          Enregistrer
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                          Encouragez vos clients à revenir. Les points sont crédités automatiquement à la fin de leur session Wi-Fi.
                        </p>
                        <button 
                          onClick={() => setIsEditingRatio(true)}
                          className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                          <Edit3 size={16} /> Modifier le barème
                        </button>
                      </>
                    )}
                  </div>

                  <div className="lg:col-span-2 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between">
                    <h3 className="font-semibold text-lg text-white mb-6">Récompenses disponibles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      {activeRewards.map(reward => (
                        <div key={reward.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                            <reward.icon className={reward.color} size={20} />
                            <span className={`text-xl font-bold font-mono ${reward.color}`}>{reward.points} pts</span>
                          </div>
                          <div className="mt-auto">
                            <h4 className="font-medium text-white mb-1">{reward.name}</h4>
                            <p className="text-xs text-slate-400">{reward.desc}</p>
                          </div>
                        </div>
                      ))}
                      <div 
                        onClick={() => setCreateModalState(true)}
                        className="bg-white/5 border border-white/10 p-4 rounded-2xl border-dashed border-slate-600 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors cursor-pointer block">
                        <Plus size={24} className="text-slate-400 mb-2" />
                        <span className="text-sm font-medium text-slate-300">Ajouter</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CRM Table */}
                <div className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-sm overflow-hidden flex flex-col">
                   <div className="flex items-center justify-between p-6 border-b border-white/5">
                      <h3 className="font-semibold text-lg text-white">Base Clients & Points</h3>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs font-medium bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">Trier par points</button>
                        <button className="px-3 py-1.5 text-xs font-medium bg-white/5 text-slate-300 rounded-lg border border-white/10 hover:text-white transition-colors">Segments</button>
                      </div>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-slate-400 border-b border-white/5">
                          <tr>
                            <th className="px-6 py-4 font-medium">Client</th>
                            <th className="px-6 py-4 font-medium">Dernière visite</th>
                            <th className="px-6 py-4 font-medium">Solde Points</th>
                            <th className="px-6 py-4 font-medium shrink-0">Statut</th>
                            <th className="px-6 py-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                          {users.map((row) => (
                            <tr key={row.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-medium text-white flex items-center gap-2">
                                  {row.name}
                                  {row.pts >= 200 && <Award size={14} className="text-orange-400" />}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">{row.email}</div>
                              </td>
                              <td className="px-6 py-4 text-slate-400">{row.time}</td>
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
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-lg text-white">Popularité des récompenses</h3>
                      <p className="text-sm text-slate-400">Échanges effectués sur les 7 derniers jours</p>
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

            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Paramètres du Portail</h2>
                  <p className="text-slate-400">Configurez votre programme de fidélité et vos options générales.</p>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                  <h3 className="font-semibold text-lg text-white mb-6 flex items-center gap-2">
                    <Sparkles className="text-indigo-400" size={20} />
                    Configuration de la Fidélité
                  </h3>
                  
                  <div className="space-y-8">
                    {/* Ratio Setting */}
                    <div>
                      <h4 className="font-medium text-white mb-2">Barème d'acquisition des points</h4>
                      <p className="text-sm text-slate-400 mb-4">Définissez combien de points un client gagne par heure de connexion au réseau Wi-Fi.</p>
                      
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 inline-flex">
                        <div className="flex items-center gap-2">
                           <input 
                             type="number" 
                             value={ratioConfig.hours}
                             onChange={(e) => setRatioConfig({...ratioConfig, hours: parseInt(e.target.value) || 1})}
                             className="w-16 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <span className="text-slate-300 font-medium">Heure(s) de session</span>
                        </div>
                        <ArrowRight size={16} className="text-slate-500" />
                        <div className="flex items-center gap-2">
                           <input 
                             type="number" 
                             value={ratioConfig.points}
                             onChange={(e) => setRatioConfig({...ratioConfig, points: parseInt(e.target.value) || 0})}
                             className="w-20 px-3 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-300 font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <span className="text-slate-300 font-medium">Points offerts</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 my-4"></div>

                    {/* Rewards Settings */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-white mb-1">Catalogue de Récompenses</h4>
                          <p className="text-sm text-slate-400">Activez et définissez la valeur des récompenses disponibles pour vos clients.</p>
                        </div>
                        <button 
                          onClick={() => setCreateModalState(true)}
                          className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          <Plus size={16} /> Créer une récompense
                        </button>
                      </div>

                      <div className="space-y-3">
                        {rewards.map(reward => (
                          <div key={reward.id} className={`flex items-center border rounded-2xl p-4 transition-colors ${reward.active ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-60'}`}>
                            <div className={`p-3 rounded-xl mr-4 ${reward.color.replace('text-', 'bg-')}/10 ${reward.color}`}>
                                <reward.icon size={24} />
                            </div>
                            <div className="flex-1 mr-4">
                              <input 
                                type="text"
                                value={reward.name}
                                onChange={(e) => setRewards(rewards.map(r => r.id === reward.id ? {...r, name: e.target.value} : r))}
                                disabled={!reward.active}
                                className={`font-medium text-white w-full bg-transparent border border-transparent hover:border-white/10 focus:border-white/20 focus:bg-white/5 focus:outline-none rounded px-2 -ml-2 transition-colors ${!reward.active && 'opacity-60 cursor-not-allowed'}`}
                              />
                              <input 
                                type="text"
                                value={reward.desc}
                                onChange={(e) => setRewards(rewards.map(r => r.id === reward.id ? {...r, desc: e.target.value} : r))}
                                disabled={!reward.active}
                                className={`text-xs text-slate-400 w-full bg-transparent border border-transparent hover:border-white/10 focus:border-white/20 focus:bg-white/5 focus:outline-none rounded px-2 -ml-2 mt-1 transition-colors ${!reward.active && 'opacity-60 cursor-not-allowed'}`}
                              />
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-400">Coût:</span>
                                <input 
                                  type="number" 
                                  value={reward.points}
                                  onChange={(e) => setRewards(rewards.map(r => r.id === reward.id ? {...r, points: parseInt(e.target.value) || 0} : r))}
                                  disabled={!reward.active}
                                  className="w-20 px-2 py-1 bg-black/20 border border-white/10 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
                    <button className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                      <CheckCircle2 size={18} />
                      Enregistrer les modifications
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Redeem Modal */}
      {redeemModal.isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#050614]/60 backdrop-blur-md p-4 mt-0">
          <div className="bg-[#0b0c21]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => { setRedeemModal({ isOpen: false, userId: null }); setSelectedRewardId(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Échanger des points</h3>
            {(() => {
              const user = users.find(u => u.id === redeemModal.userId);
              if (!user) return null;
              return (
                <>
                  <p className="text-slate-400 text-sm mb-6">Sélectionnez une récompense pour <span className="text-white font-semibold">{user.name}</span> (Solde : <span className="text-indigo-400 font-bold">{user.pts} pts</span>)</p>
                  
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
                          className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${!canAfford ? 'opacity-50 cursor-not-allowed border-white/5 bg-white/5' : isSelected ? 'border-indigo-400 bg-indigo-500/10 cursor-pointer' : 'border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer'}`}
                        >
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-xl ${bgColor} ${reward.color}`}>
                               <reward.icon size={20} />
                             </div>
                             <div>
                               <p className="font-semibold text-white">{reward.name}</p>
                               <p className="text-xs text-slate-400">{reward.desc}</p>
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#050614]/60 backdrop-blur-md p-4 mt-0">
          <div className="bg-[#0b0c21]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setCreateModalState(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Créer une récompense</h3>
            <p className="text-slate-400 text-sm mb-6">Ajoutez une nouvelle option au catalogue de fidélité.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nom de la récompense</label>
                <input 
                  type="text" 
                  placeholder="ex: Pâtisserie offerte"
                  value={newRewardData.name}
                  onChange={(e) => setNewRewardData({...newRewardData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description (optionnelle)</label>
                <input 
                  type="text" 
                  placeholder="ex: Valable tous les matins"
                  value={newRewardData.desc}
                  onChange={(e) => setNewRewardData({...newRewardData, desc: e.target.value})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Coût en points</label>
                <input 
                  type="number" 
                  value={newRewardData.points}
                  onChange={(e) => setNewRewardData({...newRewardData, points: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Icône</label>
                <div className="grid grid-cols-5 gap-2">
                  {ICON_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setNewRewardData({...newRewardData, icon: opt.id})}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-colors ${newRewardData.icon === opt.id ? 'bg-white/10 border-indigo-400' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
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

    </div>
  );
}
