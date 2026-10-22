import React, { useState } from 'react';
import { 
  X, CreditCard, DollarSign, Coins, CheckCircle2, Copy, 
  Check, ExternalLink, ShieldCheck, Zap, Sparkles, ArrowRight,
  QrCode, AlertCircle, RefreshCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { PaymentGatewaysConfig, getStoredGatewaysConfig } from './PaymentGatewaysSettings';

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: (gateway: 'stripe' | 'paypal' | 'solana', priceId: string) => Promise<void>;
  initialGateway?: 'stripe' | 'paypal' | 'solana';
}

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
  initialGateway = 'stripe'
}) => {
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'paypal' | 'solana'>(initialGateway);
  const [gatewaysConfig, setGatewaysConfig] = useState<PaymentGatewaysConfig>(getStoredGatewaysConfig);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [solanaTxHash, setSolanaTxHash] = useState('');

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Adresse copiée dans le presse-papier !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmSubscription = async () => {
    setIsProcessing(true);
    try {
      let identifier = gatewaysConfig.stripePriceId;
      if (selectedGateway === 'paypal') identifier = gatewaysConfig.paypalPlanId;
      if (selectedGateway === 'solana') identifier = gatewaysConfig.solanaWalletAddress;

      await onSuccess(selectedGateway, identifier);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'activation de l\'abonnement.');
    } finally {
      setIsProcessing(false);
    }
  };

  const solanaPayUri = `solana:${gatewaysConfig.solanaWalletAddress}?amount=${gatewaysConfig.solanaPriceSol}&label=WiFiCash%20Business%20Plan&memo=WiFiCash-${user?.uid?.slice(0, 6) || 'Sub'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-white/10 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={12} /> Passer au Plan Business Pro
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Activer l'Abonnement
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tarif : <span className="font-bold text-slate-900 dark:text-white">49,00 € / mois HT</span> · Sans engagement
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Gateway Selection Tabs */}
        <div className="my-5 relative z-10">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
            Choisissez votre passerelle de paiement
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Stripe */}
            <button
              type="button"
              onClick={() => setSelectedGateway('stripe')}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                selectedGateway === 'stripe'
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <CreditCard size={20} />
              <span className="text-xs font-bold">Stripe</span>
              <span className="text-[10px] opacity-75">Carte CB</span>
            </button>

            {/* PayPal */}
            <button
              type="button"
              onClick={() => setSelectedGateway('paypal')}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                selectedGateway === 'paypal'
                  ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <DollarSign size={20} />
              <span className="text-xs font-bold">PayPal</span>
              <span className="text-[10px] opacity-75">Plan Récurrent</span>
            </button>

            {/* Solana */}
            <button
              type="button"
              onClick={() => setSelectedGateway('solana')}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                selectedGateway === 'solana'
                  ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <Coins size={20} />
              <span className="text-xs font-bold">Solana</span>
              <span className="text-[10px] opacity-75">SOL Crypto</span>
            </button>
          </div>
        </div>

        {/* Selected Gateway Detail Panel */}
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 mb-5 relative z-10">
          {selectedGateway === 'stripe' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Méthode</span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <CreditCard size={13} /> Stripe Checkout CB
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">ID de prix configuré</span>
                <code className="font-mono bg-white dark:bg-black/30 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 text-[11px] text-slate-800 dark:text-slate-200">
                  {gatewaysConfig.stripePriceId}
                </code>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Montant</span>
                <span className="font-bold text-slate-900 dark:text-white">49,00 € / mois</span>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <span>Paiement sécurisé avec renouvellement automatique et factures téléchargeables.</span>
              </div>
            </div>
          )}

          {selectedGateway === 'paypal' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Méthode</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <DollarSign size={13} /> Abonnement PayPal
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">ID de Plan PayPal</span>
                <code className="font-mono bg-white dark:bg-black/30 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 text-[11px] text-slate-800 dark:text-slate-200">
                  {gatewaysConfig.paypalPlanId}
                </code>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Tarif récurrent</span>
                <span className="font-bold text-slate-900 dark:text-white">49,00 € / mois</span>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <span>Synchronisé avec PayPal Subscriptions. Débit mensuel automatique sans interruption.</span>
              </div>
            </div>
          )}

          {selectedGateway === 'solana' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Méthode</span>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <Coins size={13} /> Solana Pay (SOL Crypto)
                </span>
              </div>

              {/* Solana QR Code and Address */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-black/30 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
                  <QRCodeSVG value={solanaPayUri} size={96} level="M" />
                </div>
                <div className="flex-1 w-full text-left">
                  <p className="text-xs text-slate-500 mb-1">Scannez via Phantom / Solflare ou envoyez à :</p>
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-200 dark:border-white/10 font-mono text-[11px] text-slate-900 dark:text-white overflow-hidden mb-2">
                    <span className="truncate flex-1">{gatewaysConfig.solanaWalletAddress}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(gatewaysConfig.solanaWalletAddress)}
                      className="p-1 hover:text-indigo-500 text-slate-400 shrink-0"
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Montant exact :</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">
                      {gatewaysConfig.solanaPriceSol} SOL (~49 €)
                    </span>
                  </div>
                </div>
              </div>

              {/* Tx Hash optional field */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Signature / Hash de transaction Solana (optionnel)
                </label>
                <input
                  type="text"
                  value={solanaTxHash}
                  onChange={(e) => setSolanaTxHash(e.target.value)}
                  placeholder="Ex: 5r7kH8... (Optionnel pour validation immédiate)"
                  className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Benefits list reminder */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 mb-6">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> Routeurs & AP illimités
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> Utilisateurs illimités
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> Vouchers & Monétisation
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> Support prioritaire 24/7
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Annuler
          </button>
          
          <button
            type="button"
            onClick={handleConfirmSubscription}
            disabled={isProcessing}
            className={`flex-1 py-3 rounded-2xl text-white font-bold text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
              selectedGateway === 'stripe'
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                : selectedGateway === 'paypal'
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
            }`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Zap size={16} />
                Activer l'Abonnement (49€)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
