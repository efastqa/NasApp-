import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, CheckCircle, Share, PlusSquare, X, Monitor, ArrowRight, Sparkles } from 'lucide-react';

interface PWAInstallButtonProps {
  lang?: 'en' | 'ar';
  variant?: 'header' | 'sidebar' | 'banner' | 'card';
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  lang = 'en',
  variant = 'header',
  onInstalled,
}) => {
  const { isInstallable, isInstalled, isIOS, install, platformName } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const isAr = lang === 'ar';

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        if (onInstalled) onInstalled();
      }
    } else {
      setShowModal(true);
    }
  };

  if (isInstalled && variant !== 'card') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>NasApp {isAr ? 'مثبّت' : 'Installed'}</span>
      </div>
    );
  }

  // Variant: header (compact, high polish neon CTA)
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          title={isAr ? 'تثبيت تطبيق NasApp على جهازك' : 'Install NasApp on your device'}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#39FFB0] text-[#0A0A0B] text-xs font-bold hover:bg-[#2ee69c] active:scale-95 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(57,255,176,0.35)] cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
          <span className="tracking-wide">
            {isAr ? 'تثبيت NasApp' : 'Install NasApp'}
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.2 bg-[#0A0A0B]/15 rounded text-[10px] uppercase font-mono">
            APP
          </span>
        </button>

        {showModal && <InstallGuideModal lang={lang} isIOS={isIOS} onClose={() => setShowModal(false)} />}
      </>
    );
  }

  // Variant: sidebar (full width button inside sidebar footer or menu)
  if (variant === 'sidebar') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-emerald-900/20 border border-emerald-500/30 hover:border-emerald-400/60 text-[#EDEDED] hover:text-[#39FFB0] transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#39FFB0]/10 border border-[#39FFB0]/30 flex items-center justify-center text-[#39FFB0] group-hover:bg-[#39FFB0] group-hover:text-[#0A0A0B] transition-colors">
              <Download className="w-4 h-4" />
            </div>
            <div className="text-start">
              <div className="text-xs font-bold text-[#F5F5F4] flex items-center gap-1.5">
                <span>{isAr ? 'تطبيق NasApp' : 'NasApp Native App'}</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-[#39FFB0]">
                  PWA
                </span>
              </div>
              <div className="text-[10px] text-[#9C9DA3]">
                {isInstalled 
                  ? (isAr ? 'تطبيق مثبت ونشط' : 'App Active & Installed')
                  : (isAr ? 'تثبيت بنقرة واحدة' : '1-Click Install')}
              </div>
            </div>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 text-[#5E5F64] group-hover:text-[#39FFB0] transition-transform ${isAr ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
        </button>

        {showModal && <InstallGuideModal lang={lang} isIOS={isIOS} onClose={() => setShowModal(false)} />}
      </>
    );
  }

  // Variant: banner (prominent notification banner)
  if (variant === 'banner') {
    return (
      <>
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#121E19] via-[#0E1713] to-[#0A0A0B] border border-[#39FFB0]/30 shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#39FFB0]/15 border border-[#39FFB0]/40 flex items-center justify-center text-[#39FFB0] shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#F5F5F4] flex items-center gap-2">
                <span>{isAr ? 'تثبيت تطبيق NasApp للتشغيل السريع' : 'Install NasApp for Instant Access'}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#39FFB0] text-[#0A0A0B]">
                  OFFICIAL
                </span>
              </div>
              <p className="text-[11px] text-[#9C9DA3]">
                {isAr 
                  ? 'يعمل كتطبيق أصلي على شاشة هاتفك أو حاسوبك بدون إنترنت وبسرعة فائقة'
                  : 'Runs full-screen with offline support, fast barcode scanning, and receipt printing.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-2 rounded-xl bg-[#39FFB0] text-[#0A0A0B] text-xs font-bold hover:bg-[#2ee69c] transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تثبيت التطبيق الآن' : 'Install NasApp'}</span>
          </button>
        </div>

        {showModal && <InstallGuideModal lang={lang} isIOS={isIOS} onClose={() => setShowModal(false)} />}
      </>
    );
  }

  // Default card variant
  return (
    <>
      <button
        onClick={handleInstallClick}
        className="px-4 py-2.5 rounded-xl bg-[#39FFB0] text-[#0A0A0B] font-bold text-xs hover:bg-[#2ee69c] transition flex items-center gap-2 shadow-md cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>{isAr ? 'تثبيت NasApp الآن' : 'Install NasApp Now'}</span>
      </button>

      {showModal && <InstallGuideModal lang={lang} isIOS={isIOS} onClose={() => setShowModal(false)} />}
    </>
  );
};

// ==========================================
// DETAILED MODAL GUIDE FOR iOS & DESKTOP
// ==========================================
export const InstallGuideModal: React.FC<{
  lang: 'en' | 'ar';
  isIOS: boolean;
  onClose: () => void;
}> = ({ lang, isIOS, onClose }) => {
  const isAr = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-[#121214] border border-[#27272A] p-6 shadow-2xl text-[#EDEDED]">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-lg text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#1E1E21] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#39FFB0]/10 border border-[#39FFB0]/30 flex items-center justify-center text-[#39FFB0]">
            {isIOS ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F5F5F4]">
              {isAr ? 'تثبيت تطبيق NasApp' : 'Install NasApp'}
            </h3>
            <p className="text-xs text-[#9C9DA3]">
              {isAr ? 'احصل على تجربة التطبيق الأصلي للشاشة الرئيسية' : 'Add to home screen or desktop for native speed'}
            </p>
          </div>
        </div>

        {isIOS ? (
          /* iOS Step by step */
          <div className="space-y-3 my-4 text-xs">
            <div className="p-3 rounded-xl bg-[#1E1E21] border border-[#27272A] flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div>
                <p className="font-semibold text-[#F5F5F4]">
                  {isAr ? 'افتح الموقع في متصفح Safari' : 'Open in Safari browser'}
                </p>
                <p className="text-[#9C9DA3] mt-0.5">
                  {isAr ? 'تأكد من أنك تستخدم متصفح سفاري على iPhone أو iPad' : 'Make sure you are browsing via Safari on your Apple device'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#1E1E21] border border-[#27272A] flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div>
                <p className="font-semibold text-[#F5F5F4] flex items-center gap-1.5">
                  <span>{isAr ? 'اضغط على زر المشاركة' : 'Tap the Share icon'}</span>
                  <Share className="w-3.5 h-3.5 text-[#39FFB0] inline" />
                </p>
                <p className="text-[#9C9DA3] mt-0.5">
                  {isAr ? 'الموجود في شريط أسفل الشاشة أو أعلى شريط العنوان' : 'Located at the bottom toolbar or top address bar'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#1E1E21] border border-[#27272A] flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div>
                <p className="font-semibold text-[#F5F5F4] flex items-center gap-1.5">
                  <span>{isAr ? 'اختر "إضافة إلى الصفحة الرئيسية"' : 'Select "Add to Home Screen"'}</span>
                  <PlusSquare className="w-3.5 h-3.5 text-[#39FFB0] inline" />
                </p>
                <p className="text-[#9C9DA3] mt-0.5">
                  {isAr ? 'سيمت إضافة أيقونة "NasApp" الفورية إلى شاشة جهازك' : 'NasApp icon will be added to your home screen instantly'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Android / Desktop Step by step */
          <div className="space-y-3 my-4 text-xs">
            <div className="p-3 rounded-xl bg-[#1E1E21] border border-[#27272A] flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div>
                <p className="font-semibold text-[#F5F5F4]">
                  {isAr ? 'من شريط العنوان في المتصفح (Chrome أو Edge)' : 'From Browser Address Bar (Chrome / Edge)'}
                </p>
                <p className="text-[#9C9DA3] mt-0.5">
                  {isAr 
                    ? 'اضغط على رمز التثبيت ⊕ في أقصى يمين شريط العنوان أو القائمة (⋮)'
                    : 'Click the install icon ⊕ on the right side of the address bar or open the (⋮) menu'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#1E1E21] border border-[#27272A] flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#39FFB0]/20 text-[#39FFB0] flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div>
                <p className="font-semibold text-[#F5F5F4]">
                  {isAr ? 'اختر "تثبيت NasApp"' : 'Click "Install NasApp"'}
                </p>
                <p className="text-[#9C9DA3] mt-0.5">
                  {isAr 
                    ? 'سيتم تثبيت التطبيق وفتحه في نافذة مستقلة مع إضافة اختصار لسطح المكتب'
                    : 'The app will launch in its own dedicated window without browser address bars'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#1E1E21] hover:bg-[#27272A] text-xs font-semibold text-[#EDEDED] transition cursor-pointer"
          >
            {isAr ? 'حسناً، فهمت' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
