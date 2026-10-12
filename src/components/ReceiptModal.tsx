import React, { useState } from 'react';
import { Download, Printer, Copy, Check, X, ShieldCheck, Wifi, Sparkles, Building, Calendar, CreditCard, Mail } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { WifiReceipt } from '../types';
import { downloadReceiptPdf, printReceipt, formatCurrency, formatDuration } from '../utils/generateReceiptPdf';
import { useLanguage } from '../contexts/LanguageContext';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: WifiReceipt | null;
}

export function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  const { language, t } = useLanguage();
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen || !receipt) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(receipt.voucherCode);
    setCopiedCode(true);
    toast.success(t('receipt.code_copied'));
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownload = () => {
    try {
      setIsDownloading(true);
      downloadReceiptPdf(receipt, language);
      toast.success(t('portal.receipt_downloaded') || 'Reçu PDF téléchargé avec succès !', {
        description: `Recu-WiFi-${receipt.id}.pdf`,
      });
    } catch (err) {
      console.error('Erreur lors du téléchargement du PDF:', err);
      toast.error(t('portal.receipt_error') || 'Échec de la génération du PDF');
    } finally {
      setTimeout(() => setIsDownloading(false), 600);
    }
  };

  const handlePrint = () => {
    try {
      printReceipt(receipt, language);
    } catch (err) {
      console.error('Erreur d\'impression:', err);
      toast.error(t('receipt.print_error'));
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim()) return;
    setIsSendingEmail(true);
    try {
      // Simulate or call email notification
      await new Promise(resolve => setTimeout(resolve, 800));
      setEmailSent(true);
      toast.success(t('receipt.email_sent'));
    } catch (err) {
      toast.error(t('portal.error_occurred'));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const vatRate = receipt.vatRate !== undefined ? receipt.vatRate : 20;
  const totalTtc = receipt.amount;
  const totalHt = Math.round((totalTtc / (1 + vatRate / 100)) * 100) / 100;
  const vatAmount = Math.round((totalTtc - totalHt) * 100) / 100;
  const currency = receipt.currency || 'EUR';

  const dateLocale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';
  const formattedDate = new Date(receipt.createdAt || Date.now()).toLocaleString(dateLocale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden my-auto max-h-[92vh] flex flex-col z-10"
        >
          {/* Modal Header Actions */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Wifi size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                  {t('receipt.modal_title')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('receipt.modal_subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors border border-slate-200 dark:border-white/10"
                title={t('receipt.print')}
              >
                <Printer size={15} />
                <span>{t('receipt.print')}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                <Download size={15} />
                <span>{isDownloading ? t('receipt.downloading') : t('receipt.download_pdf')}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors ml-1"
                aria-label={t('receipt.close')}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Modal Body / Scrollable Printable Template Preview */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
            {/* The Physical Paper Preview Card */}
            <div 
              id="printable-receipt"
              className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6 text-left relative overflow-hidden"
            >
              {/* Decorative Top Accent Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600"></div>

              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
                    Wi
                  </div>
                  <div>
                    <div className="font-extrabold text-xl tracking-tight text-slate-900">WiFiCash</div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {t('receipt.gateway_tag')}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{t('receipt.paid_badge')}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {t('receipt.ref')} : <span className="font-mono font-bold text-slate-800">{receipt.id}</span>
                  </div>
                </div>
              </div>

              {/* Parties Metadata: Seller & Buyer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building size={13} className="text-indigo-600" /> {t('receipt.seller_header')}
                  </div>
                  <div className="font-bold text-slate-900 text-base">{receipt.locationName}</div>
                  {receipt.locationAddress && (
                    <div className="text-xs text-slate-500">{receipt.locationAddress}</div>
                  )}
                  <div className="text-xs text-slate-600 pt-0.5">
                    {t('receipt.wifi_network')} : <span className="font-semibold text-indigo-600">{receipt.wifiSsid || 'WiFi-Guest'}</span>
                  </div>
                </div>

                <div className="space-y-1 sm:text-right">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center sm:justify-end gap-1.5">
                    <Calendar size={13} className="text-indigo-600" /> {t('receipt.payment_details')}
                  </div>
                  <div className="text-xs text-slate-600">
                    {t('receipt.date')} : <span className="font-semibold text-slate-800">{formattedDate}</span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center sm:justify-end gap-1">
                    <CreditCard size={12} className="text-slate-400" /> {receipt.paymentMethod || t('portal.card_stripe')}
                  </div>
                  {receipt.customerEmail && (
                    <div className="text-xs text-slate-500">
                      {t('receipt.client')} : <span className="font-medium text-slate-700">{receipt.customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Itemized Service Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 sm:px-4">{t('receipt.col_desc')}</th>
                      <th className="py-2.5 px-2 text-center">{t('receipt.col_duration')}</th>
                      <th className="py-2.5 px-2 text-center">{t('receipt.col_qty')}</th>
                      <th className="py-2.5 px-3 text-right">{t('receipt.col_unit_ht')}</th>
                      <th className="py-2.5 px-3 sm:px-4 text-right">{t('receipt.col_total_ttc')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-bold text-slate-900">
                          {t('receipt.plan_item')} - {receipt.planName || 'Internet'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {t('receipt.plan_sub')}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600 font-medium">
                        {formatDuration(receipt.durationMinutes || 60, language)}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600">1</td>
                      <td className="py-3 px-3 text-right text-slate-600 font-mono">
                        {formatCurrency(totalHt, currency)}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(totalTtc, currency)}
                      </td>
                    </tr>
                    {receipt.discountCode && receipt.discountAmount && (
                      <tr className="bg-emerald-50/40 text-emerald-700">
                        <td colSpan={4} className="py-2 px-3 sm:px-4 text-xs font-medium">
                          {t('receipt.discount_applied', { code: receipt.discountCode })}
                        </td>
                        <td className="py-2 px-3 sm:px-4 text-right font-bold font-mono">
                          -{formatCurrency(receipt.discountAmount, currency)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end pt-1">
                <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between py-0.5">
                    <span>{t('receipt.subtotal_ht')} :</span>
                    <span className="font-mono text-slate-800">{formatCurrency(totalHt, currency)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>{t('receipt.vat')} ({vatRate}%) :</span>
                    <span className="font-mono text-slate-800">{formatCurrency(vatAmount, currency)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-sm text-slate-900">
                    <span className="text-indigo-700">{t('receipt.total_paid')} :</span>
                    <span className="font-mono text-indigo-700 text-base">{formatCurrency(totalTtc, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Wi-Fi Access Credentials Voucher Card */}
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles size={14} /> {t('receipt.credentials_title')}
                  </div>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <div className="bg-white border border-indigo-200 px-4 py-2 rounded-xl font-mono text-xl sm:text-2xl font-black text-indigo-900 tracking-widest shadow-sm">
                      {receipt.voucherCode}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="p-2.5 bg-white hover:bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-200 transition-colors shadow-sm"
                      title={t('receipt.code_copied')}
                    >
                      {copiedCode ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                    </button>
                  </div>

                  <p className="text-[11px] text-indigo-900/80">
                    {t('receipt.credentials_help', { ssid: receipt.wifiSsid || 'WiFi-Guest' })}
                  </p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-2.5 rounded-xl border border-indigo-200 shadow-sm shrink-0 flex flex-col items-center">
                  <QRCodeSVG 
                    value={`WIFI:S:${receipt.wifiSsid || 'WiFi-Guest'};T:nopass;;`} 
                    size={72} 
                    level="M" 
                  />
                  <span className="text-[9px] text-slate-500 font-semibold mt-1">{t('receipt.scan_qr')}</span>
                </div>
              </div>

              {/* Legal Note & Accounting Justification */}
              <div className="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100 leading-relaxed">
                <div className="font-semibold text-slate-700 flex items-center gap-1 mb-0.5">
                  <ShieldCheck size={13} className="text-emerald-600" /> {t('receipt.legal_title')}
                </div>
                {t('receipt.legal_body')}
              </div>
            </div>

            {/* Email send option */}
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Mail size={14} className="text-indigo-500" />
                {t('receipt.email_copy_title')}
              </h4>
              {emailSent ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                  <Check size={14} /> {t('receipt.email_sent')}
                </div>
              ) : (
                <form onSubmit={handleSendEmail} className="flex gap-2">
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder={t('receipt.email_placeholder')}
                    className="flex-1 text-xs px-3 py-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isSendingEmail || !guestEmail.trim()}
                    className="px-3.5 py-2 text-xs font-semibold bg-slate-900 dark:bg-indigo-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSendingEmail ? t('receipt.sending') : t('receipt.send')}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {t('receipt.footer_note')}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                {t('receipt.close')}
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <Download size={14} />
                <span>{isDownloading ? t('receipt.downloading') : t('receipt.download_pdf')}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
