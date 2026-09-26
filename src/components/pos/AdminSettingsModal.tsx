import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Lock
} from 'lucide-react';
import { Language } from '../../i18n';
import { NasappBrandLogo } from '../NasappBrandLogo';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  storeLogo: string | null;
  onUpdateStoreLogo: (newLogo: string | null) => void;
  theme: 'light' | 'dark';
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  storeLogo,
  onUpdateStoreLogo,
  theme
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'security' | 'branding'>('security');

  // Security PIN states
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  // Logo upload states
  const [logoInputUrl, setLogoInputUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getStoredPin = () => {
    try {
      return localStorage.getItem('nasapp_admin_pin') || '1234';
    } catch {
      return '1234';
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    const storedPin = getStoredPin();
    if (currentPin !== storedPin) {
      setPinError(isAr ? 'رمز المرور الحالي غير صحيح' : 'Current Admin PIN is incorrect');
      return;
    }

    if (newPin.length < 4) {
      setPinError(isAr ? 'الرمز الجديد يجب أن يتكون من 4 أرقام على الأقل' : 'New PIN must be at least 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError(isAr ? 'تأكيد الرمز الجديد غير متطابق' : 'New PIN and confirmation do not match');
      return;
    }

    try {
      localStorage.setItem('nasapp_admin_pin', newPin);
      setPinSuccess(isAr ? '✓ تم تحديث رمز مرور المشرف بنجاح' : '✓ Admin Security PIN updated successfully');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch {
      setPinError(isAr ? 'فشل الحفظ في الذاكرة' : 'Failed to save to local storage');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(isAr ? 'حجم الصورة يجب أن لا يتجاوز 2 ميجابايت' : 'Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        onUpdateStoreLogo(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        dir={isAr ? 'rtl' : 'ltr'}
        className={`border rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0A0A0B] border-[#1E1E21] text-[#F5F5F4]'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-[#1E1E21]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-[#151517] border-[#39FFB0]/30 text-[#39FFB0]'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`font-black text-sm sm:text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isAr ? 'إعدادات حماية الموقع والمشرف' : 'Admin Security & Store Settings'}
              </h2>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-[#9C9DA3]'}`}>
                {isAr ? 'حماية النظام وحصر التحكم بالمشرف فقط' : 'Protect POS controls & configure store branding'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isLight 
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600' 
                : 'bg-[#151517] hover:bg-[#1E1E21] border-[#1E1E21] text-[#9C9DA3] hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className={`grid grid-cols-2 p-1 rounded-2xl border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#121215] border-[#1E1E21]'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'security'
                ? isLight 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'bg-[#1E1E21] text-[#39FFB0] shadow-sm'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#9C9DA3] hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isAr ? 'رمز حماية المشرف (PIN)' : 'Admin Security PIN'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'branding'
                ? isLight 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'bg-[#1E1E21] text-[#39FFB0] shadow-sm'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#9C9DA3] hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{isAr ? 'شعار وهوية المتجر' : 'Store Logo & Branding'}</span>
          </button>
        </div>

        {/* TAB 1: SECURITY PIN */}
        {activeTab === 'security' && (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
              isLight ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
            }`}>
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{isAr ? 'حماية النظام مفعلة' : 'System Protection Active'}</p>
                <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                  {isAr 
                    ? 'رمز المرور سري وخاص بالمشرف فقط لحماية لوحة التحكم والمبيعات من وصول العملاء.' 
                    : 'The security PIN is strictly for authorized admins to prevent customers from accessing POS controls.'}
                </p>
              </div>
            </div>

            {pinSuccess && (
              <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              }`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pinSuccess}</span>
              </div>
            )}

            {pinError && (
              <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className={`block text-[10px] mb-1 font-semibold uppercase ${
                  isLight ? 'text-slate-500' : 'text-[#9C9DA3]'
                }`}>
                  {isAr ? 'رمز المرور الحالي:' : 'Current Admin PIN:'}
                </label>
                <input
                  type="password"
                  required
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder="••••"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none border transition ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900' 
                      : 'bg-[#000000] border-[#1E1E21] focus:border-[#39FFB0] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] mb-1 font-semibold uppercase ${
                  isLight ? 'text-slate-500' : 'text-[#9C9DA3]'
                }`}>
                  {isAr ? 'رمز المرور الجديد (4 أرقام أو أكثر):' : 'New Admin PIN (4+ digits):'}
                </label>
                <input
                  type="password"
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="••••"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none border transition ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900' 
                      : 'bg-[#000000] border-[#1E1E21] focus:border-[#39FFB0] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] mb-1 font-semibold uppercase ${
                  isLight ? 'text-slate-500' : 'text-[#9C9DA3]'
                }`}>
                  {isAr ? 'تأكيد رمز المرور الجديد:' : 'Confirm New PIN:'}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="••••"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none border transition ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900' 
                      : 'bg-[#000000] border-[#1E1E21] focus:border-[#39FFB0] text-white'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                isLight 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                  : 'bg-[#39FFB0] hover:opacity-90 text-black font-black shadow-[#39FFB0]/20'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'حفظ وتحديث رمز المشرف' : 'Save & Update Admin PIN'}</span>
            </button>
          </form>
        )}

        {/* TAB 2: BRANDING & STORE LOGO */}
        {activeTab === 'branding' && (
          <div className="space-y-4 text-xs">
            {/* Current Preview */}
            <div className={`flex flex-col items-center justify-center gap-2.5 py-4 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121215] border-[#1E1E21]'
            }`}>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                isLight ? 'text-slate-500' : 'text-[#9C9DA3]'
              }`}>
                {isAr ? 'معاينة الشعار الحالي:' : 'Current Store Logo Preview:'}
              </span>
              <div className={`w-20 h-20 rounded-2xl border-2 overflow-hidden flex items-center justify-center p-1 shadow-lg ${
                isLight ? 'bg-white border-emerald-400 shadow-emerald-500/10' : 'bg-[#000000] border-[#39FFB0]/60 shadow-[#39FFB0]/10'
              }`}>
                {storeLogo ? (
                  <img src={storeLogo} alt="Custom Logo" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <NasappBrandLogo theme={theme} className="w-full h-full" />
                )}
              </div>

              {storeLogo && (
                <button
                  type="button"
                  onClick={() => onUpdateStoreLogo(null)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border ${
                    isLight 
                      ? 'bg-white hover:bg-emerald-50 border-emerald-300 text-emerald-700' 
                      : 'bg-[#1E1E21] hover:bg-emerald-950/60 border-[#39FFB0]/40 text-[#39FFB0]'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'استعادة شعار ناس آب الأصلي' : 'Restore Default Logo'}</span>
                </button>
              )}
            </div>

            {/* Upload File */}
            <div className="space-y-2">
              <label className={`block text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {isAr ? '1. رفع صورة شعار من جهازك (PNG / JPG / SVG):' : '1. Upload Logo from Device (PNG / JPG / SVG):'}
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${
                  isLight 
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800' 
                    : 'bg-[#1A2E24] hover:bg-[#224032] border-[#39FFB0]/40 text-[#39FFB0]'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{isAr ? 'اختيار ملف صورة الشعار' : 'Choose Logo Image File'}</span>
              </button>
            </div>

            {/* Paste Image URL */}
            <div className={`space-y-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-[#1E1E21]'}`}>
              <label className={`block text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {isAr ? '2. أو إدخال رابط صورة الشعار (URL):' : '2. Or Paste Image URL:'}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LinkIcon className={`w-3.5 h-3.5 absolute left-3 top-3 ${
                    isLight ? 'text-slate-400' : 'text-[#5E5F64]'
                  }`} />
                  <input
                    type="url"
                    value={logoInputUrl}
                    onChange={(e) => setLogoInputUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono outline-none border transition ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white' 
                        : 'bg-[#000000] border-[#1E1E21] focus:border-[#39FFB0] text-white'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (logoInputUrl.trim()) {
                      onUpdateStoreLogo(logoInputUrl.trim());
                      setLogoInputUrl('');
                    }
                  }}
                  disabled={!logoInputUrl.trim()}
                  className={`px-3.5 py-2 disabled:opacity-30 font-bold rounded-xl text-xs transition cursor-pointer shrink-0 ${
                    isLight 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                      : 'bg-[#39FFB0] text-black'
                  }`}
                >
                  {isAr ? 'تطبيق' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
