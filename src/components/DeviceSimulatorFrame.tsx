import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Battery, 
  Lock, 
  RotateCw, 
  Globe, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { DeviceMode, DeviceOrientation } from './DevicePreviewBar';

interface DeviceSimulatorFrameProps {
  deviceMode: DeviceMode;
  orientation: DeviceOrientation;
  onToggleOrientation: () => void;
  children: React.ReactNode;
  isLight?: boolean;
}

export const DeviceSimulatorFrame: React.FC<DeviceSimulatorFrameProps> = ({
  deviceMode,
  orientation,
  onToggleOrientation,
  children,
  isLight = false
}) => {
  const [dohaTime, setDohaTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        setDohaTime(now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Qatar',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }));
      } catch {
        const now = new Date();
        setDohaTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // When 'auto', render children directly without simulated device container
  if (deviceMode === 'auto') {
    return <>{children}</>;
  }

  // Mobile Device Specs
  const isMobile = deviceMode === 'mobile';
  const isTab = deviceMode === 'tab';
  const isWeb = deviceMode === 'web';

  // Compute container dimensions based on orientation
  let frameWidthClass = 'w-full max-w-[1240px]';
  let frameHeightStyle: React.CSSProperties = { minHeight: 'calc(100vh - 80px)' };

  if (isMobile) {
    if (orientation === 'portrait') {
      frameWidthClass = 'w-[390px]';
      frameHeightStyle = { height: '844px', maxHeight: 'calc(100vh - 80px)' };
    } else {
      frameWidthClass = 'w-[844px]';
      frameHeightStyle = { height: '390px', maxHeight: 'calc(100vh - 80px)' };
    }
  } else if (isTab) {
    if (orientation === 'portrait') {
      frameWidthClass = 'w-[768px]';
      frameHeightStyle = { height: '1024px', maxHeight: 'calc(100vh - 80px)' };
    } else {
      frameWidthClass = 'w-[1024px]';
      frameHeightStyle = { height: '768px', maxHeight: 'calc(100vh - 80px)' };
    }
  }

  return (
    <div className="min-h-[calc(100vh-50px)] w-full bg-[#030712] py-4 px-2 sm:px-4 flex flex-col items-center justify-start overflow-x-auto select-text">
      
      {/* Device Dimension Info Tag */}
      <div className="mb-2.5 flex items-center gap-3 text-[11px] font-mono font-bold text-slate-400">
        <span className="px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>
            {isMobile && `Mobile Phone (${orientation === 'portrait' ? '390 × 844' : '844 × 390'} px)`}
            {isTab && `Tablet / iPad (${orientation === 'portrait' ? '768 × 1024' : '1024 × 768'} px)`}
            {isWeb && `Desktop Web (1240 px Full Layout)`}
          </span>
        </span>
        <button
          onClick={onToggleOrientation}
          className="text-xs hover:text-white transition flex items-center gap-1 text-slate-400 cursor-pointer"
          title="Toggle Orientation"
        >
          <RotateCw className="w-3 h-3" />
          <span className="capitalize">{orientation}</span>
        </button>
      </div>

      {/* Frame Container */}
      <div 
        className={`${frameWidthClass} relative transition-all duration-300 shadow-2xl flex flex-col ${
          isMobile 
            ? 'rounded-[46px] border-[10px] border-[#1C1F26] bg-[#000000] ring-1 ring-slate-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]'
            : isTab
            ? 'rounded-[32px] border-[12px] border-[#1C1F26] bg-[#000000] ring-1 ring-slate-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]'
            : 'rounded-2xl border border-slate-700/80 bg-[#0B0F19] shadow-2xl overflow-hidden'
        }`}
        style={frameHeightStyle}
      >
        
        {/* Mobile / Tablet Simulated Status Bar */}
        {(isMobile || isTab) && (
          <div className="relative z-30 shrink-0 h-9 bg-black text-white px-6 flex items-center justify-between text-[11px] font-semibold select-none">
            {/* Time (Doha Local) */}
            <span className="font-mono tracking-tight text-xs font-bold pl-1">{dohaTime || '12:00'}</span>

            {/* Dynamic Island / Speaker Notch on Mobile */}
            {isMobile && orientation === 'portrait' && (
              <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-24 h-4.5 bg-black rounded-full border border-slate-800 flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#111] border border-slate-900"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>
              </div>
            )}

            {/* Tablet Camera dot */}
            {isTab && (
              <div className="absolute left-1/2 -translate-x-1/2 top-2 w-2 h-2 rounded-full bg-slate-800 border border-slate-900"></div>
            )}

            {/* Status Icons */}
            <div className="flex items-center gap-2 pr-1">
              <span className="text-[10px] font-mono text-emerald-400 font-bold">5G</span>
              <Wifi className="w-3.5 h-3.5 text-white" />
              <div className="flex items-center gap-0.5">
                <span className="text-[9px] font-mono">100%</span>
                <Battery className="w-4 h-4 text-emerald-400 fill-current" />
              </div>
            </div>
          </div>
        )}

        {/* Desktop Web Browser Header Bar */}
        {isWeb && (
          <div className="shrink-0 bg-[#111622] border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-3 text-xs select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>

            {/* URL Address Bar */}
            <div className="flex-1 max-w-xl mx-auto flex items-center justify-center gap-2 px-3 py-1 rounded-lg bg-[#070A11] border border-slate-700/80 text-slate-300 font-mono text-[11px]">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-400 font-bold">https://</span>
              <span className="text-white font-extrabold">nasapp.qa</span>
              <span className="text-emerald-400">/live-orders</span>
              <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                SSL 256-BIT
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Doha, Qatar</span>
            </div>
          </div>
        )}

        {/* Screen Viewport with smooth scroll */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative flex flex-col bg-inherit">
          {children}
        </div>

        {/* Mobile / Tablet Home Indicator Bar */}
        {(isMobile || isTab) && (
          <div className="shrink-0 h-4 bg-black flex items-center justify-center select-none">
            <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
          </div>
        )}

      </div>
    </div>
  );
};
