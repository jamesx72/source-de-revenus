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
  duration: number; // in minutes
  price: number; // in cents
  downloadSpeedLimit?: number; // in mbps
  isAdSupported: boolean;
}
