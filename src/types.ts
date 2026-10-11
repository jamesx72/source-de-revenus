export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'guest';
}

export interface Establishment {
  id: string;
  name: string;
  address: string;
  plan: 'Starter' | 'Pro' | 'Business';
  wifiSsid: string;
}

export interface WifiPlan {
  id: string;
  name: string;
  duration: number; // in minutes (e.g. 15, 30, 60, 120, 1440, etc.)
  price: number; // in major unit (e.g. 2 for 2€, 0 for free) or cents depending on context
  currency?: string; // "eur", "usd", "gbp"
  description?: string;
  badge?: string; // e.g. "Gratuit", "Populaire", "Meilleure Offre", "Ultra Rapide"
  isAdSupported?: boolean;
  downloadSpeedLimit?: number; // in mbps
  uploadSpeedLimit?: number; // in mbps
  devicesLimit?: number; // max concurrent devices
  stripePriceId?: string;
  isActive?: boolean; // whether offered on captive portal
  features?: string[];
}

export interface WifiReceipt {
  id: string;
  transactionId?: string;
  locationName: string;
  locationAddress?: string;
  wifiSsid?: string;
  planName: string;
  durationMinutes: number;
  amount: number; // e.g. 5.00
  currency?: string; // "EUR", "USD", "GBP"
  vatRate?: number; // e.g. 20
  discountCode?: string;
  discountAmount?: number;
  paymentMethod?: string;
  status: 'paid' | 'pending' | 'refunded';
  createdAt: string | number | Date;
  voucherCode: string;
  customerEmail?: string;
  customerName?: string;
  deviceMac?: string;
}
