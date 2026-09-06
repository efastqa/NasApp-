import React, { useState } from 'react';
import { 
  Camera, 
  Search, 
  Trash2, 
  Printer, 
  MessageSquare, 
  Percent, 
  CreditCard, 
  Banknote,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
  Edit2
} from 'lucide-react';
import { Product, CartItem, Discount, Sale } from '../../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ProductModifierModal } from './ProductModifierModal';
import { Language, translations } from '../../i18n';

interface RegisterViewProps {
  products: Product[];
  onSaleComplete: (saleData: any) => Promise<Sale | null>;
  onPrintReceipt: (sale: Sale) => void;
  onRefreshProducts: () => void;
  lang?: Language;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  products,
  onSaleComplete,
  onPrintReceipt,
  lang = 'en'
}) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  const [search, setSearch] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [channel, setChannel] = useState<'instore' | 'online'>('instore');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountInput, setDiscountInput] = useState<string>('');
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [stampVisible, setStampVisible] = useState<boolean>(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modifiers Selection Modal
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);

  const fmt = (n: number) => (isAr ? `${Number(n).toFixed(2)} ر.ق` : `QR ${Number(n).toFixed(2)}`);

  // Categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort()];

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase();
    const matchesQ = p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
    const matchesCat = activeCategory === 'All' || (p.category || '') === activeCategory;
    return matchesQ && matchesCat;
  });

  // Handle click on product catalog
  const handleProductClick = (product: Product) => {
    if (product.stock <= 0) return;

    if (product.modifierGroups && product.modifierGroups.length > 0) {
      setModifierProduct(product);
      setEditingCartItem(null);
    } else {
      addToCartDirect(product);
    }
  };

  // Add standard product without modifiers
  const addToCartDirect = (product: Product) => {
    const existing = cart.find(c => c.productId === product.id && (!c.selectedModifiers || c.selectedModifiers.length === 0));
    const inCart = existing ? existing.qty : 0;
    if (inCart >= product.stock) {
      alert(isAr ? `الكمية المتوفرة بالمخزن فقط ${product.stock}!` : `Only ${product.stock} in stock!`);
      return;
    }

    if (existing) {
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

  // Handle confirm from Modifier Modal
  const handleConfirmModifiers = (item: CartItem) => {
    if (editingCartItem) {
      // Update existing item in cart
      setCart(cart.map(c => c === editingCartItem ? item : c));
      setEditingCartItem(null);
    } else {
      // Add new item with modifiers to cart
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
      alert(isAr ? `الكمية المتوفرة بالمخزن فقط ${prod.stock}!` : `Only ${prod.stock} in stock!`);
    } else {
      setCart(cart.map((c, idx) => idx === index ? { ...c, qty: newQty } : c));
    }
  };

  const handleEditCartItemModifiers = (item: CartItem) => {
    const prod = products.find(p => p.id === item.productId);
    if (prod) {
      setModifierProduct(prod);
      setEditingCartItem(item);
    }
  };

  // Discount calculation
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountVal = parseFloat(discountInput) || 0;
  const discountAmount = discountVal > 0 
    ? (discountType === 'percentage' ? subtotal * (Math.min(discountVal, 100) / 100) : Math.min(discountVal, subtotal))
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  // Handle Checkout
  const handleCheckout = async () => {
    if (cart.length === 0 || total <= 0 || submitting) return;
    setSubmitting(true);

    const discountObj: Discount = {
      type: discountType,
      value: discountVal,
      amount: discountAmount
    };

    const payload = {
      channel,
      customerPhone: customerPhone.trim(),
      items: cart,
      subtotal,
      discount: discountObj,
      total,
      source: 'pos'
    };

    try {
      const createdSale = await onSaleComplete(payload);
      if (createdSale) {
        setLastCompletedSale(createdSale);
        setStampVisible(true);
        setTimeout(() => setStampVisible(false), 1400);
        setCart([]);
        setDiscountInput('');
        setCustomerPhone('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Barcode detection from scanner
  const handleBarcodeDetected = (code: string) => {
    const found = products.find(p => p.sku && p.sku.toLowerCase() === code.toLowerCase()) 
      || products.find(p => p.name.toLowerCase().includes(code.toLowerCase()));
    
    if (found) {
      if (found.stock <= 0) {
        alert((isAr ? 'المنتج نفد من المخزون: ' : 'Product out of stock: ') + found.name);
      } else {
        handleProductClick(found);
        setScannerOpen(false);
      }
    }
  };

  // WhatsApp receipt send
  const sendWhatsAppReceipt = (sale: Sale) => {
    const rawPhone = sale.customerPhone || prompt(isAr ? 'أدخل رقم جوال العميل للواتساب:' : 'Enter customer WhatsApp phone number:');
    if (!rawPhone) return;
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.length <= 8 && !digits.startsWith('974')) digits = '974' + digits;

    const lines = sale.items.map(i => {
      const mods = i.selectedModifiers && i.selectedModifiers.length > 0 
        ? ` (${i.selectedModifiers.map(m => m.optionName).join(', ')})` 
        : '';
      const notes = i.notes ? ` [📝 ${i.notes}]` : '';
      return `${i.qty}x ${i.name}${mods}${notes} - ${fmt(i.price * i.qty)}`;
    }).join('\n');

    const disc = sale.discount && sale.discount.amount > 0 ? (isAr ? `\nالخصم: ${fmt(sale.discount.amount)}` : `\nDiscount: ${fmt(sale.discount.amount)}`) : '';
    
    const text = encodeURIComponent(
      isAr 
        ? `مرحباً! إليك فاتورة مشترياتك من ناس آب قطر (Nasapp)\n\n${lines}${disc}\n\nالإجمالي: ${fmt(sale.total)}\nالتاريخ: ${new Date(sale.timestamp).toLocaleString('ar-QA')}\n\nشكراً لتسوقكم معنا!`
        : `Hi! Here's your receipt from Nasapp Qatar\n\n${lines}${disc}\n\nTotal: ${fmt(sale.total)}\n${new Date(sale.timestamp).toLocaleString()}\n\nThank you for shopping with us!`
    );
    window.open(`https://wa.me/${digits}?text=${text}`, '_blank');
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-4">
      
      {/* Search & Actions Bar */}
      <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Search className={`w-4 h-4 absolute ${isAr ? 'right-3' : 'left-3'} top-3 text-[#5E5F64]`} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchProducts}
                className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 bg-[#000000] border border-[#1E1E21] rounded-lg text-xs text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0] transition`}
              />
            </div>
            <button
              onClick={() => setScannerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1A2E24] hover:bg-[#224032] border border-[#39FFB0]/40 text-xs font-semibold text-[#39FFB0] rounded-lg transition cursor-pointer shrink-0 shadow-sm shadow-[#39FFB0]/10"
              title={t.scanBarcodeBtn}
            >
              <Camera className="w-4 h-4 text-[#39FFB0] animate-pulse" />
              <span>{t.scanCode}</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 bg-[#39FFB0] text-[#04120C] text-[9px] font-mono font-bold rounded">
                LIVE
              </span>
            </button>
          </div>

          {/* Quick Categories Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#39FFB0] text-[#04120C] font-bold shadow-sm'
                    : 'bg-[#151517] text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#1E1E21]'
                }`}
              >
                {cat === 'All' ? t.allCategories : cat}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Main Grid: Catalog (Left) + Cart & Checkout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Products Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#F5F5F4]">
              {isAr ? 'قائمة الأصناف' : 'Product Items'} ({filteredProducts.length})
            </span>
            <span className="text-[11px] text-[#9C9DA3]">
              {isAr ? 'انقر على الصنف لاختيار الخيارات والإضافة' : 'Click item to customize options or add'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const inCartCount = cart.filter(c => c.productId === p.id).reduce((s, i) => s + i.qty, 0);
              const isOut = p.stock <= 0;
              const hasModifiers = p.modifierGroups && p.modifierGroups.length > 0;

              return (
                <div
                  key={p.id}
                  onClick={() => !isOut && handleProductClick(p)}
                  className={`bg-[#0A0A0B] border rounded-2xl p-3 flex flex-col justify-between transition group relative select-none ${
                    isOut 
                      ? 'border-red-950/40 opacity-50 cursor-not-allowed bg-[#0F0808]' 
                      : 'border-[#1E1E21] hover:border-[#39FFB0]/60 hover:bg-[#121214] cursor-pointer shadow-sm'
                  }`}
                >
                  {inCartCount > 0 && (
                    <span className={`absolute top-2 ${isAr ? 'left-2' : 'right-2'} px-2 py-0.5 rounded-full bg-[#39FFB0] text-[#04120C] font-mono text-[10px] font-bold shadow`}>
                      {inCartCount}x
                    </span>
                  )}

                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#5E5F64] block truncate">
                        {p.category || 'General'}
                      </span>
                      {hasModifiers && (
                        <span className="px-1.5 py-0.2 bg-[#1A2E24] border border-[#39FFB0]/40 text-[#39FFB0] text-[9px] font-bold rounded-md flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{isAr ? 'خيارات' : 'Options'}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-xs text-[#F5F5F4] line-clamp-2 mb-1 group-hover:text-[#39FFB0] transition">
                      {p.name}
                    </h4>

                    {p.sku && (
                      <span className="text-[10px] font-mono text-[#5E5F64] block mb-2 truncate">
                        {p.sku}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#1E1E21] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#39FFB0] font-mono">
                      {fmt(p.price)}
                    </span>
                    <span className={`text-[10px] font-medium ${p.stock <= 5 ? 'text-amber-400' : 'text-[#5E5F64]'}`}>
                      {isOut ? t.outOfStock : `${p.stock} ${t.stockLeft}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Register Cart & Payment (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4 flex flex-col h-full relative overflow-hidden shadow-xl">
            
            {/* PAID Stamp Animation */}
            {stampVisible && (
              <div className="absolute inset-0 bg-[#0A0A0B]/90 backdrop-blur-sm z-30 flex items-center justify-center animate-in zoom-in duration-200">
                <div className="border-4 border-[#39FFB0] text-[#39FFB0] px-6 py-3 rounded-2xl rotate-[-8deg] font-black text-2xl tracking-widest shadow-[0_0_30px_#39FFB0] flex items-center gap-2">
                  <CheckCircle2 className="w-8 h-8" />
                  <span>{isAr ? 'تم الدفع بنجاح' : 'PAID & RECORDED'}</span>
                </div>
              </div>
            )}

            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E21]">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#F5F5F4]">{t.currentSale}</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#1E1E21] text-[#39FFB0] font-mono text-[10px] font-bold">
                  {cart.reduce((s, i) => s + i.qty, 0)} {t.items}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[#9C9DA3] hover:text-red-400 text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.clearCart}</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 min-h-[220px] max-h-[260px] overflow-y-auto py-2 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#5E5F64]">
                  <p className="text-xs font-semibold text-[#9C9DA3] mb-1">{t.emptyCart}</p>
                  <p className="text-[11px]">{t.emptyCartDesc}</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-[#0F0F12] border border-[#1E1E21] rounded-xl text-xs space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-[#F5F5F4] truncate">{item.name}</p>
                          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleEditCartItemModifiers(item)}
                              className="text-[#39FFB0] hover:text-white transition"
                              title="Edit options"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Modifiers List Badges */}
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selectedModifiers.map((m, mIdx) => (
                              <span key={mIdx} className="px-1.5 py-0.2 bg-[#1A2E24] text-[#39FFB0] border border-[#39FFB0]/30 rounded text-[9px] font-mono">
                                +{m.optionName} {m.price > 0 && `(${m.price} QR)`}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Kitchen Notes */}
                        {item.notes && (
                          <p className="text-[10px] text-amber-300 italic mt-0.5">
                            📝 {item.notes}
                          </p>
                        )}

                        <span className="text-[10px] font-mono text-[#9C9DA3] block mt-1">
                          {fmt(item.price)} × {item.qty} = <strong className="text-[#39FFB0]">{fmt(item.price * item.qty)}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pt-1">
                        <button
                          onClick={() => changeQty(idx, -1)}
                          className="w-6 h-6 rounded-md bg-[#1E1E21] hover:bg-[#2A2A30] text-[#F5F5F4] flex items-center justify-center transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs font-bold w-5 text-center text-[#F5F5F4]">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => changeQty(idx, 1)}
                          className="w-6 h-6 rounded-md bg-[#1E1E21] hover:bg-[#2A2A30] text-[#F5F5F4] flex items-center justify-center transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Discount Section */}
            <div className="pt-3 border-t border-[#1E1E21] space-y-2">
              
              {/* Fast 1-Click Promo Coupons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] text-[#9C9DA3] shrink-0">{isAr ? 'كوبونات:' : 'Coupons:'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('percentage');
                    setDiscountInput('10');
                  }}
                  className="px-2 py-0.5 rounded-full bg-[#151517] hover:bg-[#1E1E21] border border-[#39FFB0]/30 text-[#39FFB0] text-[10px] font-mono font-bold shrink-0 cursor-pointer"
                >
                  WELCOME10 (-10%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('percentage');
                    setDiscountInput('20');
                  }}
                  className="px-2 py-0.5 rounded-full bg-[#151517] hover:bg-[#1E1E21] border border-[#39FFB0]/30 text-[#39FFB0] text-[10px] font-mono font-bold shrink-0 cursor-pointer"
                >
                  DOHA20 (-20%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('fixed');
                    setDiscountInput('50');
                  }}
                  className="px-2 py-0.5 rounded-full bg-[#151517] hover:bg-[#1E1E21] border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold shrink-0 cursor-pointer"
                >
                  VIP50 (-50 QR)
                </button>
              </div>

              {/* Discount inputs */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-[#1E1E21] bg-[#000000] p-0.5 text-[11px]">
                  <button
                    onClick={() => setDiscountType('percentage')}
                    className={`px-2 py-1 rounded transition cursor-pointer ${discountType === 'percentage' ? 'bg-[#1E1E21] text-[#39FFB0] font-bold' : 'text-[#9C9DA3]'}`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setDiscountType('fixed')}
                    className={`px-2 py-1 rounded transition cursor-pointer ${discountType === 'fixed' ? 'bg-[#1E1E21] text-[#39FFB0] font-bold' : 'text-[#9C9DA3]'}`}
                  >
                    {isAr ? 'ر.ق' : 'QR'}
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder={t.customDiscount}
                  className="flex-1 px-3 py-1 bg-[#000000] border border-[#1E1E21] rounded-lg text-xs font-mono text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
                />
              </div>

              {/* Customer WhatsApp input */}
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder={isAr ? 'رقم جوال العميل للواتساب (اختياري)' : 'Customer Mobile (+974, optional)'}
                className="w-full px-3 py-1 bg-[#000000] border border-[#1E1E21] rounded-lg text-xs text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
              />

              {/* Financial Totals */}
              <div className="space-y-1 text-xs pt-1">
                <div className="flex justify-between text-[#9C9DA3]">
                  <span>{t.subtotal}:</span>
                  <span className="font-mono text-[#F5F5F4]">{fmt(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#39FFB0]">
                    <span>{t.discount}:</span>
                    <span className="font-mono">−{fmt(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-[#F5F5F4] pt-1.5 border-t border-[#1E1E21]">
                  <span>{t.total}:</span>
                  <span className="font-mono text-base text-[#39FFB0]">{fmt(total)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-[#1E1E21] border-[#39FFB0] text-[#39FFB0]'
                      : 'bg-[#0F0F12] border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4]'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>{t.quickCash}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-[#1E1E21] border-[#39FFB0] text-[#39FFB0]'
                      : 'bg-[#0F0F12] border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4]'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{t.cardPayment}</span>
                </button>
              </div>

              {/* Complete Payment Button */}
              <button
                type="button"
                disabled={cart.length === 0 || total <= 0 || submitting}
                onClick={handleCheckout}
                className="w-full py-3 bg-[#39FFB0] hover:opacity-95 disabled:opacity-30 disabled:cursor-not-allowed text-[#04120C] font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#39FFB0]/10 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? (isAr ? 'جاري الحفظ...' : 'Processing...') : t.completePayment}</span>
                <span className="font-mono">({fmt(total)})</span>
              </button>

              {/* Last Sale Action Bar */}
              {lastCompletedSale && (
                <div className="pt-2 flex items-center gap-2 animate-in fade-in">
                  <button
                    onClick={() => onPrintReceipt(lastCompletedSale)}
                    className="flex-1 py-1.5 bg-[#1E1E21] hover:bg-[#2A2A30] text-[#F5F5F4] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#39FFB0]" />
                    <span>{t.printReceipt}</span>
                  </button>

                  <button
                    onClick={() => sendWhatsAppReceipt(lastCompletedSale)}
                    className="flex-1 py-1.5 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t.whatsappOrder}</span>
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>

      </div>

      {/* Product Modifiers Modal */}
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
        />
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleBarcodeDetected}
        products={products}
        lang={lang}
      />

    </div>
  );
};

export default RegisterView;
