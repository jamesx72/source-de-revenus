import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Menu, WifiOff, Wifi, User, Users, DollarSign, Activity, Settings, Bell, Search, LayoutDashboard, Plus, MoreHorizontal, ArrowUpRight, ArrowRight, Smartphone, Gift, Coffee, Sparkles, Star, Award, Edit3, ShieldCheck, X, CheckCircle2, LogOut, ChevronRight, ChevronLeft, QrCode, Download, MessageSquare, Globe, Mail, Megaphone, Clock, Calendar, Palette, MapPin, Trash2, Key, BellRing, Moon, Sun, AlertCircle, Ticket, Server, HeartPulse, XCircle } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableWidget } from '../components/SortableWidget';
import { LocationsMapView } from '../components/LocationsMap';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
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

const MONTHLY_REVENUE_DATA = [
  { name: 'Jan', sales: 12000, ads: 8400 },
  { name: 'Fév', sales: 15000, ads: 9200 },
  { name: 'Mar', sales: 18000, ads: 11000 },
  { name: 'Avr', sales: 14000, ads: 13900 },
  { name: 'Mai', sales: 22000, ads: 18000 },
  { name: 'Juin', sales: 26000, ads: 21000 },
];

const WIFI_USAGE_DATA = [
  { name: 'Jan', sessions: 4000, dataGB: 450 },
  { name: 'Fév', sessions: 3500, dataGB: 380 },
  { name: 'Mar', sessions: 5200, dataGB: 590 },
  { name: 'Avr', sessions: 4800, dataGB: 510 },
  { name: 'Mai', sessions: 6100, dataGB: 720 },
  { name: 'Juin', sessions: 7400, dataGB: 850 },
];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = Array.from({length: 24}, (_, i) => i);

const DEVICE_DISTRIBUTION_DATA = [
  { name: 'Mobile', value: 65, color: '#818cf8', icon: <Smartphone size={16} /> },
  { name: 'Desktop', value: 25, color: '#34d399', icon: <LayoutDashboard size={16} /> },
  { name: 'Tablet', value: 10, color: '#fbbf24', icon: <Smartphone size={16} className="rotate-90" /> },
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

const TRANSLATIONS = {
  fr: {
    dashboard: "Tableau de bord",
    establishment: "Établissement:",
    online: "Point d'accès Online",
    search: "Rechercher...",
    welcome: "Bienvenue",
    loginInfo: "Connectez-vous pour accéder au réseau Wi-Fi gratuit de l'établissement.",
    quickConnect: "Connexion Rapide",
    adVideo: "Publicité (30s)",
    terms: "Conditions d'utilisation"
  },
  en: {
    dashboard: "Dashboard",
    establishment: "Establishment:",
    online: "Access Point Online",
    search: "Search...",
    welcome: "Welcome",
    loginInfo: "Log in to access the establishment's free Wi-Fi network.",
    quickConnect: "Quick Connect",
    adVideo: "Advertisement (30s)",
    terms: "Terms of Use"
  }
};

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const t = TRANSLATIONS[language];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [ratioConfig, setRatioConfig] = useState({ hours: 1, points: 10 });
  const [wifiConfig, setWifiConfig] = useState({ timeLimit: 'unlimited', customTimeLimit: 120, bandwidth: '10', autoRenew: false, autoRenewLimit: 1, macBypassEnabled: false, macBypassGracePeriod: 24 });
  const [portalConfig, setPortalConfig] = useState<{ themeColor: string; logoUrl: string | null }>({ themeColor: '#6366f1', logoUrl: null });
  const [smtpConfig, setSmtpConfig] = useState({ enabled: false, host: '', port: 587, username: '', password: '', fromName: 'Mon Établissement', fromEmail: 'no-reply@mon-etablissement.com' });
  const [promoBanner, setPromoBanner] = useState({ enabled: false, title: 'Happy Hour !', description: '-20% sur toutes les boissons de 18h à 20h.', type: 'info', scheduleType: 'always', startTime: '18:00', endTime: '20:00', imageUrl: '', linkUrl: '' });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [backupRetention, setBackupRetention] = useState('30');
  const [adsRevenueTimeframe, setAdsRevenueTimeframe] = useState<'daily' | 'monthly'>('daily');
  const [overviewTimeframe, setOverviewTimeframe] = useState<'daily' | 'monthly'>('daily');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'daily' | 'monthly'>('monthly');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSavingWifiConfig, setIsSavingWifiConfig] = useState(false);

  const handleSaveWifiConfig = async () => {
    if (!user || locations.length === 0) return;
    setIsSavingWifiConfig(true);
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const primaryLocation = locations[0];
      const docRef = doc(db, 'locations', primaryLocation.id);
      
      await setDoc(docRef, {
        wifiConfig: wifiConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast.success("Configuration Wi-Fi enregistrée!");
      
      // Update local state copy
      setLocations(prev => prev.map(loc => 
        loc.id === primaryLocation.id 
          ? { ...loc, wifiConfig } 
          : loc
      ));
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement de la configuration Wi-Fi.");
    } finally {
      setIsSavingWifiConfig(false);
    }
  };

  // DnD configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [widgetOrder, setWidgetOrder] = useState(['stats', 'revenue', 'plans', 'connections', 'activity']);

  function handleWidgetDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleLocationDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocations((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  // Vouchers state
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [vouchers, setVouchers] = useState([
    { id: '1', code: 'A7X9-B2M4', duration: '2 heures', status: 'actif', locationId: 'all', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    { id: '2', code: 'K9P1-C4R8', duration: '24 heures', status: 'utilisé', locationId: 'all', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    { id: '3', code: 'L2N5-J7W3', duration: '1 semaine', status: 'actif', locationId: 'all', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  ]);

  // Locations state
  const [locations, setLocations] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [isSubmittingLocation, setIsSubmittingLocation] = useState(false);
  const [locationFormError, setLocationFormError] = useState('');

  // Portal Config Modal
  const [showPortalConfigModal, setShowPortalConfigModal] = useState(false);
  const [currentLocationForPortal, setCurrentLocationForPortal] = useState<any>(null);
  const [isSubmittingPortalConfig, setIsSubmittingPortalConfig] = useState(false);
  const [portalConfigPreview, setPortalConfigPreview] = useState({ themeColor: '#6366f1', logoUrl: '', welcomeMessage: '', termsOfService: '', layoutTheme: 'default', sessionDuration: 60, allowExtension: false, redirectUrl: '' });
  const [previewDeviceSize, setPreviewDeviceSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [aiBrandPrompt, setAiBrandPrompt] = useState('');
  const [isGeneratingAiTheme, setIsGeneratingAiTheme] = useState(false);

  // Notification Config Modal
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [currentLocationForNotification, setCurrentLocationForNotification] = useState<any>(null);
  const [isSubmittingNotification, setIsSubmittingNotification] = useState(false);

  // QR Code Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [currentLocationForQr, setCurrentLocationForQr] = useState<any>(null);

  useEffect(() => {
    // Simulate data fetching from Firestore
    const timer = setTimeout(() => {
      setIsDataLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let unsubscribeConnections: (() => void) | undefined;
    async function fetchLocations() {
      if (!user) {
        setIsDataLoading(false);
        return;
      }
      setIsLoadingLocations(true);
      try {
        const { collection, getDocs, query, where, orderBy, onSnapshot } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const q = query(
          collection(db, 'locations'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const locs = querySnapshot.docs.map((doc, idx) => ({ 
          id: doc.id, 
          ...doc.data(),
          // Mock heartbeat: Every second location is simulated offline for demonstration (> 5 mins)
          lastHeartbeat: Date.now() - (idx === 0 ? 30000 : 360000) 
        })) as any[];
        setLocations(locs);
        if (locs.length > 0 && locs[0].wifiConfig) {
          setWifiConfig(prev => ({ ...prev, ...locs[0].wifiConfig }));
        }

        const connectionsQuery = query(
          collection(db, 'connections'),
          where('userId', '==', user.uid),
          orderBy('connectedAt', 'desc')
        );
        unsubscribeConnections = onSnapshot(connectionsQuery, (snapshot) => {
           const logData = snapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
           }));
           setConnections(logData);
        }, (error) => {
           console.error("Error fetching connections logs in real-time:", error);
        });

      } catch (err: any) {
        console.error("Failed to fetch locations:", err);
      } finally {
        setIsLoadingLocations(false);
      }
    }
    fetchLocations();
    return () => {
      if (unsubscribeConnections) {
        unsubscribeConnections();
      }
    };
  }, [user]);

  const handleSaveLocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmittingLocation(true);
    setLocationFormError('');

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const address = formData.get('address') as string;

    if (!name || !type || !address) {
      setLocationFormError('Veuillez remplir tous les champs.');
      setIsSubmittingLocation(false);
      return;
    }

    try {
      const { doc, setDoc, addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      if (currentLocation) {
        const docRef = doc(db, 'locations', currentLocation.id);
        await setDoc(docRef, {
          name,
          type,
          address,
          userId: user.uid,
          createdAt: currentLocation.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        toast.success("Établissement mis à jour avec succès.");
      } else {
        await addDoc(collection(db, 'locations'), {
          name,
          type,
          address,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast.success("Nouvel établissement ajouté.");
      }
      
      // Re-fetch
      const { getDocs, query, where, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'locations'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const locs = querySnapshot.docs.map((d, idx) => ({ 
        id: d.id, 
        ...d.data(),
        lastHeartbeat: Date.now() - (idx === 0 ? 30000 : 360000) 
      }));
      setLocations(locs);
      
      setShowLocationModal(false);
      setCurrentLocation(null);
    } catch (error: any) {
      console.error(error);
      setLocationFormError("Erreur lors de la sauvegarde: " + error.message);
    } finally {
      setIsSubmittingLocation(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!user || !confirm('Voulez-vous vraiment supprimer cet établissement ?')) return;
    
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await deleteDoc(doc(db, 'locations', id));
      setLocations(prev => prev.filter(loc => loc.id !== id));
      toast.success("Établissement supprimé.");
    } catch (error: any) {
      console.error(error);
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleSavePortalConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !currentLocationForPortal) return;
    setIsSubmittingPortalConfig(true);

    const themeColor = portalConfigPreview.themeColor;
    const logoUrl = portalConfigPreview.logoUrl;
    const welcomeMessage = portalConfigPreview.welcomeMessage;
    const termsOfService = portalConfigPreview.termsOfService;

    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const docRef = doc(db, 'locations', currentLocationForPortal.id);
      const newPortalConfig = {
        themeColor,
        logoUrl: logoUrl || null,
        welcomeMessage: welcomeMessage || null,
        termsOfService: termsOfService || null,
        layoutTheme: portalConfigPreview.layoutTheme || 'default',
        sessionDuration: portalConfigPreview.sessionDuration || 60,
        allowExtension: portalConfigPreview.allowExtension || false,
        redirectUrl: portalConfigPreview.redirectUrl || null
      };

      await setDoc(docRef, {
        portalConfig: newPortalConfig,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast.success("Design du portail mis à jour.");
      
      // Update local state
      setLocations(prev => prev.map(loc => 
        loc.id === currentLocationForPortal.id 
          ? { ...loc, portalConfig: newPortalConfig } 
          : loc
      ));
      
      setShowPortalConfigModal(false);
      setCurrentLocationForPortal(null);
    } catch (error: any) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour du design.");
    } finally {
      setIsSubmittingPortalConfig(false);
    }
  };

  const handleGenerateAiTheme = async () => {
    if (!aiBrandPrompt.trim()) {
      toast.error("Veuillez décrire votre marque ou secteur d'activité.");
      return;
    }
    
    setIsGeneratingAiTheme(true);
    try {
      const response = await fetch('/api/generate-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: aiBrandPrompt })
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate theme.");
      }
      
      const data = await response.json();
      
      if (data.themeColor) {
        setPortalConfigPreview(prev => ({
          ...prev,
          themeColor: data.themeColor,
          welcomeMessage: data.marketingMessage || prev.welcomeMessage,
          layoutTheme: data.layoutTheme || prev.layoutTheme,
        }));
        setPortalConfig(prev => ({
          ...prev,
          themeColor: data.themeColor,
        }));
        toast.success("Thème généré avec succès !");
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue lors de la génération du thème.");
    } finally {
      setIsGeneratingAiTheme(false);
    }
  };

  const handleSaveNotificationConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !currentLocationForNotification) return;
    setIsSubmittingNotification(true);

    const formData = new FormData(e.currentTarget);
    const dauThreshold = Number(formData.get('dauThreshold')) || 100;
    const emailEnabled = formData.get('emailEnabled') === 'on';
    const pushEnabled = formData.get('pushEnabled') === 'on';
    const notifyEmail = formData.get('notifyEmail') as string;

    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const docRef = doc(db, 'locations', currentLocationForNotification.id);
      const newNotificationConfig = {
        dauThreshold,
        emailEnabled,
        pushEnabled,
        notifyEmail: notifyEmail || null
      };

      await setDoc(docRef, {
        notificationConfig: newNotificationConfig,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast.success("Paramètres de notification mis à jour.");
      
      // Update local state
      setLocations(prev => prev.map(loc => 
        loc.id === currentLocationForNotification.id 
          ? { ...loc, notificationConfig: newNotificationConfig } 
          : loc
      ));
      
      setShowNotificationModal(false);
      setCurrentLocationForNotification(null);
    } catch (error: any) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour des notifications.");
    } finally {
      setIsSubmittingNotification(false);
    }
  };

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

  const activeSessions = connections.filter(c => c.status === 'Connecté').length;
  const uniqueDevices = new Set(connections.map(c => c.device || 'Inconnu')).size;
  const avgSessionTime = connections.length > 0 
    ? Math.round(connections.reduce((acc, curr) => acc + (curr.duration || 0), 0) / connections.length) 
    : 0;

  const dashboardStats = [
    { label: 'Revenus Potentiels', value: `${activeSessions * 2} €`, trend: 'Basé sur sessions actives', trendColor: 'text-indigo-400' },
    { label: 'Visiteurs Uniques', value: uniqueDevices.toString(), trend: 'Basé sur les appareils', trendColor: 'text-slate-500' },
    { label: 'Sessions Wi-Fi Actives', value: activeSessions.toString(), trend: 'En temps réel', trendColor: 'text-green-400' },
    { label: 'Temps Moyen', value: `${avgSessionTime} min`,  trend: 'Calculé sur toutes les sessions', trendColor: 'text-slate-500' },
    { label: 'Satisfaction Client', value: '4.8/5', trend: 'Sur les avis reçus', trendColor: 'text-amber-500' },
  ];

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
              { id: 'locations', icon: MapPin, label: 'Établissements' },
              { id: 'wifi', icon: Wifi, label: 'Forfaits Wi-Fi' },
              { id: 'vouchers', icon: Ticket, label: 'Vouchers & Accès' },
              { id: 'users', icon: Users, label: 'Visiteurs & CRM' },
              { id: 'ads', icon: DollarSign, label: 'Publicités & Revenus' },
              { id: 'analytics', icon: Activity, label: 'Statistiques & IA' },
              { id: 'health', icon: HeartPulse, label: 'État du système' },
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
            onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <User size={18} />
            Profil & Sécurité
          </button>
          <button 
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mt-2 text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Settings size={18} />
            Système & Portail
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
              <h1 className="text-xl lg:text-2xl font-bold">{t.dashboard}</h1>
              <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{t.establishment} <span className="text-indigo-400 font-medium">Le Café Central</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-4 ml-auto">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></span>
              <span className="text-xs lg:text-sm font-medium hidden sm:inline">{t.online}</span>
              <span className="text-xs lg:text-sm font-medium sm:hidden">Online</span>
            </div>
            
            <button 
              onClick={() => setLanguage(lang => lang === 'fr' ? 'en' : 'fr')}
              className="px-3 py-1.5 lg:px-4 lg:py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-full text-xs lg:text-sm font-medium transition-colors flex items-center gap-2 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10"
              title="Changer de langue / Change language"
            >
              <Globe size={16} />
              <span className="uppercase">{language}</span>
            </button>

            <div className="relative hidden xl:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder={t.search} 
                className="pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-500 w-48 xl:w-64 transition-all"
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
            {locations.filter(loc => loc.lastHeartbeat && Date.now() - loc.lastHeartbeat > 300000).length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-4">
                <div className="bg-red-500/20 text-red-500 p-2 rounded-xl mt-0.5">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-red-600 dark:text-red-400">Alerte : Routeur hors ligne</h3>
                  <p className="text-sm text-red-500/80 dark:text-red-300 mt-1">
                    {locations.filter(loc => loc.lastHeartbeat && Date.now() - loc.lastHeartbeat > 300000).length} établissement(s) ne communiquent plus avec le portail depuis plus de 5 minutes.
                  </p>
                </div>
              </div>
            )}
            {isDataLoading && <DashboardSkeleton />}
            {!isDataLoading && activeTab === 'overview' && (
              <>
                   {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {dashboardStats.map((stat, i) => (
                <div key={i} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-3xl backdrop-blur-md">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl lg:text-3xl font-bold flex items-center gap-2">
                    {stat.value}
                    {stat.label === 'Satisfaction Client' && <Star size={20} className="text-amber-400 fill-amber-400" />}
                  </p>
                  <div className={`text-xs mt-2 ${stat.trendColor}`}>{stat.trend}</div>
                </div>
              ))}
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleWidgetDragEnd}>
              <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 pb-4">
                  {widgetOrder.map(widgetId => {
                    if (widgetId === 'revenue') return (
                      <SortableWidget key="revenue" id="revenue" className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
                            <MoreHorizontal className="text-slate-400 hidden sm:block" size={20} />
                            <div>
                              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Évolution des Revenus</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Abonnements Wi-Fi et Publicité</p>
                            </div>
                          </div>
                          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                            <button 
                              onClick={() => setOverviewTimeframe('daily')}
                              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${overviewTimeframe === 'daily' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                              Quotidien
                            </button>
                            <button 
                              onClick={() => setOverviewTimeframe('monthly')}
                              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${overviewTimeframe === 'monthly' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                              Mensuel
                            </button>
                          </div>
                        </div>
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={overviewTimeframe === 'daily' ? REVENUE_DATA : MONTHLY_REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                      </SortableWidget>
                    );

                    if (widgetId === 'plansAndHealth') return (
                      <SortableWidget key="plansAndHealth" id="plansAndHealth" className="flex flex-col gap-8 lg:col-span-1">
                        {/* Active Plans */}
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm flex flex-col flex-1 cursor-grab active:cursor-grabbing">
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
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm flex flex-col cursor-grab active:cursor-grabbing">
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
                      </SortableWidget>
                    );

                    if (widgetId === 'visitors') return (
                      <SortableWidget key="visitors" id="visitors" className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl backdrop-blur-md shadow-sm overflow-hidden flex flex-col">
                         <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5 cursor-grab active:cursor-grabbing">
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2"><MoreHorizontal className="text-slate-400 hidden sm:block" size={20} /> Connexions récentes</h3>
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
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                       {row.status === 'Actif' && (
                                         <button 
                                           onClick={() => toast.success(`Utilisateur ${row.name || 'Anonyme'} déconnecté.`)}
                                           className="text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                                           title="Déconnecter"
                                         >
                                           <WifiOff size={16} />
                                           <span className="hidden sm:inline">Déconnecter</span>
                                         </button>
                                       )}
                                       <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1">
                                         <MoreHorizontal size={18} />
                                       </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                           </table>
                         </div>
                      </SortableWidget>
                    );

                    if (widgetId === 'activity') return (
                      <SortableWidget key="activity" id="activity" className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm lg:col-span-1 cursor-grab active:cursor-grabbing">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Fil d'Activité</h3>
                          <button className="text-slate-400 hover:text-indigo-500 transition-colors">
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                        
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-white/10 before:to-transparent">
                          {[
                            { title: "Nouveau sign-in", desc: "Sophie Bernard a rejoint le réseau.", time: "à l'instant", icon: <User size={14} />, color: "bg-indigo-500 text-white", ring: "ring-indigo-100 dark:ring-indigo-500/20" },
                            { title: "Seuil atteint", desc: "'Bar de la Plage' a dépassé 150 sessions actives.", time: "il y a 10 min", icon: <Activity size={14} />, color: "bg-amber-500 text-white", ring: "ring-amber-100 dark:ring-amber-500/20" },
                            { title: "Nouvel avis 5 étoiles", desc: "Laure N. a noté son expérience Wi-Fi.", time: "il y a 22 min", icon: <Star size={14} className="fill-white" />, color: "bg-amber-400 text-white", ring: "ring-amber-100 dark:ring-amber-500/20" },
                            { title: "Déconnexion auto", desc: "18 sessions expirées (Pass 3h).", time: "il y a 45 min", icon: <Clock size={14} />, color: "bg-slate-500 text-white", ring: "ring-slate-100 dark:ring-slate-500/20" },
                            { title: "Campagne Fidélité", desc: "4 utilisateurs ont débloqué un pass.", time: "il y a 2 heures", icon: <Gift size={14} />, color: "bg-pink-500 text-white", ring: "ring-pink-100 dark:ring-pink-500/20" },
                          ].map((activity, i) => (
                            <div key={i} className="relative flex items-center justify-between group is-active">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#050614] ${activity.color} ring-4 ${activity.ring} shadow-sm shrink-0 z-10`}>
                                {activity.icon}
                              </div>
                              <div className="w-[calc(100%-3.5rem)] bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white capitalize truncate">{activity.title}</h4>
                                  <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">{activity.time}</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{activity.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </SortableWidget>
                    );

                    return null;
                  })}
                </div>
              </SortableContext>
            </DndContext>
              </>
            )}

            {!isDataLoading && activeTab === 'vouchers' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Vouchers & Codes d'accès</h2>
                    <p className="text-slate-500 dark:text-slate-400">Générez des codes à usage unique ou limités dans le temps (idéal pour les hôtels ou l'accès payant).</p>
                  </div>
                  <button
                    onClick={() => setShowVoucherModal(true)}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm"
                  >
                    <Plus size={18} />
                    Générer des codes
                  </button>
                </div>

                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl backdrop-blur-md shadow-sm overflow-hidden flex flex-col">
                 <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Codes récents</h3>
                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                       <button className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm">Tous</button>
                       <button className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Actifs</button>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5">
                        <tr>
                          <th className="px-6 py-4 font-medium">Code d'accès</th>
                          <th className="px-6 py-4 font-medium">Durée / Validité</th>
                          <th className="px-6 py-4 font-medium shrink-0">Statut</th>
                          <th className="px-6 py-4 font-medium">Établissement</th>
                          <th className="px-6 py-4 font-medium">Créé le</th>
                          <th className="px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-600 dark:text-slate-300">
                        {vouchers.map((voucher) => (
                          <tr key={voucher.id} className="hover:bg-white dark:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-mono font-bold text-lg text-slate-900 dark:text-white tracking-widest">{voucher.code}</div>
                            </td>
                            <td className="px-6 py-4">{voucher.duration}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${voucher.status === 'actif' ? 'bg-green-500/20 text-green-400' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
                                {voucher.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                               {voucher.locationId === 'all' ? 'Tous les établissements' : locations.find(l => l.id === voucher.locationId)?.name || 'Inconnu'}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                               {new Date(voucher.createdAt).toLocaleDateString()} à {new Date(voucher.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                               <button 
                                 onClick={() => {
                                   navigator.clipboard.writeText(voucher.code);
                                   toast.success("Code copié dans le presse-papier !");
                                 }}
                                 className="text-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                                 title="Copier"
                               >
                                 Copier
                               </button>
                               <button 
                                 onClick={() => {
                                   setVouchers(prev => prev.filter(v => v.id !== voucher.id));
                                   toast.success("Voucher supprimé.");
                                 }}
                                 className="text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                 title="Supprimer"
                               >
                                 <Trash2 size={16} />
                               </button>
                            </td>
                          </tr>
                        ))}
                        {vouchers.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                              Aucun voucher généré pour le moment.
                            </td>
                          </tr>
                        )}
                      </tbody>
                   </table>
                 </div>
                </div>
              </div>
            )}

            {!isDataLoading && activeTab === 'users' && (
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

            {!isDataLoading && activeTab === 'locations' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Établissements</h2>
                    <p className="text-slate-500 dark:text-slate-400">Gérez vos multiples lieux et commerces.</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentLocation(null);
                      setLocationFormError('');
                      setShowLocationModal(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm"
                  >
                    <Plus size={18} />
                    Ajouter un établissement
                  </button>
                </div>

                {isLoadingLocations ? (
                   <div className="flex justify-center items-center h-48">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                   </div>
                ) : locations.length === 0 ? (
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center backdrop-blur-md shadow-sm">
                    <MapPin size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Aucun établissement</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                      Ajoutez votre premier établissement pour commencer à analyser et monétiser votre trafic Wi-Fi.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <LocationsMapView locations={locations} />
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLocationDragEnd}>
                    <SortableContext items={locations.map(l => l.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {locations.map((loc) => (
                          <SortableWidget key={loc.id} id={loc.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors flex flex-col group cursor-grab active:cursor-grabbing">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <MoreHorizontal className="text-slate-400 group-hover:text-slate-600 transition-colors" size={20} />
                                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                                  <MapPin size={24} />
                                </div>
                              </div>
                              <div className="flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setCurrentLocation(loc);
                                setLocationFormError('');
                                setShowLocationModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                setCurrentLocationForNotification(loc);
                                setShowNotificationModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/20 rounded-lg transition-colors"
                              title="Notifications"
                            >
                              <Bell size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteLocation(loc.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                setCurrentLocationForQr(loc);
                                setShowQrModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                              title="Code QR"
                            >
                              <QrCode size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                setCurrentLocationForPortal(loc);
                                setPortalConfigPreview({
                                  themeColor: loc.portalConfig?.themeColor || '#6366f1',
                                  logoUrl: loc.portalConfig?.logoUrl || '',
                                  welcomeMessage: loc.portalConfig?.welcomeMessage || '',
                                  termsOfService: loc.portalConfig?.termsOfService || '',
                                  layoutTheme: loc.portalConfig?.layoutTheme || 'default',
                                  sessionDuration: loc.portalConfig?.sessionDuration || 60,
                                  allowExtension: loc.portalConfig?.allowExtension || false,
                                  redirectUrl: loc.portalConfig?.redirectUrl || ''
                                });
                                setShowPortalConfigModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/20 rounded-lg transition-colors"
                              title="Personnaliser le portail"
                            >
                              <Palette size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{loc.name}</h3>
                            <div className="flex items-center gap-3 mb-3">
                              <p className="text-sm font-medium text-indigo-500">{loc.type}</p>
                              {loc.lastHeartbeat && Date.now() - loc.lastHeartbeat > 300000 ? (
                                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-md">
                                  <AlertCircle size={10} /> Hors ligne
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-md">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> En ligne
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex flex-1 items-start gap-2">
                           {loc.address}
                        </p>
                      </SortableWidget>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
                  </div>
                )}
              </div>
            )}

            {!isDataLoading && activeTab === 'wifi' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Forfaits Wi-Fi</h2>
                  <p className="text-slate-500 dark:text-slate-400">Gérez les offres d'accès à votre réseau.</p>
                </div>

                {/* Global Wi-Fi Constraints Form */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-sm">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Settings className="text-indigo-400" size={20} />
                    Limites Globales (Invités)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Time Limit */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Limite de Temps par Session</label>
                      <select 
                        value={wifiConfig.timeLimit}
                        onChange={(e) => setWifiConfig({ ...wifiConfig, timeLimit: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      >
                        <option value="unlimited">Illimité</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 heure</option>
                        <option value="custom">Personnalisé</option>
                      </select>
                      
                      {wifiConfig.timeLimit === 'custom' && (
                        <div className="mt-3 flex items-center gap-3">
                          <input 
                            type="number" 
                            min="1"
                            value={wifiConfig.customTimeLimit}
                            onChange={(e) => setWifiConfig({ ...wifiConfig, customTimeLimit: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          />
                          <span className="text-slate-500 text-sm">minutes</span>
                        </div>
                      )}
                    </div>

                    {/* Bandwidth Cap */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Plafond de Bande Passante (Vitesse)</label>
                      <select 
                        value={wifiConfig.bandwidth}
                        onChange={(e) => setWifiConfig({ ...wifiConfig, bandwidth: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      >
                        <option value="unlimited">Illimitée</option>
                        <option value="5">5 Mbps (Basique)</option>
                        <option value="10">10 Mbps (Standard)</option>
                        <option value="25">25 Mbps (HD Video)</option>
                        <option value="50">50 Mbps (Premium)</option>
                      </select>
                      <p className="mt-2 text-xs text-slate-500">Limite la vitesse maximale par appareil pour éviter la congestion.</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 sm:p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        Renouvellement Automatique
                      </h4>
                      <p className="text-sm text-slate-500 mt-1 max-w-xl">
                        Autoriser les invités à prolonger leur session une fois la limite atteinte.
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                      {wifiConfig.autoRenew && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-slate-600 dark:text-slate-400">Limite:</label>
                          <select
                            value={wifiConfig.autoRenewLimit}
                            onChange={(e) => setWifiConfig({ ...wifiConfig, autoRenewLimit: parseInt(e.target.value) })}
                            className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          >
                            <option value={1}>1 fois</option>
                            <option value={2}>2 fois</option>
                            <option value={3}>3 fois</option>
                            <option value={-1}>Illimité</option>
                          </select>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setWifiConfig({ ...wifiConfig, autoRenew: !wifiConfig.autoRenew })}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${wifiConfig.autoRenew ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${wifiConfig.autoRenew ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 p-4 sm:p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        Connexion Rapide (MAC Fast Login)
                      </h4>
                      <p className="text-sm text-slate-500 mt-1 max-w-xl">
                        Mémoriser l'adresse MAC des appareils pour reconnecter les utilisateurs habituels sans portail web.
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                      {wifiConfig.macBypassEnabled && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-slate-600 dark:text-slate-400">Durée:</label>
                          <select
                            value={wifiConfig.macBypassGracePeriod}
                            onChange={(e) => setWifiConfig({ ...wifiConfig, macBypassGracePeriod: parseInt(e.target.value) })}
                            className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          >
                            <option value={12}>12 heures</option>
                            <option value={24}>24 heures</option>
                            <option value={48}>2 jours</option>
                            <option value={168}>7 jours</option>
                            <option value={720}>30 jours</option>
                          </select>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setWifiConfig({ ...wifiConfig, macBypassEnabled: !wifiConfig.macBypassEnabled })}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${wifiConfig.macBypassEnabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${wifiConfig.macBypassEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => toast.success('Configuration réseau enregistrée avec succès.')}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-6 py-2.5 font-medium transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      Sauvegarder
                    </button>
                  </div>
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

                {/* Connection Logs Table */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl backdrop-blur-md shadow-sm overflow-hidden flex flex-col mt-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-slate-100 dark:border-white/5 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Activity size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Journaux de connexion en direct</h3>
                        <p className="text-sm text-slate-500">Activité en temps réel par établissement</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-sm font-medium outline-none">
                        <option value="all">Tous les établissements</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                      <button className="px-4 py-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-slate-200 dark:border-white/10">
                        <Download size={16} /> Exporter
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5">
                        <tr>
                          <th className="px-6 py-4 font-medium">Appareil & OS</th>
                          <th className="px-6 py-4 font-medium">Établissement</th>
                          <th className="px-6 py-4 font-medium">Début & Durée</th>
                          <th className="px-6 py-4 font-medium">Trafic (↑/↓)</th>
                          <th className="px-6 py-4 font-medium">Statut</th>
                          <th className="px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-600 dark:text-slate-300">
                        {connections.length === 0 ? (
                           <tr>
                             <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Aucune connexion enregistrée.</td>
                           </tr>
                        ) : (
                          connections.map((log) => {
                             const isConnected = log.status === 'Connecté';
                             const statusColor = isConnected ? 'bg-green-500/20 text-green-500' : 'bg-slate-500/20 text-slate-500 dark:text-slate-400';
                             const start = log.connectedAt ? new Date(log.connectedAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...';
                             const duration = log.duration ? `${log.duration} min` : '...';
                             return (
                               <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                 <td className="px-6 py-4">
                                   <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                     <Smartphone size={14} className="text-slate-400" />
                                     {log.device || "Appareil Inconnu"}
                                   </div>
                                   <div className="text-xs text-slate-500 mt-1">{log.os || "Inconnu"}</div>
                                 </td>
                                 <td className="px-6 py-4">
                                   <div className="flex items-center gap-1.5 font-medium">
                                     <MapPin size={14} className="text-indigo-400" />
                                     {log.locationName || "Inconnu"}
                                   </div>
                                 </td>
                                 <td className="px-6 py-4">
                                   <div>{start}</div>
                                   <div className="text-xs text-slate-500 mt-1">{duration}</div>
                                 </td>
                                 <td className="px-6 py-4 font-medium">-</td>
                                 <td className="px-6 py-4">
                                   <span className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${statusColor}`}>
                                     {log.status || "Inconnu"}
                                   </span>
                                 </td>
                                 <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                    {isConnected && (
                                      <button 
                                        onClick={async () => {
                                          try {
                                             const { doc, updateDoc } = await import('firebase/firestore');
                                             const { db } = await import('../firebase');
                                             await updateDoc(doc(db, 'connections', log.id), { status: 'Déconnecté' });
                                             toast.success(`Appareil ${log.device || ''} déconnecté.`);
                                          } catch (e) {
                                             toast.error("Erreur de déconnexion");
                                          }
                                        }}
                                        className="text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                                        title="Déconnecter"
                                      >
                                        <WifiOff size={16} />
                                        <span className="hidden sm:inline">Déconnecter</span>
                                      </button>
                                    )}
                                 </td>
                               </tr>
                             );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {!isDataLoading && activeTab === 'ads' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Publicités & Revenus</h2>
                  <p className="text-slate-500 dark:text-slate-400">Gérez vos campagnes publicitaires sur le portail captif et suivez vos revenus.</p>
                </div>

                {/* Revenue Visualization Component */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="text-indigo-400" size={20} />
                        Revenus de Monétisation Wi-Fi
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Évolution des forfaits payants et revenus publicitaires.</p>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                      <button 
                        onClick={() => setAdsRevenueTimeframe('daily')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${adsRevenueTimeframe === 'daily' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Quotidien
                      </button>
                      <button 
                        onClick={() => setAdsRevenueTimeframe('monthly')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${adsRevenueTimeframe === 'monthly' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Mensuel
                      </button>
                    </div>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={adsRevenueTimeframe === 'daily' ? REVENUE_DATA : MONTHLY_REVENUE_DATA} 
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#94a3b8' }} />
                        <Bar name="Forfaits Wi-Fi (€)" dataKey="sales" fill="#818cf8" radius={[4, 4, 0, 0]} />
                        <Bar name="Publicités (€)" dataKey="ads" fill="#c084fc" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
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
                
                {/* Promotional Banner Section */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Megaphone className="text-indigo-400" size={20} />
                        Bannière Promotionnelle
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">Affichez une bannière personnalisée sur le portail de connexion pour informer vos clients.</p>
                    </div>
                    <button 
                      onClick={() => setPromoBanner({ ...promoBanner, enabled: !promoBanner.enabled })}
                      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${promoBanner.enabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${promoBanner.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  {promoBanner.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200 dark:border-white/10">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Titre de la bannière</label>
                        <input 
                          type="text" 
                          value={promoBanner.title}
                          onChange={(e) => setPromoBanner({ ...promoBanner, title: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description / Offre</label>
                        <textarea 
                          rows={2}
                          value={promoBanner.description}
                          onChange={(e) => setPromoBanner({ ...promoBanner, description: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 mt-2">Image de la bannière (URL)</label>
                        <input 
                          type="url" 
                          placeholder="https://example.com/banner.jpg"
                          value={promoBanner.imageUrl}
                          onChange={(e) => setPromoBanner({ ...promoBanner, imageUrl: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 mt-2">Lien publicitaire (URL de destination)</label>
                        <input 
                          type="url" 
                          placeholder="https://example.com/promo"
                          value={promoBanner.linkUrl}
                          onChange={(e) => setPromoBanner({ ...promoBanner, linkUrl: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <Palette size={16} className="text-slate-400" /> Style de bannière
                        </label>
                        <select
                          value={promoBanner.type}
                          onChange={(e) => setPromoBanner({ ...promoBanner, type: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                        >
                          <option value="info">Info (Bleu)</option>
                          <option value="success">Succès (Vert)</option>
                          <option value="alert">Alerte (Rouge)</option>
                          <option value="warning">Avertissement (Jaune)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <Calendar size={16} className="text-slate-400" /> Planification
                        </label>
                        <select
                          value={promoBanner.scheduleType}
                          onChange={(e) => setPromoBanner({ ...promoBanner, scheduleType: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                        >
                          <option value="always">Toujours actif</option>
                          <option value="scheduled">Plage horaire spécifique</option>
                        </select>
                      </div>
                      
                      {promoBanner.scheduleType === 'scheduled' && (
                        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" /> Heure de début
                              </label>
                              <input 
                                type="time" 
                                value={promoBanner.startTime}
                                onChange={(e) => setPromoBanner({ ...promoBanner, startTime: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" /> Heure de fin
                              </label>
                              <input 
                                type="time" 
                                value={promoBanner.endTime}
                                onChange={(e) => setPromoBanner({ ...promoBanner, endTime: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                           </div>
                        </div>
                      )}
                      
                      <div className="col-span-1 md:col-span-2 mt-4 flex justify-end gap-3 z-10">
                        <button 
                          onClick={() => toast.success('Bannière promotionnelle enregistrée avec succès.')}
                          className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                        >
                          <CheckCircle2 size={18} />
                          Mettre à jour
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isDataLoading && activeTab === 'analytics' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Statistiques & IA</h2>
                  <p className="text-slate-500 dark:text-slate-400">Analyse du trafic, tendances de revenus et statistiques d'utilisation du Wi-Fi.</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Monthly Revenue Chart */}
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Tendances des Revenus</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Évolution des forfaits et revenus publicitaires</p>
                      </div>
                      <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                        <button 
                          onClick={() => setAnalyticsTimeframe('daily')}
                          className={`px-3 py-1 text-sm font-medium transition-colors rounded-lg ${analyticsTimeframe === 'daily' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                          Quotidien
                        </button>
                        <button 
                          onClick={() => setAnalyticsTimeframe('monthly')}
                          className={`px-3 py-1 text-sm font-medium transition-colors rounded-lg ${analyticsTimeframe === 'monthly' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                          Mensuel
                        </button>
                      </div>
                    </div>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsTimeframe === 'daily' ? REVENUE_DATA : MONTHLY_REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSalesM" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorAdsM" x1="0" y1="0" x2="0" y2="1">
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
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#94a3b8' }} />
                          <Area type="monotone" name="Forfaits Wi-Fi (€)" dataKey="sales" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorSalesM)" />
                          <Area type="monotone" name="Publicités (€)" dataKey="ads" stroke="#c084fc" strokeWidth={3} fillOpacity={1} fill="url(#colorAdsM)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Device Distribution */}
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm flex flex-col">
                    <div className="mb-2">
                       <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Appareils Connectés</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400">Répartition par type</p>
                    </div>
                    <div className="flex-1 min-h-[220px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={DEVICE_DISTRIBUTION_DATA}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {DEVICE_DISTRIBUTION_DATA.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontSize: '14px', fontWeight: 500, color: '#f8fafc' }}
                            formatter={(value: number) => [`${value}%`, 'Part']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="text-center">
                            <span className="block text-2xl font-bold text-slate-900 dark:text-white">3.2k</span>
                            <span className="block text-xs text-slate-500">Sessions</span>
                         </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {DEVICE_DISTRIBUTION_DATA.map((device, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                           <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: device.color }}></div>
                              <span className="flex items-center gap-1.5">{device.icon} {device.name}</span>
                           </div>
                           <span className="font-semibold text-slate-900 dark:text-white">{device.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WiFi Usage Stats */}
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Statistiques d'Utilisation Wi-Fi</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Croissance des sessions et volume de données (Go)</p>
                      </div>
                    </div>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={WIFI_USAGE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={8}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontSize: '14px', fontWeight: 500, color: '#f8fafc' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#94a3b8' }} />
                          <Bar yAxisId="left" name="Sessions Mensuelles" dataKey="sessions" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          <Bar yAxisId="right" name="Trafic (Go)" dataKey="dataGB" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Heatmap Widget */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Heures d'Affluence Globale</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Volume de trafic Wi-Fi par jour et tranche horaire</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="flex flex-col min-w-[700px] mt-4">
                      {/* Header (hours) */}
                      <div className="flex mb-2 ml-10">
                        {HOURS.map(h => (
                          <div key={`header-${h}`} className="flex-1 text-center text-xs font-medium text-slate-400 dark:text-slate-500">{h}h</div>
                        ))}
                      </div>
                      {/* Body (days x hours) */}
                      {DAYS.map((day, i) => (
                        <div key={`row-${day}`} className="flex items-center mb-1.5 gap-1">
                          <div className="w-10 text-xs font-medium text-slate-500 dark:text-slate-400 text-right pr-2 shrink-0">{day}</div>
                          <div className="flex flex-1 gap-1">
                            {HOURS.map(h => {
                              const isWeekend = i >= 5;
                              const isNight = h < 6 || h > 22;
                              const isLunch = h >= 12 && h <= 14;
                              const isEvening = h >= 18 && h <= 21;
                              
                              let intensity = Math.random() * 20;
                              if (!isNight) intensity += 20;
                              if (!isWeekend && isLunch) intensity += 30;
                              if (isEvening) intensity += 40;
                              if (isWeekend && (h >= 14 && h <= 18)) intensity += 50;

                              let colorClass = 'bg-slate-100 dark:bg-white/5';
                              if (intensity > 80) colorClass = 'bg-indigo-600 dark:bg-indigo-500';
                              else if (intensity > 60) colorClass = 'bg-indigo-500 dark:bg-indigo-400 border border-indigo-400/20';
                              else if (intensity > 40) colorClass = 'bg-indigo-400 dark:bg-indigo-500/60 border border-indigo-400/20';
                              else if (intensity > 20) colorClass = 'bg-indigo-300 dark:bg-indigo-500/40 border border-indigo-400/20';
                              else if (intensity > 10) colorClass = 'bg-indigo-200 dark:bg-indigo-500/20 border border-indigo-400/20';

                              return (
                                <div 
                                  key={`cell-${day}-${h}`} 
                                  className={`flex-1 h-8 rounded shrink-0 ${colorClass} transition-all hover:ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 cursor-crosshair`}
                                  title={`${day} à ${h}h`}
                                ></div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 text-xs text-slate-500 dark:text-slate-400">
                     <span>Moins dense</span>
                     <div className="flex gap-1">
                        <div className="w-3 h-3 rounded bg-slate-100 dark:bg-white/5"></div>
                        <div className="w-3 h-3 rounded bg-indigo-200 dark:bg-indigo-500/20"></div>
                        <div className="w-3 h-3 rounded bg-indigo-400 dark:bg-indigo-500/60"></div>
                        <div className="w-3 h-3 rounded bg-indigo-600 dark:bg-indigo-500"></div>
                     </div>
                     <span>Plus dense</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Sparkles className="text-purple-500" size={32} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Analyses Avancées IA</h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Découvrez des insights précis sur les heures d'affluence et le profil de vos clients.
                      </p>
                    </div>
                    <button className="md:ml-auto w-full md:w-auto bg-purple-500 hover:bg-purple-600 text-white rounded-xl px-6 py-2.5 font-medium transition-colors flex justify-center items-center gap-2">
                       Générer un rapport IA
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!isDataLoading && activeTab === 'profile' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Profil & Sécurité</h2>
                  <p className="text-slate-500 dark:text-slate-400">Gérez vos informations de compte, vos préférences et la sécurité.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Account Info */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <User className="text-indigo-400" size={20} />
                        Informations du compte
                      </h3>
                      
                      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); toast.success('Profil mis à jour'); }}>
                        <div className="flex flex-col sm:flex-row gap-5">
                          <div className="flex-1">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nom complet</label>
                            <input 
                              type="text" 
                              defaultValue={user?.displayName || ''}
                              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                              placeholder="Votre nom"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Adresse Email</label>
                            <input 
                              type="email" 
                              disabled
                              defaultValue={user?.email || ''}
                              className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-500 dark:text-slate-400 cursor-not-allowed border-dashed"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Société / Entreprise</label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                            placeholder="Nom de votre entreprise"
                          />
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button type="submit" className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                             Enregistrer les modifications
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Security */}
                     <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Key className="text-indigo-400" size={20} />
                        Sécurité
                      </h3>
                      
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                 <ShieldCheck size={20} />
                              </div>
                              <div>
                                 <p className="font-medium text-slate-900 dark:text-white">Authentification à deux facteurs (2FA)</p>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sécurisez votre compte avec une étape supplémentaire.</p>
                              </div>
                           </div>
                           <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                              Activer
                           </button>
                        </div>

                        <div className="border-t border-slate-200 dark:border-white/10 pt-6">
                           <form className="space-y-5" onSubmit={async (e) => { 
                             e.preventDefault();
                             // Mocks password update action
                             const target = e.target as any;
                             const pwd = target[0].value;
                             const confirmPwd = target[1].value;
                             
                             if (!pwd || pwd !== confirmPwd) {
                               toast.error('Les mots de passe ne correspondent pas.');
                               return;
                             }
                             
                             toast.success('Mot de passe mis à jour');
                             target.reset();
                           }}>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                               <div>
                                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nouveau mot de passe</label>
                                 <input 
                                   type="password" 
                                   required
                                   className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                   placeholder="••••••••"
                                 />
                               </div>
                               <div>
                                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Confirmer le mot de passe</label>
                                 <input 
                                   type="password" 
                                   required
                                   className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                   placeholder="••••••••"
                                 />
                               </div>
                             </div>
                             <div className="flex justify-end pt-2">
                                <button type="submit" className="px-6 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-medium transition-colors">
                                   Mettre à jour
                                </button>
                             </div>
                           </form>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settings / Notifications sidebar */}
                  <div className="space-y-8">
                     <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                          <BellRing className="text-amber-500" size={20} />
                          Notifications Globales
                        </h3>
                        
                        <div className="space-y-4">
                           <label className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                             <div className="relative flex items-start pt-1">
                               <input 
                                 type="checkbox" 
                                 defaultChecked
                                 className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                               />
                             </div>
                             <div>
                               <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">Rapport Périodique (Email)</p>
                               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Recevoir un résumé hebdomadaire de l'activité de vos établissements.</p>
                             </div>
                           </label>
                           
                           <label className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                             <div className="relative flex items-start pt-1">
                               <input 
                                 type="checkbox" 
                                 defaultChecked
                                 className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                               />
                             </div>
                             <div>
                               <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">Alertes Système</p>
                               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Être notifié en cas de dysfonctionnement du portail captif.</p>
                             </div>
                           </label>
                           
                           <label className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                             <div className="relative flex items-start pt-1">
                               <input 
                                 type="checkbox" 
                                 className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                               />
                             </div>
                             <div>
                               <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">Nouveautés & Offres</p>
                               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Recevoir les actualités et nouvelles fonctionnalités de la plateforme.</p>
                             </div>
                           </label>
                        </div>
                     </div>

                     {/* Display Preferences */}
                     <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                          <Palette className="text-indigo-400" size={20} />
                          Apparence (Tableau de bord)
                        </h3>
                        
                        <div className="space-y-4">
                           <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                              <div className="flex flex-col">
                                 <p className="text-sm font-semibold text-slate-900 dark:text-white">Mode Sombre</p>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Confort visuel pour l'utilisation nocturne.</p>
                              </div>
                              <button 
                                onClick={toggleTheme}
                                className={`w-14 h-8 rounded-full p-1 flex items-center transition-colors shadow-inner ${theme === 'dark' ? 'bg-indigo-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}
                              >
                                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                                  {theme === 'dark' ? <Moon size={14} className="text-indigo-500" /> : <Sun size={14} className="text-amber-500" />}
                                </span>
                              </button>
                           </div>
                        </div>
                     </div>
                     
                     {/* Dangerous Zone */}
                     <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-3xl p-8">
                        <h3 className="font-semibold text-lg text-red-600 dark:text-red-400 mb-2">Zone Dangereuse</h3>
                        <p className="text-sm text-red-500/80 mb-6">Ces actions sont irréversibles et supprimeront définitivement vos données.</p>
                        
                        <button className="w-full py-3 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-xl font-medium transition-colors text-sm border border-red-200 dark:border-red-500/30 shadow-sm">
                           Supprimer mon compte
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {!isDataLoading && activeTab === 'settings' && (
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
                       
                       {/* AI Theme Generation */}
                       <div className="bg-gradient-to-r from-indigo-50 to-pink-50 dark:from-indigo-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 mb-6">
                         <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
                           <Sparkles size={16} /> Générer avec l'IA
                         </label>
                         <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-3">Décrivez votre marque pour générer un thème adapté.</p>
                         <div className="flex gap-2">
                           <input 
                             type="text"
                             className="flex-1 bg-white dark:bg-black/20 border border-indigo-200 dark:border-indigo-500/30 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                             placeholder="Ex: Start-up tech minimaliste..."
                             value={aiBrandPrompt}
                             onChange={(e) => setAiBrandPrompt(e.target.value)}
                           />
                           <button
                             type="button"
                             onClick={handleGenerateAiTheme}
                             disabled={isGeneratingAiTheme}
                             className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                           >
                             {isGeneratingAiTheme ? 'Génération...' : 'Générer'}
                           </button>
                         </div>
                       </div>

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
                    <div className="shrink-0 hidden lg:block">
                      <h4 className="font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Smartphone size={18} className="text-indigo-400" />
                        Aperçu en Direct
                      </h4>
                      <div className="w-[280px] border border-slate-200 dark:border-white/10 rounded-[2rem] p-3 bg-slate-50 dark:bg-white/5 relative shadow-inner h-[500px]">
                        <div className="w-full h-full bg-[#050614] rounded-[1.5rem] overflow-hidden relative border border-white/5 flex flex-col items-center p-6 text-center shadow-2xl">
                         <div className="absolute top-3 right-3 z-50">
                            <button 
                              onClick={() => setLanguage(lang => lang === 'fr' ? 'en' : 'fr')}
                              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-medium transition-colors flex items-center gap-1.5 text-white border border-white/10"
                            >
                              <Globe size={10} />
                              <span className="uppercase">{language}</span>
                            </button>
                         </div>
                         {promoBanner.enabled && (
                            promoBanner.linkUrl ? (
                              <a href={promoBanner.linkUrl} target="_blank" rel="noreferrer" className="block w-full z-10 mb-4 transition-transform hover:scale-[1.02]">
                                {promoBanner.imageUrl ? (
                                  <img src={promoBanner.imageUrl} alt={promoBanner.title} className="w-full rounded-xl object-cover" />
                                ) : (
                                  <div className={`w-full p-2 rounded-xl border text-left flex flex-col gap-0.5 backdrop-blur-md ${promoBanner.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : promoBanner.type === 'alert' ? 'bg-red-500/10 text-red-400 border-red-500/20' : promoBanner.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                     <div className="font-bold text-[10px] leading-tight flex items-center gap-1">
                                       <Megaphone size={10} /> 
                                       {promoBanner.title}
                                     </div>
                                     <div className="text-[9px] opacity-80 leading-tight line-clamp-2">{promoBanner.description}</div>
                                  </div>
                                )}
                              </a>
                            ) : (
                              <div className="w-full z-10 mb-4 flex flex-col gap-1">
                                {promoBanner.imageUrl && (
                                  <img src={promoBanner.imageUrl} alt={promoBanner.title} className="w-full rounded-xl object-cover" />
                                )}
                                {!promoBanner.imageUrl && (
                                  <div className={`w-full p-2 rounded-xl border text-left flex flex-col gap-0.5 backdrop-blur-md ${promoBanner.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : promoBanner.type === 'alert' ? 'bg-red-500/10 text-red-400 border-red-500/20' : promoBanner.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                     <div className="font-bold text-[10px] leading-tight flex items-center gap-1">
                                       <Megaphone size={10} /> 
                                       {promoBanner.title}
                                     </div>
                                     <div className="text-[9px] opacity-80 leading-tight line-clamp-2">{promoBanner.description}</div>
                                  </div>
                                )}
                              </div>
                            )
                         )}
                         {portalConfig.logoUrl ? (
                            <img src={portalConfig.logoUrl} className="w-16 h-16 object-contain mb-8 z-10 mx-auto mt-4" alt="Aperçu Logo" />
                         ) : (
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 z-10 mx-auto text-white mt-4">
                              <Wifi size={24} />
                            </div>
                         )}
                         <h4 className="text-white font-bold text-lg z-10 mb-2">{t.welcome}</h4>
                         <p className="text-slate-400 text-xs z-10 mb-8 px-4">{t.loginInfo}</p>
                         
                         <div className="w-full space-y-3 z-10 mt-auto">
                            <div className="w-full py-2.5 rounded-xl font-medium text-sm text-white flex justify-center items-center gap-2 transition-colors" style={{ backgroundColor: portalConfig.themeColor, opacity: 0.9 }}>
                               {t.quickConnect}
                            </div>
                            <div className="w-full py-2.5 rounded-xl font-medium text-sm text-white border border-white/10 flex justify-center items-center gap-2 bg-white/5">
                               {t.adVideo}
                            </div>
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
                
                {/* SMTP Configuration Section */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Mail className="text-indigo-400" size={20} />
                        Reçus Automatiques & SMTP
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configurez l'envoi de reçus par email à vos clients après leur session.</p>
                    </div>
                    <button 
                      onClick={() => setSmtpConfig({ ...smtpConfig, enabled: !smtpConfig.enabled })}
                      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${smtpConfig.enabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${smtpConfig.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  {smtpConfig.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-white/10 relative">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hôte SMTP</label>
                        <input 
                          type="text" 
                          placeholder="smtp.exemple.com"
                          value={smtpConfig.host}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Port</label>
                        <input 
                          type="number" 
                          value={smtpConfig.port}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) || 587 })}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nom d'utilisateur</label>
                        <input 
                          type="text" 
                          placeholder="contact@etablissement.com"
                          value={smtpConfig.username}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mot de passe / Clé d'API</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={smtpConfig.password}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      
                      <div className="col-span-1 md:col-span-2 mt-2 pt-6 border-t border-slate-200 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nom de l'expéditeur</label>
                            <input 
                              type="text" 
                              value={smtpConfig.fromName}
                              onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email de l'expéditeur</label>
                            <input 
                              type="email" 
                              value={smtpConfig.fromEmail}
                              onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                         </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 mt-4 flex justify-end gap-3 z-10">
                        <button 
                          onClick={() => toast.success('Email de test envoyé.')}
                          className="px-6 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors flex justify-center items-center gap-2"
                        >
                          Tester la connexion
                        </button>
                        <button 
                          onClick={() => toast.success('Paramètres SMTP enregistrés avec succès.')}
                          className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2"
                        >
                          <CheckCircle2 size={18} />
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Backup Settings Section */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <Server className="text-indigo-400" size={20} />
                      Sauvegardes Automatiques (Firestore)
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Storage Meter */}
                    <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Activity size={16} className="text-indigo-500" />
                            Quota de Stockage utilisé
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Espace occupé par les archives de logs de connexion.
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-slate-900 dark:text-white">42.5 MB</span>
                          <span className="text-sm font-medium text-slate-400"> / 1 GB</span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full" style={{ width: '4.25%' }}></div>
                      </div>
                      
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono uppercase tracking-wider">
                        <span>Sécurisé</span>
                        <span className="text-indigo-500">4.25% Utilisé</span>
                        <span>Limite</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/10 my-6"></div>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Configurez la période de rétention pour vos sauvegardes automatiques quotidiennes. Les sauvegardes plus anciennes seront purgées.
                    </p>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Période de rétention
                      </label>
                      <div className="flex flex-wrap gap-4">
                        {['30', '60', '90'].map(days => (
                          <label key={days} className={`flex items-center gap-2 px-6 py-3 rounded-xl border cursor-pointer transition-all ${backupRetention === days ? 'bg-indigo-500/10 border-indigo-500' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'}`}>
                             <input 
                               type="radio" 
                               name="backupRetention" 
                               value={days} 
                               checked={backupRetention === days} 
                               onChange={() => setBackupRetention(days)} 
                               className="hidden" 
                             />
                             <div className="flex flex-col">
                               <span className="text-sm font-bold text-slate-900 dark:text-white">{days} jours</span>
                               <span className="text-xs text-slate-500">Conservation des logs</span>
                             </div>
                             {backupRetention === days && (
                               <div className="ml-auto w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                 <div className="w-1.5 h-1.5 bg-white rounded-full" />
                               </div>
                             )}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                      <button 
                         onClick={() => toast.success('Période de rétention mise à jour avec succès.')}
                         className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2"
                      >
                         <CheckCircle2 size={18} />
                         Enregistrer la politique
                      </button>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <QrCode className="text-indigo-400" size={20} />
                      Code QR de Connexion
                    </h3>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-white/10">
                    <div className="bg-white p-4 rounded-2xl shadow-sm shrink-0">
                       <QRCodeSVG 
                         value={`${window.location.origin}/portal`} 
                         size={160} 
                         fgColor={portalConfig.themeColor} 
                         level="H"
                         imageSettings={portalConfig.logoUrl ? {
                           src: portalConfig.logoUrl,
                           x: undefined,
                           y: undefined,
                           height: 38,
                           width: 38,
                           excavate: true,
                         } : undefined}
                       />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white text-lg mb-2">Imprimez votre code d'accès</h4>
                      <p className="text-sm text-slate-500 mb-6 max-w-md">
                        Affichez ce code QR sur vos comptoirs ou tables. Vos clients pourront le scanner pour être directement redirigés vers le portail de connexion au Wi-Fi.
                      </p>
                      <div className="flex flex-wrap gap-3">
                         <button 
                           onClick={() => toast.success('QR Code prêt pour le téléchargement.')}
                           className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 text-sm"
                         >
                           <Download size={16} />
                           Télécharger (PNG)
                         </button>
                         <button 
                           onClick={() => toast.success('Options d\'impression ouvertes.')}
                           className="px-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl font-medium transition-colors shadow-sm text-sm"
                         >
                           Imprimer l'Affiche
                         </button>
                      </div>
                    </div>
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
                    <button 
                      onClick={handleSaveWifiConfig}
                      disabled={isSavingWifiConfig}
                      className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-75 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                    >
                      {isSavingWifiConfig ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={18} />}
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

            {!isDataLoading && activeTab === 'health' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">État du Système</h2>
                    <p className="text-slate-500 dark:text-slate-400">Surveillez l'infrastructure, la latence et la disponibilité des services.</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium">
                     <CheckCircle2 size={18} /> Normal
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Uptime Services List */}
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-sm flex flex-col h-full">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                       <Server className="text-indigo-400" size={20} /> Services Externes
                    </h3>
                    <div className="space-y-4 flex-1">
                      {[
                        { name: 'Portail Web', status: 'operational', uptime: '99.99%', latency: '45ms' },
                        { name: 'Serveur RADIUS', status: 'operational', uptime: '99.95%', latency: '120ms' },
                        { name: 'Base de données', status: 'operational', uptime: '99.99%', latency: '23ms' },
                        { name: 'Paiement (Stripe)', status: 'operational', uptime: '99.9%', latency: '210ms' },
                        { name: 'Service SMS', status: 'degraded', uptime: '98.5%', latency: '850ms' },
                      ].map((service, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 gap-3">
                           <div className="flex items-center gap-3">
                              {service.status === 'operational' ? (
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                   <CheckCircle2 size={20} />
                                </div>
                              ) : service.status === 'degraded' ? (
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                   <AlertCircle size={20} />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                                   <XCircle size={20} />
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium text-slate-900 dark:text-white dark:text-white">{service.name}</h4>
                                <p className="text-xs text-slate-500 capitalize">{service.status === 'operational' ? 'Opérationnel' : service.status === 'degraded' ? 'Performances dégradées' : 'Panne'}</p>
                              </div>
                           </div>
                           <div className="flex gap-4 sm:gap-6 text-sm">
                             <div className="flex flex-col">
                                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Disponibilité</span>
                                <span className="font-medium text-slate-900 dark:text-white">{service.uptime}</span>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Latence</span>
                                <span className="font-medium text-slate-900 dark:text-white">{service.latency}</span>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* API Latency Chart */}
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-sm h-[400px] flex flex-col">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                       <Activity className="text-indigo-400" size={20} /> Latence API & DB (ms)
                    </h3>
                    <div className="flex-1 w-full min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { time: '00:00', api: 45, db: 23 },
                          { time: '04:00', api: 52, db: 25 },
                          { time: '08:00', api: 120, db: 45 },
                          { time: '12:00', api: 210, db: 85 },
                          { time: '16:00', api: 180, db: 65 },
                          { time: '20:00', api: 85, db: 35 },
                          { time: '24:00', api: 42, db: 22 }
                        ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorDb" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/5" />
                          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                            labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                          <Area type="monotone" name="API Principale" dataKey="api" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorApi)" activeDot={{ r: 6, strokeWidth: 0 }} />
                          <Area type="monotone" name="Base de données" dataKey="db" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorDb)" activeDot={{ r: 6, strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Storage Growth Chart */}
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-sm h-[350px] flex flex-col">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                     <Server className="text-indigo-400" size={20} />
                     Croissance du Stockage des Logs (30 jours)
                  </h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { date: '16 mai', size: 15.2 },
                        { date: '18 mai', size: 17.5 },
                        { date: '21 mai', size: 21.3 },
                        { date: '24 mai', size: 25.1 },
                        { date: '27 mai', size: 28.5 },
                        { date: '30 mai', size: 32.4 },
                        { date: '02 jun', size: 35.8 },
                        { date: '05 jun', size: 39.2 },
                        { date: '08 jun', size: 42.5 }
                      ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/5" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                          labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                          formatter={(value) => [`${value} MB`, 'Espace Utilisé']}
                        />
                        <Line type="monotone" name="Espace Utilisé" dataKey="size" stroke="#a855f7" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}

            {!isDataLoading && activeTab === 'support' && (
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
               <div className="absolute top-4 right-4 z-50">
                  <button 
                    onClick={() => setLanguage(lang => lang === 'fr' ? 'en' : 'fr')}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-medium transition-colors flex items-center gap-2 text-white border border-white/10 backdrop-blur-md"
                  >
                    <Globe size={14} />
                    <span className="uppercase">{language}</span>
                  </button>
               </div>
               <div className="absolute top-0 inset-x-0 h-40 bg-indigo-500/20 blur-[50px] pointer-events-none"></div>
               {promoBanner.enabled && (
                  promoBanner.linkUrl ? (
                    <a href={promoBanner.linkUrl} target="_blank" rel="noreferrer" className="block w-full max-w-sm mx-auto z-10 mb-6 mt-4 transition-transform hover:scale-[1.02]">
                      {promoBanner.imageUrl ? (
                        <img src={promoBanner.imageUrl} alt={promoBanner.title} className="w-full rounded-2xl object-cover shadow-lg" />
                      ) : (
                        <div className={`w-full p-4 rounded-2xl border text-left flex flex-col gap-1 backdrop-blur-md ${promoBanner.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : promoBanner.type === 'alert' ? 'bg-red-500/10 text-red-400 border-red-500/20' : promoBanner.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                           <div className="font-bold text-sm flex items-center gap-1.5">
                             <Megaphone size={16} /> 
                             {promoBanner.title}
                           </div>
                           <div className="text-xs opacity-90">{promoBanner.description}</div>
                        </div>
                      )}
                    </a>
                  ) : (
                    <div className="w-full max-w-sm mx-auto z-10 mb-6 mt-4 flex flex-col gap-2">
                      {promoBanner.imageUrl && (
                        <img src={promoBanner.imageUrl} alt={promoBanner.title} className="w-full rounded-2xl object-cover shadow-lg" />
                      )}
                      {!promoBanner.imageUrl && (
                        <div className={`w-full p-4 rounded-2xl border text-left flex flex-col gap-1 backdrop-blur-md ${promoBanner.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : promoBanner.type === 'alert' ? 'bg-red-500/10 text-red-400 border-red-500/20' : promoBanner.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                           <div className="font-bold text-sm flex items-center gap-1.5">
                             <Megaphone size={16} /> 
                             {promoBanner.title}
                           </div>
                           <div className="text-xs opacity-90">{promoBanner.description}</div>
                        </div>
                      )}
                    </div>
                  )
               )}
               {portalConfig.logoUrl ? (
                  <img src={portalConfig.logoUrl} className="w-24 h-24 object-contain mb-8 z-10 mx-auto" alt="Aperçu Logo" />
               ) : (
                  <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 z-10 mx-auto text-white shadow-xl shadow-white/5">
                    <Wifi size={40} />
                  </div>
               )}
               <h4 className="text-white font-bold text-2xl z-10 mb-3 tracking-tight">{t.welcome}</h4>
               <p className="text-slate-400 text-sm z-10 mb-12">{t.loginInfo}</p>
               
               <div className="w-full space-y-4 z-10 mt-auto">
                  <button className="w-full py-3.5 rounded-xl font-medium text-base text-white flex justify-center items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]" style={{ backgroundColor: portalConfig.themeColor }}>
                     <Sparkles size={18} />
                     {t.quickConnect}
                  </button>
                  <button className="w-full py-3.5 rounded-xl font-medium text-base text-white border border-white/10 flex justify-center items-center gap-2 bg-white/5 hover:bg-white/10 transition-colors">
                     {t.adVideo}
                  </button>
               </div>
               <div className="mt-8 z-10 text-[10px] text-slate-500 underline decoration-slate-600 underline-offset-4 cursor-pointer hover:text-slate-400">
                  {t.terms}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Generation Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#050614] rounded-3xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5 top-rounded-3xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Générer des codes d'accès
              </h3>
              <button onClick={() => setShowVoucherModal(false)} className="text-slate-400 hover:text-slate-500">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const count = parseInt((form.elements.namedItem('count') as HTMLInputElement).value) || 1;
              const duration = (form.elements.namedItem('duration') as HTMLSelectElement).value;
              const locationId = (form.elements.namedItem('locationId') as HTMLSelectElement).value;

              const newVouchers = Array.from({ length: count }).map(() => ({
                id: Math.random().toString(36).substr(2, 9),
                code: Array.from({ length: 2 }, () => Math.random().toString(36).substring(2, 6).toUpperCase()).join('-'),
                duration,
                status: 'actif',
                locationId,
                createdAt: new Date().toISOString()
              }));

              setVouchers(prev => [...newVouchers, ...prev]);
              toast.success(`${count} code(s) généré(s) avec succès.`);
              setShowVoucherModal(false);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de codes</label>
                <input required type="number" name="count" min="1" max="100" defaultValue="1" className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Durée de validité</label>
                <select required name="duration" className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="1 heure">1 heure</option>
                  <option value="2 heures">2 heures</option>
                  <option value="24 heures">24 heures</option>
                  <option value="1 semaine" selected>1 semaine</option>
                  <option value="1 mois">1 mois</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Établissement (Optionnel)</label>
                <select required name="locationId" className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="all">Tous les établissements</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowVoucherModal(false)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  Annuler
                </button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20">
                  Générer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#050614] rounded-3xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5 top-rounded-3xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {currentLocation ? 'Modifier l\'établissement' : 'Ajouter un établissement'}
              </h3>
              <button 
                onClick={() => setShowLocationModal(false)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveLocation} className="p-6 space-y-5">
              {locationFormError && (
                <div className="div-error p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex gap-2 items-center">
                  <Activity size={16} /> <span>{locationFormError}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nom de l'établissement</label>
                <input 
                  type="text" 
                  name="name"
                  defaultValue={currentLocation?.name || ''}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder="Ex: Le Café des Amis"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Type d'activité</label>
                <div className="relative">
                  <select 
                    name="type"
                    defaultValue={currentLocation?.type || 'Café / Restaurant'}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none"
                  >
                    <option value="Café / Restaurant">Café / Restaurant</option>
                    <option value="Hôtel">Hôtel</option>
                    <option value="Boutique">Boutique</option>
                    <option value="Espace de Coworking">Espace de Coworking</option>
                    <option value="Espace Public">Espace Public</option>
                    <option value="Autre">Autre</option>
                  </select>
                  <ChevronRight size={16} className="absolute right-4 top-4 text-slate-400 rotate-90" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Adresse / Emplacement</label>
                <input 
                  type="text" 
                  name="address"
                  defaultValue={currentLocation?.address || ''}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder="Ex: 123 Rue de la Paix, 75000 Paris"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingLocation}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {isSubmittingLocation ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                       {currentLocation ? 'Mettre à jour' : 'Ajouter'}
                       <CheckCircle2 size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Portal Config Modal */}
      {showPortalConfigModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#050614] rounded-3xl w-full max-w-5xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl my-4 md:my-8 flex flex-col md:flex-row h-auto md:h-[800px]">
            {/* Editor Side */}
            <div className="w-full md:w-1/2 flex flex-col h-full overflow-y-auto md:border-r border-slate-100 dark:border-white/5 relative">
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5 sticky top-0 z-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette size={20} className="text-pink-500" /> Personnaliser le Portail
                </h3>
                <button 
                  onClick={() => setShowPortalConfigModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm"
                >
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleSavePortalConfig} className="p-6 space-y-6 flex-1 flex flex-col">
                <div className="mb-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Définissez l'apparence du portail captif pour <strong>{currentLocationForPortal?.name}</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Thème de mise en page</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setPortalConfigPreview({ ...portalConfigPreview, layoutTheme: 'default' })}
                      className={`p-3 rounded-xl border text-left transition-colors flex flex-col items-center justify-center gap-2 ${portalConfigPreview.layoutTheme === 'default' ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                      <LayoutDashboard size={24} />
                      <span className="text-sm font-medium">Standard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortalConfigPreview({ ...portalConfigPreview, layoutTheme: 'elegant' })}
                      className={`p-3 rounded-xl border text-left transition-colors flex flex-col items-center justify-center gap-2 ${portalConfigPreview.layoutTheme === 'elegant' ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                      <Sparkles size={24} />
                      <span className="text-sm font-medium">Élégant Sombre</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortalConfigPreview({ ...portalConfigPreview, layoutTheme: 'minimal' })}
                      className={`p-3 rounded-xl border text-left transition-colors flex flex-col items-center justify-center gap-2 ${portalConfigPreview.layoutTheme === 'minimal' ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                      <Smartphone size={24} />
                      <span className="text-sm font-medium">Minimaliste</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortalConfigPreview({ ...portalConfigPreview, layoutTheme: 'modern' })}
                      className={`p-3 rounded-xl border text-left transition-colors flex flex-col items-center justify-center gap-2 ${portalConfigPreview.layoutTheme === 'modern' ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                      <Star size={24} />
                      <span className="text-sm font-medium">Moderne Carte</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-pink-50 dark:from-indigo-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 mb-6">
                  <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
                    <Sparkles size={16} /> Générer avec l'IA
                  </label>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-3">Décrivez votre activité pour générer automatiquement des couleurs et textes adaptés.</p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 bg-white dark:bg-black/20 border border-indigo-200 dark:border-indigo-500/30 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ex: Un café cosy et végétalien à Paris..."
                      value={aiBrandPrompt}
                      onChange={(e) => setAiBrandPrompt(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateAiTheme}
                      disabled={isGeneratingAiTheme}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      {isGeneratingAiTheme ? 'Génération...' : 'Générer'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Couleur principale (Thème)</label>
                  <div className="flex gap-4 items-center">
                    <input 
                      type="color" 
                      name="themeColor"
                      value={portalConfigPreview.themeColor}
                      onChange={(e) => setPortalConfigPreview({ ...portalConfigPreview, themeColor: e.target.value })}
                      className="w-14 h-14 p-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sera utilisée pour les boutons et les éléments d'interaction.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">URL du Logo (Optionnel)</label>
                  <input 
                    type="url" 
                    name="logoUrl"
                    value={portalConfigPreview.logoUrl}
                    onChange={(e) => setPortalConfigPreview({ ...portalConfigPreview, logoUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Message de bienvenue</label>
                  <textarea 
                    name="welcomeMessage"
                    value={portalConfigPreview.welcomeMessage}
                    onChange={(e) => setPortalConfigPreview({ ...portalConfigPreview, welcomeMessage: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors resize-none"
                    placeholder="Ex: Bienvenue au Café des Amis. Connectez-vous..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">URL de redirection (Optionnel)</label>
                  <input 
                    type="url"
                    name="redirectUrl"
                    value={portalConfigPreview.redirectUrl}
                    onChange={(e) => setPortalConfigPreview({ ...portalConfigPreview, redirectUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors"
                    placeholder="https://votre-site.com/menu"
                  />
                  <p className="text-xs text-slate-500 mt-2">Redirige l'utilisateur vers ce lien une fois la connexion réussie.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Conditions d'utilisation (Optionnel)</label>
                  <textarea 
                    name="termsOfService"
                    value={portalConfigPreview.termsOfService}
                    onChange={(e) => setPortalConfigPreview({ ...portalConfigPreview, termsOfService: e.target.value })}
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors resize-none mb-4"
                    placeholder="Saisissez ici les conditions d'utilisation spécifiques à cet établissement."
                  ></textarea>
                </div>
                
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock size={18} className="text-pink-500" />
                    Limites de Session (Wi-Fi Manager)
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Durée de la session (minutes)</label>
                    <div className="flex items-center gap-3">
                      <select
                        name="sessionDuration"
                        value={portalConfigPreview.sessionDuration}
                        onChange={(e) => setPortalConfigPreview({ ...portalConfigPreview, sessionDuration: Number(e.target.value) })}
                        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500 transition-colors"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 heure</option>
                        <option value={120}>2 heures</option>
                        <option value={240}>4 heures</option>
                        <option value={0}>Illimitée</option>
                      </select>
                      <span className="text-xs text-slate-500">
                        {portalConfigPreview.sessionDuration === 0 ? "Les utilisateurs ne seront jamais déconnectés." : `Déconnexion après ${portalConfigPreview.sessionDuration} min.`}
                      </span>
                    </div>
                  </div>

                  <label className={`flex items-start gap-3 cursor-pointer group ${portalConfigPreview.sessionDuration === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="relative flex items-start pt-1">
                      <input 
                        type="checkbox" 
                        name="allowExtension"
                        checked={portalConfigPreview.allowExtension}
                        onChange={(e) => setPortalConfigPreview({ ...portalConfigPreview, allowExtension: e.target.checked })}
                        disabled={portalConfigPreview.sessionDuration === 0}
                        className="w-5 h-5 rounded border-slate-300 text-pink-500 focus:ring-pink-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-pink-500 transition-colors">Autoriser la prolongation</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Permet aux clients de relancer une session après expiration.</p>
                    </div>
                  </label>
                </div>

                <div className="mt-auto pt-6 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowPortalConfigModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingPortalConfig}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-pink-500/20"
                  >
                    {isSubmittingPortalConfig ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                         Enregistrer
                         <CheckCircle2 size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Side */}
            <div className="w-full md:w-1/2 relative hidden md:flex flex-col items-center justify-center p-8 bg-slate-200/50 dark:bg-[#02030a] overflow-y-auto">
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm mb-6 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setPreviewDeviceSize('sm')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${previewDeviceSize === 'sm' ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Mobile (Petit)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPreviewDeviceSize('md')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${previewDeviceSize === 'md' ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Mobile (Grand)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPreviewDeviceSize('lg')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${previewDeviceSize === 'lg' ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Tablette
                  </button>
                </div>

                <div className={`bg-[#f8fafc] rounded-[2.5rem] border-[8px] border-slate-800 dark:border-slate-700 shadow-2xl relative overflow-hidden flex flex-col shrink-0 transition-all duration-300 ease-in-out ${previewDeviceSize === 'sm' ? 'w-[320px] h-[568px]' : previewDeviceSize === 'lg' ? 'w-[480px] h-[650px]' : 'w-[375px] h-[650px]'} ${portalConfigPreview.layoutTheme === 'elegant' ? 'bg-slate-900 text-slate-100 font-serif' : ''} ${portalConfigPreview.layoutTheme === 'modern' ? 'bg-slate-100' : ''}`}>
                   {/* Notch */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 dark:bg-slate-700 rounded-b-xl z-20"></div>
                   
                   <div className={`flex-1 overflow-y-auto flex relative p-6 pt-16 ${portalConfigPreview.layoutTheme === 'modern' ? 'flex-col justify-end pb-8' : 'flex-col items-center'}`}>
                        {portalConfigPreview.layoutTheme === 'modern' && portalConfigPreview.logoUrl && (
                           <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${portalConfigPreview.logoUrl})`, filter: 'blur(10px)' }}></div>
                        )}

                        <div className={`w-full relative z-10 flex flex-col ${portalConfigPreview.layoutTheme === 'modern' ? 'bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl' : portalConfigPreview.layoutTheme === 'minimal' ? 'items-center flex-1 justify-center' : 'items-center'}`}>
                            {portalConfigPreview.layoutTheme !== 'modern' && (
                                <>
                                    {portalConfigPreview.logoUrl ? (
                                        <img src={portalConfigPreview.logoUrl} alt="Logo" className={`object-contain mb-8 ${portalConfigPreview.layoutTheme === 'minimal' ? 'w-32 h-32' : 'w-24 h-24 rounded-2xl shadow-sm bg-white'}`} style={portalConfigPreview.layoutTheme === 'elegant' ? { borderRadius: '50%' } : {}} />
                                    ) : (
                                        <div className={`bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 border border-slate-100 ${portalConfigPreview.layoutTheme === 'minimal' ? 'w-32 h-32' : 'w-24 h-24'}`} style={portalConfigPreview.layoutTheme === 'elegant' ? { borderRadius: '50%', backgroundColor: '#1e293b', borderColor: '#334155' } : {}}>
                                        <Wifi className={portalConfigPreview.layoutTheme === 'elegant' ? 'text-slate-400' : 'text-slate-300'} size={40} />
                                        </div>
                                    )}
                                </>
                            )}

                            {portalConfigPreview.layoutTheme === 'modern' && portalConfigPreview.logoUrl && (
                                <img src={portalConfigPreview.logoUrl} alt="Logo" className="w-16 h-16 object-contain mb-6 rounded-2xl bg-white shadow-sm self-start" />
                            )}

                            <h2 className={`text-xl font-bold text-center mb-3 ${portalConfigPreview.layoutTheme === 'elegant' ? 'text-white font-serif text-2xl tracking-wide' : 'text-slate-900'} ${portalConfigPreview.layoutTheme === 'modern' ? 'text-left' : ''}`}>
                            {portalConfigPreview.welcomeMessage || `Bienvenue au ${currentLocationForPortal?.name || 'réseau'}`}
                            </h2>
                            
                            {portalConfigPreview.layoutTheme !== 'minimal' && (
                                <p className={`text-center text-sm mb-8 ${portalConfigPreview.layoutTheme === 'elegant' ? 'text-slate-400' : 'text-slate-500'} ${portalConfigPreview.layoutTheme === 'modern' ? 'text-left mb-6' : ''}`}>
                                  {portalConfigPreview.sessionDuration > 0 ? `Connectez-vous pour profiter de ${portalConfigPreview.sessionDuration >= 60 ? Math.floor(portalConfigPreview.sessionDuration/60) + 'h' + (portalConfigPreview.sessionDuration%60 > 0 ? portalConfigPreview.sessionDuration%60 : '') : portalConfigPreview.sessionDuration + ' min'} de Wi-Fi gratuit.` : "Connectez-vous pour accéder au Wi-Fi gratuit."}
                                </p>
                            )}
                            
                            <button 
                                type="button"
                                style={{ backgroundColor: portalConfigPreview.themeColor || '#6366f1' }}
                                className={`w-full py-4 text-white font-bold text-lg shadow-lg mb-6 transition-transform active:scale-95 ${portalConfigPreview.layoutTheme === 'elegant' ? 'rounded-md uppercase tracking-wider text-sm shadow-black/50' : 'rounded-xl'}`}
                            >
                                {portalConfigPreview.layoutTheme === 'minimal' ? 'Connexion Automatique' : 'Se connecter'}
                            </button>

                            <div className={`text-xs text-center w-full ${portalConfigPreview.layoutTheme === 'elegant' ? 'text-slate-500 mt-8' : 'text-slate-400'} ${portalConfigPreview.layoutTheme === 'modern' ? 'mt-2' : 'mt-auto pt-8 pb-4'}`}>
                                {portalConfigPreview.termsOfService ? (
                                    <p className="whitespace-pre-line">{portalConfigPreview.termsOfService}</p>
                                ) : (
                                    <p>En vous connectant, vous acceptez les conditions générales d'utilisation de ce réseau.</p>
                                )}
                            </div>
                        </div>
                   </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Config Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#050614] rounded-3xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl my-4">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5 sticky top-0 z-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell size={20} className="text-amber-500" /> Notifications d'Activité
              </h3>
              <button 
                onClick={() => setShowNotificationModal(false)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveNotificationConfig} className="p-6 space-y-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Soyez averti lorsque la fréquentation de <strong>{currentLocationForNotification?.name}</strong> atteint un certain pic.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Seuil d'utilisateurs actifs (DAU)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    name="dauThreshold"
                    min="1"
                    defaultValue={currentLocationForNotification?.notificationConfig?.dauThreshold || 100}
                    className="w-24 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400">utilisateurs</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Canaux de notification</label>
                
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-start pt-1">
                    <input 
                      type="checkbox" 
                      name="emailEnabled"
                      defaultChecked={currentLocationForNotification?.notificationConfig?.emailEnabled !== false}
                      className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">Alertes par Email</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Recevoir un résumé journalier de l'activité.</p>
                  </div>
                </label>

                <div>
                  <input 
                    type="email" 
                    name="notifyEmail"
                    defaultValue={currentLocationForNotification?.notificationConfig?.notifyEmail || ''}
                    placeholder="Adresse email (ex: gerant@cafe.com)"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors text-sm ml-8 max-w-[calc(100%-2rem)]"
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-start pt-1">
                    <input 
                      type="checkbox" 
                      name="pushEnabled"
                      defaultChecked={currentLocationForNotification?.notificationConfig?.pushEnabled || false}
                      className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">Notifications Push</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Alerte immédiate sur votre appareil.</p>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowNotificationModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingNotification}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-amber-500/20"
                >
                  {isSubmittingNotification ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                       Enregistrer
                       <CheckCircle2 size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal for specific location */}
      {showQrModal && currentLocationForQr && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#050614] rounded-3xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl my-4">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode size={20} className="text-indigo-500" /> Code QR Unique
              </h3>
              <button 
                onClick={() => {
                  setShowQrModal(false);
                  setCurrentLocationForQr(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Ce QR Code dirige vos clients vers le portail de connexion de <strong>{currentLocationForQr.name}</strong>. Il est prêt à être imprimé.
              </p>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                <QRCodeSVG
                  id={`qr-code-${currentLocationForQr.id}`}
                  value={`${window.location.origin}/portal/${currentLocationForQr.id}`}
                  size={200}
                  bgColor={"#ffffff"}
                  fgColor={"#0f172a"}
                  level={"Q"}
                  includeMargin={false}
                />
              </div>

              <div className="w-full space-y-3">
                <button 
                  onClick={() => {
                    const svg = document.getElementById(`qr-code-${currentLocationForQr.id}`);
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = 240;
                      canvas.height = 240;
                      if(ctx) {
                        ctx.fillStyle = "white";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 20, 20, 200, 200);
                        const pngFile = canvas.toDataURL("image/png");
                        const downloadLink = document.createElement("a");
                        downloadLink.download = `QR_Code_${currentLocationForQr.name.replace(/\s+/g, '_')}.png`;
                        downloadLink.href = pngFile;
                        downloadLink.click();
                      }
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                  }}
                  className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Download size={18} /> Télécharger l'image (PNG)
                </button>
                <button 
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    const svg = document.getElementById(`qr-code-${currentLocationForQr.id}`);
                    if (!printWindow || !svg) return;
                    
                    const svgData = new XMLSerializer().serializeToString(svg);
                    
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Imprimer QR Code - ${currentLocationForQr.name}</title>
                          <style>
                            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                            h1 { font-size: 24px; color: #0f172a; margin-bottom: 8px; }
                            p { font-size: 16px; color: #64748b; margin-bottom: 32px; }
                            .qr-container { padding: 32px; border: 2px solid #e2e8f0; border-radius: 24px; }
                          </style>
                        </head>
                        <body>
                          <h1>${currentLocationForQr.name}</h1>
                          <p>Scannez pour vous connecter au Wi-Fi</p>
                          <div class="qr-container">${svgData}</div>
                          <script>
                            window.onload = () => {
                              setTimeout(() => {
                                window.print();
                                window.close();
                              }, 500);
                            };
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                  className="w-full flex justify-center items-center gap-2 px-4 py-3 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Imprimer le QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
