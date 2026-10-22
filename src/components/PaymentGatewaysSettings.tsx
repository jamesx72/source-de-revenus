import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Coins, ShieldCheck, CheckCircle2, Copy, Check, 
  ExternalLink, Zap, RefreshCw, AlertCircle, Info, Sparkles, 
  QrCode, ArrowRight, DollarSign, Wallet, Lock, Layers
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

export interface PaymentGatewaysConfig {
  stripePriceId: string;
  paypalPlanId: string;
  paypalClientId: string;
  solanaWalletAddress: string;
  solanaPriceSol: string;
  solanaNetwork: 'mainnet' | 'devnet';
}

export const DEFAULT_PAYMENT_GATEWAYS_CONFIG: PaymentGatewaysConfig = {
  stripePriceId: (import.meta as any).env?.VITE_STRIPE_PRICE_ID || 'price_1P0XWiFiCashBusiness49',
  paypalPlanId: (import.meta as any).env?.VITE_PAYPAL_PLAN_ID || 'P-5ML4271244454362WXNWU5NQ',
  paypalClientId: (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID || 'sb-demo-paypal-client-id',
  solanaWalletAddress: (import.meta as any).env?.VITE_SOLANA_WALLET_ADDRESS || '7XwPz4WiFiCashMerchantHubSolanaNetworkAddress9',
  solanaPriceSol: (import.meta as any).env?.VITE_SOLANA_PRICE_SOL || '0.35',
  solanaNetwork: 'mainnet'
};

const STORAGE_KEY = 'wificash_payment_gateways_v1';

export function getStoredGatewaysConfig(): PaymentGatewaysConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PAYMENT_GATEWAYS_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Error reading stored payment gateways config:', e);
  }
  return DEFAULT_PAYMENT_GATEWAYS_CONFIG;
}

export function saveStoredGatewaysConfig(config: PaymentGatewaysConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Error saving payment gateways config to localStorage:', e);
  }
}

interface PaymentGatewaysSettingsProps {
  user: any;
  platformSubscription: any;
  onActivateSubscription: (gateway: 'stripe' | 'paypal' | 'solana', customPriceId?: string) => Promise<void>;
  onCancelSubscription?: () => Promise<void>;
  onConfigUpdated?: (config: PaymentGatewaysConfig) => void;
  className?: string;
}

export const PaymentGatewaysSettings: React.FC<PaymentGatewaysSettingsProps> = ({
  user,
  platformSubscription,
  onActivateSubscription,
  onCancelSubscription,
  onConfigUpdated,
  className = ''
}) => {
  const [config, setConfig] = useState<PaymentGatewaysConfig>(getStoredGatewaysConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'stripe' | 'paypal' | 'solana'>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredGatewaysConfig();
    setConfig(stored);
  }, []);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success('Copié dans le presse-papier !');
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      saveStoredGatewaysConfig(config);
      if (onConfigUpdated) {
        onConfigUpdated(config);
      }
      toast.success('Identifiants des passerelles enregistrés avec succès !');
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_PAYMENT_GATEWAYS_CONFIG);
    saveStoredGatewaysConfig(DEFAULT_PAYMENT_GATEWAYS_CONFIG);
    if (onConfigUpdated) {
      onConfigUpdated(DEFAULT_PAYMENT_GATEWAYS_CONFIG);
    }
    toast.info('Identifiants réinitialisés aux valeurs par défaut.');
  };

  const triggerActivation = async (gateway: 'stripe' | 'paypal' | 'solana') => {
    setIsActivating(gateway);
    try {
      let priceIdentifier = config.stripePriceId;
      if (gateway === 'paypal') priceIdentifier = config.paypalPlanId;
      if (gateway === 'solana') priceIdentifier = config.solanaWalletAddress;

      await onActivateSubscription(gateway, priceIdentifier);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'activation.');
    } finally {
      setIsActivating(null);
    }
  };

  const isSubscribed = platformSubscription?.status === 'active';
  const solanaPayUri = `solana:${config.solanaWalletAddress}?amount=${config.solanaPriceSol}&label=WiFiCash%20Business%20Plan&memo=WiFiCash-Sub-${user?.uid?.slice(0, 8) || 'User'}`;

  return (
    <div className={`bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                Passerelles de Paiement & ID d'Abonnement
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium">
                  Stripe · PayPal · Solana
                </span>
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Configurez l'ID de prix Stripe (<code className="text-xs font-mono bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded">VITE_STRIPE_PRICE_ID</code>), le plan PayPal et votre adresse Solana Crypto pour activer l'abonnement.
              </p>
            </div>
          </div>
        </div>

        {/* Current Subscription Status Badge */}
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <div className="px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Abonnement Actif</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-300">
                  Plan Business ({platformSubscription?.gateway ? platformSubscription.gateway.toUpperCase() : 'PRO'})
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Plan Gratuit</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-300">Abonnement Business inactif</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          Toutes les passerelles (3)
        </button>
        <button
          onClick={() => setActiveTab('stripe')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'stripe'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          <CreditCard size={13} /> Stripe (CB)
        </button>
        <button
          onClick={() => setActiveTab('paypal')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'paypal'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          <DollarSign size={13} /> PayPal
        </button>
        <button
          onClick={() => setActiveTab('solana')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'solana'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          <Coins size={13} /> Crypto Solana
        </button>
      </div>

      {/* Gateway Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. STRIPE GATEWAY */}
        {(activeTab === 'all' || activeTab === 'stripe') && (
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Stripe Checkout</h4>
                    <p className="text-xs text-slate-500">Cartes Bancaires, Visa, Mastercard</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Prêt
                </span>
              </div>

              {/* Stripe Price ID input */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
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
                    className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Tarif récurrent pour le Plan Business (49,00 € / mois HT).
                  </p>
                </div>

                <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Mode de facturation :</span>
                    <span className="font-semibold text-slate-900 dark:text-white">Abonnement mensuel</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mt-1">
                    <span>Montant :</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">49,00 € / mois</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/5 space-y-2">
              <button
                type="button"
                onClick={() => triggerActivation('stripe')}
                disabled={isActivating === 'stripe'}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
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

        {/* 2. PAYPAL GATEWAY */}
        {(activeTab === 'all' || activeTab === 'paypal') && (
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">PayPal Subscriptions</h4>
                    <p className="text-xs text-slate-500">Portefeuille PayPal & Cartes</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Configuré
                </span>
              </div>

              {/* PayPal Plan ID & Client ID */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      ID de Plan PayPal <span className="text-blue-500 font-mono text-[10px]">(VITE_PAYPAL_PLAN_ID)</span>
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
                    onChange={(e) => setConfig({ ...config, paypalPlanId: e.target.value.trim() })}
                    placeholder="P-5ML4271244454362WXNWU5NQ"
                    className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    ID Client PayPal <span className="text-slate-400 font-mono text-[10px]">(VITE_PAYPAL_CLIENT_ID)</span>
                  </label>
                  <input
                    type="text"
                    value={config.paypalClientId}
                    onChange={(e) => setConfig({ ...config, paypalClientId: e.target.value.trim() })}
                    placeholder="sb-demo-paypal-client-id"
                    className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Plan d'abonnement récurrent PayPal (49,00 € / mois).
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/5 space-y-2">
              <button
                type="button"
                onClick={() => triggerActivation('paypal')}
                disabled={isActivating === 'paypal'}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
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

        {/* 3. SOLANA CRYPTO GATEWAY */}
        {(activeTab === 'all' || activeTab === 'solana') && (
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Coins size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Crypto Solana Pay</h4>
                    <p className="text-xs text-slate-500">SOL, USDC-SPL, Phantom, Solflare</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Instant
                </span>
              </div>

              {/* Solana Wallet & Price in SOL */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      Adresse Wallet Solana <span className="text-purple-500 font-mono text-[10px]">(SOL Récepteur)</span>
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
                    placeholder="7XwPz4WiFiCashMerchantHubSolanaNetworkAddress9"
                    className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-inner truncate"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Tarif mensuel (SOL)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={config.solanaPriceSol}
                      onChange={(e) => setConfig({ ...config, solanaPriceSol: e.target.value })}
                      className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Réseau Solana
                    </label>
                    <select
                      value={config.solanaNetwork}
                      onChange={(e) => setConfig({ ...config, solanaNetwork: e.target.value as any })}
                      className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    >
                      <option value="mainnet">Mainnet-Beta</option>
                      <option value="devnet">Devnet (Test)</option>
                    </select>
                  </div>
                </div>

                {/* Solana Pay QR Code preview snippet */}
                <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/10 flex items-center gap-3">
                  <div className="bg-white p-1 rounded-lg shrink-0 shadow-sm">
                    <QRCodeSVG value={solanaPayUri} size={44} level="L" />
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <QrCode size={12} /> Solana Pay QR Code Actif
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {config.solanaPriceSol} SOL (~49 €) par mois
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/5 space-y-2">
              <button
                type="button"
                onClick={() => triggerActivation('solana')}
                disabled={isActivating === 'solana'}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2"
              >
                {isActivating === 'solana' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Zap size={14} />
                    Activer l'abonnement via Solana Crypto
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
          <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
          <span>
            Les identifiants sont synchronisés en mémoire et vérifiés lors du passage au plan Business.
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-medium transition-colors"
          >
            Rétablir les identifiants par défaut
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <CheckCircle2 size={16} />
            )}
            Enregistrer les paramètres
          </button>
        </div>
      </div>
    </div>
  );
};
