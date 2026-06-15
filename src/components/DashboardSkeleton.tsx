import { LayoutDashboard, Users, DollarSign, Activity, Settings, MessageSquare } from 'lucide-react';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse w-full">
      {/* Stats Overview Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 p-5 rounded-3xl backdrop-blur-md h-32 flex flex-col justify-between">
             <div className="w-1/2 h-4 bg-slate-300 dark:bg-white/10 rounded"></div>
             <div className="w-2/3 h-8 bg-slate-300 dark:bg-white/10 rounded mt-4"></div>
             <div className="w-1/3 h-3 bg-slate-300 dark:bg-white/10 rounded mt-3"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Skeleton */}
        <div className="lg:col-span-2 bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-sm h-96 flex flex-col">
           <div className="w-1/3 h-6 bg-slate-300 dark:bg-white/10 rounded mb-2"></div>
           <div className="w-1/4 h-4 bg-slate-300 dark:bg-white/10 rounded mb-8"></div>
           <div className="flex-1 w-full bg-slate-300/50 dark:bg-white/10 rounded-2xl"></div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-sm h-96 flex flex-col">
           <div className="w-1/2 h-6 bg-slate-300 dark:bg-white/10 rounded mb-6"></div>
           <div className="space-y-6">
             {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-300 dark:bg-white/10 shrink-0"></div>
                   <div className="flex-1 space-y-2">
                     <div className="w-3/4 h-4 bg-slate-300 dark:bg-white/10 rounded"></div>
                     <div className="w-1/2 h-3 bg-slate-300 dark:bg-white/10 rounded"></div>
                   </div>
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
