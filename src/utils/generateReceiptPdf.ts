import { jsPDF } from 'jspdf';
import { WifiReceipt } from '../types';

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const symbol = currency.toUpperCase() === 'USD' ? '$' : currency.toUpperCase() === 'GBP' ? '£' : '€';
  return `${amount.toFixed(2)} ${symbol}`;
}

export function formatDuration(minutes: number): string {
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

export function generateReceiptPdf(receipt: WifiReceipt): jsPDF {
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
  doc.text('PASSERELLE D\'ACCÈS INTERNET SÉCURISÉE', margin + 16, currentY + 4.5);

  // Receipt Title & Badge on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.text('REÇU DE PAIEMENT', pageWidth - margin, currentY - 2, { align: 'right' });

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
  doc.text('✓  PAYÉ', badgeX + badgeWidth / 2, badgeY + 4.3, { align: 'center' });

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
  doc.text('ÉTABLISSEMENT / VENDEUR', col1X, currentY);

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
  doc.text(`Réseau Wi-Fi (SSID) : ${receipt.wifiSsid || 'WiFi-Guest'}`, col1X, currentY + 15.5);

  // Right Column: Transaction / Invoice info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedTextColor);
  doc.text('DÉTAILS DU RÈGLEMENT', col2X, currentY);

  const formattedDate = new Date(receipt.createdAt || Date.now()).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...darkTextColor);
  doc.text(`N° Reçu : `, col2X, currentY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.id, col2X + 16, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Date & Heure : `, col2X, currentY + 10.5);
  doc.text(formattedDate, col2X + 22, currentY + 10.5);

  doc.text(`Règlement : `, col2X, currentY + 15.5);
  doc.text(receipt.paymentMethod || 'Carte Bancaire / Stripe', col2X + 18, currentY + 15.5);

  if (receipt.customerEmail) {
    doc.text(`Client : ${receipt.customerEmail}`, col2X, currentY + 20.5);
  }

  currentY += 28;

  // Itemized Purchase Table
  // Header
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

  doc.text('DESCRIPTION DU SERVICE', colDescX, tableHeaderY + 5.2);
  doc.text('DURÉE', colDurationX, tableHeaderY + 5.2);
  doc.text('QTÉ', colQtyX, tableHeaderY + 5.2);
  doc.text('P.U. HT', colUnitPriceX, tableHeaderY + 5.2);
  doc.text('TOTAL TTC', colTotalX, tableHeaderY + 5.2, { align: 'right' });

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
  doc.text(`Forfait Wi-Fi Premium - ${receipt.planName || 'Accès Internet'}`, colDescX, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text('Connexion haute vitesse sécurisée sans interruption', colDescX, currentY + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkTextColor);
  doc.text(formatDuration(receipt.durationMinutes || 60), colDurationX, currentY + 6.5);
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
    doc.text(`Remise appliquée (Code promo: ${receipt.discountCode})`, colDescX, currentY + 5.5);
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
  doc.text('Sous-total HT :', totalsBoxX, currentY);
  doc.setTextColor(...darkTextColor);
  doc.text(formatCurrency(totalHt, currency), pageWidth - margin, currentY, { align: 'right' });

  currentY += 5;
  doc.setTextColor(...mutedTextColor);
  doc.text(`TVA (${vatRate}%) :`, totalsBoxX, currentY);
  doc.setTextColor(...darkTextColor);
  doc.text(formatCurrency(vatAmount, currency), pageWidth - margin, currentY, { align: 'right' });

  currentY += 6;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.4);
  doc.line(totalsBoxX, currentY - 1.5, pageWidth - margin, currentY - 1.5);

  // Total TTC Highlighted
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(totalsBoxX - 2, currentY - 0.5, totalsBoxWidth + 2, 8, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL PAYÉ (TTC) :', totalsBoxX + 2, currentY + 5.2);
  doc.setFontSize(11);
  doc.setTextColor(...accentColor);
  doc.text(formatCurrency(totalTtc, currency), pageWidth - margin, currentY + 5.2, { align: 'right' });

  currentY += 18;

  // Highlight Box: WI-FI ACCESS CODE & CONNECTION CREDENTIALS
  const accessBoxY = currentY;
  const accessBoxHeight = 44;

  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, accessBoxY, contentWidth, accessBoxHeight, 3, 3, 'FD');

  // Box Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...accentColor);
  doc.text('VOS IDENTIFIANTS DE CONNEXION WI-FI', margin + 8, accessBoxY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedTextColor);
  doc.text('Conservez précieusement ce code pour déverrouiller votre accès internet sur vos appareils.', margin + 8, accessBoxY + 13);

  // Voucher Code Display
  const codeBoxWidth = 85;
  const codeBoxHeight = 13;
  const codeBoxX = margin + 8;
  const codeBoxY = accessBoxY + 17;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(199, 210, 254); // indigo-200
  doc.setLineWidth(0.3);
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
  doc.text('Instructions de connexion rapide :', guideX, accessBoxY + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text(`1. Connectez votre appareil au réseau : "${receipt.wifiSsid || 'WiFi-Guest'}"`, guideX, accessBoxY + 24);
  doc.text('2. Ouvrez le navigateur ou appuyez sur la notification de connexion', guideX, accessBoxY + 28);
  doc.text('3. Saisissez votre code d\'accès pour commencer à naviguer', guideX, accessBoxY + 32);

  // Validity reminder at bottom of access box
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...accentColor);
  doc.text(`* Accès valable pour une durée de ${formatDuration(receipt.durationMinutes || 60)} dès la première connexion.`, margin + 8, accessBoxY + 39);

  currentY = accessBoxY + accessBoxHeight + 14;

  // Customer Note & Legal Information Box
  doc.setFillColor(...lightBgColor);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkTextColor);
  doc.text('INFORMATIONS & JUSTIFICATIF DE FRAIS', margin + 6, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text('Ce reçu atteste du règlement d\'un service d\'accès aux télécommunications par le portail WiFiCash.', margin + 6, currentY + 11);
  doc.text('Il constitue un justificatif officiel pour votre comptabilité et le remboursement de vos notes de frais.', margin + 6, currentY + 15.5);
  doc.text('Pour toute assistance technique, veuillez contacter le gestionnaire de l\'établissement ou support@wificash.io.', margin + 6, currentY + 20);

  // Footer / Page Bottom
  const footerY = pageHeight - 16;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...mutedTextColor);
  doc.text('WiFiCash Cloud Services • Système de portail captif sécurisé certifié • Document dématérialisé', margin, footerY);
  doc.text(`Émis le ${new Date().toLocaleDateString('fr-FR')} • Page 1/1`, pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

export function downloadReceiptPdf(receipt: WifiReceipt): void {
  const doc = generateReceiptPdf(receipt);
  const cleanId = receipt.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Recu-WiFi-${cleanId}.pdf`;
  doc.save(filename);
}

export function printReceipt(receipt: WifiReceipt): void {
  const doc = generateReceiptPdf(receipt);
  // jsPDF provides autoPrint & output for printing
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
