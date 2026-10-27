import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Coins, ShieldCheck, CheckCircle2, Copy, Check, 
  Zap, AlertCircle, QrCode, DollarSign, RefreshCw, Globe, Wallet
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

export interface PaymentGatewaysConfig {
  stripeEnabled: boolean;
  stripePriceId: string;
  paypalEnabled: boolean;
  paypalMode: 'sandbox' | 'live';
  paypalPlanId: string;
  paypalClientId: string;
  paypalMerchantEmail: string;
  cryptoEnabled: boolean;
  solanaWalletAddress: string;
  solanaPriceSol: string;
  solanaNetwork: 'mainnet' | 'devnet';
  cryptoUsdcEnabled: boolean;
  cryptoUsdcPrice: string;
  evmWalletAddress: string;
  solRateEur: number;
}

export const VALID_DEMO_SOLANA_ADDRESS = '7XwPz4WiFiCashMerchantHubSo1anaNetworkAddr9';
const LEGACY_INVALID_SOLANA_ADDRESS = '7XwPz4WiFiCashMerchantHubSolanaNetworkAddress9';

export function isValidSolanaAddress(address: string): boolean {
  const trimmed = (address || '').trim();
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
}

export function isValidEvmAddress(address: string): boolean {
  const trimmed = (address || '').trim();
  if (!trimmed) return true; // optional
  return /^0x[a-fA-F0-9]{40}$/.test(trimmed);
}

export function isValidEmail(email: string): boolean {
  const trimmed = (email || '').trim();
  if (!trimmed) return true; // optional if clientId/planId set
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

const rawEnvSolana = (import.meta as any).env?.VITE_SOLANA_WALLET_ADDRESS || VALID_DEMO_SOLANA_ADDRESS;

export const DEFAULT_PAYMENT_GATEWAYS_CONFIG: PaymentGatewaysConfig = {
  stripeEnabled: true,
  stripePriceId: (import.meta as any).env?.VITE_STRIPE_PRICE_ID || 'price_1P0XWiFiCashBusiness49',
  paypalEnabled: true,
  paypalMode: ((import.meta as any).env?.VITE_PAYPAL_MODE === 'live' ? 'live' : 'sandbox'),
  paypalPlanId: (import.meta as any).env?.VITE_PAYPAL_PLAN_ID || 'P-5ML4271244454362WXNWU5NQ',
  paypalClientId: (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID || 'sb-demo-paypal-client-id',
  paypalMerchantEmail: (import.meta as any).env?.VITE_PAYPAL_MERCHANT_EMAIL || 'merchant@wificash-hotspot.com',
  cryptoEnabled: true,
  solanaWalletAddress: isValidSolanaAddress(rawEnvSolana) ? rawEnvSolana : VALID_DEMO_SOLANA_ADDRESS,
  solanaPriceSol: (import.meta as any).env?.VITE_SOLANA_PRICE_SOL || '0.35',
  solanaNetwork: 'mainnet',
  cryptoUsdcEnabled: true,
  cryptoUsdcPrice: (import.meta as any).env?.VITE_CRYPTO_USDC_PRICE || '49.00',
  evmWalletAddress: (import.meta as any).env?.VITE_EVM_WALLET_ADDRESS || '',
  solRateEur: 140,
};

const STORAGE_KEY = 'wificash_payment_gateways_v1';

export function sanitizeGatewaysConfig(raw?: Partial<PaymentGatewaysConfig> | null): PaymentGatewaysConfig {
  const merged: PaymentGatewaysConfig = {
    ...DEFAULT_PAYMENT_GATEWAYS_CONFIG,
    ...(raw || {}),
  };

  // Automatically migrate legacy address containing non-Base58 'l' character
  if (
    !merged.solanaWalletAddress ||
    merged.solanaWalletAddress === LEGACY_INVALID_SOLANA_ADDRESS
  ) {
    merged.solanaWalletAddress = VALID_DEMO_SOLANA_ADDRESS;
  }

  if (typeof merged.stripeEnabled !== 'boolean') merged.stripeEnabled = true;
  if (typeof merged.paypalEnabled !== 'boolean') merged.paypalEnabled = true;
  if (typeof merged.cryptoEnabled !== 'boolean') merged.cryptoEnabled = true;
  if (typeof merged.cryptoUsdcEnabled !== 'boolean') merged.cryptoUsdcEnabled = true;
  if (merged.paypalMode !== 'live' && merged.paypalMode !== 'sandbox') merged.paypalMode = 'sandbox';
  if (merged.solanaNetwork !== 'mainnet' && merged.solanaNetwork !== 'devnet') merged.solanaNetwork = 'mainnet';
  if (!merged.solRateEur || isNaN(Number(merged.solRateEur)) || Number(merged.solRateEur) <= 0) {
    merged.solRateEur = 140;
  }

  return merged;
}

export function getStoredGatewaysConfig(): PaymentGatewaysConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const sanitized = sanitizeGatewaysConfig(parsed);
      if (parsed.solanaWalletAddress === LEGACY_INVALID_SOLANA_ADDRESS) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      }
      return sanitized;
    }
  } catch (e) {
    console.warn('Error reading stored payment gateways config:', e);
  }
  return { ...DEFAULT_PAYMENT_GATEWAYS_CONFIG };
}

export function saveStoredGatewaysConfig(config: PaymentGatewaysConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeGatewaysConfig(config)));
  } catch (e) {
    console.warn('Error saving payment gateways config to localStorage:', e);
  }
}

export interface SubscriptionActivationMetadata {
  txHash?: string;
  token?: string;
  paypalOrderId?: string;
}

interface PaymentGatewaysSettingsProps {
  user: any;
  platformSubscription: any;
  onActivateSubscription: (
    gateway: 'stripe' | 'paypal' | 'solana',
    customPriceId?: string,
    metadata?: SubscriptionActivationMetadata
  ) => Promise<void>;
  onCancelSubscription?: () => Promise<void>;
  onConfigUpdated?: (config: PaymentGatewaysConfig) => void;
  className?: string;
}

export const PaymentGatewaysSettings: React.FC<PaymentGatewaysSettingsProps> = ({
  user,
  platformSubscription,
  onActivateSubscription,
  onConfigUpdated,
  className = ''
}) => {
  const [config, setConfig] = useState<PaymentGatewaysConfig>(getStoredGatewaysConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingPaypal, setIsTestingPaypal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'stripe' | 'paypal' | 'solana'>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Hydrate from Firestore payment_settings/{uid} so config syncs across devices
  useEffect(() => {
    const stored = getStoredGatewaysConfig();
    setConfig(stored);

    if (!user?.uid) return;
    let cancelled = false;

    (async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const snap = await getDoc(doc(db, 'payment_settings', user.uid));
        if (!cancelled && snap.exists()) {
          const remoteConfig = sanitizeGatewaysConfig(snap.data() as Partial<PaymentGatewaysConfig>);
          setConfig(remoteConfig);
          saveStoredGatewaysConfig(remoteConfig);
          if (onConfigUpdated) {
            onConfigUpdated(remoteConfig);
          }
        }
      } catch (err) {
        console.warn('Could not fetch remote payment_settings:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const handleCopy = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success('Copié dans le presse-papier !');
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const validateConfiguration = (cfg: PaymentGatewaysConfig, targetGateway?: 'stripe' | 'paypal' | 'solana'): string | null => {
    if (!cfg.stripeEnabled && !cfg.paypalEnabled && !cfg.cryptoEnabled) {
      return 'Au moins un mode de paiement (Stripe, PayPal ou Crypto) doit rester activé.';
    }

    if ((cfg.paypalEnabled || targetGateway === 'paypal')) {
      if (!cfg.paypalClientId.trim() && !cfg.paypalMerchantEmail.trim()) {
        return 'PayPal : veuillez renseigner un ID Client PayPal ou un email marchand PayPal.';
      }
      if (!cfg.paypalPlanId.trim()) {
        return 'PayPal : veuillez renseigner l\'ID de Plan PayPal (ex: P-5ML4271244454362WXNWU5NQ).';
      }
      if (cfg.paypalMerchantEmail && !isValidEmail(cfg.paypalMerchantEmail)) {
        return 'PayPal : le format de l\'adresse email marchand est invalide.';
      }
    }

    if ((cfg.cryptoEnabled || targetGateway === 'solana')) {
      if (!isValidSolanaAddress(cfg.solanaWalletAddress)) {
        return 'Crypto Solana : l\'adresse du portefeuille Solana doit être au format Base58 valide (32 à 44 caractères, sans 0, O, I ni l).';
      }
      const solPrice = parseFloat(cfg.solanaPriceSol);
      if (isNaN(solPrice) || solPrice <= 0) {
        return 'Crypto Solana : le tarif mensuel en SOL doit être supérieur à 0.';
      }
      if (cfg.evmWalletAddress && !isValidEvmAddress(cfg.evmWalletAddress)) {
        return 'Crypto EVM : l\'adresse EVM (USDC Polygon/Base) doit commencer par 0x suivi de 40 caractères hexadécimaux.';
      }
    }

    if ((cfg.stripeEnabled || targetGateway === 'stripe') && !cfg.stripePriceId.trim()) {
      return 'Stripe : veuillez renseigner l\'ID de prix Stripe (ex: price_...).';
    }

    return null;
  };

  const persistConfigEverywhere = async (cfgToSave: PaymentGatewaysConfig, showSuccessToast = true): Promise<boolean> => {
    const cleanCfg = sanitizeGatewaysConfig({
      ...cfgToSave,
      stripePriceId: cfgToSave.stripePriceId.trim(),
      paypalPlanId: cfgToSave.paypalPlanId.trim(),
      paypalClientId: cfgToSave.paypalClientId.trim(),
      paypalMerchantEmail: cfgToSave.paypalMerchantEmail.trim(),
      solanaWalletAddress: cfgToSave.solanaWalletAddress.trim(),
      evmWalletAddress: cfgToSave.evmWalletAddress.trim(),
    });

    const err = validateConfiguration(cleanCfg);
    if (err) {
      setValidationError(err);
      toast.error(err);
      return false;
    }

    setValidationError(null);
    setConfig(cleanCfg);
    saveStoredGatewaysConfig(cleanCfg);

    if (onConfigUpdated) {
      onConfigUpdated(cleanCfg);
    }

    // Sync to Firestore payment_settings/{uid} and all user locations so CaptivePortal guests get live gateways
    if (user?.uid) {
      try {
        const { doc, setDoc, collection, query, where, getDocs, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');

        await setDoc(
          doc(db, 'payment_settings', user.uid),
          {
            ...cleanCfg,
            userId: user.uid,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        const locQuery = query(collection(db, 'locations'), where('userId', '==', user.uid));
        const locSnap = await getDocs(locQuery);
        await Promise.all(
          locSnap.docs.map((locDoc) =>
            updateDoc(locDoc.ref, {
              paymentGateways: cleanCfg,
              updatedAt: new Date().toISOString(),
            })
          )
        );
      } catch (fsErr) {
        console.warn('Firestore gateway sync warning:', fsErr);
      }
    }

    if (showSuccessToast) {
      toast.success('Modes de paiement PayPal, Crypto & Stripe enregistrés et synchronisés !');
    }
    return true;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await persistConfigEverywhere(config, true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPaypal = async () => {
    const err = validateConfiguration(config, 'paypal');
    if (err) {
      setValidationError(err);
      toast.error(err);
      return;
    }
    setIsTestingPaypal(true);
    try {
      const res = await fetch('/api/paypal/verify-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: config.paypalClientId,
          planId: config.paypalPlanId,
          merchantEmail: config.paypalMerchantEmail,
          mode: config.paypalMode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        toast.success(data.message || `Configuration PayPal (${config.paypalMode.toUpperCase()}) vérifiée avec succès !`);
      } else {
        toast.error(data.error || 'Vérification PayPal échouée.');
      }
    } catch {
      toast.error('Impossible de contacter le serveur de vérification PayPal.');
    } finally {
      setIsTestingPaypal(false);
    }
  };

  const handleResetDefaults = async () => {
    setValidationError(null);
    setConfig(DEFAULT_PAYMENT_GATEWAYS_CONFIG);
    await persistConfigEverywhere(DEFAULT_PAYMENT_GATEWAYS_CONFIG, false);
    toast.info('Paramètres de paiement réinitialisés aux valeurs recommandées.');
  };

  const triggerActivation = async (gateway: 'stripe' | 'paypal' | 'solana') => {
    const err = validateConfiguration(config, gateway);
    if (err) {
      setValidationError(err);
      toast.error(err);
      return;
    }

    setIsActivating(gateway);
    try {
      // Save current edits first so activation always uses latest configured IDs
      const savedOk = await persistConfigEverywhere(config, false);
      if (!savedOk) return;

      let priceIdentifier = config.stripePriceId;
      if (gateway === 'paypal') priceIdentifier = config.paypalPlanId;
      if (gateway === 'solana') priceIdentifier = config.solanaWalletAddress;

      await onActivateSubscription(gateway, priceIdentifier, {
        token: gateway === 'solana' ? 'SOL' : undefined,
      });
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'activation.");
    } finally {
      setIsActivating(null);
    }
  };

  const isSubscribed = platformSubscription?.status === 'active';
  const solanaAddressValid = isValidSolanaAddress(config.solanaWalletAddress);
  const safeQrAddress = solanaAddressValid ? config.solanaWalletAddress : VALID_DEMO_SOLANA_ADDRESS;
  const solanaPayUri = `solana:${safeQrAddress}?amount=${config.solanaPriceSol || '0.35'}&label=WiFiCash%20Business%20Plan&memo=WiFiCash-Sub-${user?.uid?.slice(0, 8) || 'User'}`;

  return (
    <div className={`bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                Configuration des Modes de Paiement
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Configurez et activez <span className="font-semibold text-slate-700 dark:text-slate-200">PayPal</span>, <span className="font-semibold text-slate-700 dark:text-slate-200">Crypto (Solana SOL / USDC)</span> et <span className="font-semibold text-slate-700 dark:text-slate-200">Stripe</span> pour vos portails captifs et votre abonnement.
              </p>
            </div>
          </div>
        </div>

        {/* Current Subscription Status */}
        <div className="flex items-center gap-3 shrink-0">
          {isSubscribed ? (
            <div className="px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Abonnement Actif</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-300">
                  Plan Business · {platformSubscription?.gateway ? platformSubscription.gateway.toUpperCase() : 'PRO'}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Plan Gratuit</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-300">Prêt pour activation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline Validation Error Banner */}
      {validationError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1">
            <p className="font-bold mb-0.5">Erreur de configuration détectée</p>
            <p>{validationError}</p>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-rose-500 hover:underline font-semibold"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          Tous les modes (3)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('paypal')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'paypal'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          <DollarSign size={14} /> PayPal {config.paypalEnabled ? '· Actif' : '· Désactivé'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('solana')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'solana'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          <Coins size={14} /> Crypto (Solana / USDC) {config.cryptoEnabled ? '· Actif' : '· Désactivé'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stripe')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'stripe'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          <CreditCard size={14} /> Stripe CB {config.stripeEnabled ? '· Actif' : '· Désactivé'}
        </button>
      </div>

      {/* Gateway Cards Grid — PayPal & Crypto prioritized */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. PAYPAL GATEWAY */}
        {(activeTab === 'all' || activeTab === 'paypal') && (
          <div className={`bg-slate-50 dark:bg-white/5 border rounded-2xl p-6 flex flex-col justify-between transition-all ${
            config.paypalEnabled ? 'border-blue-500/30 dark:border-blue-400/20' : 'border-slate-200 dark:border-white/10 opacity-75'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">PayPal Express & Plans</h4>
                    <p className="text-xs text-slate-500">Compte PayPal & Cartes sans compte</p>
                  </div>
                </div>

                {/* Enable Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.paypalEnabled}
                  onClick={() => setConfig({ ...config, paypalEnabled: !config.paypalEnabled })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    config.paypalEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-white/20'
                  }`}
                  title={config.paypalEnabled ? 'Désactiver PayPal' : 'Activer PayPal'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      config.paypalEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {/* Environment Mode */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Environnement PayPal
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-black/30 rounded-xl border border-slate-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, paypalMode: 'sandbox' })}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        config.paypalMode === 'sandbox'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Sandbox (Test)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, paypalMode: 'live' })}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        config.paypalMode === 'live'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Live (Production)
                    </button>
                  </div>
                </div>

                {/* PayPal Client ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Client ID PayPal <span className="text-slate-400 font-mono text-[10px]">(VITE_PAYPAL_CLIENT_ID)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(config.paypalClientId, 'paypalClientId')}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      {copiedField === 'paypalClientId' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      Copier
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.paypalClientId}
                    onChange={(e) => setConfig({ ...config, paypalClientId: e.target.value })}
                    placeholder="sb-demo-paypal-client-id"
                    className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* PayPal Plan ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      ID de Plan Abonnement <span className="text-blue-500 font-mono text-[10px]">(VITE_PAYPAL_PLAN_ID)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(config.paypalPlanId, 'paypalPlanId')}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      {copiedField === 'paypalPlanId' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      Copier
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.paypalPlanId}
                    onChange={(e) => setConfig({ ...config, paypalPlanId: e.target.value })}
                    placeholder="P-5ML4271244454362WXNWU5NQ"
                    className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* PayPal Merchant Email */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Marchand PayPal (Portail Captif)
                  </label>
                  <input
                    type="email"
                    value={config.paypalMerchantEmail}
                    onChange={(e) => setConfig({ ...config, paypalMerchantEmail: e.target.value })}
                    placeholder="merchant@votre-etablissement.com"
                    className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/5 space-y-2">
              <button
                type="button"
                onClick={handleTestPaypal}
                disabled={isTestingPaypal}
                className="w-full py-2 px-3 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                {isTestingPaypal ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                Vérifier la configuration PayPal
              </button>

              <button
                type="button"
                onClick={() => triggerActivation('paypal')}
                disabled={isActivating === 'paypal' || !config.paypalEnabled}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {isActivating === 'paypal' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Zap size={14} />
                    Activer l'abonnement via PayPal
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 2. CRYPTO GATEWAY (SOLANA PAY SOL / USDC-SPL / EVM) */}
        {(activeTab === 'all' || activeTab === 'solana') && (
          <div className={`bg-slate-50 dark:bg-white/5 border rounded-2xl p-6 flex flex-col justify-between transition-all ${
            config.cryptoEnabled ? 'border-purple-500/30 dark:border-purple-400/20' : 'border-slate-200 dark:border-white/10 opacity-75'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Coins size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Crypto (Solana & USDC)</h4>
                    <p className="text-xs text-slate-500">SOL, USDC-SPL, Phantom, Solflare, EVM</p>
                  </div>
                </div>

                {/* Enable Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.cryptoEnabled}
                  onClick={() => setConfig({ ...config, cryptoEnabled: !config.cryptoEnabled })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    config.cryptoEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-white/20'
                  }`}
                  title={config.cryptoEnabled ? 'Désactiver Crypto' : 'Activer Crypto'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      config.cryptoEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {/* Solana Wallet Address */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Adresse Wallet Solana (SOL & USDC)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(config.solanaWalletAddress, 'solanaWallet')}
                      className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      {copiedField === 'solanaWallet' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      Copier
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.solanaWalletAddress}
                    onChange={(e) => setConfig({ ...config, solanaWalletAddress: e.target.value.trim() })}
                    placeholder={VALID_DEMO_SOLANA_ADDRESS}
                    className={`w-full bg-white dark:bg-black/30 border rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                      solanaAddressValid
                        ? 'border-slate-200 dark:border-white/10 focus:ring-purple-500'
                        : 'border-rose-400 focus:ring-rose-500'
                    }`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[11px] ${solanaAddressValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      {solanaAddressValid ? 'Format Base58 Solana valide' : 'Adresse Base58 invalide (évitez 0, O, I, l)'}
                    </span>
                    {!solanaAddressValid && (
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, solanaWalletAddress: VALID_DEMO_SOLANA_ADDRESS })}
                        className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                      >
                        Corriger
                      </button>
                    )}
                  </div>
                </div>

                {/* Price SOL & Network */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Abonnement (SOL)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={config.solanaPriceSol}
                      onChange={(e) => setConfig({ ...config, solanaPriceSol: e.target.value })}
                      className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Réseau Solana
                    </label>
                    <select
                      value={config.solanaNetwork}
                      onChange={(e) => setConfig({ ...config, solanaNetwork: e.target.value as 'mainnet' | 'devnet' })}
                      className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="mainnet">Mainnet-Beta</option>
                      <option value="devnet">Devnet (Test)</option>
                    </select>
                  </div>
                </div>

                {/* USDC Stablecoin Toggle & Optional EVM Wallet */}
                <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Accepter aussi <strong className="font-semibold">USDC (Stablecoin)</strong>
                  </span>
                  <input
                    type="checkbox"
                    checked={config.cryptoUsdcEnabled}
                    onChange={(e) => setConfig({ ...config, cryptoUsdcEnabled: e.target.checked })}
                    className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </div>

                {/* Live Solana Pay QR Code Preview */}
                <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/10 flex items-center gap-3">
                  <div className="bg-white p-1.5 rounded-lg shrink-0 shadow-sm">
                    <QRCodeSVG value={solanaPayUri} size={46} level="L" />
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <QrCode size={12} /> Solana Pay QR Prêt ({config.solanaNetwork})
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {config.solanaPriceSol} SOL {config.cryptoUsdcEnabled ? `ou ${config.cryptoUsdcPrice} USDC` : ''} / mois
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/5 space-y-2">
              <button
                type="button"
                onClick={() => triggerActivation('solana')}
                disabled={isActivating === 'solana' || !config.cryptoEnabled}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2"
              >
                {isActivating === 'solana' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Zap size={14} />
                    Activer via Crypto (SOL / USDC)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 3. STRIPE GATEWAY */}
        {(activeTab === 'all' || activeTab === 'stripe') && (
          <div className={`bg-slate-50 dark:bg-white/5 border rounded-2xl p-6 flex flex-col justify-between transition-all ${
            config.stripeEnabled ? 'border-indigo-500/30 dark:border-indigo-400/20' : 'border-slate-200 dark:border-white/10 opacity-75'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Stripe Checkout</h4>
                    <p className="text-xs text-slate-500">Cartes Visa, Mastercard, Apple Pay</p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={config.stripeEnabled}
                  onClick={() => setConfig({ ...config, stripeEnabled: !config.stripeEnabled })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    config.stripeEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-white/20'
                  }`}
                  title={config.stripeEnabled ? 'Désactiver Stripe' : 'Activer Stripe'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      config.stripeEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      ID de Prix Stripe <span className="text-indigo-500 font-mono text-[10px]">(VITE_STRIPE_PRICE_ID)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(config.stripePriceId, 'stripePriceId')}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {copiedField === 'stripePriceId' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      Copier
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.stripePriceId}
                    onChange={(e) => setConfig({ ...config, stripePriceId: e.target.value.trim() })}
                    placeholder="price_1P0XWiFiCashBusiness49"
                    className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Optionnel si vous encaissez uniquement via PayPal et Crypto.
                  </p>
                </div>

                <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Facturation :</span>
                    <span className="font-semibold text-slate-900 dark:text-white">Mensuelle sans engagement</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Montant Business :</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">49,00 € / mois</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/5 space-y-2">
              <button
                type="button"
                onClick={() => triggerActivation('stripe')}
                disabled={isActivating === 'stripe' || !config.stripeEnabled}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {isActivating === 'stripe' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Zap size={14} />
                    Activer l'abonnement via Stripe
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global Bottom Actions */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Globe size={16} className="text-emerald-500 shrink-0" />
          <span>
            Synchronisation temps réel avec vos portails captifs Wi-Fi et votre espace facturation.
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-medium transition-colors"
          >
            Valeurs par défaut
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <CheckCircle2 size={16} />
            )}
            Enregistrer & Synchroniser
          </button>
        </div>
      </div>
    </div>
  );
};
