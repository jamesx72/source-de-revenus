import { jsPDF } from 'jspdf';
import { WifiReceipt } from '../types';

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const symbol = currency.toUpperCase() === 'USD' ? '$' : currency.toUpperCase() === 'GBP' ? '£' : '€';
  return `${amount.toFixed(2)} ${symbol}`;
}

export function formatDuration(minutes: number, lang: 'fr' | 'en' | 'es' = 'fr'): string {
  if (lang === 'en') {
    if (minutes >= 1440) {
      const days = Math.round(minutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} (${minutes / 60}h)`;
    }
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${minutes} minutes`;
  }

  if (lang === 'es') {
    if (minutes >= 1440) {
      const days = Math.round(minutes / 1440);
      return `${days} día${days > 1 ? 's' : ''} (${minutes / 60}h)`;
    }
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours} hora${hours > 1 ? 's' : ''}`;
    }
    return `${minutes} minutos`;
  }

  // French default
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440);
    return `${days} jour${days > 1 ? 's' : ''} (${minutes / 60}h)`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours} heure${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} minutes`;
}

interface I18nReceiptLabels {
  subtitle: string;
  title: string;
  paidBadge: string;
  vendorHeader: string;
  networkSsid: string;
  paymentDetails: string;
  receiptNumber: string;
  dateTime: string;
  paymentMethod: string;
  client: string;
  serviceDesc: string;
  duration: string;
  qty: string;
  unitPrice: string;
  totalTtc: string;
  planSubtitle: string;
  discount: string;
  subtotalHt: string;
  vat: string;
  totalDue: string;
  fastAccessBoxTitle: string;
  fastAccessBoxSub: string;
  wifiAccessCode: string;
  quickGuideTitle: string;
  step1: string;
  step2: string;
  step3: string;
  validityReminder: string;
  legalHeader: string;
  legalLine1: string;
  legalLine2: string;
  legalLine3: string;
  footerBrand: string;
  pageInfo: string;
}

const PDF_TRANSLATIONS: Record<'fr' | 'en' | 'es', I18nReceiptLabels> = {
  fr: {
    subtitle: "PASSERELLE D'ACCÈS INTERNET SÉCURISÉE",
    title: "REÇU DE PAIEMENT",
    paidBadge: "✓  PAYÉ",
    vendorHeader: "ÉTABLISSEMENT / VENDEUR",
    networkSsid: "Réseau Wi-Fi (SSID) :",
    paymentDetails: "DÉTAILS DU RÈGLEMENT",
    receiptNumber: "N° Reçu :",
    dateTime: "Date & Heure :",
    paymentMethod: "Règlement :",
    client: "Client :",
    serviceDesc: "DESCRIPTION DU SERVICE",
    duration: "DURÉE",
    qty: "QTÉ",
    unitPrice: "P.U. HT",
    totalTtc: "TOTAL TTC",
    planSubtitle: "Connexion haute vitesse sécurisée sans interruption",
    discount: "Remise appliquée (Code promo: {code})",
    subtotalHt: "Sous-total HT :",
    vat: "TVA ({rate}%) :",
    totalDue: "TOTAL RÉGLÉ TTC :",
    fastAccessBoxTitle: "VOS IDENTIFIANTS D'ACCÈS WI-FI",
    fastAccessBoxSub: "À conserver pour connecter vos équipements ou en cas de reconnexion",
    wifiAccessCode: "CODE D'ACCÈS WI-FI",
    quickGuideTitle: "Instructions de connexion rapide :",
    step1: "1. Connectez votre appareil au réseau : \"{ssid}\"",
    step2: "2. Ouvrez le navigateur ou appuyez sur la notification de connexion",
    step3: "3. Saisissez votre code d'accès pour commencer à naviguer",
    validityReminder: "* Accès valable pour une durée de {duration} dès la première connexion.",
    legalHeader: "INFORMATIONS & JUSTIFICATIF DE FRAIS",
    legalLine1: "Ce reçu atteste du règlement d'un service d'accès aux télécommunications par le portail WiFiCash.",
    legalLine2: "Il constitue un justificatif officiel pour votre comptabilité et le remboursement de vos notes de frais.",
    legalLine3: "Pour toute assistance technique, veuillez contacter le gestionnaire de l'établissement ou support@wificash.io.",
    footerBrand: "WiFiCash Cloud Services • Système de portail captif sécurisé certifié • Document dématérialisé",
    pageInfo: "Émis le {date} • Page 1/1"
  },
  en: {
    subtitle: "SECURE INTERNET GATEWAY & CAPTIVE PORTAL",
    title: "PAYMENT RECEIPT",
    paidBadge: "✓  PAID",
    vendorHeader: "ESTABLISHMENT / VENDOR",
    networkSsid: "Wi-Fi Network (SSID):",
    paymentDetails: "PAYMENT DETAILS",
    receiptNumber: "Receipt No:",
    dateTime: "Date & Time:",
    paymentMethod: "Payment:",
    client: "Customer:",
    serviceDesc: "SERVICE DESCRIPTION",
    duration: "DURATION",
    qty: "QTY",
    unitPrice: "UNIT PRICE",
    totalTtc: "TOTAL INCL. VAT",
    planSubtitle: "High-speed secure connection with zero interruptions",
    discount: "Discount applied (Promo code: {code})",
    subtotalHt: "Subtotal excl. VAT:",
    vat: "VAT ({rate}%):",
    totalDue: "TOTAL PAID INCL. VAT:",
    fastAccessBoxTitle: "YOUR WI-FI ACCESS CREDENTIALS",
    fastAccessBoxSub: "Keep this to connect your devices or in case of reconnection",
    wifiAccessCode: "WI-FI ACCESS CODE",
    quickGuideTitle: "Quick connection instructions:",
    step1: "1. Connect your device to network: \"{ssid}\"",
    step2: "2. Open your browser or tap the Wi-Fi sign-in notification",
    step3: "3. Enter your access code to start browsing",
    validityReminder: "* Access valid for a duration of {duration} starting upon first connection.",
    legalHeader: "OFFICIAL RECEIPT & EXPENSE REPORT DOCUMENT",
    legalLine1: "This receipt certifies the payment for Wi-Fi telecommunications services through WiFiCash.",
    legalLine2: "It serves as an official proof of expense for corporate accounting and tax reimbursement.",
    legalLine3: "For technical support, contact the establishment desk or support@wificash.io.",
    footerBrand: "WiFiCash Cloud Services • Certified Secure Captive Portal System • Digital Document",
    pageInfo: "Issued on {date} • Page 1/1"
  },
  es: {
    subtitle: "PASARELA DE ACCESO A INTERNET SEGURO",
    title: "RECIBO DE PAGO",
    paidBadge: "✓  PAGADO",
    vendorHeader: "ESTABLECIMIENTO / VENDEDOR",
    networkSsid: "Red Wi-Fi (SSID):",
    paymentDetails: "DETALLES DEL PAGO",
    receiptNumber: "N° Recibo:",
    dateTime: "Fecha y hora:",
    paymentMethod: "Método de pago:",
    client: "Cliente:",
    serviceDesc: "DESCRIPCIÓN DEL SERVICIO",
    duration: "DURACIÓN",
    qty: "CANT",
    unitPrice: "PRECIO UNIT.",
    totalTtc: "TOTAL CON IVA",
    planSubtitle: "Conexión de alta velocidad segura y sin interrupciones",
    discount: "Descuento aplicado (Código promo: {code})",
    subtotalHt: "Subtotal sin IVA:",
    vat: "IVA ({rate}%):",
    totalDue: "TOTAL PAGADO:",
    fastAccessBoxTitle: "SUS CREDENCIALES DE ACCESO WI-FI",
    fastAccessBoxSub: "Guarde este código para conectar sus dispositivos o al reconectarse",
    wifiAccessCode: "CÓDIGO DE ACCESO WI-FI",
    quickGuideTitle: "Instrucciones de conexión rápida:",
    step1: "1. Conecte su dispositivo a la red: \"{ssid}\"",
    step2: "2. Abra el navegador o toque la notificación de inicio de sesión",
    step3: "3. Introduzca su código de acceso para comenzar a navegar",
    validityReminder: "* Acceso válido durante {duration} a partir de la primera conexión.",
    legalHeader: "INFORMACIÓN Y JUSTIFICANTE DE GASTOS",
    legalLine1: "Este recibo acredita el pago de un servicio de acceso a telecomunicaciones por WiFiCash.",
    legalLine2: "Constituye un comprobante oficial para su contabilidad y el reembolso de gastos.",
    legalLine3: "Para asistencia técnica, contacte con la recepción o soporte en support@wificash.io.",
    footerBrand: "WiFiCash Cloud Services • Sistema de portal cautivo certificado • Documento digital",
    pageInfo: "Emitido el {date} • Página 1/1"
  }
};

export function generateReceiptPdf(receipt: WifiReceipt, language?: 'fr' | 'en' | 'es'): jsPDF {
  // Determine language: explicit argument or fallback to localStorage
  let lang: 'fr' | 'en' | 'es' = language || 'fr';
  if (!language && typeof window !== 'undefined') {
    const saved = localStorage.getItem('language');
    if (saved === 'en' || saved === 'es' || saved === 'fr') {
      lang = saved;
    }
  }

  const t = PDF_TRANSLATIONS[lang] || PDF_TRANSLATIONS.fr;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor: [number, number, number] = [30, 41, 59]; // slate-800
  const accentColor: [number, number, number] = [79, 70, 229]; // indigo-600
  const emeraldColor: [number, number, number] = [16, 185, 129]; // emerald-500
  const lightBgColor: [number, number, number] = [248, 250, 252]; // slate-50
  const mutedTextColor: [number, number, number] = [100, 116, 139]; // slate-500
  const darkTextColor: [number, number, number] = [15, 23, 42]; // slate-900
  const borderColor: [number, number, number] = [226, 232, 240]; // slate-200

  // Top Decorative Bar
  doc.setFillColor(...accentColor);
  doc.rect(0, 0, pageWidth, 5, 'F');

  let currentY = 22;

  // Header Brand & Icon
  doc.setFillColor(...accentColor);
  doc.roundedRect(margin, currentY - 6, 12, 12, 2.5, 2.5, 'F');
  
  // Wi-Fi Emblem
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Wi', margin + 3.2, currentY + 1.5);

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('WiFiCash', margin + 16, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedTextColor);
  doc.text(t.subtitle, margin + 16, currentY + 4.5);

  // Receipt Title & Badge on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.text(t.title, pageWidth - margin, currentY - 2, { align: 'right' });

  // Paid Status Pill
  const badgeWidth = 28;
  const badgeHeight = 6.5;
  const badgeX = pageWidth - margin - badgeWidth;
  const badgeY = currentY + 2;

  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(...emeraldColor);
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(...emeraldColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(t.paidBadge, badgeX + badgeWidth / 2, badgeY + 4.3, { align: 'center' });

  currentY += 18;

  // Horizontal divider
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 8;

  // Metadata Block: Receipt Details & Date
  const col1X = margin;
  const col2X = margin + contentWidth / 2;

  // Left Column: Establishment info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedTextColor);
  doc.text(t.vendorHeader, col1X, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkTextColor);
  doc.text(receipt.locationName || 'Établissement Partenaire', col1X, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  if (receipt.locationAddress) {
    doc.text(receipt.locationAddress, col1X, currentY + 10.5);
  }
  doc.text(`${t.networkSsid} ${receipt.wifiSsid || 'WiFi-Guest'}`, col1X, currentY + 15.5);

  // Right Column: Transaction / Invoice info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedTextColor);
  doc.text(t.paymentDetails, col2X, currentY);

  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR';
  const formattedDate = new Date(receipt.createdAt || Date.now()).toLocaleString(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...darkTextColor);
  doc.text(`${t.receiptNumber} `, col2X, currentY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.id, col2X + 22, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`${t.dateTime} `, col2X, currentY + 10.5);
  doc.text(formattedDate, col2X + 26, currentY + 10.5);

  doc.text(`${t.paymentMethod} `, col2X, currentY + 15.5);
  doc.text(receipt.paymentMethod || 'Carte Bancaire / Stripe', col2X + 26, currentY + 15.5);

  if (receipt.customerEmail) {
    doc.text(`${t.client} ${receipt.customerEmail}`, col2X, currentY + 20.5);
  }

  currentY += 28;

  // Itemized Purchase Table
  const tableHeaderY = currentY;
  const tableHeaderHeight = 8;
  doc.setFillColor(...lightBgColor);
  doc.rect(margin, tableHeaderY, contentWidth, tableHeaderHeight, 'F');
  doc.setDrawColor(...borderColor);
  doc.rect(margin, tableHeaderY, contentWidth, tableHeaderHeight, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedTextColor);
  
  const colDescX = margin + 4;
  const colDurationX = margin + 75;
  const colQtyX = margin + 105;
  const colUnitPriceX = margin + 125;
  const colTotalX = pageWidth - margin - 4;

  doc.text(t.serviceDesc, colDescX, tableHeaderY + 5.2);
  doc.text(t.duration, colDurationX, tableHeaderY + 5.2);
  doc.text(t.qty, colQtyX, tableHeaderY + 5.2);
  doc.text(t.unitPrice, colUnitPriceX, tableHeaderY + 5.2);
  doc.text(t.totalTtc, colTotalX, tableHeaderY + 5.2, { align: 'right' });

  currentY = tableHeaderY + tableHeaderHeight;

  // Calculations
  const vatRate = receipt.vatRate !== undefined ? receipt.vatRate : 20;
  const totalTtc = receipt.amount;
  const totalHt = Math.round((totalTtc / (1 + vatRate / 100)) * 100) / 100;
  const vatAmount = Math.round((totalTtc - totalHt) * 100) / 100;
  const currency = receipt.currency || 'EUR';

  // Item Row
  const rowHeight = 12;
  doc.setDrawColor(...borderColor);
  doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkTextColor);
  doc.text(`Wi-Fi - ${receipt.planName || 'Internet Access'}`, colDescX, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text(t.planSubtitle, colDescX, currentY + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkTextColor);
  doc.text(formatDuration(receipt.durationMinutes || 60, lang), colDurationX, currentY + 6.5);
  doc.text('1', colQtyX, currentY + 6.5);
  doc.text(formatCurrency(totalHt, currency), colUnitPriceX, currentY + 6.5);
  
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalTtc, currency), colTotalX, currentY + 6.5, { align: 'right' });

  currentY += rowHeight;

  // Discount Row (if applicable)
  if (receipt.discountCode && receipt.discountAmount) {
    const discountRowHeight = 8;
    doc.setDrawColor(...borderColor);
    doc.line(margin, currentY + discountRowHeight, pageWidth - margin, currentY + discountRowHeight);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...emeraldColor);
    doc.text(t.discount.replace('{code}', receipt.discountCode), colDescX, currentY + 5.5);
    doc.text(`-${formatCurrency(receipt.discountAmount, currency)}`, colTotalX, currentY + 5.5, { align: 'right' });

    currentY += discountRowHeight;
  }

  currentY += 6;

  // Totals Breakdown Box (Right Aligned)
  const totalsBoxWidth = 72;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedTextColor);
  doc.text(t.subtotalHt, totalsBoxX, currentY);
  doc.setTextColor(...darkTextColor);
  doc.text(formatCurrency(totalHt, currency), pageWidth - margin, currentY, { align: 'right' });

  currentY += 5;
  doc.setTextColor(...mutedTextColor);
  doc.text(t.vat.replace('{rate}', String(vatRate)), totalsBoxX, currentY);
  doc.setTextColor(...darkTextColor);
  doc.text(formatCurrency(vatAmount, currency), pageWidth - margin, currentY, { align: 'right' });

  currentY += 6;
  doc.setFillColor(...lightBgColor);
  doc.roundedRect(totalsBoxX - 2, currentY - 4.5, totalsBoxWidth + 4, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...accentColor);
  doc.text(t.totalDue, totalsBoxX, currentY + 1.5);
  doc.text(formatCurrency(totalTtc, currency), pageWidth - margin, currentY + 1.5, { align: 'right' });

  currentY += 16;

  // Access Token Box
  const accessBoxY = currentY;
  const accessBoxHeight = 44;
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, accessBoxY, contentWidth, accessBoxHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...accentColor);
  doc.text(t.fastAccessBoxTitle, margin + 8, accessBoxY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedTextColor);
  doc.text(t.fastAccessBoxSub, margin + 8, accessBoxY + 13);

  // Voucher Code Badge Box
  const codeBoxX = margin + 8;
  const codeBoxY = accessBoxY + 17;
  const codeBoxWidth = 85;
  const codeBoxHeight = 14;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(codeBoxX, codeBoxY, codeBoxWidth, codeBoxHeight, 2, 2, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text(receipt.voucherCode || 'WIFI-PREMIUM-CODE', codeBoxX + codeBoxWidth / 2, codeBoxY + 8.5, { align: 'center' });

  // Connection Guide next to Voucher Box
  const guideX = margin + 102;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkTextColor);
  doc.text(t.quickGuideTitle, guideX, accessBoxY + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text(t.step1.replace('{ssid}', receipt.wifiSsid || 'WiFi-Guest'), guideX, accessBoxY + 24);
  doc.text(t.step2, guideX, accessBoxY + 28);
  doc.text(t.step3, guideX, accessBoxY + 32);

  // Validity reminder at bottom of access box
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...accentColor);
  doc.text(t.validityReminder.replace('{duration}', formatDuration(receipt.durationMinutes || 60, lang)), margin + 8, accessBoxY + 39);

  currentY = accessBoxY + accessBoxHeight + 14;

  // Customer Note & Legal Information Box
  doc.setFillColor(...lightBgColor);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkTextColor);
  doc.text(t.legalHeader, margin + 6, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text(t.legalLine1, margin + 6, currentY + 11);
  doc.text(t.legalLine2, margin + 6, currentY + 15.5);
  doc.text(t.legalLine3, margin + 6, currentY + 20);

  // Footer / Page Bottom
  const footerY = pageHeight - 16;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...mutedTextColor);
  doc.text(t.footerBrand, margin, footerY);
  doc.text(t.pageInfo.replace('{date}', new Date().toLocaleDateString(locale)), pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

export function downloadReceiptPdf(receipt: WifiReceipt, language?: 'fr' | 'en' | 'es'): void {
  const doc = generateReceiptPdf(receipt, language);
  const cleanId = receipt.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Recu-WiFi-${cleanId}.pdf`;
  doc.save(filename);
}

export function printReceipt(receipt: WifiReceipt, language?: 'fr' | 'en' | 'es'): void {
  const doc = generateReceiptPdf(receipt, language);
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Direct print failed, opening in new tab', e);
      window.open(blobUrl, '_blank');
    }
  };
}
