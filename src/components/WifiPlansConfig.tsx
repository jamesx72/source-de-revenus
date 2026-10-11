import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit3, Copy, Check, CheckCircle2, Wifi, DollarSign, Clock, 
  Zap, Smartphone, Sparkles, Star, Tag, ChevronRight, RefreshCw, 
  ArrowDown, ArrowUp, Layers, Store, X, HelpCircle, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { WifiPlan } from '../types';

interface LocationItem {
  id: string;
  name: string;
  type?: string;
  address?: string;
  paymentConfig?: {
    currency?: string;
    price1h?: number;
    price24h?: number;
    passes?: any[];
  };
  wifiPlans?: WifiPlan[];
  portalConfig?: any;
  wifiConfig?: any;
}

interface WifiPlansConfigProps {
  locations: LocationItem[];
  selectedLocationId?: string;
  onLocationChange?: (locationId: string) => void;
  onSaveSuccess?: (updatedLocation: LocationItem) => void;
}

// Preset bundles for 1-click fast configuration
const PRESET_TEMPLATES = [
  {
    id: 'cafe',
    name: 'Café & Bistrot',
    description: 'Accès rapide pour clients en pause café et pass longue durée pour nomades.',
    icon: '☕',
    plans: [
      {
        id: 'plan-cafe-free',
        name: 'Pass Découverte',
        duration: 30,
        price: 0,
        badge: 'Gratuit',
        isAdSupported: true,
        downloadSpeedLimit: 15,
        uploadSpeedLimit: 5,
        devicesLimit: 1,
        isActive: true,
        description: 'Session gratuite sponsorisée avec publicité.',
        features: ['30 minutes incluses', 'Financé par 1 courte pub', '1 appareil connecté']
      },
      {
        id: 'plan-cafe-2h',
        name: 'Pass Coffee & Work',
        duration: 120,
        price: 2.5,
        badge: 'Populaire',
        isAdSupported: false,
        downloadSpeedLimit: 40,
        uploadSpeedLimit: 15,
        devicesLimit: 2,
        isActive: true,
        description: 'Idéal pour télétravailler et étudier sereinement.',
        features: ['2 heures de connexion continue', 'Sans aucune publicité', 'Débit prioritaire 40 Mbps']
      },
      {
        id: 'plan-cafe-day',
        name: 'Pass Journée Complète',
        duration: 1440,
        price: 5.0,
        badge: 'Meilleure Offre',
        isAdSupported: false,
        downloadSpeedLimit: 60,
        uploadSpeedLimit: 20,
        devicesLimit: 3,
        isActive: true,
        description: 'Accès illimité 24 heures pour toute la journée.',
        features: ['24 heures d\'accès illimité', 'Multi-appareils (jusqu\'à 3)', 'Visioconférence HD fluide']
      }
    ]
  },
  {
    id: 'coworking',
    name: 'Espace Coworking',
    description: 'Tarification professionnelle adaptée aux télétravailleurs et résidents.',
    icon: '💼',
    plans: [
      {
        id: 'plan-cowork-2h',
        name: 'Pass Sprint 2H',
        duration: 120,
        price: 4.0,
        badge: 'Express',
        isAdSupported: false,
        downloadSpeedLimit: 50,
        uploadSpeedLimit: 25,
        devicesLimit: 2,
        isActive: true,
        description: 'Parfait pour un rendez-vous ou une session de travail courte.',
        features: ['2 heures d\'accès haut débit', 'Fibre 50 Mbps', 'Sécurisé WPA3']
      },
      {
        id: 'plan-cowork-day',
        name: 'Pass Day Worker',
        duration: 1440,
        price: 12.0,
        badge: 'Recommandé',
        isAdSupported: false,
        downloadSpeedLimit: 100,
        uploadSpeedLimit: 50,
        devicesLimit: 3,
        isActive: true,
        description: 'Une journée productive sans limite de débit.',
        features: ['Accès 24 heures illimité', 'Fibre 100 Mbps symétrique', 'PC portable + Smartphone']
      },
      {
        id: 'plan-cowork-week',
        name: 'Pass Semaine Nomade',
        duration: 10080, // 7 days
        price: 45.0,
        badge: 'Pro Nomade',
        isAdSupported: false,
        downloadSpeedLimit: 150,
        uploadSpeedLimit: 75,
        devicesLimit: 4,
        isActive: true,
        description: '7 jours d\'accès complet pour les professionnels en déplacement.',
        features: ['7 jours consécutifs', '4 appareils simultanés', 'IP dédiée & support prioritaire']
      }
    ]
  },
  {
    id: 'hotel',
    name: 'Hôtel & Résidence',
    description: 'Pour hébergements touristiques, séjours d\'affaires et resorts.',
    icon: '🏨',
    plans: [
      {
        id: 'plan-hotel-free',
        name: 'Wi-Fi Résident Basique',
        duration: 1440,
        price: 0,
        badge: 'Inclus',
        isAdSupported: true,
        downloadSpeedLimit: 8,
        uploadSpeedLimit: 2,
        devicesLimit: 1,
        isActive: true,
        description: 'Connexion de base pour navigation web et messages.',
        features: ['Inclus avec le séjour', 'Débit standard 8 Mbps', '1 appareil']
      },
      {
        id: 'plan-hotel-premium-day',
        name: 'Pass 24H Ultra-Stream',
        duration: 1440,
        price: 6.0,
        badge: 'Streaming HD',
        isAdSupported: false,
        downloadSpeedLimit: 80,
        uploadSpeedLimit: 30,
        devicesLimit: 3,
        isActive: true,
        description: 'Pour Netflix, YouTube 4K, appels vidéo et gaming.',
        features: ['24H très haut débit 80 Mbps', 'Sans restriction de bande passante', '3 appareils autorisés']
      },
      {
        id: 'plan-hotel-week',
        name: 'Pass Séjour Vacances (7J)',
        duration: 10080,
        price: 25.0,
        badge: 'Pack Famille',
        isAdSupported: false,
        downloadSpeedLimit: 100,
        uploadSpeedLimit: 40,
        devicesLimit: 5,
        isActive: true,
        description: 'Valable pour toute la chambre et toute la famille.',
        features: ['7 jours d\'accès continu', 'Jusqu\'à 5 appareils connectés', 'Streaming 4K garanti']
      }
    ]
  }
];

// Helper to format minutes into human readable French string
export function formatMinutesLabel(minutes: number): string {
  if (!minutes || minutes <= 0) return 'Illimité';
  if (minutes >= 43200) {
    const months = Math.round(minutes / 43200);
    return `${months} mois (${minutes / 1440}j)`;
  }
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440);
    return `${days} jour${days > 1 ? 's' : ''}`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}min` : `${hours} heure${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} min`;
}

export function formatCurrencySymbol(currency: string = 'eur'): string {
  const c = currency.toLowerCase();
  if (c === 'usd') return '$';
  if (c === 'gbp') return '£';
  if (c === 'chf') return 'CHF';
  return '€';
}

export default function WifiPlansConfig({ 
  locations, 
  selectedLocationId, 
  onLocationChange,
  onSaveSuccess 
}: WifiPlansConfigProps) {
  // Current chosen location
  const [activeLocId, setActiveLocId] = useState<string>(() => {
    if (selectedLocationId) return selectedLocationId;
    return locations[0]?.id || '';
  });

  const currentLocation = locations.find(l => l.id === activeLocId) || locations[0];

  // Currency
  const [currency, setCurrency] = useState<string>('eur');
  
  // Plans list state
  const [plans, setPlans] = useState<WifiPlan[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modal / Plan Editor State
  const [editingPlan, setEditingPlan] = useState<WifiPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewPlan, setIsNewPlan] = useState(false);

  // Form custom duration inputs
  const [durationValue, setDurationValue] = useState<number>(60);
  const [durationUnit, setDurationUnit] = useState<'minutes' | 'hours' | 'days'>('hours');

  // Preview phone tab in mobile
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Synchronize when active location changes
  useEffect(() => {
    if (!currentLocation) return;
    
    const curr = currentLocation.paymentConfig?.currency || 'eur';
    setCurrency(curr);

    // Look for plans in paymentConfig.passes or wifiPlans
    const existingPasses = currentLocation.paymentConfig?.passes;
    const existingWifiPlans = currentLocation.wifiPlans;

    if (existingPasses && existingPasses.length > 0) {
      const normalized: WifiPlan[] = existingPasses.map((p: any, idx: number) => ({
        id: p.id || `plan-${idx}-${Date.now()}`,
        name: p.name || `Pass ${p.duration || 60}m`,
        duration: Number(p.duration) || 60,
        price: Number(p.price) || 0,
        currency: p.currency || curr,
        badge: p.badge || (p.price === 0 ? 'Gratuit' : idx === 1 ? 'Populaire' : ''),
        isAdSupported: p.isAdSupported ?? (p.price === 0),
        downloadSpeedLimit: p.downloadSpeedLimit || 25,
        uploadSpeedLimit: p.uploadSpeedLimit || 10,
        devicesLimit: p.devicesLimit || 1,
        stripePriceId: p.stripePriceId || '',
        isActive: p.isActive !== false,
        description: p.description || '',
        features: p.features || [
          `${formatMinutesLabel(p.duration || 60)} d'accès Wi-Fi`,
          p.price === 0 ? 'Sponsorisé par pub' : 'Connexion ultra-rapide sans pub',
          'Connexion automatique sécurisée'
        ]
      }));
      setPlans(normalized);
    } else if (existingWifiPlans && existingWifiPlans.length > 0) {
      setPlans(existingWifiPlans);
    } else {
      // Default to starter template
      const defaultPlans = PRESET_TEMPLATES[0].plans.map(p => ({ ...p, currency: curr }));
      setPlans(defaultPlans);
      setHasUnsavedChanges(true);
    }
  }, [activeLocId, currentLocation]);

  // Handle switching location
  const handleSelectLocation = (locId: string) => {
    if (hasUnsavedChanges) {
      if (!window.confirm("Vous avez des modifications non enregistrées. Voulez-vous vraiment changer d'établissement ?")) {
        return;
      }
    }
    setActiveLocId(locId);
    setHasUnsavedChanges(false);
    if (onLocationChange) onLocationChange(locId);
  };

  // Open editor for a new plan
  const handleCreatePlan = () => {
    const newId = `plan-${Date.now()}`;
    const initialPlan: WifiPlan = {
      id: newId,
      name: 'Nouveau Pass Wi-Fi',
      duration: 120, // 2 hours
      price: 3.0,
      currency: currency,
      badge: '',
      isAdSupported: false,
      downloadSpeedLimit: 50,
      uploadSpeedLimit: 20,
      devicesLimit: 1,
      isActive: true,
      description: 'Accès Internet haut débit immédiat.',
      features: ['2 heures d\'accès Wi-Fi', 'Haut débit sans publicité', '1 appareil connecté']
    };
    setEditingPlan(initialPlan);
    setDurationValue(2);
    setDurationUnit('hours');
    setIsNewPlan(true);
    setIsModalOpen(true);
  };

  // Open editor for existing plan
  const handleEditPlan = (plan: WifiPlan) => {
    setEditingPlan({ ...plan });
    // compute duration value & unit
    if (plan.duration % 1440 === 0 && plan.duration > 0) {
      setDurationValue(plan.duration / 1440);
      setDurationUnit('days');
    } else if (plan.duration % 60 === 0 && plan.duration > 0) {
      setDurationValue(plan.duration / 60);
      setDurationUnit('hours');
    } else {
      setDurationValue(plan.duration);
      setDurationUnit('minutes');
    }
    setIsNewPlan(false);
    setIsModalOpen(true);
  };

  // Delete plan
  const handleDeletePlan = (planId: string) => {
    const updated = plans.filter(p => p.id !== planId);
    setPlans(updated);
    setHasUnsavedChanges(true);
    toast.success("Forfait supprimé de la liste");
  };

  // Duplicate plan
  const handleDuplicatePlan = (plan: WifiPlan) => {
    const copy: WifiPlan = {
      ...plan,
      id: `plan-${Date.now()}`,
      name: `${plan.name} (Copie)`,
      badge: ''
    };
    setPlans([...plans, copy]);
    setHasUnsavedChanges(true);
    toast.success("Forfait dupliqué avec succès");
  };

  // Toggle active state
  const handleToggleActive = (planId: string) => {
    const updated = plans.map(p => {
      if (p.id === planId) {
        return { ...p, isActive: !p.isActive };
      }
      return p;
    });
    setPlans(updated);
    setHasUnsavedChanges(true);
  };

  // Apply a preset bundle
  const handleApplyPreset = (presetId: string) => {
    const preset = PRESET_TEMPLATES.find(p => p.id === presetId);
    if (!preset) return;

    if (window.confirm(`Remplacer les forfaits actuels par le modèle "${preset.name}" ?`)) {
      const localized = preset.plans.map(p => ({
        ...p,
        currency: currency,
        id: `plan-${presetId}-${Math.random().toString(36).slice(2, 7)}`
      }));
      setPlans(localized);
      setHasUnsavedChanges(true);
      toast.success(`Modèle "${preset.name}" appliqué avec succès !`);
    }
  };

  // Save changes from modal into plans state
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    // Calculate duration in minutes
    let totalMinutes = durationValue;
    if (durationUnit === 'hours') totalMinutes = durationValue * 60;
    if (durationUnit === 'days') totalMinutes = durationValue * 1440;

    const finalizedPlan: WifiPlan = {
      ...editingPlan,
      duration: Math.max(1, Math.round(totalMinutes)),
      currency: currency
    };

    if (isNewPlan) {
      setPlans([...plans, finalizedPlan]);
    } else {
      setPlans(plans.map(p => p.id === finalizedPlan.id ? finalizedPlan : p));
    }

    setHasUnsavedChanges(true);
    setIsModalOpen(false);
    setEditingPlan(null);
    toast.success(isNewPlan ? "Nouveau forfait ajouté" : "Forfait mis à jour");
  };

  // Persist to Firestore
  const handleSaveToFirestore = async () => {
    if (!currentLocation) {
      toast.error("Veuillez sélectionner un établissement");
      return;
    }

    setIsSaving(true);
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      // We format paymentConfig passes for backward compatibility with captive portal
      const passesPayload = plans.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        duration: Number(p.duration),
        badge: p.badge || '',
        isAdSupported: Boolean(p.isAdSupported),
        downloadSpeedLimit: p.downloadSpeedLimit || 25,
        uploadSpeedLimit: p.uploadSpeedLimit || 10,
        devicesLimit: p.devicesLimit || 1,
        stripePriceId: p.stripePriceId || '',
        isActive: p.isActive !== false,
        description: p.description || '',
        features: p.features || []
      }));

      // Find price1h and price24h references for fallbacks
      const pass1h = plans.find(p => p.duration === 60 || p.duration === 120);
      const pass24h = plans.find(p => p.duration === 1440);

      const updatedPaymentConfig = {
        currency: currency,
        price1h: pass1h ? pass1h.price : (currentLocation.paymentConfig?.price1h || 2),
        price24h: pass24h ? pass24h.price : (currentLocation.paymentConfig?.price24h || 5),
        passes: passesPayload
      };

      const docRef = doc(db, 'locations', currentLocation.id);
      await setDoc(docRef, {
        paymentConfig: updatedPaymentConfig,
        wifiPlans: plans
      }, { merge: true });

      setHasUnsavedChanges(false);
      toast.success("Configuration des forfaits enregistrée avec succès !", {
        description: `${plans.length} forfaits enregistrés pour ${currentLocation.name}`
      });

      if (onSaveSuccess) {
        onSaveSuccess({
          ...currentLocation,
          paymentConfig: updatedPaymentConfig,
          wifiPlans: plans
        });
      }
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde des forfaits:", err);
      toast.error("Échec de l'enregistrement des forfaits dans Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Venue Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Wifi size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Forfaits & Tarifs Wi-Fi</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Définissez les durées de session sur mesure et la grille tarifaire de votre portail captif.
              </p>
            </div>
          </div>
        </div>

        {/* Location selector & save action */}
        <div className="flex flex-wrap items-center gap-3">
          {locations.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-2xl">
              <Store size={16} className="text-slate-400" />
              <select
                value={activeLocId}
                onChange={(e) => handleSelectLocation(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Currency Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
            {(['eur', 'usd', 'gbp'] as const).map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => {
                  setCurrency(cur);
                  setPlans(plans.map(p => ({ ...p, currency: cur })));
                  setHasUnsavedChanges(true);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  currency === cur
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cur === 'eur' ? '€ EUR' : cur === 'usd' ? '$ USD' : '£ GBP'}
              </button>
            ))}
          </div>

          <button
            onClick={handleSaveToFirestore}
            disabled={isSaving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-lg ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 ring-2 ring-emerald-400/50 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
            } disabled:opacity-50`}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {hasUnsavedChanges ? 'Enregistrer les modifications' : 'Enregistré'}
          </button>
        </div>
      </div>

      {/* Preset Templates Quick Setup */}
      <div className="bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-indigo-200/50 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Modèles Clé en Main (1-Clic)</h3>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">• Pré-configurez vos forfaits selon votre activité</span>
          </div>
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Smartphone size={14} />
            {showLivePreview ? 'Masquer aperçu portail' : 'Afficher aperçu portail'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESET_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => handleApplyPreset(tmpl.id)}
              className="group bg-white dark:bg-white/5 hover:bg-indigo-50/50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-indigo-400 rounded-2xl p-4 cursor-pointer transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{tmpl.icon}</span>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Appliquer <ChevronRight size={12} />
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{tmpl.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{tmpl.description}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-white/5">
                {tmpl.plans.map(p => (
                  <span key={p.id} className="text-[10px] bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md font-mono text-slate-600 dark:text-slate-300">
                    {p.price === 0 ? 'Gratuit' : `${p.price}€`} / {formatMinutesLabel(p.duration)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Plans List + Live Portal Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configured Tiers List */}
        <div className={showLivePreview ? 'lg:col-span-7 space-y-6' : 'lg:col-span-12 space-y-6'}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <Layers size={20} className="text-indigo-500" />
                Grille des Forfaits ({plans.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ces offres apparaîtront sur le portail captif lorsque les clients se connecteront au Wi-Fi.
              </p>
            </div>
            
            <button
              onClick={handleCreatePlan}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-indigo-500/20"
            >
              <Plus size={16} />
              Nouveau forfait
            </button>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {plans.map((plan, index) => {
              const isFree = plan.price === 0 || plan.isAdSupported;
              const formattedDuration = formatMinutesLabel(plan.duration);
              const symbol = formatCurrencySymbol(currency);

              return (
                <div
                  key={plan.id}
                  className={`bg-white dark:bg-white/5 border rounded-3xl p-5 md:p-6 transition-all backdrop-blur-md shadow-sm relative group ${
                    plan.isActive 
                      ? 'border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/40' 
                      : 'border-dashed border-slate-300 dark:border-white/10 opacity-60 bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Plan Information */}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isFree 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                      }`}>
                        {isFree ? <Wifi size={22} /> : <Zap size={22} />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">
                            {plan.name}
                          </h4>
                          {plan.badge && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <Star size={10} className="fill-amber-500 text-amber-500" />
                              {plan.badge}
                            </span>
                          )}
                          {!plan.isActive && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                              Désactivé
                            </span>
                          )}
                        </div>

                        {plan.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {plan.description}
                          </p>
                        )}

                        {/* Specs row */}
                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <Clock size={13} className="text-indigo-500" />
                            {formattedDuration}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <ArrowDown size={12} className="text-emerald-500" />
                            {plan.downloadSpeedLimit || 25} Mbps
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Smartphone size={13} className="text-slate-400" />
                            {plan.devicesLimit || 1} appareil{(plan.devicesLimit || 1) > 1 ? 's' : ''}
                          </span>
                          {plan.stripePriceId && (
                            <>
                              <span>•</span>
                              <span className="text-[10px] text-indigo-500 font-mono bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                Stripe: {plan.stripePriceId}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-white/5 gap-3">
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                          {isFree ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Gratuit</span>
                          ) : (
                            <span>{plan.price.toFixed(2)} {symbol}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {isFree ? 'Accès sponsorisé' : 'Paiement unique'}
                        </p>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(plan.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                            plan.isActive 
                              ? 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200' 
                              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                          title={plan.isActive ? "Désactiver pour cacher du portail" : "Activer sur le portail"}
                        >
                          {plan.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicatePlan(plan)}
                          className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                          title="Dupliquer ce forfait"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditPlan(plan)}
                          className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                          title="Modifier le forfait"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Supprimer ce forfait"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Features badges row if present */}
                  {plan.features && plan.features.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-2">
                      {plan.features.map((feat, fidx) => (
                        <span key={fidx} className="text-[11px] bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check size={11} className="text-emerald-500" />
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {plans.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-8">
                <Wifi size={40} className="mx-auto text-slate-400 mb-3" />
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Aucun forfait configuré</h4>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
                  Créez vos premiers forfaits personnalisés ou appliquez un des modèles recommandés en un clic.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleCreatePlan}
                    className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/20"
                  >
                    Créer un forfait
                  </button>
                  <button
                    onClick={() => handleApplyPreset('cafe')}
                    className="px-5 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    Charger le modèle Café
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Captive Portal Smartphone Mockup */}
        {showLivePreview && (
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="sticky top-6 w-full max-w-[360px]">
              <div className="text-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                  Aperçu Portail Captif en Direct
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Rendu exact visible par les clients du {currentLocation?.name}
                </p>
              </div>

              {/* iPhone Frame */}
              <div className="relative mx-auto border-[10px] border-slate-800 dark:border-slate-700 rounded-[44px] overflow-hidden shadow-2xl bg-white dark:bg-slate-950 aspect-[9/18.5] max-h-[640px] flex flex-col">
                {/* Dynamic island notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30"></div>
                
                {/* Screen Content */}
                <div className="flex-1 overflow-y-auto p-4 pt-9 text-slate-900 dark:text-white flex flex-col justify-between text-center bg-gradient-to-b from-indigo-50/40 to-slate-50 dark:from-indigo-950/20 dark:to-slate-950">
                  <div>
                    {/* Portal Header */}
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-2">
                      <Wifi size={22} />
                    </div>
                    <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {currentLocation?.name || 'Le Café Central'}
                    </h5>
                    <p className="text-[10px] text-slate-500 mb-4">
                      Sélectionnez une formule pour vous connecter au Wi-Fi.
                    </p>

                    {/* Passes in Portal */}
                    <div className="space-y-2 mb-4 text-left">
                      {plans.filter(p => p.isActive).map((p) => {
                        const isFree = p.price === 0 || p.isAdSupported;
                        const symbol = formatCurrencySymbol(currency);

                        return (
                          <div
                            key={p.id}
                            className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-indigo-400 transition-all shadow-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {p.name}
                                </span>
                                {p.badge && (
                                  <span className="text-[9px] bg-amber-500/10 text-amber-600 font-bold px-1.5 rounded">
                                    {p.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500">
                                Durée : {formatMinutesLabel(p.duration)}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="font-bold text-xs font-mono text-indigo-600 dark:text-indigo-400">
                                {isFree ? 'Gratuit' : `${p.price.toFixed(2)} ${symbol}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Portal Footer info */}
                  <div className="pt-2 text-[9px] text-slate-400 border-t border-slate-200 dark:border-white/10">
                    Connexion cryptée et sécurisée par WiFiCash
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plan Editor Modal */}
      {isModalOpen && editingPlan && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#080918] rounded-3xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl my-6">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isNewPlan ? 'Créer un Forfait Wi-Fi' : 'Modifier le Forfait'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Personnalisez la durée, le tarif et les paramètres de bande passante.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Plan Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Nom du Forfait *
                </label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="Ex: Pass 2 Heures Travail, Pass Journée 24H..."
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Pricing Model: Free vs Paid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Modèle Tarifaire *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingPlan({ ...editingPlan, price: 0, isAdSupported: true, badge: editingPlan.badge || 'Gratuit' })}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      editingPlan.price === 0 || editingPlan.isAdSupported
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <Wifi size={20} className="shrink-0 text-emerald-500 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm">Gratuit (Sponsorisé)</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Session financée par une publicité ou inscription
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingPlan({ ...editingPlan, price: editingPlan.price === 0 ? 3.0 : editingPlan.price, isAdSupported: false })}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      editingPlan.price > 0 && !editingPlan.isAdSupported
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <DollarSign size={20} className="shrink-0 text-indigo-500 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm">Payant (Pass Premium)</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Paiement sécurisé par carte bancaire ou Apple Pay
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Price input if paid */}
              {(!editingPlan.isAdSupported && editingPlan.price > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Prix du forfait ({formatCurrencySymbol(currency)}) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        required
                        value={editingPlan.price}
                        onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white font-mono font-bold text-base focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <span className="absolute right-4 top-2 text-slate-400 font-bold">
                        {formatCurrencySymbol(currency)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Stripe Price ID <span className="text-slate-400 font-normal">(Optionnel)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="price_1NxyZ..."
                      value={editingPlan.stripePriceId || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, stripePriceId: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Session Duration Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Durée de Connexion Wi-Fi *</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    Total : {formatMinutesLabel(
                      durationUnit === 'hours' ? durationValue * 60 : 
                      durationUnit === 'days' ? durationValue * 1440 : durationValue
                    )}
                  </span>
                </label>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    { label: '15 min', val: 15, unit: 'minutes' as const },
                    { label: '30 min', val: 30, unit: 'minutes' as const },
                    { label: '1 heure', val: 1, unit: 'hours' as const },
                    { label: '2 heures', val: 2, unit: 'hours' as const },
                    { label: '4 heures', val: 4, unit: 'hours' as const },
                    { label: '24 heures (1j)', val: 1, unit: 'days' as const },
                    { label: '3 jours', val: 3, unit: 'days' as const },
                    { label: '7 jours (1 sem)', val: 7, unit: 'days' as const },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setDurationValue(preset.val);
                        setDurationUnit(preset.unit);
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-white/10 transition-colors font-medium text-slate-700 dark:text-slate-300"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Duration Input */}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationValue}
                    onChange={(e) => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />

                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Heures</option>
                    <option value="days">Jours</option>
                  </select>
                </div>
              </div>

              {/* Badge & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Badge Mise en Avant (Optionnel)
                  </label>
                  <select
                    value={editingPlan.badge || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Aucun badge</option>
                    <option value="Gratuit">Gratuit</option>
                    <option value="Populaire">Populaire ⭐</option>
                    <option value="Meilleure Offre">Meilleure Offre 🔥</option>
                    <option value="Recommandé">Recommandé 👍</option>
                    <option value="Ultra Rapide">Ultra Rapide ⚡</option>
                    <option value="Pro Nomade">Pro Nomade 💼</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre max d'appareils
                  </label>
                  <select
                    value={editingPlan.devicesLimit || 1}
                    onChange={(e) => setEditingPlan({ ...editingPlan, devicesLimit: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={1}>1 appareil (standard)</option>
                    <option value={2}>2 appareils (ordinateur + mobile)</option>
                    <option value={3}>3 appareils</option>
                    <option value={5}>5 appareils (pack famille)</option>
                  </select>
                </div>
              </div>

              {/* Bandwidth Limits (Download & Upload) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <ArrowDown size={13} className="text-emerald-500" />
                    Limite Download (Mbps)
                  </label>
                  <select
                    value={editingPlan.downloadSpeedLimit || 25}
                    onChange={(e) => setEditingPlan({ ...editingPlan, downloadSpeedLimit: parseInt(e.target.value) || 25 })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={5}>5 Mbps (Basique / Email)</option>
                    <option value={15}>15 Mbps (Web & Streaming SD)</option>
                    <option value={25}>25 Mbps (Standard)</option>
                    <option value={50}>50 Mbps (Confort HD)</option>
                    <option value={100}>100 Mbps (Très Haut Débit 4K)</option>
                    <option value={200}>200 Mbps (Fibre Max)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <ArrowUp size={13} className="text-indigo-500" />
                    Limite Upload (Mbps)
                  </label>
                  <select
                    value={editingPlan.uploadSpeedLimit || 10}
                    onChange={(e) => setEditingPlan({ ...editingPlan, uploadSpeedLimit: parseInt(e.target.value) || 10 })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={2}>2 Mbps</option>
                    <option value={5}>5 Mbps</option>
                    <option value={10}>10 Mbps</option>
                    <option value={25}>25 Mbps</option>
                    <option value={50}>50 Mbps</option>
                  </select>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description courte du forfait
                </label>
                <input
                  type="text"
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  placeholder="Ex: Idéal pour télétravailler et passer des appels vidéo."
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    Actif sur le portail captif
                  </div>
                  <div className="text-xs text-slate-500">
                    Les clients pourront voir et choisir cette formule.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPlan({ ...editingPlan, isActive: !editingPlan.isActive })}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    editingPlan.isActive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      editingPlan.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/20 text-sm transition-all"
                >
                  {isNewPlan ? 'Créer le forfait' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
