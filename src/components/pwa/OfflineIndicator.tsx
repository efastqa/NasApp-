import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';

interface OfflineIndicatorProps {
  lang?: 'en' | 'ar';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lang = 'en' }) => {
  const isOnline = useOnlineStatus();
  const isAr = lang === 'ar';

  if (isOnline) return null;

  return (
    <aside 
      aria-label="Offline status notice"
      className="fixed bottom-4 start-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/90 hover:bg-amber-500 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-2xl border border-amber-400 transition animate-in fade-in slide-in-from-bottom-2"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
      </span>
      <WifiOff className="w-4 h-4 text-slate-950" />
      <span>
        {isAr 
          ? 'وضع عدم الاتصال — NasApp يعمل دون إنترنت ويستخدم البيانات المحفوظة'
          : 'Offline Mode — NasApp is using local cache and will sync once reconnected'}
      </span>
    </aside>
  );
};
