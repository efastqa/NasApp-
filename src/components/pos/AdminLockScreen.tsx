import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Delete, 
  Settings2,
  Store,
  CheckCircle2,
  Globe,
  Sun,
  Moon,
  RotateCcw,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { Language, translations } from '../../i18n';
import { NasappBrandLogo } from '../NasappBrandLogo';
import { useTheme } from '../../ThemeContext';

interface AdminLockScreenProps {
  onUnlock: () => void;
  lang?: Language;
  onToggleLang?: () => void;
  onOpenCustomerView?: () => void;
  storeLogo?: string | null;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const AdminLockScreen: React.FC<AdminLockScreenProps> = ({
  onUnlock,
  lang = 'en',
  onToggleLang,
  onOpenCustomerView,
  storeLogo: initialStoreLogo,
  theme: propTheme,
  onToggleTheme: propToggleTheme
}) => {
  const contextTheme = useTheme();
  const theme = propTheme || contextTheme.theme;
  const toggleTheme = propToggleTheme || contextTheme.toggleTheme;
  const isLight = theme === 'light';

  const isAr = lang === 'ar';
  const t = translations[lang];

  const storeLogo = initialStoreLogo !== undefined 
    ? initialStoreLogo 
    : (typeof window !== 'undefined' ? localStorage.getItem('nasapp_store_logo') : null);

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);

  // Admin Reset Password & Recovery States
  const [isResettingPin, setIsResettingPin] = useState<boolean>(false);
  const [masterKeyInput, setMasterKeyInput] = useState<string>('');
  const [resetNewPin, setResetNewPin] = useState<string>('');
  const [resetConfirmPin, setResetConfirmPin] = useState<string>('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Master emergency security keys accepted for administrative recovery:
  const MASTER_RECOVERY_KEYS = [
    '9740',
    '974',
    'NASAPP-SUPERADMIN-974',
    'NASAPP-974',
    'efastqa@gmail.com',
    'admin@nasapp.qa',
    '1234'
  ];

  // Pin change form states
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [changeSuccess, setChangeSuccess] = useState<string | null>(null);

  const getStoredPin = () => {
    try {
      return localStorage.getItem('nasapp_admin_pin') || '1234';
    } catch {
      return '1234';
    }
  };

  const handleKeyPress = (num: string) => {
    if (enteredPin.length < 10) {
      const next = enteredPin + num;
      setEnteredPin(next);
      setErrorMsg(null);
      
      // Auto verify if matches length of 4 digits
      const stored = getStoredPin();
      if (next === stored) {
        setTimeout(() => {
          onUnlock();
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg(null);
  };

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const stored = getStoredPin();
    if (enteredPin === stored) {
      setErrorMsg(null);
      onUnlock();
    } else {
      setErrorMsg(isAr ? 'رمز المرور غير صحيح، يرجى المحاولة مرة أخرى أو النقر على "استعادة كلمة المرور"' : 'Incorrect PIN. Try again or click "Forgot PIN / Reset Password" below.');
      setEnteredPin('');
    }
  };

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isChangingPin || isResettingPin) return; // ignore if user typing in form

      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleVerify();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enteredPin, isChangingPin, isResettingPin]);

  // Master Recovery Reset Submission
  const handleMasterResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const enteredKey = masterKeyInput.trim().toLowerCase();
    const isMasterValid = MASTER_RECOVERY_KEYS.some(k => k.toLowerCase() === enteredKey);

    if (!isMasterValid) {
      setErrorMsg(t.masterKeyInvalid || (isAr ? 'مفتاح الاستعادة غير صحيح، يرجى التحقق والمحاولة ثانية' : 'Invalid Master Recovery Key. Please try again.'));
      return;
    }

    if (resetNewPin.length < 4) {
      setErrorMsg(isAr ? 'الرمز الجديد يجب أن يتكون من 4 أرقام على الأقل' : 'New PIN must be at least 4 digits');
      return;
    }

    if (resetNewPin !== resetConfirmPin) {
      setErrorMsg(isAr ? 'تأكيد الرمز الجديد غير متطابق' : 'New PIN and confirmation do not match');
      return;
    }

    try {
      localStorage.setItem('nasapp_admin_pin', resetNewPin);
      setResetSuccessMsg(t.resetPinSuccess || (isAr ? '✓ تم استعادة وإعادة تعيين رمز المشرف بنجاح!' : '✓ Admin Security PIN has been reset successfully!'));
      setErrorMsg(null);
      setTimeout(() => {
        setIsResettingPin(false);
        setResetSuccessMsg(null);
        setMasterKeyInput('');
        setResetNewPin('');
        setResetConfirmPin('');
        onUnlock();
      }, 1000);
    } catch {
      setErrorMsg(isAr ? 'تعذر الحفظ في الذاكرة' : 'Could not save to local storage');
    }
  };

  // Instant Reset to Factory Default PIN (1234)
  const handleRestoreDefaultPin = () => {
    try {
      localStorage.setItem('nasapp_admin_pin', '1234');
      setResetSuccessMsg(isAr ? '✓ تم استعادة الرمز الافتراضي (1234) بنجاح! يتم الآن فتح لوحة التحكم...' : '✓ Default PIN (1234) restored successfully! Unlocking POS...');
      setErrorMsg(null);
      setTimeout(() => {
        setIsResettingPin(false);
        setResetSuccessMsg(null);
        onUnlock();
      }, 1000);
    } catch {
      setErrorMsg(isAr ? 'تعذر إعادة تعيين الرمز' : 'Could not reset PIN');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = getStoredPin();
    if (currentPinInput !== stored) {
      setErrorMsg(isAr ? 'رمز المرور الحالي غير صحيح' : 'Current PIN is incorrect');
      return;
    }

    if (newPinInput.length < 4) {
      setErrorMsg(isAr ? 'الرمز الجديد يجب أن يتكون من 4 أرقام على الأقل' : 'New PIN must be at least 4 digits');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setErrorMsg(isAr ? 'تأكيد الرمز الجديد غير متطابق' : 'New PIN and confirmation do not match');
      return;
    }

    try {
      localStorage.setItem('nasapp_admin_pin', newPinInput);
      setChangeSuccess(isAr ? '✓ تم تغيير رمز مرور المشرف بنجاح!' : '✓ Admin PIN changed successfully!');
      setErrorMsg(null);
      setTimeout(() => {
        setIsChangingPin(false);
        setChangeSuccess(null);
        setCurrentPinInput('');
        setNewPinInput('');
        setConfirmPinInput('');
      }, 1500);
    } catch {
      setErrorMsg(isAr ? 'تعذر الحفظ في الذاكرة' : 'Could not save to local storage');
    }
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className={`min-h-screen flex flex-col justify-between font-sans p-4 sm:p-6 select-none transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#040405] text-[#F5F5F4]'
    }`}>
      
      {/* Top Bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          {storeLogo ? (
            <div className={`w-9 h-9 rounded-xl border overflow-hidden flex items-center justify-center p-0.5 shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-black border-[#39FFB0]/40'
            }`}>
              <img src={storeLogo} alt="Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
          ) : (
            <NasappBrandLogo theme={theme} className="w-9 h-9 rounded-xl shadow-sm" />
          )}
          <div>
            <h1 className={`font-extrabold text-sm tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              NasApp.qa POS
            </h1>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-[#9C9DA3]'}`}>
              {isAr ? 'نظام الكاشير وإدارة المبيعات' : 'Point of Sale & Admin Panel'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border shadow-sm ${
              isLight 
                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' 
                : 'bg-[#151517] hover:bg-[#1E1E21] border-[#1E1E21] text-amber-300'
            }`}
            title={isAr ? 'تغيير المظهر (فاتح / داكن)' : 'Toggle Light/Dark Theme'}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline text-[11px] font-medium">{isAr ? 'داكن' : 'Dark'}</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[11px] font-medium">{isAr ? 'فاتح' : 'Light'}</span>
              </>
            )}
          </button>

          {onToggleLang && (
            <button
              onClick={onToggleLang}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' 
                  : 'bg-[#151517] hover:bg-[#1E1E21] border-[#1E1E21] text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>{isAr ? 'EN' : 'العربية'}</span>
            </button>
          )}

          {onOpenCustomerView && (
            <button
              onClick={onOpenCustomerView}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                isLight 
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800' 
                  : 'bg-[#151517] hover:bg-[#1E1E21] border-[#39FFB0]/30 text-[#39FFB0]'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{isAr ? 'قائمة العملاء' : 'Customer Menu'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Lock Card */}
      <div className={`max-w-sm w-full mx-auto border rounded-3xl p-6 shadow-2xl space-y-6 my-auto transition-colors duration-200 ${
        isLight ? 'bg-white border-slate-200 shadow-slate-200/60' : 'bg-[#0A0A0B] border-[#1E1E21]'
      }`}>
        
        {isResettingPin ? (
          /* ======================================================== */
          /* ADMIN RESET PASSWORD & RECOVERY PANEL                    */
          /* ======================================================== */
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border shadow-sm ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
              }`}>
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className={`font-black text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {t.resetAdminPinTitle}
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#9C9DA3]'}`}>
                {t.resetAdminPinDesc}
              </p>
            </div>

            {resetSuccessMsg && (
              <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2 animate-in zoom-in-95 ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              }`}>
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="font-bold">{resetSuccessMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick One-Click Factory Reset to 1234 Button */}
            <div className={`p-3.5 rounded-2xl border space-y-2 ${
              isLight ? 'bg-amber-50/70 border-amber-200 text-amber-950' : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.restoreDefaultPin}</span>
                </span>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                  1234
                </span>
              </div>
              <p className="text-[10px] opacity-80">
                {t.restoreDefaultPinDesc}
              </p>
              <button
                type="button"
                onClick={handleRestoreDefaultPin}
                className="w-full py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-98 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t.confirmRestoreDefault}</span>
              </button>
            </div>

            {/* Master Key Custom Reset Option */}
            <form onSubmit={handleMasterResetSubmit} className="space-y-3 pt-2 border-t border-slate-200 dark:border-[#1E1E21]">
              <span className={`block text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {isAr ? 'أو تعيين رمز جديد عبر مفتاح الاستعادة:' : 'Or set a new PIN via Master Recovery Key:'}
              </span>

              <div>
                <label className={`block text-[10px] mb-1 font-semibold uppercase ${
                  isLight ? 'text-slate-500' : 'text-[#9C9DA3]'
                }`}>
                  {t.enterMasterKey}
                </label>
                <input
                  type="text"
                  required
                  value={masterKeyInput}
                  onChange={(e) => setMasterKeyInput(e.target.value)}
                  placeholder={t.masterKeyPlaceholder}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 focus:border-amber-500 text-slate-900' 
                      : 'bg-[#000000] border-[#1E1E21] focus:border-amber-400 text-white'
                  }`}
                />
                <span className={`text-[9px] mt-0.5 block ${isLight ? 'text-slate-400' : 'text-[#5E5F64]'}`}>
                  {isAr ? 'رمز الطوارئ الافتراضي: 9740 أو بريد المشرف المسجل' : 'Emergency master key: 9740 or registered admin email'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-[10px] mb-1 font-semibold uppercase ${
                    isLight ? 'text-slate-500' : 'text-[#9C9DA3]'
                  }`}>
                    {isAr ? 'الرمز الجديد (4+)' : 'New PIN (4+)'}
                  </label>
                  <input
                    type="password"
                    required
                    value={resetNewPin}
                    onChange={(e) => setResetNewPin(e.target.value)}
                    placeholder="••••"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono outline-none border transition ${
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
                    {isAr ? 'تأكيد الرمز' : 'Confirm PIN'}
                  </label>
                  <input
                    type="password"
                    required
                    value={resetConfirmPin}
                    onChange={(e) => setResetConfirmPin(e.target.value)}
                    placeholder="••••"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono outline-none border transition ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900' 
                        : 'bg-[#000000] border-[#1E1E21] focus:border-[#39FFB0] text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResettingPin(false);
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2.5 border text-xs font-semibold rounded-xl transition cursor-pointer ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                      : 'bg-[#121215] hover:bg-[#1E1E21] border-[#1E1E21] text-[#9C9DA3]'
                  }`}
                >
                  {isAr ? 'رجوع' : 'Back'}
                </button>

                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer shadow-sm ${
                    isLight 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                      : 'bg-[#39FFB0] hover:opacity-90 text-black'
                  }`}
                >
                  {isAr ? 'تعيين وفتح' : 'Reset & Unlock'}
                </button>
              </div>
            </form>
          </div>
        ) : !isChangingPin ? (
          <>
            {/* Lock Header */}
            <div className="text-center space-y-2">
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg transition-colors ${
                isLight 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-emerald-500/10' 
                  : 'bg-gradient-to-b from-[#151517] to-[#0D0D10] border border-[#39FFB0]/30 text-[#39FFB0] shadow-[#39FFB0]/10'
              }`}>
                <KeyRound className="w-8 h-8" />
              </div>
              <h2 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isAr ? 'تسجيل دخول المشرف / الكاشير' : 'Admin & Staff Access'}
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-[#9C9DA3]'}`}>
                {isAr ? 'أدخل رمز مرور المشرف للمتابعة' : 'Enter Admin Security PIN to continue'}
              </p>
            </div>

            {/* PIN Dots / Input Display */}
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="relative">
                <div className={`h-14 border-2 rounded-2xl flex items-center justify-center px-4 tracking-[0.5em] text-xl font-mono font-bold transition ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 focus-within:border-emerald-500 text-emerald-700' 
                    : 'bg-[#000000] border-[#1E1E21] focus-within:border-[#39FFB0] text-[#39FFB0]'
                }`}>
                  {showPassword ? (
                    <span>{enteredPin || <span className={`tracking-normal text-xs font-sans ${isLight ? 'text-slate-400' : 'text-[#5E5F64]'}`}>{isAr ? 'أدخل الرمز...' : 'Enter PIN...'}</span>}</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      {Array.from({ length: Math.max(4, enteredPin.length) }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                            idx < enteredPin.length
                              ? isLight 
                                ? 'bg-emerald-600 scale-110 shadow-sm shadow-emerald-500/50' 
                                : 'bg-[#39FFB0] scale-110 shadow-sm shadow-[#39FFB0]'
                              : isLight ? 'bg-slate-200' : 'bg-[#1E1E21]'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${isAr ? 'left-3' : 'right-3'} top-4 transition cursor-pointer ${
                    isLight ? 'text-slate-400 hover:text-slate-600' : 'text-[#5E5F64] hover:text-[#9C9DA3]'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {errorMsg && (
                <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 animate-shake ${
                  isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Touch Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeyPress(digit)}
                    className={`h-12 rounded-2xl border text-lg font-mono font-bold transition flex items-center justify-center cursor-pointer shadow-sm ${
                      isLight 
                        ? 'bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 active:bg-emerald-600 active:text-white border-slate-200 text-slate-800' 
                        : 'bg-[#121215] hover:bg-[#1E1E21] active:bg-[#39FFB0] active:text-black border-[#1E1E21] text-white'
                    }`}
                  >
                    {digit}
                  </button>
                ))}
                
                <button
                  type="button"
                  onClick={handleClear}
                  className={`h-12 rounded-2xl border text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600' 
                      : 'bg-[#121215] hover:bg-[#1E1E21] border-[#1E1E21] text-[#9C9DA3] hover:text-white'
                  }`}
                >
                  {isAr ? 'مسح' : 'C'}
                </button>

                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className={`h-12 rounded-2xl border text-lg font-mono font-bold transition flex items-center justify-center cursor-pointer shadow-sm ${
                    isLight 
                      ? 'bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 active:bg-emerald-600 active:text-white border-slate-200 text-slate-800' 
                      : 'bg-[#121215] hover:bg-[#1E1E21] active:bg-[#39FFB0] active:text-black border-[#1E1E21] text-white'
                  }`}
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className={`h-12 rounded-2xl border text-sm transition flex items-center justify-center cursor-pointer ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-red-50 hover:border-red-200 border-slate-200 text-slate-500 hover:text-red-600' 
                      : 'bg-[#121215] hover:bg-[#1E1E21] border-[#1E1E21] text-[#9C9DA3] hover:text-red-400'
                  }`}
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Submit Unlock Button */}
              <button
                type="submit"
                className={`w-full py-3.5 font-black rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98 ${
                  isLight 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25' 
                    : 'bg-[#39FFB0] hover:opacity-90 text-black shadow-[#39FFB0]/20'
                }`}
              >
                <Unlock className="w-4 h-4" />
                <span>{isAr ? 'فتح لوحة التحكم' : 'Unlock POS Panel'}</span>
              </button>
            </form>

            {/* Change PIN & Reset Password Trigger Links */}
            <div className={`pt-3 border-t flex flex-col sm:flex-row items-center justify-center gap-3 text-xs ${
              isLight ? 'border-slate-200 text-slate-500' : 'border-[#1E1E21] text-[#9C9DA3]'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setIsResettingPin(true);
                  setIsChangingPin(false);
                  setErrorMsg(null);
                }}
                className={`flex items-center gap-1.5 transition cursor-pointer font-bold ${
                  isLight ? 'text-amber-700 hover:text-amber-900' : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.forgotAdminPin}</span>
              </button>

              <span className="hidden sm:inline text-slate-300 dark:text-[#2A2A30]">•</span>

              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(true);
                  setIsResettingPin(false);
                  setErrorMsg(null);
                }}
                className={`flex items-center gap-1.5 transition cursor-pointer ${
                  isLight ? 'hover:text-emerald-700' : 'hover:text-[#39FFB0]'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'تغيير رمز المرور' : 'Change Admin PIN'}</span>
              </button>
            </div>
          </>
        ) : (
          /* ======================================================== */
          /* CHANGE ADMIN PIN FORM                                   */
          /* ======================================================== */
          <form onSubmit={handleChangePinSubmit} className="space-y-4">
            <div className="text-center space-y-1">
              <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-[#1A2E24] border-[#39FFB0]/40 text-[#39FFB0]'
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isAr ? 'تغيير رمز مرور المشرف' : 'Change Admin PIN'}
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#9C9DA3]'}`}>
                {isAr ? 'قم بإنشاء رمز حماية جديد للوحة التحكم' : 'Create a new security PIN for your POS system'}
              </p>
            </div>

            {changeSuccess && (
              <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              }`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{changeSuccess}</span>
              </div>
            )}

            {errorMsg && (
              <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className={`block text-[10px] mb-1 font-semibold uppercase ${
                  isLight ? 'text-slate-500' : 'text-[#9C9DA3]'
                }`}>
                  {isAr ? 'رمز المرور الحالي:' : 'Current PIN:'}
                </label>
                <input
                  type="password"
                  required
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
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
                  {isAr ? 'رمز المرور الجديد (4 أرقام أو أكثر):' : 'New PIN (4+ digits):'}
                </label>
                <input
                  type="password"
                  required
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
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
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="••••"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none border transition ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900' 
                      : 'bg-[#000000] border-[#1E1E21] focus:border-[#39FFB0] text-white'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(false);
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2.5 border text-xs font-semibold rounded-xl transition cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                    : 'bg-[#121215] hover:bg-[#1E1E21] border-[#1E1E21] text-[#9C9DA3]'
                }`}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer shadow-sm ${
                  isLight 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-[#39FFB0] hover:opacity-90 text-black'
                }`}
              >
                {isAr ? 'حفظ الرمز' : 'Save PIN'}
              </button>
            </div>

            <div className="pt-2 text-center border-t border-slate-100 dark:border-[#1E1E21]">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(false);
                  setIsResettingPin(true);
                  setErrorMsg(null);
                }}
                className={`text-[11px] font-semibold underline transition cursor-pointer ${
                  isLight ? 'text-amber-700 hover:text-amber-900' : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                {t.forgotAdminPin}
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Footer Branding */}
      <footer className={`text-center text-[10px] py-2 ${isLight ? 'text-slate-400' : 'text-[#5E5F64]'}`}>
        <p>🔒 Enterprise Encrypted POS • NasApp.qa Suite</p>
      </footer>

    </div>
  );
};

export default AdminLockScreen;
