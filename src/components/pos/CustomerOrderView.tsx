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
  Moon,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Banknote,
  Landmark,
  Copy,
  Zap,
  X,
  Image as ImageIcon,
  Maximize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Product, CartItem, Order } from '../../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ProductModifierModal } from './ProductModifierModal';
import { Language, translations } from '../../i18n';
import { NasappBrandLogo } from '../NasappBrandLogo';
import { useTheme } from '../../ThemeContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface CustomerOrderViewProps {
  products: Product[];
  orders?: Order[];
  onSubmitOrder: (orderPayload: any) => Promise<any>;
  onExitCustomerMode?: () => void;
  onOpenAdminAccess?: () => void;
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
  onOpenAdminAccess,
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
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'fawran' | 'bank_transfer'>('cod');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [fawranCopied, setFawranCopied] = useState<boolean>(false);
  const [bankCopied, setBankCopied] = useState<boolean>(false);

  const handleCopyFawran = () => {
    try {
      navigator.clipboard?.writeText('30606701');
      setFawranCopied(true);
      setTimeout(() => setFawranCopied(false), 2200);
    } catch {}
  };

  const handleCopyBank = () => {
    try {
      navigator.clipboard?.writeText('30606701');
      setBankCopied(true);
      setTimeout(() => setBankCopied(false), 2200);
    } catch {}
  };

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
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Store Logo state (defaults to null which renders the original NasappBrandLogo)
  const storeLogo = initialStoreLogo !== undefined 
    ? initialStoreLogo 
    : (typeof window !== 'undefined' ? localStorage.getItem('nasapp_store_logo') : null);

  // Modifiers Selection
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);

  // Product Images Visibility State (Defaults to visible, can be toggled by customer)
  const [showProductImages, setShowProductImages] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('customer_show_images');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleShowImages = () => {
    const next = !showProductImages;
    setShowProductImages(next);
    try {
      localStorage.setItem('customer_show_images', String(next));
    } catch {}
  };

  // Image Zoom Lightbox state
  const [previewImageModal, setPreviewImageModal] = useState<{
    name: string;
    price: number;
    imgUrl: string;
    category?: string;
    product?: Product;
  } | null>(null);

  // Fallback high-resolution food & grocery images if product.image is empty
  const getProductImage = (prod: Product | { image?: string; name?: string; category?: string }): string => {
    if (prod.image && prod.image.trim()) {
      return prod.image;
    }
    const name = (prod.name || '').toLowerCase();
    const cat = (prod.category || '').toLowerCase();

    if (cat.includes('bev') || name.includes('karak') || name.includes('tea') || name.includes('chai') || name.includes('coffee') || name.includes('latte')) {
      return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80';
    }
    if (cat.includes('food') || name.includes('burger') || name.includes('sandwich') || name.includes('angus') || name.includes('meal')) {
      return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80';
    }
    if (name.includes('popcorn') || cat.includes('snack')) {
      return 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80';
    }
    if (cat.includes('choc') || name.includes('storck') || name.includes('candy') || name.includes('mamba') || name.includes('knoppers') || name.includes('sweet') || name.includes('fruit')) {
      return 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=600&q=80';
    }
    if (cat.includes('pizza')) {
      return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80';
    }
    if (cat.includes('dessert') || cat.includes('cake') || cat.includes('pastry') || name.includes('cake')) {
      return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80';
    }
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
  };

  const isDirectCustomerUrl = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('customer') === '1');

  const BUSINESS_WHATSAPP = '97477315415';
  const fmt = (n: number) => (isAr ? `${Number(n).toFixed(2)} ر.ق` : `QR ${Number(n).toFixed(2)}`);

  // Direct real-time Firestore listener for live order tracking across mobile, tab and web
  const [liveDirectOrder, setLiveDirectOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderSuccessId) {
      setLiveDirectOrder(null);
      return;
    }

    try {
      const unsub = onSnapshot(
        doc(db, 'orders', orderSuccessId),
        (docSnap) => {
          if (docSnap.exists()) {
            setLiveDirectOrder(docSnap.data() as Order);
          }
        },
        (err) => {
          console.warn('Direct order tracking onSnapshot note:', err);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Error setting up direct order listener:', e);
    }
  }, [orderSuccessId]);

  // Active tracked order from live direct stream or fallback orders list
  const activeTrackedOrder: Order | undefined = liveDirectOrder 
    || (orderSuccessId ? orders.find(o => o.id.toLowerCase() === orderSuccessId.toLowerCase()) : undefined);

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

  const handleDecrementProduct = (product: Product) => {
    const idx = cart.findIndex(c => c.productId === product.id && (!c.selectedModifiers || c.selectedModifiers.length === 0));
    if (idx >= 0) {
      changeQty(idx, -1);
    } else {
      // If not unmodified, find any item of this product
      const anyIdx = cart.findIndex(c => c.productId === product.id);
      if (anyIdx >= 0) {
        changeQty(anyIdx, -1);
      }
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);
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
    const resolvedDeliveryAddress = deliveryMethod === 'delivery' 
      ? address.trim() 
      : 'Pickup in-store';

    const paymentMethodText = paymentMethod === 'fawran'
      ? (isAr ? `⚡ فوران Fawran (30606701)${paymentRef.trim() ? ` [مرجع: ${paymentRef.trim()}]` : ''}` : `⚡ Fawran Instant (30606701)${paymentRef.trim() ? ` [Ref: ${paymentRef.trim()}]` : ''}`)
      : paymentMethod === 'bank_transfer'
      ? (isAr ? `🏦 تحويل بنكي QNB (30606701)${paymentRef.trim() ? ` [مرجع: ${paymentRef.trim()}]` : ''}` : `🏦 Bank Transfer QNB (30606701)${paymentRef.trim() ? ` [Ref: ${paymentRef.trim()}]` : ''}`)
      : (isAr ? '💵 الدفع عند الاستلام (كاش)' : '💵 Cash on Delivery (COD)');

    const payload = {
      customerName: customerName.trim() || (isAr ? 'عميل' : 'Valued Customer'),
      customerPhone: customerPhone.trim(),
      deliveryMethod,
      deliveryAddress: resolvedDeliveryAddress,
      paymentMethod,
      paymentReference: paymentRef.trim() || undefined,
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
        setIsCartDrawerOpen(false);
        
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
            ? `🛍️ *طلب جديد عبر قائمة QR - ناس آب (NasApp.qa)*\nرقم الطلب: #${created.id}\nالاسم: ${customerName || 'عميل'}\nالجوال: ${customerPhone}\nطريقة الاستلام: ${deliveryText}\n💰 *طريقة الدفع:* ${paymentMethodText}\n\n*الأصناف والخيارات المطلوبة:*\n${lines}\n\n*الإجمالي:* ${fmt(total)}\n\n📍 *رابط تتبع الطلب المباشر:*\n${trackingUrl}\n\nيرجى تأكيد استلام وتجهيز الطلب، شكراً لكم!`
            : `🛍️ *New Online Self-Order - NasApp.qa*\nOrder ID: #${created.id}\nCustomer: ${customerName || 'Guest'}\nPhone: ${customerPhone}\nMethod: ${deliveryText}\n💰 *Payment Option:* ${paymentMethodText}\n\n*Order Items & Options:*\n${lines}\n\n*Total:* ${fmt(total)}\n\n📍 *Live Order Tracker:*\n${trackingUrl}\n\nPlease confirm order preparation, thanks!`
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
                <span>{isAr ? 'ناس آب - NasApp.qa' : 'NasApp.qa Store'}</span>
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

            {/* View Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                totalCartCount > 0 
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500 font-extrabold'
                  : (isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800' 
                      : 'bg-[#151517] hover:bg-[#1E1E21] border-[#1E1E21] text-white')
              }`}
              title="View Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'السلة' : 'Cart'}</span>
              {totalCartCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white rounded-full text-[10px] font-mono flex items-center justify-center font-bold">
                  {totalCartCount}
                </span>
              )}
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

            <PWAInstallButton lang={lang} variant="header" />

            {/* Staff & Admin Access Button in Header (Suitable visible place on Web & Phone) */}
            {(onOpenAdminAccess || onExitCustomerMode) && (
              <button
                type="button"
                onClick={onOpenAdminAccess || onExitCustomerMode}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-sm ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                    : 'bg-[#151517] hover:bg-[#1E1E21] border-[#39FFB0]/40 text-[#39FFB0] hover:border-[#39FFB0]'
                }`}
                title={isAr ? 'دخول الموظفين والإدارة (POS)' : 'Staff & Admin POS Access'}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#39FFB0] shrink-0" />
                <span className="hidden sm:inline font-bold">{t.staffAndAdmin}</span>
                <span className="sm:hidden font-bold">{isAr ? 'الموظفين' : 'Staff'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className={`flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6 ${cart.length > 0 && !orderSuccessId ? 'pb-28' : ''}`}>
        
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
                    {isAr ? 'متجر وسوبرماركت ناس آب (NasApp.qa)' : 'NasApp.qa Supermarket & Grocery'}
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

        {/* NasApp PWA App Install Banner for Customers */}
        {!orderSuccessId && (
          <PWAInstallButton lang={lang} variant="banner" />
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

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeTrackedOrder.items.map((it, iIdx) => {
                    const itImg = getProductImage({ name: it.name, image: products.find(p => p.id === it.productId)?.image, category: products.find(p => p.id === it.productId)?.category });
                    return (
                      <div key={iIdx} className="flex items-center justify-between text-xs gap-2.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-[#1E1E21] bg-slate-100 dark:bg-black">
                            <img src={itImg} alt={it.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="truncate">
                            <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{it.qty}x {it.name}</span>
                            {it.selectedModifiers && it.selectedModifiers.length > 0 && (
                              <span className={`text-[10px] block ${isLight ? 'text-emerald-700' : 'text-[#39FFB0]'}`}>
                                ↳ {it.selectedModifiers.map(m => m.optionName).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`font-mono shrink-0 ${isLight ? 'text-slate-600' : 'text-[#9C9DA3]'}`}>{fmt(it.price * it.qty)}</span>
                      </div>
                    );
                  })}
                </div>

                {activeTrackedOrder.deliveryAddress && (
                  <div className={`pt-2 border-t flex items-center gap-2 text-xs ${
                    isLight ? 'border-slate-200 text-slate-600' : 'border-[#1E1E21] text-[#9C9DA3]'
                  }`}>
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{activeTrackedOrder.deliveryAddress}</span>
                  </div>
                )}

                {activeTrackedOrder.paymentMethod && (
                  <div className={`pt-2 border-t flex items-center justify-between text-xs ${
                    isLight ? 'border-slate-200 text-slate-600' : 'border-[#1E1E21] text-[#9C9DA3]'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{isAr ? 'طريقة الدفع:' : 'Payment Method:'}</span>
                    </span>
                    <span className="font-bold flex items-center gap-1">
                      {activeTrackedOrder.paymentMethod === 'fawran' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                          ⚡ Fawran (30606701)
                        </span>
                      )}
                      {activeTrackedOrder.paymentMethod === 'bank_transfer' && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-mono text-[11px]">
                          🏦 Bank Transfer (QNB)
                        </span>
                      )}
                      {activeTrackedOrder.paymentMethod === 'cod' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                          💵 {isAr ? 'عند الاستلام (كاش)' : 'Cash on Delivery (COD)'}
                        </span>
                      )}
                    </span>
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
              
              {/* Search, Scan and Photo View Toggle Bar */}
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

                {/* Customer Photo Visibility Option Toggle */}
                <button
                  type="button"
                  onClick={handleToggleShowImages}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 border shadow-sm ${
                    showProductImages
                      ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-emerald-500/10' : 'bg-[#1A2E24] text-[#39FFB0] border-[#39FFB0]/40')
                      : (isLight ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' : 'bg-[#0A0A0B] text-[#9C9DA3] border-[#1E1E21] hover:text-white')
                  }`}
                  title={showProductImages ? t.hideImages : t.showImages}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{showProductImages ? t.photosVisible : t.compactView}</span>
                  <span className="sm:hidden">{showProductImages ? (isAr ? 'الصور' : 'Photos') : (isAr ? 'بدون' : 'Text')}</span>
                </button>

                <button
                  onClick={() => setScannerOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 shadow-sm border ${
                    isLight 
                      ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 shadow-emerald-600/5' 
                      : 'bg-[#1A2E24] hover:bg-[#224032] border-[#39FFB0]/40 text-[#39FFB0] shadow-[#39FFB0]/10'
                  }`}
                  title={t.scanBarcodeBtn}
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.scanCode}</span>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
                {filtered.map((product) => {
                  const inCartCount = cart.filter(c => c.productId === product.id).reduce((s, i) => s + i.qty, 0);
                  const isOut = product.stock <= 0;
                  const hasModifiers = product.modifierGroups && product.modifierGroups.length > 0;
                  const productImg = getProductImage(product);

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOut && handleProductSelect(product)}
                      className={`border rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between transition relative select-none shadow-sm group ${
                        isOut 
                          ? (isLight ? 'bg-slate-100/70 border-slate-200 opacity-50 cursor-not-allowed' : 'bg-[#0A0A0B] border-red-950/30 opacity-40 cursor-not-allowed')
                          : (isLight 
                              ? 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer' 
                              : 'bg-[#0A0A0B] border-[#1E1E21] hover:border-[#39FFB0]/50 hover:bg-[#121215] cursor-pointer')
                      }`}
                    >
                      {inCartCount > 0 && (
                        <span className={`absolute top-2.5 ${isAr ? 'left-2.5' : 'right-2.5'} z-10 px-2 py-0.5 rounded-full font-bold text-[10px] shadow ${
                          isLight ? 'bg-emerald-600 text-white' : 'bg-[#39FFB0] text-black'
                        }`}>
                          {inCartCount}x
                        </span>
                      )}

                      {/* Product Image Container (Visible while ordering) */}
                      {showProductImages && (
                        <div className="relative w-full h-28 sm:h-36 rounded-xl overflow-hidden mb-2.5 bg-slate-100 dark:bg-[#151518] group/img shrink-0 border border-slate-100 dark:border-[#1E1E21]/60">
                          <img
                            src={productImg}
                            alt={product.name}
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
                            }}
                            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                              isOut ? 'grayscale contrast-75' : ''
                            }`}
                          />

                          {/* Out of stock banner */}
                          {isOut && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1">
                              <span className="px-2 py-1 rounded-lg bg-red-600/90 text-white font-black text-[10px] uppercase tracking-wider shadow">
                                {t.outOfStock}
                              </span>
                            </div>
                          )}

                          {/* Image Zoom button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImageModal({
                                name: product.name,
                                price: product.price,
                                imgUrl: productImg,
                                category: product.category,
                                product
                              });
                            }}
                            className={`absolute bottom-1.5 ${isAr ? 'left-1.5' : 'right-1.5'} p-1.5 rounded-lg bg-black/60 hover:bg-black/85 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer backdrop-blur-sm shadow-md z-10`}
                            title={isAr ? 'تكبير صورة الصنف' : 'View full product image'}
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                        </div>
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

                        {inCartCount > 0 && !hasModifiers ? (
                          <div 
                            className={`flex items-center rounded-xl border text-xs font-bold shadow-sm ${
                              isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-[#151518] border-[#2A2A2F] text-white'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleDecrementProduct(product)}
                              className={`px-2 py-1 transition cursor-pointer hover:text-red-400 rounded-l-xl ${
                                isLight ? 'hover:bg-slate-200' : 'hover:bg-[#222228]'
                              }`}
                              title={isAr ? 'تقليل الكمية' : 'Decrease'}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-mono text-xs font-bold min-w-[20px] text-center">
                              {inCartCount}
                            </span>
                            <button
                              type="button"
                              disabled={product.stock <= inCartCount}
                              onClick={() => handleProductSelect(product)}
                              className={`px-2 py-1 transition cursor-pointer hover:text-emerald-400 disabled:opacity-30 rounded-r-xl ${
                                isLight ? 'hover:bg-slate-200' : 'hover:bg-[#222228]'
                              }`}
                              title={isAr ? 'زيادة الكمية' : 'Increase'}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isOut}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductSelect(product);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm ${
                              isLight 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{hasModifiers ? (isAr ? 'خيارات' : 'Add') : (isAr ? 'إضافة' : 'Add')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Cart & Customer Checkout Form (5 cols) */}
            <div id="cart-checkout-section" className="lg:col-span-5 scroll-mt-20">
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
                    cart.map((item, idx) => {
                      const itemProd = products.find(p => p.id === item.productId);
                      const itemImg = getProductImage({ name: item.name, image: itemProd?.image, category: itemProd?.category });
                      return (
                      <div key={idx} className={`p-2.5 rounded-xl text-xs space-y-1 border ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0F0F12] border-[#1E1E21]'
                      }`}>
                        <div className="flex items-start justify-between gap-2.5">
                          {/* Item Thumbnail */}
                          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-[#1E1E21] bg-slate-100 dark:bg-black mt-0.5">
                            <img src={itemImg} alt={item.name} className="w-full h-full object-cover" />
                          </div>

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
                    );
                    })
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
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        deliveryMethod === 'pickup'
                          ? (isLight ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm' : 'bg-[#1E1E21] border-[#39FFB0] text-[#39FFB0]')
                          : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white' : 'bg-[#000000] border-[#1E1E21] text-[#9C9DA3] hover:text-white')
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t.dineInPickup}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        deliveryMethod === 'delivery'
                          ? (isLight ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm' : 'bg-[#1E1E21] border-[#39FFB0] text-[#39FFB0]')
                          : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white' : 'bg-[#000000] border-[#1E1E21] text-[#9C9DA3] hover:text-white')
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{t.homeDelivery} (+10)</span>
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

                {/* Qatar Payment Options */}
                <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-[#1E1E21]'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${
                      isLight ? 'text-slate-600' : 'text-[#9C9DA3]'
                    }`}>
                      {t.paymentOption}
                    </label>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/30 text-amber-500">
                      QATAR 🇶🇦
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Cash on Delivery */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-1.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === 'cod'
                          ? (isLight ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold shadow-sm' : 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold shadow-sm')
                          : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300' : 'bg-[#060A12] border-[#1E293B] text-slate-400 hover:border-slate-700')
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] leading-tight font-semibold">{isAr ? 'عند الاستلام' : 'Cash (COD)'}</span>
                    </button>

                    {/* Fawran (30606701) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('fawran')}
                      className={`p-1.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 relative ${
                        paymentMethod === 'fawran'
                          ? 'bg-emerald-600 border-emerald-500 text-white font-bold shadow-sm'
                          : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300' : 'bg-[#060A12] border-[#1E293B] text-slate-400 hover:border-emerald-500/50')
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-current shrink-0 text-amber-300" />
                        <span className="text-[10px] leading-tight font-extrabold">{isAr ? 'فوران' : 'Fawran'}</span>
                      </div>
                      <span className="text-[9px] font-mono leading-none opacity-90 font-bold">30606701</span>
                    </button>

                    {/* Bank Transfer */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-1.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === 'bank_transfer'
                          ? (isLight ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold shadow-sm' : 'bg-blue-500/20 border-blue-400 text-blue-300 font-bold shadow-sm')
                          : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300' : 'bg-[#060A12] border-[#1E293B] text-slate-400 hover:border-slate-700')
                      }`}
                    >
                      <Landmark className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] leading-tight font-semibold">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</span>
                    </button>
                  </div>

                  {/* Fawran Active Details Box */}
                  {paymentMethod === 'fawran' && (
                    <div className={`mt-2 p-2 rounded-xl border animate-in fade-in duration-200 text-xs ${
                      isLight ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950' : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    }`}>
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1 font-bold text-[11px]">
                          <Zap className="w-3 h-3 text-emerald-600 dark:text-[#39FFB0] fill-current" />
                          <span>{isAr ? 'رقم فوران:' : 'Fawran:'}</span>
                          <span className="font-mono text-xs font-black px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            30606701
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyFawran}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition cursor-pointer shadow-sm"
                        >
                          {fawranCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{fawranCopied ? t.copied : t.copy}</span>
                        </button>
                      </div>
                      <p className={`text-[9px] mt-1 leading-tight ${isLight ? 'text-emerald-800' : 'text-emerald-300/80'}`}>
                        {t.fawranInstructions}
                      </p>
                      <div className="mt-1.5">
                        <input
                          type="text"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          placeholder={t.paymentRefOptional}
                          className={`w-full px-2 py-1 rounded-lg text-[10px] border focus:outline-none transition ${
                            isLight ? 'bg-white border-emerald-300 text-slate-800 placeholder-slate-400' : 'bg-black/60 border-emerald-500/30 text-white placeholder-zinc-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Active Details Box */}
                  {paymentMethod === 'bank_transfer' && (
                    <div className={`mt-2 p-2 rounded-xl border animate-in fade-in duration-200 text-xs ${
                      isLight ? 'bg-blue-50/90 border-blue-200 text-blue-950' : 'bg-blue-950/30 border-blue-500/30 text-blue-200'
                    }`}>
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="font-bold flex items-center gap-1 text-[11px]">
                          <Landmark className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>QNB:</span>
                          <span className="font-mono text-xs font-black px-1 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300">
                            30606701
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyBank}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 transition cursor-pointer shadow-sm"
                        >
                          {bankCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{bankCopied ? t.copied : t.copy}</span>
                        </button>
                      </div>
                      <p className={`text-[9px] mt-1 leading-tight ${isLight ? 'text-blue-800' : 'text-blue-300/80'}`}>
                        {isAr ? 'يرجى تحويل المبلغ ثم إرسال إيصال التحويل عبر واتساب' : 'Please transfer the amount and share the receipt on WhatsApp'}
                      </p>
                      <div className="mt-1.5">
                        <input
                          type="text"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          placeholder={t.paymentRefOptional}
                          className={`w-full px-2 py-1 rounded-lg text-[10px] border focus:outline-none transition ${
                            isLight ? 'bg-white border-blue-300 text-slate-800 placeholder-slate-400' : 'bg-black/60 border-blue-500/30 text-white placeholder-zinc-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Cash on Delivery (COD) Active Note */}
                  {paymentMethod === 'cod' && (
                    <div className={`mt-1.5 p-1.5 rounded-xl border text-[10px] flex items-center gap-1.5 ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#060A12] border-[#1E293B] text-slate-400'
                    }`}>
                      <Banknote className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{t.cashOnDeliveryDesc}</span>
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

        {/* ======================================================== */}
        {/* STAFF & ADMIN ACCESS SECTION (CONVENIENT ACCESS FOR POS) */}
        {/* ======================================================== */}
        {(onOpenAdminAccess || onExitCustomerMode) && (
          <div className={`mt-8 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isLight 
              ? 'bg-gradient-to-r from-slate-50 via-emerald-50/20 to-white border-slate-200 shadow-slate-200/50' 
              : 'bg-gradient-to-r from-[#0C1210] via-[#0D0D10] to-[#121215] border-[#1E1E21] shadow-black/40'
          }`}>
            <div className="flex items-center gap-3.5 text-center sm:text-left rtl:sm:text-right">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                isLight 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-[#39FFB0]/10 text-[#39FFB0] border-[#39FFB0]/30'
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className={`text-xs sm:text-sm font-extrabold flex items-center justify-center sm:justify-start gap-1.5 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  <span>{t.staffAndAdmin}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                    isLight 
                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                      : 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                  }`}>
                    POS
                  </span>
                </h4>
                <p className={`text-[11px] sm:text-xs mt-0.5 ${
                  isLight ? 'text-slate-500' : 'text-[#9C9DA3]'
                }`}>
                  {t.staffAccessDesc}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAdminAccess || onExitCustomerMode}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 shadow-md ${
                isLight
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-[#39FFB0] hover:opacity-90 text-black font-extrabold'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{t.openStaffPos}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* FLOATING "VIEW CART" BOTTOM BAR (STICKY LIKE IN SCREENSHOT) */}
      {/* ======================================================== */}
      {cart.length > 0 && !orderSuccessId && (
        <aside 
          aria-label={isAr ? "شريط سلة المشتريات" : "Floating Cart Bar"}
          className="fixed bottom-4 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md md:max-w-lg z-40 transition-all duration-300 animate-in slide-in-from-bottom-5"
        >
          <div 
            onClick={() => setIsCartDrawerOpen(true)}
            className="bg-[#0D1322] border border-[#1E293B] text-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-2xl shadow-black/90 backdrop-blur-md flex items-center justify-between gap-3 cursor-pointer hover:border-amber-400/50 transition group"
          >
            {/* Left: Bag Icon with Green Count Badge & Cart Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                <ShoppingBag className="w-5 h-5 text-slate-950 stroke-[2.4]" />
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-[#10B981] text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-[#0D1322] shadow font-mono">
                  {totalCartCount}
                </span>
              </div>

              <div className="truncate">
                <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 truncate">
                  <span>{isAr ? 'سلة الطلب' : 'Cart'}</span>
                  <span className="text-amber-300/90 text-[11px] sm:text-xs font-medium">
                    ({totalCartCount} {totalCartCount === 1 ? (isAr ? 'عنصر' : 'item') : (isAr ? 'عناصر' : 'items')})
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs font-mono font-bold text-slate-300 truncate">
                  <span className="text-slate-400">{isAr ? 'الإجمالي:' : 'Total:'} </span>
                  <span className="text-white font-black">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Right: "View Cart ➔" Amber Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCartDrawerOpen(true);
              }}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <span>{isAr ? 'عرض السلة' : 'View Cart'}</span>
              {isAr ? <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> : <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
            </button>
          </div>
        </aside>
      )}

      {/* ======================================================== */}
      {/* SLIDE-UP / MODAL VIEW CART DRAWER (MOBILE & QUICK ACCESS) */}
      {/* ======================================================== */}
      {isCartDrawerOpen && !orderSuccessId && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsCartDrawerOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl transition-all duration-200 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E1322] border-[#1E293B] text-[#F5F5F4]'
            }`}
          >
            {/* Drawer Header */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
              isLight ? 'border-slate-200' : 'border-[#1E293B]'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-sm">
                  <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                    <span>{t.yourCart}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#10B981] text-white">
                      {totalCartCount} {totalCartCount === 1 ? (isAr ? 'صنف' : 'item') : (isAr ? 'أصناف' : 'items')}
                    </span>
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                      isLight 
                        ? 'border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200' 
                        : 'border-[#1E293B] text-[#9C9DA3] hover:text-red-400 hover:border-red-900/50'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.clearCart}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#1E293B] hover:bg-[#334155] text-white'
                  }`}
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800/40 text-slate-400 mx-auto flex items-center justify-center mb-3">
                    <ShoppingBag className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="font-bold text-sm text-slate-300">{t.emptyCart}</p>
                  <p className="text-xs text-slate-500 mt-1">{t.emptyCartDesc}</p>
                  <button
                    type="button"
                    onClick={() => setIsCartDrawerOpen(false)}
                    className="mt-4 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {isAr ? 'تصفح القائمة الآن' : 'Browse Menu'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  {/* List of Cart Items */}
                  <div className="space-y-2">
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${
                      isLight ? 'text-slate-500' : 'text-[#9C9DA3]'
                    }`}>
                      {isAr ? 'الأصناف المحددة' : 'Selected Items'}
                    </label>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {cart.map((item, idx) => {
                        const itemProd = products.find(p => p.id === item.productId);
                        const itemImg = getProductImage({ name: item.name, image: itemProd?.image, category: itemProd?.category });
                        return (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060A12] border-[#1E293B]'
                          }`}
                        >
                          {/* Item Thumbnail */}
                          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-[#1E293B] bg-slate-100 dark:bg-black">
                            <img src={itemImg} alt={item.name} className="w-full h-full object-cover" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-xs sm:text-sm truncate">{item.name}</p>
                              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCartDrawerOpen(false);
                                    handleEditItem(item);
                                  }}
                                  className="text-amber-400 hover:text-amber-300 p-0.5"
                                  title="Edit modifiers"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.selectedModifiers.map((m, mIdx) => (
                                  <span key={mIdx} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    +{m.optionName} {m.price > 0 && `(${m.price} QR)`}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.notes && (
                              <p className="text-[10px] italic mt-0.5 text-amber-300">
                                📝 {item.notes}
                              </p>
                            )}

                            <div className="text-[11px] font-mono mt-1 text-slate-400">
                              {fmt(item.price)} × {item.qty} = <span className="font-bold text-white">{fmt(item.price * item.qty)}</span>
                            </div>
                          </div>

                          {/* Stepper controls & trash */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className={`flex items-center rounded-xl border ${
                              isLight ? 'bg-white border-slate-200' : 'bg-[#151D2F] border-[#1E293B]'
                            }`}>
                              <button
                                type="button"
                                onClick={() => changeQty(idx, -1)}
                                className="w-7 h-7 flex items-center justify-center text-xs font-bold transition hover:text-red-400 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-mono font-bold text-xs">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => changeQty(idx, 1)}
                                className="w-7 h-7 flex items-center justify-center text-xs font-bold transition hover:text-emerald-400 cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => changeQty(idx, -item.qty)}
                              className="p-1.5 text-slate-500 hover:text-red-400 transition cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  </div>

                  {/* Order Method */}
                  <div className={`pt-3 border-t ${isLight ? 'border-slate-200' : 'border-[#1E293B]'}`}>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                      isLight ? 'text-slate-500' : 'text-[#9C9DA3]'
                    }`}>
                      {t.orderType}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('pickup')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          deliveryMethod === 'pickup'
                            ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold shadow-sm'
                            : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#060A12] border-[#1E293B] text-slate-400')
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t.dineInPickup}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('delivery')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          deliveryMethod === 'delivery'
                            ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold shadow-sm'
                            : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#060A12] border-[#1E293B] text-slate-400')
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{t.homeDelivery} (+10)</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer Inputs */}
                  <div className="space-y-2 pt-1">
                    <div className="relative">
                      <User className={`w-3.5 h-3.5 absolute ${isAr ? 'right-3' : 'left-3'} top-3 text-slate-400`} />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder={t.yourName}
                        className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2.5 rounded-xl text-xs border focus:outline-none transition ${
                          isLight 
                            ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500' 
                            : 'bg-[#060A12] border-[#1E293B] text-white placeholder-slate-500 focus:border-amber-400'
                        }`}
                      />
                    </div>

                    <div className="relative">
                      <Phone className={`w-3.5 h-3.5 absolute ${isAr ? 'right-3' : 'left-3'} top-3 text-slate-400`} />
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder={`${t.yourPhone} *`}
                        className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2.5 rounded-xl text-xs border focus:outline-none transition ${
                          isLight 
                            ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500' 
                            : 'bg-[#060A12] border-[#1E293B] text-white placeholder-slate-500 focus:border-amber-400'
                        }`}
                      />
                    </div>

                    {deliveryMethod === 'delivery' && (
                      <div className="relative">
                        <MapPin className={`w-3.5 h-3.5 absolute ${isAr ? 'right-3' : 'left-3'} top-3 text-slate-400`} />
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder={`${t.deliveryAddress} *`}
                          className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2.5 rounded-xl text-xs border focus:outline-none transition ${
                            isLight 
                              ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500' 
                              : 'bg-[#060A12] border-[#1E293B] text-white placeholder-slate-500 focus:border-amber-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Qatar Payment Options */}
                  <div className={`pt-3 border-t ${isLight ? 'border-slate-200' : 'border-[#1E293B]'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`block text-[11px] font-bold uppercase tracking-wider ${
                        isLight ? 'text-slate-600' : 'text-[#9C9DA3]'
                      }`}>
                        {t.paymentOption}
                      </label>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/30 text-amber-500">
                        QATAR 🇶🇦
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Cash on Delivery */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'cod'
                            ? (isLight ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold shadow-sm' : 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold shadow-sm')
                            : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300' : 'bg-[#060A12] border-[#1E293B] text-slate-400 hover:border-slate-700')
                        }`}
                      >
                        <Banknote className="w-4 h-4 shrink-0" />
                        <span className="text-[11px] leading-tight font-semibold">{isAr ? 'عند الاستلام' : 'Cash (COD)'}</span>
                      </button>

                      {/* Fawran (30606701) */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('fawran')}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 relative ${
                          paymentMethod === 'fawran'
                            ? 'bg-emerald-600 border-emerald-500 text-white font-bold shadow-sm'
                            : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300' : 'bg-[#060A12] border-[#1E293B] text-slate-400 hover:border-emerald-500/50')
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 fill-current shrink-0 text-amber-300" />
                          <span className="text-[11px] leading-tight font-extrabold">{isAr ? 'فوران' : 'Fawran'}</span>
                        </div>
                        <span className="text-[9px] font-mono leading-none opacity-90 font-bold">30606701</span>
                      </button>

                      {/* Bank Transfer */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank_transfer')}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'bank_transfer'
                            ? (isLight ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold shadow-sm' : 'bg-blue-500/20 border-blue-400 text-blue-300 font-bold shadow-sm')
                            : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300' : 'bg-[#060A12] border-[#1E293B] text-slate-400 hover:border-slate-700')
                        }`}
                      >
                        <Landmark className="w-4 h-4 shrink-0" />
                        <span className="text-[11px] leading-tight font-semibold">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</span>
                      </button>
                    </div>

                    {/* Fawran Active Details Box */}
                    {paymentMethod === 'fawran' && (
                      <div className={`mt-2.5 p-3 rounded-xl border animate-in fade-in duration-200 text-xs ${
                        isLight ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950' : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-[#39FFB0] fill-current" />
                            <span>{isAr ? 'رقم فوران (Fawran):' : 'Fawran Alias:'}</span>
                            <span className="font-mono text-sm font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                              30606701
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyFawran}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition cursor-pointer shadow-sm"
                          >
                            {fawranCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{fawranCopied ? t.copied : t.copy}</span>
                          </button>
                        </div>
                        <p className={`text-[10px] mt-1.5 leading-relaxed ${isLight ? 'text-emerald-800' : 'text-emerald-300/80'}`}>
                          {t.fawranInstructions}
                        </p>
                        <div className="mt-2">
                          <input
                            type="text"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            placeholder={t.paymentRefOptional}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs border focus:outline-none transition ${
                              isLight ? 'bg-white border-emerald-300 text-slate-800 placeholder-slate-400' : 'bg-black/60 border-emerald-500/30 text-white placeholder-zinc-500'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Bank Transfer Active Details Box */}
                    {paymentMethod === 'bank_transfer' && (
                      <div className={`mt-2.5 p-3 rounded-xl border animate-in fade-in duration-200 text-xs ${
                        isLight ? 'bg-blue-50/90 border-blue-200 text-blue-950' : 'bg-blue-950/30 border-blue-500/30 text-blue-200'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold flex items-center gap-1.5 text-xs">
                            <Landmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{isAr ? 'بنك قطر الوطني (QNB):' : 'QNB Account:'}</span>
                            <span className="font-mono text-sm font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300">
                              30606701
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyBank}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 transition cursor-pointer shadow-sm"
                          >
                            {bankCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{bankCopied ? t.copied : t.copy}</span>
                          </button>
                        </div>
                        <p className={`text-[10px] mt-1.5 leading-relaxed ${isLight ? 'text-blue-800' : 'text-blue-300/80'}`}>
                          {isAr ? 'يرجى تحويل المبلغ ثم إرسال إيصال التحويل عبر واتساب' : 'Please transfer the amount and share the receipt on WhatsApp'}
                        </p>
                        <div className="mt-2">
                          <input
                            type="text"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            placeholder={t.paymentRefOptional}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs border focus:outline-none transition ${
                              isLight ? 'bg-white border-blue-300 text-slate-800 placeholder-slate-400' : 'bg-black/60 border-blue-500/30 text-white placeholder-zinc-500'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Cash on Delivery (COD) Active Note */}
                    {paymentMethod === 'cod' && (
                      <div className={`mt-2 p-2 rounded-xl border text-[11px] flex items-center gap-2 ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#060A12] border-[#1E293B] text-slate-400'
                      }`}>
                        <Banknote className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{t.cashOnDeliveryDesc}</span>
                      </div>
                    )}
                  </div>

                  {/* Totals Breakdown */}
                  <div className={`pt-3 border-t space-y-1.5 text-xs ${
                    isLight ? 'border-slate-200 text-slate-600' : 'border-[#1E293B] text-slate-300'
                  }`}>
                    <div className="flex justify-between">
                      <span>{t.subtotal}:</span>
                      <span className="font-mono font-bold">{fmt(subtotal)}</span>
                    </div>
                    {deliveryMethod === 'delivery' && (
                      <div className="flex justify-between">
                        <span>{isAr ? 'رسوم التوصيل' : 'Delivery Fee'}:</span>
                        <span className="font-mono font-bold">{fmt(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm font-extrabold pt-1.5 border-t border-dashed border-[#1E293B]/60 text-white">
                      <span className={isLight ? 'text-slate-900' : 'text-white'}>{t.total}:</span>
                      <span className="font-mono text-lg text-amber-400 font-black">{fmt(total)}</span>
                    </div>
                  </div>

                  {/* WhatsApp Submit Action */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
                    >
                      <MessageSquare className="w-4 h-4 fill-current" />
                      <span>{submitting ? (isAr ? 'جاري إرسال الطلب...' : 'Sending Order...') : t.placeOrderWhatsapp}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCartDrawerOpen(false)}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
                        isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {isAr ? '← مواصلة إضافة أصناف' : '← Continue Adding Items'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Product Image Lightbox Zoom Modal */}
      {previewImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImageModal(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-3xl overflow-hidden border shadow-2xl transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0A0A0B] border-[#1E1E21] text-white'
            }`}
          >
            {/* Modal Image */}
            <div className="relative w-full h-72 sm:h-80 bg-black overflow-hidden flex items-center justify-center">
              <img 
                src={previewImageModal.imgUrl} 
                alt={previewImageModal.name} 
                className="w-full h-full object-cover" 
              />
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer backdrop-blur-sm shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Info & Actions */}
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`text-[10px] uppercase font-mono tracking-wider block font-semibold ${
                    isLight ? 'text-emerald-700' : 'text-[#39FFB0]'
                  }`}>
                    {previewImageModal.category || 'Store'}
                  </span>
                  <h3 className="font-extrabold text-base sm:text-lg mt-0.5">
                    {previewImageModal.name}
                  </h3>
                </div>
                <div className={`text-right font-mono font-black text-base sm:text-lg shrink-0 ${
                  isLight ? 'text-emerald-700' : 'text-[#39FFB0]'
                }`}>
                  {fmt(previewImageModal.price)}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-[#1E1E21]">
                <button
                  type="button"
                  onClick={() => setPreviewImageModal(null)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-[#151517] hover:bg-[#1E1E21] border-[#1E1E21] text-slate-300'
                  }`}
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
                {previewImageModal.product && (
                  <button
                    type="button"
                    disabled={previewImageModal.product.stock <= 0}
                    onClick={() => {
                      handleProductSelect(previewImageModal.product!);
                      setPreviewImageModal(null);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                      isLight 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'bg-[#39FFB0] hover:opacity-90 text-black'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{isAr ? 'إضافة إلى السلة' : 'Add to Cart'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerOrderView;
