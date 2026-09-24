import React from 'react';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Maximize2, 
  RotateCw, 
  Radio, 
  ShoppingBag, 
  Terminal, 
  ChevronDown, 
  ChevronUp,
  Wifi,
  Sparkles,
  QrCode
} from 'lucide-react';
import { Language, translations } from '../i18n';

export type DeviceMode = 'auto' | 'mobile' | 'tab' | 'web';
export type DeviceOrientation = 'portrait' | 'landscape';

interface DevicePreviewBarProps {
  deviceMode: DeviceMode;
  onDeviceModeChange: (mode: DeviceMode) => void;
  orientation: DeviceOrientation;
  onToggleOrientation: () => void;
  customerMode: boolean;
  onToggleCustomerMode: () => void;
  lang: Language;
  onToggleLang: () => void;
  cloudConnected?: boolean;
  minimized?: boolean;
  onToggleMinimize?: () => void;
  pendingOrdersCount?: number;
}

export const DevicePreviewBar: React.FC<DevicePreviewBarProps> = ({
  deviceMode,
  onDeviceModeChange,
  orientation,
  onToggleOrientation,
  customerMode,
  onToggleCustomerMode,
  lang,
  onToggleLang,
  cloudConnected = true,
  minimized = false,
  onToggleMinimize,
  pendingOrdersCount = 0
}) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  if (minimized) {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
        <button
          onClick={onToggleMinimize}
          className="bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 shadow-2xl flex items-center gap-2 text-xs font-bold hover:bg-slate-800 transition cursor-pointer group"
          title={isAr ? 'عرض شريط تحكم الأجهزة والمزامنة' : 'Show Device & Live Sync Toolbar'}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[11px] font-mono text-emerald-400">LIVE SYNC</span>
          </div>
          <span className="text-slate-400">|</span>
          <span className="text-[11px] capitalize text-slate-200">
            {deviceMode === 'auto' ? (isAr ? 'تلقائي' : 'Responsive') : deviceMode}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
        </button>
      </div>
    );
  }

  return (
    <nav 
      aria-label="Device Preview and Live Sync"
      className="sticky top-0 z-50 bg-[#090D16]/95 backdrop-blur-md border-b border-slate-800/80 text-white text-xs px-3 py-2 shadow-2xl transition-all select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left: Live Cloud Sync Status Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-extrabold tracking-wider">LIVE CLOUD</span>
            <span className="text-[9px] text-emerald-400/80 border-l border-emerald-500/30 pl-1.5 hidden sm:inline">
              QATAR 🇶🇦
            </span>
          </div>

          {/* Pending live orders alert pill */}
          {pendingOrdersCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold animate-pulse">
              <Radio className="w-3 h-3 text-amber-400" />
              <span>{pendingOrdersCount} {isAr ? 'طلبات جديدة' : 'New Orders'}</span>
            </div>
          )}
        </div>

        {/* Center: Device Mode Switcher (Mobile | Tab | Web | Live Auto) */}
        <div className="flex items-center bg-[#03060C] p-0.5 rounded-xl border border-slate-700/80 shadow-inner">
          {/* Mobile Phone button */}
          <button
            type="button"
            onClick={() => onDeviceModeChange('mobile')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              deviceMode === 'mobile'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
            title="Mobile View (390px iPhone / Android)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.deviceMobile}</span>
            <span className="sm:hidden font-mono text-[11px]">390px</span>
          </button>

          {/* Tablet / Tab button */}
          <button
            type="button"
            onClick={() => onDeviceModeChange('tab')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              deviceMode === 'tab'
                ? 'bg-blue-500 text-white shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
            title="Tablet / iPad View (768px - 820px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.deviceTab}</span>
            <span className="sm:hidden font-mono text-[11px]">Tab</span>
          </button>

          {/* Desktop Web button */}
          <button
            type="button"
            onClick={() => onDeviceModeChange('web')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              deviceMode === 'web'
                ? 'bg-purple-600 text-white shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
            title="Desktop Web (1200px Wide)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.deviceWeb}</span>
            <span className="sm:hidden font-mono text-[11px]">Web</span>
          </button>

          {/* Live Auto / Native Responsive button */}
          <button
            type="button"
            onClick={() => onDeviceModeChange('auto')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              deviceMode === 'auto'
                ? 'bg-slate-200 text-slate-900 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
            title="Full Window (Adapts to real device)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.deviceAuto}</span>
            <span className="sm:hidden font-mono text-[11px]">Auto</span>
          </button>
        </div>

        {/* Right: Actions (Orientation, View toggle Customer vs POS, Minimize) */}
        <div className="flex items-center gap-2">
          
          {/* Orientation toggle (Active when Mobile or Tab is selected) */}
          {(deviceMode === 'mobile' || deviceMode === 'tab') && (
            <button
              type="button"
              onClick={onToggleOrientation}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs"
              title={isAr ? 'تدوير الجهاز (عمودي / أفقي)' : 'Rotate Device (Portrait / Landscape)'}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] hidden md:inline">
                {orientation === 'portrait' ? t.orientationPortrait : t.orientationLandscape}
              </span>
            </button>
          )}

          {/* Quick toggle: Customer Menu <-> Staff POS */}
          <button
            type="button"
            onClick={onToggleCustomerMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
              customerMode
                ? 'bg-amber-400/20 hover:bg-amber-400/30 border-amber-400/50 text-amber-300'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50 text-emerald-300'
            }`}
            title={customerMode ? (isAr ? 'الانتقال إلى كاشير وإدارة POS' : 'Switch to Staff POS Register') : (isAr ? 'الانتقال إلى قائمة المتجر للعميل' : 'Switch to Customer Menu')}
          >
            {customerMode ? (
              <>
                <Terminal className="w-3.5 h-3.5" />
                <span>{isAr ? 'كاشير POS' : 'Staff POS'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isAr ? 'قائمة العملاء' : 'Customer Menu'}</span>
              </>
            )}
          </button>

          {/* Language Switch */}
          <button
            type="button"
            onClick={onToggleLang}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
            title="Switch Language"
          >
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>

          {/* Minimize bar button */}
          {onToggleMinimize && (
            <button
              type="button"
              onClick={onToggleMinimize}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title={isAr ? 'تصغير شريط التحكم' : 'Minimize toolbar'}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </nav>
  );
};
