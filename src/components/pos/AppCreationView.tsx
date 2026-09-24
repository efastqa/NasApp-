import React, { useState, useEffect, useRef } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import {
  Download,
  Smartphone,
  Laptop,
  QrCode,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  Layers,
  ShieldCheck,
  Zap,
  Terminal,
  Settings,
  Share2,
  Sparkles,
  Wifi,
  WifiOff,
  Maximize2,
  FileCode,
  Check,
  Apple
} from 'lucide-react';

interface AppCreationViewProps {
  lang: 'en' | 'ar';
}

declare const QRCode: any;

export const AppCreationView: React.FC<AppCreationViewProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const { isInstallable, isInstalled, isIOS, isAndroid, platformName, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  const [activeTab, setActiveTab] = useState<'install' | 'platforms' | 'apk_package' | 'manifest'>('install');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBubblewrap, setCopiedBubblewrap] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [cacheClearing, setCacheClearing] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  // App customization settings (stored in localStorage)
  const [startupView, setStartupView] = useState<string>(() => {
    return localStorage.getItem('nasapp_startup_view') || 'register';
  });
  const [kioskMode, setKioskMode] = useState<boolean>(() => {
    return localStorage.getItem('nasapp_kiosk_mode') === 'true';
  });

  const qrRef = useRef<HTMLDivElement>(null);
  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://nasapp.qa';

  // Render QR Code for mobile install
  useEffect(() => {
    if (qrRef.current && typeof QRCode !== 'undefined') {
      qrRef.current.innerHTML = '';
      try {
        new QRCode(qrRef.current, {
          text: currentAppUrl,
          width: 170,
          height: 170,
          colorDark: '#0A0A0B',
          colorLight: '#FFFFFF',
          correctLevel: 2, // M
        });
      } catch (err) {
        console.warn('QR Code generation notice:', err);
      }
    }
  }, [currentAppUrl, activeTab]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartupViewChange = (val: string) => {
    setStartupView(val);
    localStorage.setItem('nasapp_startup_view', val);
  };

  const handleKioskModeToggle = () => {
    const next = !kioskMode;
    setKioskMode(next);
    localStorage.setItem('nasapp_kiosk_mode', String(next));
    if (next && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (!next && document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleRefreshCache = async () => {
    setCacheClearing(true);
    setCacheMessage(null);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
        }
      }
      setCacheMessage(isAr ? 'تم تحديث ذاكرة التخزين المؤقت لـ NasApp بنجاح!' : 'NasApp cache refreshed & service worker synced!');
    } catch (e) {
      setCacheMessage(isAr ? 'تم التحقق من التخزين المؤقت' : 'Cache check completed');
    } finally {
      setCacheClearing(false);
      setTimeout(() => setCacheMessage(null), 3500);
    }
  };

  const manifestJsonString = JSON.stringify(
    {
      id: '/',
      name: 'NasApp',
      short_name: 'NasApp',
      description: 'NasApp — Point of Sale, Smart Inventory, Barcodes & Express Store Suite.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'any',
      theme_color: '#0A0A0B',
      background_color: '#0A0A0B',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-maskable-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    null,
    2
  );

  const bubblewrapCommand = `# 1. Install Google Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Initialize Android APK project from NasApp manifest
bubblewrap init --manifest=${currentAppUrl}/manifest.webmanifest

# 3. Build signed release Android APK / AAB for Google Play
bubblewrap build`;

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* HEADER HERO SECTION                                      */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#131C18] via-[#0E1512] to-[#0A0A0B] border border-[#39FFB0]/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 end-0 w-96 h-96 bg-[#39FFB0]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Live NasApp App Icon Squircle */}
            <div className="relative w-20 h-20 rounded-2xl bg-[#0A0A0B] border-2 border-[#39FFB0]/50 shadow-[0_0_30px_rgba(57,255,176,0.25)] flex items-center justify-center shrink-0 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#39FFB0]/10 via-transparent to-[#10B981]/20" />
              <div className="relative flex flex-col items-center">
                <span className="font-mono font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-[#39FFB0] via-[#10B981] to-[#059669]">
                  N
                </span>
                <span className="text-[9px] font-bold tracking-widest text-[#EDEDED] uppercase -mt-1">
                  NASAPP
                </span>
              </div>
              <div className="absolute bottom-1 w-6 h-1 rounded-full bg-[#39FFB0]" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F4] tracking-tight">
                  NasApp
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#39FFB0] text-[#0A0A0B] uppercase">
                  PWA & Native App
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#1E1E21] text-[#9C9DA3] border border-[#27272A]">
                  v2.4.0
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#9C9DA3] mt-1 max-w-xl">
                {isAr
                  ? 'مركز إنشاء وتثبيت تطبيق NasApp على أجهزة الجوال (iOS / Android) والحواسيب المكتبية (Windows / Mac) للعمل بسرعة البرق ودون الحاجة لمتصفح.'
                  : 'App Creation & Installation Hub: Install NasApp directly on iPhone, Android, tablets, and Desktop computers for offline-ready POS and store operations.'}
              </p>

              {/* Status Badges */}
              <div className="flex items-center gap-3 mt-3 flex-wrap text-xs">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium ${
                  isInstalled 
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                    : 'bg-[#1E1E21] border-[#27272A] text-[#9C9DA3]'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#39FFB0]" />
                  <span>
                    {isInstalled 
                      ? (isAr ? 'الوضع: تطبيق مثبت (Standalone)' : 'Status: Installed (Standalone Mode)')
                      : (isAr ? 'الوضع: متصفح الويب (جاهز للتثبيت)' : 'Status: Web Browser (Ready to Install)')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1E1E21] border border-[#27272A] text-[#9C9DA3]">
                  {isOnline ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[#39FFB0] animate-pulse" />
                      <span className="text-[#EDEDED]">{isAr ? 'متصل بالسحابة' : 'Cloud Sync Live'}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-amber-300">{isAr ? 'وضع عدم الاتصال' : 'Offline Mode'}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1E1E21] border border-[#27272A] text-[#9C9DA3] font-mono text-[11px]">
                  <span>OS: {platformName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
            {isInstallable ? (
              <button
                onClick={install}
                className="px-5 py-3 rounded-2xl bg-[#39FFB0] text-[#0A0A0B] text-sm font-bold hover:bg-[#2ee69c] active:scale-95 transition shadow-lg hover:shadow-[0_0_25px_rgba(57,255,176,0.35)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تثبيت تطبيق NasApp الآن' : 'Install NasApp Now'}</span>
              </button>
            ) : isInstalled ? (
              <div className="px-4 py-2.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#39FFB0]" />
                <span>{isAr ? 'تطبيق NasApp يعمل بنجاح' : 'NasApp is Installed & Active'}</span>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('platforms')}
                className="px-5 py-3 rounded-2xl bg-[#39FFB0] text-[#0A0A0B] text-sm font-bold hover:bg-[#2ee69c] transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'طريقة تثبيت التطبيق' : 'Install NasApp'}</span>
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="px-4 py-3 rounded-2xl bg-[#1E1E21] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-[#EDEDED] transition flex items-center justify-center gap-2 cursor-pointer"
              title="Copy App URL"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#39FFB0]" /> : <Copy className="w-4 h-4 text-[#9C9DA3]" />}
              <span>{copiedLink ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرابط' : 'Copy App Link')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* NAVIGATION TABS                                          */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 border-b border-[#1E1E21] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('install')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'install'
              ? 'bg-[#39FFB0]/10 text-[#39FFB0] border border-[#39FFB0]/30'
              : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{isAr ? 'التثبيت الفوري ورمز QR' : 'Instant Install & Mobile QR'}</span>
        </button>

        <button
          onClick={() => setActiveTab('platforms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'platforms'
              ? 'bg-[#39FFB0]/10 text-[#39FFB0] border border-[#39FFB0]/30'
              : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>{isAr ? 'دليل الأجهزة (iOS / Android / Desktop)' : 'Devices & Platforms Guide'}</span>
        </button>

        <button
          onClick={() => setActiveTab('apk_package')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'apk_package'
              ? 'bg-[#39FFB0]/10 text-[#39FFB0] border border-[#39FFB0]/30'
              : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>{isAr ? 'حزمة APK ومتجر Google Play' : 'Android APK & Play Store Packaging'}</span>
        </button>

        <button
          onClick={() => setActiveTab('manifest')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'manifest'
              ? 'bg-[#39FFB0]/10 text-[#39FFB0] border border-[#39FFB0]/30'
              : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>{isAr ? 'مواصفات تطبيق NasApp (Manifest)' : 'NasApp Manifest Specs'}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: INSTANT INSTALL & MOBILE QR                       */}
      {/* ======================================================== */}
      {activeTab === 'install' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: QR Code & Mobile Scan */}
          <div className="lg:col-span-5 rounded-2xl bg-[#121214] border border-[#27272A] p-6 flex flex-col items-center text-center">
            <div className="flex items-center gap-2 text-xs font-bold text-[#39FFB0] uppercase tracking-wider mb-2">
              <QrCode className="w-4 h-4" />
              <span>{isAr ? 'رمز التثبيت السريع للجوال' : 'Scan to Install on Mobile'}</span>
            </div>

            <h3 className="text-base font-bold text-[#F5F5F4] mb-1">
              {isAr ? 'امسح الرمز بكاميرا هاتفك' : 'Scan with iPhone or Android'}
            </h3>
            <p className="text-xs text-[#9C9DA3] mb-6 max-w-xs">
              {isAr 
                ? 'وجّه كاميرا هاتفك نحو الرمز لفتح تطبيق NasApp وتثبيته فوراً على الشاشة الرئيسية.' 
                : 'Point your camera at this QR code to open and install NasApp on your phone with full offline support.'}
            </p>

            {/* QR Code Container */}
            <div className="p-4 bg-white rounded-3xl shadow-xl border-4 border-[#39FFB0]/30 mb-4 inline-block">
              <div ref={qrRef} className="w-[170px] h-[170px] flex items-center justify-center" />
            </div>

            <div className="w-full max-w-xs space-y-2 mt-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#1E1E21] border border-[#27272A] text-xs">
                <span className="font-mono text-[11px] text-[#9C9DA3] truncate max-w-[200px]">
                  {currentAppUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-2 py-1 rounded-lg bg-[#39FFB0]/10 text-[#39FFB0] hover:bg-[#39FFB0] hover:text-[#0A0A0B] text-[11px] font-semibold transition cursor-pointer"
                >
                  {copiedLink ? (isAr ? 'تم!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}
                </button>
              </div>

              <p className="text-[10px] text-[#5E5F64]">
                {isAr ? 'يعمل مع متصفحات Safari و Chrome و Edge و Samsung Internet' : 'Compatible with Safari, Chrome, Edge, and Samsung Internet'}
              </p>
            </div>
          </div>

          {/* Right Column: Key Benefits & In-App Customization */}
          <div className="lg:col-span-7 space-y-6">
            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#121214] border border-[#27272A] space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#39FFB0]/10 text-[#39FFB0] flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[#F5F5F4]">
                  {isAr ? 'سرعة فائقة وبدون متصفح' : 'Standalone Native Viewport'}
                </h4>
                <p className="text-[11px] text-[#9C9DA3] leading-relaxed">
                  {isAr 
                    ? 'يفتح كنافذة مستقلة بدون أشرطة عناوين المتصفح المزعجة، مع استجابة فورية ونقاء شاشة كامل.' 
                    : 'Runs in dedicated full-screen window without browser URL bars or tabs, feeling just like a desktop/mobile app.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#121214] border border-[#27272A] space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[#F5F5F4]">
                  {isAr ? 'دعم كامل للعمل بدون إنترنت' : 'Offline Database & Sync'}
                </h4>
                <p className="text-[11px] text-[#9C9DA3] leading-relaxed">
                  {isAr 
                    ? 'يتم تخزين واجهة التطبيق والمنتجات وسجل المبيعات محلياً حتى لا يتعطل البيع في حال انقطاع الشبكة.' 
                    : 'Service worker caches core app resources so staff can continue ringing up sales even during network outages.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#121214] border border-[#27272A] space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[#F5F5F4]">
                  {isAr ? 'أجهزة الباركود والطابعات' : 'Hardware & Scanner Ready'}
                </h4>
                <p className="text-[11px] text-[#9C9DA3] leading-relaxed">
                  {isAr 
                    ? 'اتصال مباشر بكاميرا الجوال لمسح الباركود، مع دعم طابعات الإيصالات الحرارية عبر USB وبلوتوث.' 
                    : 'Direct access to phone camera for barcode scanning and Web Bluetooth/USB thermal receipt printers.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#121214] border border-[#27272A] space-y-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[#F5F5F4]">
                  {isAr ? 'تحديثات فورية تلقائية' : 'Zero Store Fee & Auto-Update'}
                </h4>
                <p className="text-[11px] text-[#9C9DA3] leading-relaxed">
                  {isAr 
                    ? 'لا تحتاج إلى انتظار موافقة متاجر التطبيقات؛ يتحدث التطبيق في الخلفية فور صدور أي إصدار جديد.' 
                    : 'Instant background updates without waiting for app store reviews or paying 30% developer store cuts.'}
                </p>
              </div>
            </div>

            {/* App Preferences Card */}
            <div className="p-5 rounded-2xl bg-[#121214] border border-[#27272A] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#39FFB0]" />
                  <h4 className="text-xs font-bold text-[#F5F5F4]">
                    {isAr ? 'إعدادات تشغيل NasApp المفضلة' : 'NasApp Runtime Preferences'}
                  </h4>
                </div>
                <span className="text-[10px] text-[#9C9DA3] font-mono">App Config</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] text-[#9C9DA3] mb-1.5 font-medium">
                    {isAr ? 'الشاشة الافتراضية عند فتح التطبيق:' : 'Default Launch Screen:'}
                  </label>
                  <select
                    value={startupView}
                    onChange={(e) => handleStartupViewChange(e.target.value)}
                    className="w-full bg-[#1E1E21] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-[#EDEDED] focus:border-[#39FFB0] focus:outline-none"
                  >
                    <option value="register">{isAr ? 'نقطة البيع والكاشير (POS)' : 'Cashier Register (POS)'}</option>
                    <option value="inventory">{isAr ? 'المخزون والمنتجات' : 'Inventory & Stock'}</option>
                    <option value="orders">{isAr ? 'طلبات التوصيل والاستلام' : 'Live Orders Queue'}</option>
                    <option value="dashboard">{isAr ? 'لوحة التحليلات والمبيعات' : 'Dashboard Analytics'}</option>
                    <option value="customer">{isAr ? 'قائمة الطلب للعملاء (Online Menu)' : 'Customer Store & Menu'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#9C9DA3] mb-1.5 font-medium">
                    {isAr ? 'وضع الشاشة الكاملة (Kiosk Mode):' : 'Fullscreen / Kiosk Mode:'}
                  </label>
                  <button
                    onClick={handleKioskModeToggle}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                      kioskMode
                        ? 'bg-[#39FFB0]/20 border-[#39FFB0] text-[#39FFB0]'
                        : 'bg-[#1E1E21] border-[#27272A] text-[#9C9DA3] hover:text-[#EDEDED]'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>
                      {kioskMode 
                        ? (isAr ? 'وضع الكشك مفعّل (Fullscreen)' : 'Kiosk Active (Fullscreen)') 
                        : (isAr ? 'تفعيل وضع الكشك ملء الشاشة' : 'Enable Fullscreen Kiosk')}
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1E1E21] flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="text-[11px] text-[#9C9DA3]">
                  {cacheMessage ? (
                    <span className="text-[#39FFB0] font-semibold">{cacheMessage}</span>
                  ) : (
                    <span>{isAr ? 'الذاكرة المؤقتة: نشطة ومحدثة' : 'Local Cache: Active & Pre-cached'}</span>
                  )}
                </div>
                <button
                  onClick={handleRefreshCache}
                  disabled={cacheClearing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E1E21] hover:bg-[#27272A] text-[#9C9DA3] hover:text-[#F5F5F4] text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${cacheClearing ? 'animate-spin text-[#39FFB0]' : ''}`} />
                  <span>{isAr ? 'تحديث كاش التطبيق' : 'Sync & Refresh Cache'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: STEP-BY-STEP PLATFORMS GUIDE                      */}
      {/* ======================================================== */}
      {activeTab === 'platforms' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* iOS Safari Guide */}
          <div className="p-6 rounded-2xl bg-[#121214] border border-[#27272A] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
                <Apple className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#F5F5F4]">
                {isAr ? 'تثبيت NasApp على iPhone و iPad' : 'iPhone & iPad (Apple iOS)'}
              </h3>
              <p className="text-xs text-[#9C9DA3]">
                {isAr 
                  ? 'يعمل مباشرة عبر متصفح Safari لإضافته كأيقونة تطبيق كاملة على الشاشة الرئيسية.' 
                  : 'Install via Safari without opening the App Store. Runs fullscreen like any native iOS app.'}
              </p>

              <ol className="space-y-3 text-xs text-[#EDEDED] pt-2">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <span>{isAr ? 'افتح الموقع في متصفح Safari على جهازك.' : 'Open this page inside Safari browser on your iOS device.'}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <span>{isAr ? 'اضغط على زر المشاركة (Share) أسفل الشاشة.' : 'Tap the Share icon ⎋ at the bottom toolbar.'}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                  <span>{isAr ? 'مرر للأسفل واختر "إضافة إلى الصفحة الرئيسية" (Add to Home Screen).' : 'Scroll down and select "Add to Home Screen" [+].'}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-[11px] shrink-0">4</span>
                  <span>{isAr ? 'تأكد من كتابة الاسم "NasApp" واضغط "إضافة".' : 'Verify the name is "NasApp" and tap Add.'}</span>
                </li>
              </ol>
            </div>

            <div className="pt-4 border-t border-[#1E1E21]">
              <span className="inline-block px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                ✓ Apple WebClip & PWA Ready
              </span>
            </div>
          </div>

          {/* Android Chrome Guide */}
          <div className="p-6 rounded-2xl bg-[#121214] border border-[#27272A] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-[#39FFB0]">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#F5F5F4]">
                {isAr ? 'تثبيت NasApp على أجهزة Android' : 'Android Phones & Tablets'}
              </h3>
              <p className="text-xs text-[#9C9DA3]">
                {isAr 
                  ? 'يعمل مع Chrome و Samsung Internet و Edge بضغطة زر وتثبيت WebAPK مباشر.' 
                  : 'Install with 1-click via Chrome or Samsung Internet. Generates an official Android WebAPK.'}
              </p>

              <ol className="space-y-3 text-xs text-[#EDEDED] pt-2">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <span>{isAr ? 'اضغط على زر "تثبيت تطبيق NasApp" في أعلى الصفحة.' : 'Click the "Install NasApp" prompt button in header.'}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <span>{isAr ? 'أو افتح قائمة المتصفح (⋮) في أعلى الزاوية.' : 'Or tap the browser menu (⋮) in the top corner.'}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                  <span>{isAr ? 'اختر "تثبيت التطبيق" (Install App).' : 'Select "Install app" or "Add to Home screen".'}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-[11px] shrink-0">4</span>
                  <span>{isAr ? 'سيظهر أيقونة NasApp على قائمة تطبيقاتك الرئيسية فوراً.' : 'NasApp will appear in your app drawer with badge icon.'}</span>
                </li>
              </ol>
            </div>

            <div className="pt-4 border-t border-[#1E1E21]">
              <span className="inline-block px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                ✓ WebAPK & Background Sync
              </span>
            </div>
          </div>

          {/* Windows / Mac / Desktop Guide */}
          <div className="p-6 rounded-2xl bg-[#121214] border border-[#27272A] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#F5F5F4]">
                {isAr ? 'حواسيب الكاشير والمكاتب (Windows / Mac)' : 'Desktop (Windows / Mac / Linux)'}
              </h3>
              <p className="text-xs text-[#9C9DA3]">
                {isAr 
                  ? 'برنامج كاشير متكامل لسطح المكتب يدعم شاشات اللمس وطابعات USB وأدراج النقد.' 
                  : 'Full desktop application experience for checkout counters, touchscreens, and POS hardware.'}
              </p>

              <ol className="space-y-3 text-xs text-[#EDEDED] pt-2">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <span>{isAr ? 'استخدم متصفح Google Chrome أو Microsoft Edge أو Brave.' : 'Open in Google Chrome, Microsoft Edge, or Brave.'}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <span>{isAr ? 'لاحظ رمز التثبيت ⊕ في أقصى يمين شريط العنوان.' : 'Look for the ⊕ Install icon in the browser address bar.'}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                  <span>{isAr ? 'انقر على "تثبيت NasApp" لتثبيته كبرنامج مستقل.' : 'Click "Install NasApp" to create a desktop shortcut.'}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-[11px] shrink-0">4</span>
                  <span>{isAr ? 'ثبّت أيقونة NasApp في شريط المهام (Taskbar / Dock).' : 'Pin NasApp to your Windows Taskbar or macOS Dock.'}</span>
                </li>
              </ol>
            </div>

            <div className="pt-4 border-t border-[#1E1E21]">
              <span className="inline-block px-2.5 py-1 rounded bg-blue-950/60 border border-blue-500/30 text-blue-300 text-[10px] font-mono">
                ✓ Hardware Port & ESC/POS Print
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ANDROID APK & PLAY STORE PACKAGING                */}
      {/* ======================================================== */}
      {activeTab === 'apk_package' && (
        <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-6 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#39FFB0]" />
                <h3 className="text-base font-bold text-[#F5F5F4]">
                  {isAr ? 'توليد حزمة Android APK لمتجر Google Play' : 'Google Play & Android APK Packaging (TWA)'}
                </h3>
              </div>
              <p className="text-xs text-[#9C9DA3] mt-1">
                {isAr 
                  ? 'يمكنك تغليف تطبيق NasApp إلى حزمة APK أو Android App Bundle (.aab) جاهزة للنشر على Google Play عبر أداة Google Bubblewrap الرسمية.' 
                  : 'Convert NasApp into a signed Android APK or AAB bundle using Google Bubblewrap (Trusted Web Activity).'}
              </p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#39FFB0]/10 text-[#39FFB0] border border-[#39FFB0]/30">
              Package: qa.nasapp.pos
            </span>
          </div>

          {/* Quick CLI Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#EDEDED]">
                {isAr ? 'أوامر التوليد السريعة (Google Bubblewrap CLI):' : 'CLI Generation Commands (Google Bubblewrap):'}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(bubblewrapCommand);
                  setCopiedBubblewrap(true);
                  setTimeout(() => setCopiedBubblewrap(false), 2000);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1E1E21] hover:bg-[#27272A] text-xs text-[#39FFB0] transition cursor-pointer"
              >
                {copiedBubblewrap ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBubblewrap ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الأوامر' : 'Copy Commands')}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#0A0A0B] border border-[#27272A] text-[#39FFB0] font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{bubblewrapCommand}</code>
            </pre>
          </div>

          {/* Web Packaging Options Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#1E1E21] border border-[#27272A] space-y-1.5">
              <h4 className="font-bold text-[#F5F5F4] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#39FFB0]" />
                <span>PWABuilder.com Integration</span>
              </h4>
              <p className="text-[#9C9DA3] text-[11px]">
                {isAr
                  ? 'يمكنك إدخال رابط NasApp في موقع PWABuilder (المدعوم من مايكروسوفت) لتنزيل ملف تثبيت مباشر لنظام Windows Store أو Google Play بنقرة واحدة.'
                  : 'Enter your live NasApp URL into Microsoft PWABuilder to generate Windows Store (.msix) and Android packages with one click.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#1E1E21] border border-[#27272A] space-y-1.5">
              <h4 className="font-bold text-[#F5F5F4] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#39FFB0]" />
                <span>Google Digital Asset Links</span>
              </h4>
              <p className="text-[#9C9DA3] text-[11px]">
                {isAr
                  ? 'تم تجهيز معرفات التطبيق id: "/" و scope: "/" لتفعيل المصادقة الرقمية الكاملة وإزالة شريط المتصفح بالكامل في هواتف الأندرويد.'
                  : 'Pre-configured application identifier id: "/" and scope: "/" for full digital asset links verification.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: MANIFEST SPECS                                    */}
      {/* ======================================================== */}
      {activeTab === 'manifest' && (
        <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F4]">
                manifest.webmanifest (NasApp Standards)
              </h3>
              <p className="text-xs text-[#9C9DA3]">
                {isAr 
                  ? 'ملف التعريف القياسي المدمج لتطبيق NasApp، مع الأيقونات عالية الدقة ووضع standalone' 
                  : 'Standard W3C Web App Manifest configured for NasApp with 192px, 512px and maskable icons.'}
              </p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(manifestJsonString);
                setCopiedManifest(true);
                setTimeout(() => setCopiedManifest(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E1E21] hover:bg-[#27272A] text-xs text-[#39FFB0] transition cursor-pointer"
            >
              {copiedManifest ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedManifest ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ JSON' : 'Copy JSON')}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-[#0A0A0B] border border-[#27272A] text-emerald-400 font-mono text-xs overflow-x-auto max-h-96">
            <code>{manifestJsonString}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default AppCreationView;
