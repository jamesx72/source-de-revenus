import React, { useState, useEffect } from 'react';
import { 
  X, CreditCard, DollarSign, Coins, CheckCircle2, Copy, 
  Check, ShieldCheck, Zap, AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { 
  PaymentGatewaysConfig, 
  SubscriptionActivationMetadata,
  getStoredGatewaysConfig,
  isValidSolanaAddress,
  VALID_DEMO_SOLANA_ADDRESS
} from './PaymentGatewaysSettings';

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: (
    gateway: 'stripe' | 'paypal' | 'solana',
    priceId: string,
    metadata?: SubscriptionActivationMetadata
  ) => Promise<void>;
  initialGateway?: 'stripe' | 'paypal' | 'solana';
}

const USDC_SPL_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
  initialGateway = 'paypal'
}) => {
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'paypal' | 'solana'>(initialGateway);
  const [gatewaysConfig, setGatewaysConfig] = useState<PaymentGatewaysConfig>(getStoredGatewaysConfig);
  const [selectedCryptoToken, setSelectedCryptoToken] = useState<'SOL' | 'USDC'>('SOL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [solanaTxHash, setSolanaTxHash] = useState('');
  const [paypalOrderRef, setPaypalOrderRef] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Sync latest stored config & selected gateway whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      const fresh = getStoredGatewaysConfig();
      setGatewaysConfig(fresh);
      setModalError(null);
      setPaypalOrderRef(null);
      setSolanaTxHash('');

      // Respect initialGateway if enabled, else pick first enabled gateway
      if (initialGateway === 'paypal' && fresh.paypalEnabled !== false) {
        setSelectedGateway('paypal');
      } else if (initialGateway === 'solana' && fresh.cryptoEnabled !== false) {
        setSelectedGateway('solana');
      } else if (initialGateway === 'stripe' && fresh.stripeEnabled !== false) {
        setSelectedGateway('stripe');
      } else if (fresh.paypalEnabled !== false) {
        setSelectedGateway('paypal');
      } else if (fresh.cryptoEnabled !== false) {
        setSelectedGateway('solana');
      } else {
        setSelectedGateway('stripe');
      }
    }
  }, [isOpen, initialGateway]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copié dans le presse-papier !`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmSubscription = async () => {
    setModalError(null);
    setIsProcessing(true);

    try {
      if (selectedGateway === 'paypal') {
        if (!gatewaysConfig.paypalPlanId.trim()) {
          throw new Error("Veuillez configurer l'ID de Plan PayPal dans les paramètres.");
        }

        // Create & capture PayPal subscription/order via server route
        let orderId = paypalOrderRef;
        if (!orderId) {
          const createRes = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: '49.00',
              currency: 'EUR',
              planId: gatewaysConfig.paypalPlanId,
              clientId: gatewaysConfig.paypalClientId,
              merchantEmail: gatewaysConfig.paypalMerchantEmail,
              mode: gatewaysConfig.paypalMode,
              description: 'WiFiCash Plan Business Pro (Mensuel)',
            }),
          });
          const createData = await createRes.json();
          if (!createRes.ok) {
            throw new Error(createData.error || 'Impossible d\'initialiser la commande PayPal.');
          }
          orderId = createData.orderId;
          setPaypalOrderRef(orderId);
        }

        const captureRes = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            mode: gatewaysConfig.paypalMode,
            clientId: gatewaysConfig.paypalClientId,
          }),
        });
        const captureData = await captureRes.json();
        if (!captureRes.ok) {
          throw new Error(captureData.error || 'La validation PayPal a échoué.');
        }

        await onSuccess('paypal', gatewaysConfig.paypalPlanId, {
          paypalOrderId: captureData.orderId || orderId || undefined,
        });
        onClose();
        return;
      }

      if (selectedGateway === 'solana') {
        if (!isValidSolanaAddress(gatewaysConfig.solanaWalletAddress)) {
          throw new Error("L'adresse Solana configurée n'est pas au format Base58 valide.");
        }

        const cryptoAmount = selectedCryptoToken === 'USDC'
          ? (gatewaysConfig.cryptoUsdcPrice || '49.00')
          : (gatewaysConfig.solanaPriceSol || '0.35');

        const verifyRes = await fetch('/api/crypto/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: gatewaysConfig.solanaWalletAddress,
            amount: cryptoAmount,
            token: selectedCryptoToken,
            network: gatewaysConfig.solanaNetwork,
            txHash: solanaTxHash.trim() || undefined,
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyData.error || 'La vérification du paiement Crypto a échoué.');
        }

        await onSuccess('solana', gatewaysConfig.solanaWalletAddress, {
          txHash: verifyData.reference || solanaTxHash.trim() || undefined,
          token: selectedCryptoToken,
        });
        onClose();
        return;
      }

      // Stripe activation
      await onSuccess('stripe', gatewaysConfig.stripePriceId);
      onClose();
    } catch (err: any) {
      const msg = err.message || "Erreur lors de l'activation de l'abonnement.";
      setModalError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const safeWallet = isValidSolanaAddress(gatewaysConfig.solanaWalletAddress)
    ? gatewaysConfig.solanaWalletAddress
    : VALID_DEMO_SOLANA_ADDRESS;

  const activeCryptoAmount = selectedCryptoToken === 'USDC'
    ? (gatewaysConfig.cryptoUsdcPrice || '49.00')
    : (gatewaysConfig.solanaPriceSol || '0.35');

  const solanaPayUri = selectedCryptoToken === 'USDC'
    ? `solana:${safeWallet}?amount=${activeCryptoAmount}&spl-token=${USDC_SPL_MINT}&label=WiFiCash%20Business%20Plan&memo=WiFiCash-${user?.uid?.slice(0, 6) || 'Sub'}`
    : `solana:${safeWallet}?amount=${activeCryptoAmount}&label=WiFiCash%20Business%20Plan&memo=WiFiCash-${user?.uid?.slice(0, 6) || 'Sub'}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-white/10 relative z-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
              Plan Business Pro
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Activer votre Abonnement
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tarif : <span className="font-bold text-slate-900 dark:text-white">49,00 € / mois HT</span> · Sans engagement
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {modalError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
            <span>{modalError}</span>
          </div>
        )}

        {/* Gateway Selection Tabs */}
        <div className="my-5 relative z-10">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
            Choisissez votre mode de paiement
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* PayPal */}
            <button
              type="button"
              onClick={() => { setSelectedGateway('paypal'); setModalError(null); }}
              disabled={gatewaysConfig.paypalEnabled === false}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all text-center disabled:opacity-40 ${
                selectedGateway === 'paypal'
                  ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <DollarSign size={20} />
              <span className="text-xs font-bold">PayPal</span>
              <span className="text-[10px] opacity-75">Express / Plan</span>
            </button>

            {/* Crypto Solana / USDC */}
            <button
              type="button"
              onClick={() => { setSelectedGateway('solana'); setModalError(null); }}
              disabled={gatewaysConfig.cryptoEnabled === false}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all text-center disabled:opacity-40 ${
                selectedGateway === 'solana'
                  ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <Coins size={20} />
              <span className="text-xs font-bold">Crypto</span>
              <span className="text-[10px] opacity-75">SOL · USDC</span>
            </button>

            {/* Stripe */}
            <button
              type="button"
              onClick={() => { setSelectedGateway('stripe'); setModalError(null); }}
              disabled={gatewaysConfig.stripeEnabled === false}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all text-center disabled:opacity-40 ${
                selectedGateway === 'stripe'
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <CreditCard size={20} />
              <span className="text-xs font-bold">Stripe</span>
              <span className="text-[10px] opacity-75">Carte CB</span>
            </button>
          </div>
        </div>

        {/* Selected Gateway Detail Panel */}
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 mb-5 relative z-10">
          {selectedGateway === 'paypal' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Mode sélectionné</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <DollarSign size={13} /> PayPal ({gatewaysConfig.paypalMode === 'live' ? 'Live' : 'Sandbox'})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">ID de Plan PayPal</span>
                <code className="font-mono bg-white dark:bg-black/30 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 text-[11px] text-slate-800 dark:text-slate-200">
                  {gatewaysConfig.paypalPlanId}
                </code>
              </div>
              {gatewaysConfig.paypalMerchantEmail && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Compte Marchand</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{gatewaysConfig.paypalMerchantEmail}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-white/10">
                <span className="text-slate-500">Total mensuel</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">49,00 € / mois</span>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <span>Paiement PayPal sécurisé sans redirection bloquante. Activation immédiate de toutes les fonctionnalités Business.</span>
              </div>
            </div>
          )}

          {selectedGateway === 'solana' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Jeton Crypto</span>
                <div className="flex items-center gap-1 bg-white dark:bg-black/30 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedCryptoToken('SOL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      selectedCryptoToken === 'SOL'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    SOL
                  </button>
                  {gatewaysConfig.cryptoUsdcEnabled !== false && (
                    <button
                      type="button"
                      onClick={() => setSelectedCryptoToken('USDC')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        selectedCryptoToken === 'USDC'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      USDC (SPL)
                    </button>
                  )}
                </div>
              </div>

              {/* Solana QR Code and Address */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-black/30 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
                  <QRCodeSVG value={solanaPayUri} size={104} level="M" />
                </div>
                <div className="flex-1 w-full text-left space-y-2">
                  <p className="text-xs text-slate-500">
                    Scannez avec Phantom / Solflare ({gatewaysConfig.solanaNetwork}) ou envoyez vers :
                  </p>
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-200 dark:border-white/10 font-mono text-[11px] text-slate-900 dark:text-white overflow-hidden">
                    <span className="truncate flex-1">{safeWallet}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(safeWallet, 'Adresse Solana')}
                      className="p-1 hover:text-purple-500 text-slate-400 shrink-0"
                    >
                      {copiedField === 'Adresse Solana' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Montant à envoyer :</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeCryptoAmount, 'Montant')}
                      className="font-bold text-purple-600 dark:text-purple-400 font-mono flex items-center gap-1 hover:underline"
                    >
                      <span>{activeCryptoAmount} {selectedCryptoToken}</span>
                      {copiedField === 'Montant' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tx Hash optional field */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Signature de transaction Solana (optionnel — vérifiée sur RPC si fournie)
                </label>
                <input
                  type="text"
                  value={solanaTxHash}
                  onChange={(e) => setSolanaTxHash(e.target.value)}
                  placeholder="Ex: 5r7kH8... (Optionnel)"
                  className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {selectedGateway === 'stripe' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Mode sélectionné</span>
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
                <span>Paiement par carte bancaire avec renouvellement mensuel automatique.</span>
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
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> PayPal, Crypto & Vouchers
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> Factures PDF & Analytics
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
            className={`flex-1 py-3 px-4 rounded-2xl text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
              selectedGateway === 'stripe'
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                : selectedGateway === 'paypal'
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
            }`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Zap size={16} />
                {selectedGateway === 'paypal'
                  ? 'Payer 49,00 € via PayPal'
                  : selectedGateway === 'solana'
                  ? `Valider ${activeCryptoAmount} ${selectedCryptoToken}`
                  : 'Activer via Stripe (49€)'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
