import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Transaction {
  id?: string;
  amount: number;
  createdAt: string;
  status: string;
  [key: string]: any;
}

interface DashboardAnalyticsProps {
  transactions: Transaction[];
}

export function DashboardAnalytics({ transactions }: DashboardAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>('daily');

  const { dailyData, weeklyData } = useMemo(() => {
    // Process purely completed transactions
    const completedTx = transactions.filter(t => t.status === 'paid' || t.status === 'succeeded');

    const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    // Initialize Daily Data (Last 7 days)
    const dailyMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = DAYS[d.getDay()];
      dailyMap.set(dayName, 0); // Initialize with 0
    }

    // Initialize Weekly Data (Last 4 weeks)
    const weeklyMap = new Map<string, number>();
    for (let i = 3; i >= 0; i--) {
      weeklyMap.set(`Semaine -${i}`, 0);
    }

    const now = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const oneWeekInMs = 7 * oneDayInMs;

    completedTx.forEach(tx => {
      const dt = new Date(tx.createdAt);
      if (isNaN(dt.getTime())) return;
      const amount = tx.amount || 0;

      // Daily mapping (if within last 7 days)
      const diffDays = Math.floor((now.getTime() - dt.getTime()) / oneDayInMs);
      if (diffDays >= 0 && diffDays < 7) {
        const dayName = DAYS[dt.getDay()];
        if (dailyMap.has(dayName)) {
          dailyMap.set(dayName, dailyMap.get(dayName)! + amount);
        }
      }

      // Weekly mapping (if within last 4 weeks)
      const diffWeeks = Math.floor((now.getTime() - dt.getTime()) / oneWeekInMs);
      if (diffWeeks >= 0 && diffWeeks < 4) {
        const weekKey = `Semaine -${diffWeeks}`;
        if (weeklyMap.has(weekKey)) {
          weeklyMap.set(weekKey, weeklyMap.get(weekKey)! + amount);
        }
      }
    });

    const dailyData = Array.from(dailyMap.entries()).map(([name, revenue]) => ({ name, revenue }));
    // Reverse weekly keys to show chronological order
    const weeklyData = Array.from(weeklyMap.entries()).reverse().map(([name, revenue]) => ({ name, revenue }));

    return { dailyData, weeklyData };
  }, [transactions]);

  const data = timeframe === 'daily' ? dailyData : weeklyData;

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Revenus des Vouchers Wi-Fi</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Évolution de vos revenus selon la période</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
          <button 
            onClick={() => setTimeframe('daily')}
            className={`px-3 py-1 text-sm font-medium transition-colors rounded-lg ${timeframe === 'daily' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Quotidien
          </button>
          <button 
            onClick={() => setTimeframe('weekly')}
            className={`px-3 py-1 text-sm font-medium transition-colors rounded-lg ${timeframe === 'weekly' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Hebdomadaire
          </button>
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '14px', fontWeight: 500, color: '#10b981' }}
              formatter={(val: number) => [`${val.toFixed(2)} €`, 'Revenu']}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#94a3b8' }} />
            <Area type="monotone" name="Revenus Vouchers (€)" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
