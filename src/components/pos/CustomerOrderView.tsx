import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Trash2, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  ArrowLeft, 
  CheckCircle2, 
  MessageSquare,
  Sparkles,
  Camera,
  Globe,
  Plus,
  Minus,
  Edit2,
  ChevronRight,
  Package,
  Bike,
  ChefHat,
  Bell,
  RefreshCw,
  SearchCode,
  Store,
  Check,
  Download,
  Sun,
  Moon
} from 'lucide-react';
import { Product, CartItem, Order } from '../../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ProductModifierModal } from './ProductModifierModal';
import { Language, translations } from '../../i18n';
import { NasappBrandLogo } from '../NasappBrandLogo';
import { useTheme } from '../../ThemeContext';

interface CustomerOrderViewProps {
  products: Product[];
  orders?: Order[];
  onSubmitOrder: (orderPayload: any) => Promise<any>;
  onExitCustomerMode?: () => void;
  lang?: Language;
  onToggleLang?: () => void;
  storeLogo?: string | null;
  onUpdateStoreLogo?: (newLogo: string | null) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const CustomerOrderView: React.FC<CustomerOrderViewProps> = ({
  products,
  orders = [],
  onSubmitOrder,
  onExitCustomerMode,
  lang = 'en',
  onToggleLang,
  storeLogo: initialStoreLogo,
  onUpdateStoreLogo,
  theme: themeProp,
  onToggleTheme: onToggleThemeProp
}) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  const contextTheme = useTheme();
  const [internalTheme, setInternalTheme] = useState<'light' | 'dark'>(() => {
    if (themeProp) return themeProp;
    if (contextTheme?.theme) return contextTheme.theme;
    try {
      const saved = localStorage.getItem('pos_theme') || localStorage.getItem('nasapp_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  });

  const currentTheme = themeProp || contextTheme?.theme || internalTheme;
  const isLight = currentTheme === 'light';

  const handleToggleTheme = () => {
    if (onToggleThemeProp) {
      onToggleThemeProp();
    } else if (contextTheme?.toggleTheme) {
      contextTheme.toggleTheme();
    } else {
      const next = currentTheme === 'light' ? 'dark' : 'light';
      setInternalTheme(next);
      try {
        localStorage.setItem('pos_theme', next);
        localStorage.setItem('nasapp_theme', next);
      } catch {}
    }
  };

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('track') || params.get('orderId') || null;
    } catch {
      return null;
    }
  });
  const [trackSearchInput, setTrackSearchInput] = useState<string>('');
  const [showLookupModal, setShowLookupModal] = useState<boolean>(false);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);

  // Store Logo state (defaults to null which renders the original NasappBrandLogo)
  const storeLogo = initialStoreLogo !== undefined 
    ? initialStoreLogo 
    : (typeof window !== 'undefined' ? localStorage.getItem('nasapp_store_logo') : null);

  // Modifiers Selection
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);

  const isDirectCustomerUrl = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('customer') === '1');

  const BUSINESS_WHATSAPP = '97477315415';
  const fmt = (n: number) => (isAr ? `${Number(n).toFixed(2)} ر.ق` : `QR ${Number(n).toFixed(2)}`);

  // Active tracked order from live orders list
  const activeTrackedOrder: Order | undefined = orderSuccessId 
    ? orders.find(o => o.id.toLowerCase() === orderSuccessId.toLowerCase())
    : undefined;

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort()];

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchesQ = p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    return matchesQ && matchesCat;
  });

  const handleProductSelect = (product: Product) => {
    if (product.stock <= 0) return;

    if (product.modifierGroups && product.modifierGroups.length > 0) {
      setModifierProduct(product);
      setEditingCartItem(null);
    } else {
      addToCartDirect(product);
    }
  };

  const addToCartDirect = (product: Product) => {
    const existing = cart.find(c => c.productId === product.id && (!c.selectedModifiers || c.selectedModifiers.length === 0));
    if (existing) {
      if (existing.qty >= product.stock) {
        alert(isAr ? `الكمية المتوفرة ${product.stock} فقط` : `Only ${product.stock} available`);
        return;
      }
      setCart(cart.map(c => (c.productId === product.id && (!c.selectedModifiers || c.selectedModifiers.length === 0)) ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { 
        productId: product.id, 
        name: product.name, 
        basePrice: product.price,
        price: product.price, 
        qty: 1, 
        stock: product.stock 
      }]);
    }
  };

  const handleConfirmModifiers = (item: CartItem) => {
    if (editingCartItem) {
      setCart(cart.map(c => c === editingCartItem ? item : c));
      setEditingCartItem(null);
    } else {
      setCart([...cart, item]);
    }
    setModifierProduct(null);
  };

  const changeQty = (index: number, delta: number) => {
    const item = cart[index];
    if (!item) return;
    const prod = products.find(p => p.id === item.productId);
    const newQty = item.qty + delta;

    if (newQty <= 0) {
      setCart(cart.filter((_, idx) => idx !== index));
    } else if (prod && newQty > prod.stock) {
      alert(isAr ? `الكمية المتوفرة ${prod.stock} فقط` : `Only ${prod.stock} available`);
    } else {
      setCart(cart.map((c, idx) => idx === index ? { ...c, qty: newQty } : c));
    }
  };

  const handleEditItem = (item: CartItem) => {
    const prod = products.find(p => p.id === item.productId);
    if (prod) {
      setModifierProduct(prod);
      setEditingCartItem(item);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryFee = deliveryMethod === 'delivery' ? 10.00 : 0.00;
  const total = subtotal + deliveryFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert(isAr ? 'يرجى إضافة أصناف إلى سلتك أولاً' : 'Your cart is empty.');
      return;
    }
    if (!customerPhone.trim()) {
      alert(isAr ? 'يرجى إدخال رقم الجوال للمتابعة' : 'Please provide your contact phone number.');
      return;
    }
    if (deliveryMethod === 'delivery' && !address.trim()) {
      alert(isAr ? 'يرجى تحديد عنوان التوصيل' : 'Please provide delivery address.');
      return;
    }

    setSubmitting(true);
    const payload = {
      customerName: customerName.trim() || 'Valued Customer',
      customerPhone: customerPhone.trim(),
      deliveryMethod,
      deliveryAddress: deliveryMethod === 'delivery' ? address.trim() : 'Pickup in-store',
      items: cart,
      subtotal,
      discount: { type: 'fixed', value: 0, amount: 0 },
      total,
      channel: 'online',
      source: 'customer'
    };

    try {
      const created = await onSubmitOrder(payload);
      if (created) {
        setOrderSuccessId(created.id);
        
        // Construct WhatsApp message with modifiers & live tracking link
        const lines = cart.map(i => {
          const mods = i.selectedModifiers && i.selectedModifiers.length > 0 
            ? `\n   ↳ ${i.selectedModifiers.map(m => m.optionName).join(', ')}` 
            : '';
          const notes = i.notes ? `\n   ↳ 📝 ${i.notes}` : '';
          return `• ${i.qty}x ${i.name} (${fmt(i.price * i.qty)})${mods}${notes}`;
        }).join('\n');

        const deliveryText = deliveryMethod === 'delivery' 
          ? (isAr ? `🚚 توصيل للمنزل: ${address} (+10.00 ر.ق)` : `🚚 Delivery to: ${address} (+QR 10.00)`)
          : (isAr ? '🏬 استلام من المتجر' : '🏬 In-store Pickup');
        
        const trackingUrl = `${window.location.origin}${window.location.pathname}?customer=1&track=${created.id}`;

        const message = encodeURIComponent(
          isAr
            ? `🛍️ *طلب جديد عبر قائمة QR - ناس آب*\nرقم الطلب: #${created.id}\nالاسم: ${customerName || 'عميل'}\nالجوال: ${customerPhone}\nطريقة الاستلام: ${deliveryText}\n\n*الأصناف والخيارات المطلوبة:*\n${lines}\n\n*الإجمالي:* ${fmt(total)}\n\n📍 *رابط تتبع الطلب المباشر:*\n${trackingUrl}\n\nيرجى تأكيد استلام وتجهيز الطلب، شكراً لكم!`
            : `🛍️ *New Online Self-Order - Nasapp*\nOrder ID: #${created.id}\nCustomer: ${customerName || 'Guest'}\nPhone: ${customerPhone}\nMethod: ${deliveryText}\n\n*Order Items & Options:*\n${lines}\n\n*Total:* ${fmt(total)}\n\n📍 *Live Order Tracker:*\n${trackingUrl}\n\nPlease confirm order preparation, thanks!`
        );

        window.open(`https://wa.me/${BUSINESS_WHATSAPP}?text=${message}`, '_blank');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Status Stepper Data
  const getStepProgress = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'confirmed': return 2;
      case 'preparing': return 3;
      case 'ready': return 4;
      case 'completed': return 5;
      case 'cancelled': return 0;
      default: return 1;
    }
  };

  const currentStep = activeTrackedOrder ? getStepProgress(activeTrackedOrder.status) : 1;

  const stepsConfig = [
    { step: 1, key: 'pending', nameEn: 'Order Received', nameAr: 'تم استلام الطلب', icon: Clock, descEn: 'Awaiting merchant confirmation', descAr: 'في انتظار مراجعة وتأكيد المتجر' },
    { step: 2, key: 'confirmed', nameEn: 'Confirmed', nameAr: 'تم قبول الطلب', icon: CheckCircle2, descEn: 'Order accepted by store staff', descAr: 'تم قبول الطلب وتحويله للتحضير' },
    { step: 3, key: 'preparing', nameEn: 'In Kitchen / Packing', nameAr: 'جاري التجهيز والتعبئة', icon: ChefHat, descEn: 'Items are being freshly prepared', descAr: 'يتم تجهيز طلبك الآن بعناية' },
    { step: 4, key: 'ready', nameEn: 'Ready for Pickup / Driver', nameAr: 'جاهز للاستلام / مع السائق', icon: Bike, descEn: 'Ready at counter or dispatched', descAr: 'جاهز للاستلام الفوري أو مع السائق' },
    { step: 5, key: 'completed', nameEn: 'Delivered / Completed', nameAr: 'تم التسليم بنجاح', icon: Package, descEn: 'Order successfully delivered', descAr: 'تم استلام الطلب بنجاح، بالعافية!' }
  ];

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className={`min-h-screen flex flex-col font-sans pb-12 transition-colors duration-200 ${
      isLight ? 'bg-[#F8FAFC] text-slate-800' : 'bg-[#040405] text-[#F5F5F4]'
    }`}>
      
      {/* Customer Header with Logo */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 py-3 shadow-sm transition-colors ${
        isLight ? 'bg-white/95 border-slate-200 shadow-slate-100' : 'bg-[#0A0A0B]/90 border-[#1E1E21] shadow-md'
      }`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            {/* Store Logo Display */}
            <div className="relative">
              {storeLogo ? (
                <div className={`w-11 h-11 rounded-2xl border-2 overflow-hidden flex items-center justify-center p-1 shadow-md transition ${
                  isLight 
                    ? 'bg-white border-emerald-500/60 shadow-emerald-500/10' 
                    : 'bg-[#000000] border-[#39FFB0]/50 shadow-[#39FFB0]/10'
                }`}>
                  <img 
                    src={storeLogo} 
                    alt="Store Logo" 
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              ) : (
                <div className="w-11 h-11">
                  <NasappBrandLogo theme={currentTheme} className="w-11 h-11 shadow-md rounded-2xl" />
                </div>
              )}
            </div>

            <div>
              <h1 className={`font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <span>{isAr ? 'ناس آب - Nasapp' : 'Nasapp Store'}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${
                  isLight 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                    : 'bg-[#39FFB0]/15 text-[#39FFB0] border-[#39FFB0]/30'
                }`}>
                  LIVE
                </span>
              </h1>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#9C9DA3]'}`}>
                {isAr ? 'سوبرماركت ومواد غذائية طازجة' : 'Supermarket & Fresh Grocery'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={handleToggleTheme}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                  : 'bg-[#151517] hover:bg-[#1E1E21] border-[#1E1E21] text-amber-300'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {isLight ? <Moon className="w-3.5 h-3.5 text-slate-700" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
              <span className="hidden sm:inline">{isLight ? (isAr ? 'داكن' : 'Dark') : (isAr ? 'فاتح' : 'Light')}</span>
            </button>

            {/* Live Track Order Lookup Button */}
            <button
              onClick={() => setShowLookupModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                isLight 
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800' 
                  : 'bg-[#151517] hover:bg-[#1E1E21] border-[#39FFB0]/40 text-[#39FFB0]'
              }`}
              title="Track Order"
            >
              <SearchCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'تتبع طلبك' : 'Track Order'}</span>
            </button>

            {onToggleLang && (
              <button
                onClick={onToggleLang}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800' 
                    : 'bg-[#151517] hover:bg-[#1E1E21] border-[#1E1E21] text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isAr ? 'EN' : 'العربية'}</span>
              </button>
            )}

            {onExitCustomerMode && !isDirectCustomerUrl && (
              <button
                onClick={onExitCustomerMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs transition cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900' 
                    : 'bg-[#151517] hover:bg-[#1E1E21] border-[#1E1E21] text-[#9C9DA3] hover:text-white'
                }`}
              >
                <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                <span>{t.exitCustomerMode}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* ======================================================== */}
        {/* STORE WELCOME HERO BANNER (WITH BRAND LOGO & INFO)       */}
        {/* ======================================================== */}
        {!orderSuccessId && (
          <div className={`border rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl transition-all ${
            isLight 
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border-emerald-200/80 shadow-emerald-950/5' 
              : 'bg-gradient-to-r from-[#0C1510] via-[#0A0A0B] to-[#121215] border-[#1E1E21] shadow-xl'
          }`}>
            <div className="flex items-center gap-4 text-center sm:text-left">
              {/* Big Store Logo Badge */}
              <div 
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 overflow-hidden flex items-center justify-center p-1.5 shrink-0 shadow-lg ${
                  isLight 
                    ? 'bg-white border-emerald-400 shadow-emerald-600/10' 
                    : 'bg-[#000000] border-[#39FFB0]/40 shadow-[#39FFB0]/10'
                }`}
              >
                {storeLogo ? (
                  <img src={storeLogo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <NasappBrandLogo theme={currentTheme} className="w-full h-full" />
                )}
              </div>

              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2 className={`text-base sm:text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {isAr ? 'متجر وسوبرماركت ناس آب' : 'Nasapp Supermarket & Grocery'}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                    isLight 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLight ? 'bg-emerald-600' : 'bg-[#39FFB0]'}`}></span>
                    {isAr ? 'مفتوح للطلب الفوري' : 'Open for Orders'}
                  </span>
                </div>
                <p className={`text-xs mt-1 max-w-md ${isLight ? 'text-slate-600' : 'text-[#9C9DA3]'}`}>
                  {isAr 
                    ? 'تسوق أفضل المنتجات والمواد الغذائية الطازجة واستلم في متجرنا أو توصيل مباشر إلى باب منزلك'
                    : 'Order fresh groceries & daily essentials for in-store pickup or fast express home delivery'}
                </p>
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex items-center gap-2 shrink-0">
              <div className={`px-3 py-2 rounded-2xl text-center border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#000000]/60 border-[#1E1E21]'
              }`}>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-[#9C9DA3]'}`}>{isAr ? 'التوصيل' : 'Delivery'}</span>
                <span className={`font-bold text-xs ${isLight ? 'text-emerald-700' : 'text-[#39FFB0]'}`}>~30 {isAr ? 'دقيقة' : 'Min'}</span>
              </div>
              <div className={`px-3 py-2 rounded-2xl text-center border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#000000]/60 border-[#1E1E21]'
              }`}>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-[#9C9DA3]'}`}>{isAr ? 'المنتجات' : 'Products'}</span>
                <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{products.length}+</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* LIVE ORDER TRACKING SCREEN (REACTIVE REAL-TIME PROGRESS) */}
        {/* ======================================================== */}
        {orderSuccessId ? (
          <div className={`border rounded-3xl p-5 sm:p-8 max-w-2xl mx-auto shadow-2xl space-y-6 animate-in zoom-in-95 ${
            isLight ? 'bg-white border-emerald-200 text-slate-800' : 'bg-[#0A0A0B] border-[#39FFB0]/40 text-[#F5F5F4]'
          }`}>
            
            {/* Top Status Header */}
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b ${
              isLight ? 'border-slate-200' : 'border-[#1E1E21]'
            }`}>
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                {/* Logo or Status icon */}
                <div className={`w-14 h-14 rounded-2xl border-2 overflow-hidden flex items-center justify-center p-1 shadow-lg shrink-0 ${
                  isLight ? 'bg-white border-emerald-400 shadow-emerald-500/10' : 'bg-[#000000] border-[#39FFB0]/40 shadow-[#39FFB0]/10'
                }`}>
                  {storeLogo ? (
                    <img src={storeLogo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <NasappBrandLogo theme={currentTheme} className="w-full h-full" />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-[#39FFB0]/15 text-[#39FFB0] border-[#39FFB0]/30'
                    }`}>
                      LIVE REAL-TIME TRACKER
                    </span>
                    <span className={`w-2 h-2 rounded-full animate-ping ${isLight ? 'bg-emerald-600' : 'bg-[#39FFB0]'}`}></span>
                  </div>
                  <h2 className={`text-lg sm:text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {isAr ? 'متابعة حالة طلبك مباشرة' : 'Live Order Tracking'}
                  </h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-[#9C9DA3]'}`}>
                    {isAr ? 'يتم التحديث تلقائياً وبشكل فوري' : 'Real-time updates as staff process your order'}
                  </p>
                </div>
              </div>

              {/* Order ID Tag */}
              <div className={`px-4 py-2 rounded-2xl text-center font-mono border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000] border-[#1E1E21]'
              }`}>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-[#9C9DA3]'}`}>{t.orderId}</span>
                <span className={`font-black text-sm ${isLight ? 'text-emerald-700' : 'text-[#39FFB0]'}`}>#{orderSuccessId}</span>
              </div>
            </div>

            {/* Live Visual Stepper */}
            <div className="space-y-4 pt-2">
              <div className="relative">
                {/* Connecting Track Line */}
                <div className={`absolute left-6 top-3 bottom-3 w-0.5 z-0 ${isLight ? 'bg-slate-200' : 'bg-[#1E1E21]'}`}></div>
                <div 
                  className="absolute left-6 top-3 w-0.5 bg-gradient-to-b from-emerald-500 to-teal-500 transition-all duration-700 z-0"
                  style={{ height: `${Math.min(100, (Math.max(1, currentStep) - 1) * 25)}%` }}
                ></div>

                <div className="space-y-5 relative z-10">
                  {stepsConfig.map((st) => {
                    const isDone = currentStep >= st.step;
                    const isCurrent = currentStep === st.step;
                    const StepIcon = st.icon;

                    return (
                      <div key={st.step} className="flex items-start gap-4">
                        <div 
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
                            isCurrent
                              ? (isLight ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/30 scale-105' : 'bg-[#39FFB0] text-black border-[#39FFB0] shadow-lg shadow-[#39FFB0]/20 scale-105')
                              : isDone
                              ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-[#1A2E24] text-[#39FFB0] border-[#39FFB0]/40')
                              : (isLight ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-[#121215] text-[#5E5F64] border-[#1E1E21]')
                          }`}
                        >
                          <StepIcon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-bold ${
                              isCurrent 
                                ? (isLight ? 'text-emerald-700 font-extrabold' : 'text-[#39FFB0]') 
                                : isDone 
                                ? (isLight ? 'text-slate-900 font-bold' : 'text-white') 
                                : (isLight ? 'text-slate-400' : 'text-[#5E5F64]')
                            }`}>
                              {isAr ? st.nameAr : st.nameEn}
                            </h4>
                            {isCurrent && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse border ${
                                isLight 
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                  : 'bg-[#39FFB0]/20 text-[#39FFB0] border-[#39FFB0]/30'
                              }`}>
                                {isAr ? 'الحالة الحالية' : 'CURRENT STATUS'}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-[#9C9DA3]'}`}>
                            {isAr ? st.descAr : st.descEn}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Order Details Card */}
            {activeTrackedOrder && (
              <div className={`rounded-2xl p-4 space-y-3 border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D0D10] border-[#1E1E21]'
              }`}>
                <div className={`flex items-center justify-between text-xs font-semibold pb-2 border-b ${
                  isLight ? 'border-slate-200 text-slate-600' : 'border-[#1E1E21] text-[#9C9DA3]'
                }`}>
                  <span>{isAr ? 'تفاصيل الأصناف المطلوبة' : 'Order Summary'} ({activeTrackedOrder.items.length} items)</span>
                  <span className={`font-mono text-sm font-bold ${isLight ? 'text-emerald-700' : 'text-[#39FFB0]'}`}>{fmt(activeTrackedOrder.total)}</span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {activeTrackedOrder.items.map((it, iIdx) => (
                    <div key={iIdx} className="flex items-center justify-between text-xs">
                      <div className="truncate pr-2">
                        <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{it.qty}x {it.name}</span>
                        {it.selectedModifiers && it.selectedModifiers.length > 0 && (
                          <span className={`text-[10px] block ${isLight ? 'text-emerald-700' : 'text-[#39FFB0]'}`}>
                            ↳ {it.selectedModifiers.map(m => m.optionName).join(', ')}
                          </span>
                        )}
                      </div>
                      <span className={`font-mono shrink-0 ${isLight ? 'text-slate-600' : 'text-[#9C9DA3]'}`}>{fmt(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>

                {activeTrackedOrder.deliveryAddress && (
                  <div className={`pt-2 border-t flex items-center gap-2 text-xs ${
                    isLight ? 'border-slate-200 text-slate-600' : 'border-[#1E1E21] text-[#9C9DA3]'
                  }`}>
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{activeTrackedOrder.deliveryAddress}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <a
                href={`https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(
                  isAr 
                    ? `مرحباً، أود الاستفسار عن حالة طلبي رقم #${orderSuccessId}`
                    : `Hello, inquiring about the status of my order #${orderSuccessId}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className={`w-full py-3 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer ${
                  isLight 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isAr ? 'تواصل مع المتجر عبر الواتساب' : 'Contact Store on WhatsApp'}</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderSuccessId(null);
                    setCart([]);
                  }}
                  className={`flex-1 py-2.5 font-semibold rounded-xl text-xs transition cursor-pointer border ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                      : 'bg-[#1E1E21] hover:bg-[#2A2A30] border-transparent text-[#F5F5F4]'
                  }`}
                >
                  {isAr ? '+ إنشاء طلب جديد' : '+ Place Another Order'}
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* ======================================================== */
          /* STANDARD CUSTOMER ORDERING CATALOG & CHECKOUT FORM       */
          /* ======================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Catalog (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Search and Scan Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className={`w-4 h-4 absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-3 ${
                    isLight ? 'text-slate-400' : 'text-[#5E5F64]'
                  }`} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t.searchProducts}
                    className={`w-full ${isAr ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 rounded-xl text-sm border focus:outline-none transition ${
                      isLight 
                        ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 shadow-sm' 
                        : 'bg-[#0A0A0B] border-[#1E1E21] text-[#F5F5F4] placeholder-zinc-600 focus:border-[#39FFB0]'
                    }`}
                  />
                </div>
                <button
                  onClick={() => setScannerOpen(true)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 shadow-sm border ${
                    isLight 
                      ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 shadow-emerald-600/5' 
                      : 'bg-[#1A2E24] hover:bg-[#224032] border-[#39FFB0]/40 text-[#39FFB0] shadow-[#39FFB0]/10'
                  }`}
                  title={t.scanBarcodeBtn}
                >
                  <Camera className="w-4 h-4" />
                  <span>{t.scanCode}</span>
                </button>
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      activeCategory === cat
                        ? (isLight ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'bg-[#39FFB0] text-[#04120C] font-bold shadow-sm')
                        : (isLight ? 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50' : 'bg-[#0A0A0B] text-[#9C9DA3] border border-[#1E1E21] hover:text-[#F5F5F4]')
                    }`}
                  >
                    {cat === 'All' ? t.allCategories : cat}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {filtered.map((product) => {
                  const inCartCount = cart.filter(c => c.productId === product.id).reduce((s, i) => s + i.qty, 0);
                  const isOut = product.stock <= 0;
                  const hasModifiers = product.modifierGroups && product.modifierGroups.length > 0;

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOut && handleProductSelect(product)}
                      className={`border rounded-2xl p-3.5 flex flex-col justify-between transition relative select-none shadow-sm ${
                        isOut 
                          ? (isLight ? 'bg-slate-100/70 border-slate-200 opacity-50 cursor-not-allowed' : 'bg-[#0A0A0B] border-red-950/30 opacity-40 cursor-not-allowed')
                          : (isLight 
                              ? 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer' 
                              : 'bg-[#0A0A0B] border-[#1E1E21] hover:border-[#39FFB0]/50 hover:bg-[#121215] cursor-pointer')
                      }`}
                    >
                      {inCartCount > 0 && (
                        <span className={`absolute top-2.5 ${isAr ? 'left-2.5' : 'right-2.5'} px-2 py-0.5 rounded-full font-bold text-[10px] shadow ${
                          isLight ? 'bg-emerald-600 text-white' : 'bg-[#39FFB0] text-black'
                        }`}>
                          {inCartCount}x
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-[10px] uppercase font-mono truncate ${
                            isLight ? 'text-slate-400' : 'text-[#5E5F64]'
                          }`}>
                            {product.category || 'Store'}
                          </span>
                          {hasModifiers && (
                            <span className={`px-1.5 py-0.2 text-[8px] font-bold rounded flex items-center gap-0.5 border ${
                              isLight 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-[#1A2E24] text-[#39FFB0] border-emerald-500/20'
                            }`}>
                              <Sparkles className="w-2 h-2" />
                              <span>{isAr ? 'خيارات' : 'Options'}</span>
                            </span>
                          )}
                        </div>
                        <h4 className={`font-semibold text-xs line-clamp-2 mb-1.5 ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {product.name}
                        </h4>
                      </div>

                      <div className={`pt-2 border-t flex items-center justify-between ${
                        isLight ? 'border-slate-100' : 'border-[#1E1E21]'
                      }`}>
                        <div>
                          <span className={`font-bold text-xs font-mono block ${
                            isLight ? 'text-emerald-700' : 'text-[#39FFB0]'
                          }`}>
                            {fmt(product.price)}
                          </span>
                          <span className={`text-[9px] ${
                            isLight ? 'text-slate-500' : 'text-[#9C9DA3]'
                          }`}>
                            {isOut ? t.outOfStock : `${product.stock} ${t.stockLeft}`}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isOut}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductSelect(product);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                            isLight 
                              ? 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700' 
                              : 'bg-[#1E1E21] hover:bg-[#39FFB0] hover:text-black text-white'
                          }`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Cart & Customer Checkout Form (5 cols) */}
            <div className="lg:col-span-5">
              <form onSubmit={handleSubmitOrder} className={`border rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-slate-100' : 'bg-[#0A0A0B] border-[#1E1E21]'
              }`}>
                
                <div className={`flex items-center justify-between pb-3 border-b ${
                  isLight ? 'border-slate-200' : 'border-[#1E1E21]'
                }`}>
                  <h3 className={`font-bold text-sm flex items-center gap-2 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    <span>{t.yourCart}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-[#1E1E21] text-[#39FFB0]'
                    }`}>
                      {cart.reduce((s, i) => s + i.qty, 0)}
                    </span>
                  </h3>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      className={`text-xs flex items-center gap-1 cursor-pointer transition ${
                        isLight ? 'text-slate-400 hover:text-red-500' : 'text-[#9C9DA3] hover:text-red-400'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.clearCart}</span>
                    </button>
                  )}
                </div>

                {/* Cart Items */}
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className={`py-8 text-center text-xs ${
                      isLight ? 'text-slate-400' : 'text-[#5E5F64]'
                    }`}>
                      <p className="font-medium">{t.emptyCart}</p>
                      <p className="text-[11px] mt-1 opacity-80">{t.emptyCartDesc}</p>
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={idx} className={`p-2.5 rounded-xl text-xs space-y-1 border ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0F0F12] border-[#1E1E21]'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className={`font-medium truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.name}</p>
                              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleEditItem(item)}
                                  className={isLight ? 'text-emerald-700 hover:text-emerald-800' : 'text-[#39FFB0] hover:text-white'}
                                  title="Edit"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {item.selectedModifiers.map((m, mIdx) => (
                                  <span key={mIdx} className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                                    isLight 
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                      : 'bg-[#1A2E24] text-[#39FFB0] border-[#39FFB0]/30'
                                  }`}>
                                    +{m.optionName} {m.price > 0 && `(${m.price} QR)`}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.notes && (
                              <p className={`text-[10px] italic mt-0.5 ${
                                isLight ? 'text-amber-700' : 'text-amber-300'
                              }`}>
                                📝 {item.notes}
                              </p>
                            )}

                            <span className={`text-[10px] font-mono block mt-0.5 ${
                              isLight ? 'text-slate-500' : 'text-[#9C9DA3]'
                            }`}>
                              {fmt(item.price)} × {item.qty}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => changeQty(idx, -1)}
                              className={`w-5 h-5 rounded flex items-center justify-center text-xs transition cursor-pointer border ${
                                isLight 
                                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' 
                                  : 'bg-[#1E1E21] hover:bg-[#2A2A30] border-transparent text-white'
                              }`}
                            >
                              -
                            </button>
                            <span className={`w-5 text-center font-bold text-xs ${
                              isLight ? 'text-slate-800' : 'text-white'
                            }`}>{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => changeQty(idx, 1)}
                              className={`w-5 h-5 rounded flex items-center justify-center text-xs transition cursor-pointer border ${
                                isLight 
                                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' 
                                  : 'bg-[#1E1E21] hover:bg-[#2A2A30] border-transparent text-white'
                              }`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Delivery Method Selection */}
                <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-[#1E1E21]'}`}>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                    isLight ? 'text-slate-500' : 'text-[#9C9DA3]'
                  }`}>
                    {t.orderType}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                        deliveryMethod === 'pickup'
                          ? (isLight ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm' : 'bg-[#1E1E21] border-[#39FFB0] text-[#39FFB0]')
                          : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white' : 'bg-[#000000] border-[#1E1E21] text-[#9C9DA3] hover:text-white')
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>{t.dineInPickup}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                        deliveryMethod === 'delivery'
                          ? (isLight ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm' : 'bg-[#1E1E21] border-[#39FFB0] text-[#39FFB0]')
                          : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white' : 'bg-[#000000] border-[#1E1E21] text-[#9C9DA3] hover:text-white')
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{t.homeDelivery} (+10 QR)</span>
                    </button>
                  </div>
                </div>

                {/* Customer Contact Details */}
                <div className="space-y-2 pt-1">
                  <div className="relative">
                    <User className={`w-3.5 h-3.5 absolute ${isAr ? 'right-3' : 'left-3'} top-3 ${
                      isLight ? 'text-slate-400' : 'text-[#5E5F64]'
                    }`} />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={t.yourName}
                      className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 rounded-xl text-xs border focus:outline-none transition ${
                        isLight 
                          ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white' 
                          : 'bg-[#000000] border-[#1E1E21] text-white placeholder-zinc-600 focus:border-[#39FFB0]'
                      }`}
                    />
                  </div>

                  <div className="relative">
                    <Phone className={`w-3.5 h-3.5 absolute ${isAr ? 'right-3' : 'left-3'} top-3 ${
                      isLight ? 'text-slate-400' : 'text-[#5E5F64]'
                    }`} />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={`${t.yourPhone} *`}
                      className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 rounded-xl text-xs border focus:outline-none transition ${
                        isLight 
                          ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white' 
                          : 'bg-[#000000] border-[#1E1E21] text-white placeholder-zinc-600 focus:border-[#39FFB0]'
                      }`}
                    />
                  </div>

                  {deliveryMethod === 'delivery' && (
                    <div className="relative">
                      <MapPin className={`w-3.5 h-3.5 absolute ${isAr ? 'right-3' : 'left-3'} top-3 ${
                        isLight ? 'text-slate-400' : 'text-[#5E5F64]'
                      }`} />
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={`${t.deliveryAddress} *`}
                        className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 rounded-xl text-xs border focus:outline-none transition ${
                          isLight 
                            ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white' 
                            : 'bg-[#000000] border-[#1E1E21] text-white placeholder-zinc-600 focus:border-[#39FFB0]'
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Subtotal & Total */}
                <div className={`pt-2 border-t space-y-1 text-xs ${
                  isLight ? 'border-slate-200' : 'border-[#1E1E21]'
                }`}>
                  <div className={`flex justify-between ${isLight ? 'text-slate-500' : 'text-[#9C9DA3]'}`}>
                    <span>{t.subtotal}:</span>
                    <span className="font-mono">{fmt(subtotal)}</span>
                  </div>
                  {deliveryMethod === 'delivery' && (
                    <div className={`flex justify-between ${isLight ? 'text-slate-500' : 'text-[#9C9DA3]'}`}>
                      <span>{isAr ? 'رسوم التوصيل' : 'Delivery Fee'}:</span>
                      <span className="font-mono">{fmt(deliveryFee)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between font-bold text-sm pt-1 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    <span>{t.total}:</span>
                    <span className={`font-mono text-base font-black ${
                      isLight ? 'text-emerald-700' : 'text-[#39FFB0]'
                    }`}>{fmt(total)}</span>
                  </div>
                </div>

                {/* Submit to WhatsApp Button */}
                <button
                  type="submit"
                  disabled={cart.length === 0 || submitting}
                  className={`w-full py-3 disabled:opacity-30 disabled:cursor-not-allowed font-black rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                    isLight 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                      : 'bg-[#39FFB0] hover:opacity-90 text-black shadow-[#39FFB0]/10'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{submitting ? (isAr ? 'جاري الإرسال...' : 'Sending...') : t.placeOrderWhatsapp}</span>
                </button>

              </form>
            </div>

          </div>
        )}

      </div>

      {/* Customer Lookup Order Modal */}
      {showLookupModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0A0A0B] border-[#1E1E21] text-[#F5F5F4]'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-slate-200' : 'border-[#1E1E21]'
            }`}>
              <h3 className={`font-bold text-sm flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <SearchCode className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-[#39FFB0]'}`} />
                <span>{isAr ? 'البحث عن طلب وتتبعه' : 'Track Existing Order'}</span>
              </h3>
              <button
                onClick={() => setShowLookupModal(false)}
                className={`text-xs cursor-pointer ${
                  isLight ? 'text-slate-400 hover:text-slate-700' : 'text-[#9C9DA3] hover:text-white'
                }`}
              >
                ✕
              </button>
            </div>

            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-[#9C9DA3]'}`}>
              {isAr ? 'أدخل رقم الطلب الخاص بك (مثال: ORD-902) لتتبع حالته مباشرة' : 'Enter your Order ID (e.g. ORD-902) to track preparation status in real time.'}
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={trackSearchInput}
                onChange={(e) => setTrackSearchInput(e.target.value)}
                placeholder="ORD-902"
                className={`w-full px-3 py-2.5 rounded-xl text-sm font-mono border focus:outline-none transition ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-emerald-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white' 
                    : 'bg-[#000000] border-[#1E1E21] text-[#39FFB0] placeholder-zinc-600 focus:border-[#39FFB0]'
                }`}
              />

              <button
                onClick={() => {
                  if (trackSearchInput.trim()) {
                    setOrderSuccessId(trackSearchInput.trim());
                    setShowLookupModal(false);
                  }
                }}
                disabled={!trackSearchInput.trim()}
                className={`w-full py-2.5 disabled:opacity-40 font-bold rounded-xl text-xs transition cursor-pointer shadow-sm ${
                  isLight 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-[#39FFB0] hover:opacity-90 text-black'
                }`}
              >
                {isAr ? 'عرض حالة الطلب المباشرة' : 'Track Order Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modifiers Modal */}
      {modifierProduct && (
        <ProductModifierModal
          isOpen={Boolean(modifierProduct)}
          onClose={() => {
            setModifierProduct(null);
            setEditingCartItem(null);
          }}
          product={modifierProduct}
          initialItem={editingCartItem}
          onConfirm={handleConfirmModifiers}
          lang={lang}
          theme={currentTheme}
        />
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => {
          const found = products.find(p => p.sku && p.sku.toLowerCase() === code.toLowerCase()) 
            || products.find(p => p.name.toLowerCase().includes(code.toLowerCase()));
          if (found) {
            handleProductSelect(found);
            setScannerOpen(false);
          }
        }}
        products={products}
        lang={lang}
      />

    </div>
  );
};

export default CustomerOrderView;
