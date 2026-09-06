import React, { useState } from 'react';
import { 
  Plus, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle,
  Printer,
  Trash2,
  Check,
  ChefHat,
  Bell,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { Order, Product, CartItem, Discount } from '../../types';
import { Language, translations } from '../../i18n';

interface OrdersViewProps {
  orders: Order[];
  products: Product[];
  onUpdateStatus: (orderId: string, status: string, note?: string) => Promise<boolean>;
  onCreateManualOrder: (orderData: any) => Promise<boolean>;
  onPrintReceipt?: (saleOrOrder: any) => void;
  lang?: Language;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  products,
  onUpdateStatus,
  onCreateManualOrder,
  onPrintReceipt,
  lang = 'en'
}) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  const [filter, setFilter] = useState<string>('all');
  const [showManualOrder, setShowManualOrder] = useState<boolean>(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Manual Order Form state
  const [custName, setCustName] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [manualItems, setManualItems] = useState<CartItem[]>([]);
  const [selectedProdId, setSelectedProdId] = useState<string>(products[0]?.id || '');
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [manualDiscountVal, setManualDiscountVal] = useState<string>('');
  const [manualDiscountType, setManualDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [creating, setCreating] = useState<boolean>(false);

  const fmt = (n: number) => (isAr ? `${Number(n).toFixed(2)} ر.ق` : `QR ${Number(n).toFixed(2)}`);

  // Pipeline stages in chronological order
  const PIPELINE_STEPS = [
    { key: 'pending', labelEn: 'Pending', labelAr: 'قيد الانتظار', icon: '⏳', color: '#FFB039' },
    { key: 'confirmed', labelEn: 'Confirmed (Accepted)', labelAr: 'مؤكد ومقبول', icon: '✓', color: '#39B0FF' },
    { key: 'preparing', labelEn: 'Preparing', labelAr: 'جاري التجهيز', icon: '👨‍🍳', color: '#B039FF' },
    { key: 'ready', labelEn: 'Ready', labelAr: 'جاهز للاستلام', icon: '🛎️', color: '#39FFB0' },
    { key: 'completed', labelEn: 'Completed', labelAr: 'مكتمل', icon: '✅', color: '#39FFB0' }
  ];

  // Status labels
  const statusLabels: Record<string, string> = {
    pending: isAr ? 'قيد الانتظار' : 'Pending',
    confirmed: isAr ? 'مقبول ومؤكد' : 'Confirmed (Accepted)',
    preparing: isAr ? 'جاري التجهيز' : 'Preparing',
    ready: isAr ? 'جاهز للاستلام / التوصيل' : 'Ready',
    completed: isAr ? 'مكتمل' : 'Completed',
    cancelled: isAr ? 'ملغي' : 'Cancelled'
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-[#FFB039]/15 text-[#FFB039] border-[#FFB039]/30',
    confirmed: 'bg-[#39B0FF]/15 text-[#39B0FF] border-[#39B0FF]/30',
    preparing: 'bg-[#B039FF]/15 text-[#B039FF] border-[#B039FF]/30',
    ready: 'bg-[#39FFB0]/15 text-[#39FFB0] border-[#39FFB0]/30',
    completed: 'bg-[#39FFB0] text-[#04120C] border-[#39FFB0]',
    cancelled: 'bg-[#FF5E5E]/15 text-[#FF5E5E] border-[#FF5E5E]/30'
  };

  // Pending count for top banner
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  // Status changer handler
  const handleStatusChange = async (orderId: string, newStatus: string, note?: string) => {
    setUpdatingId(orderId);
    try {
      await onUpdateStatus(orderId, newStatus, note);
    } finally {
      setUpdatingId(null);
    }
  };

  // Accept all pending helper
  const handleAcceptAllPending = async () => {
    for (const order of pendingOrders) {
      await onUpdateStatus(order.id, 'confirmed', 'Batch accepted by staff');
    }
  };

  // Manual items subtotal & total
  const manualSubtotal = manualItems.reduce((s, i) => s + (i.price * i.qty), 0);
  const discVal = parseFloat(manualDiscountVal) || 0;
  const manualDiscAmount = discVal > 0 
    ? (manualDiscountType === 'percentage' ? manualSubtotal * (Math.min(discVal, 100) / 100) : Math.min(discVal, manualSubtotal))
    : 0;
  const manualTotal = Math.max(0, manualSubtotal - manualDiscAmount);

  const handleAddManualItem = () => {
    const prod = products.find(p => p.id === selectedProdId);
    if (!prod) return;
    const existing = manualItems.find(i => i.productId === prod.id);
    if (existing) {
      setManualItems(manualItems.map(i => i.productId === prod.id ? { ...i, qty: i.qty + selectedQty } : i));
    } else {
      setManualItems([...manualItems, { productId: prod.id, name: prod.name, price: prod.price, qty: selectedQty }]);
    }
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualItems.length === 0 || !custName.trim()) {
      alert(isAr ? 'يرجى إدخال اسم العميل وإضافة صنف واحد على الأقل' : 'Please add customer name and at least one item');
      return;
    }

    setCreating(true);
    const discountObj: Discount = {
      type: manualDiscountType,
      value: discVal,
      amount: manualDiscAmount
    };

    const payload = {
      customerName: custName.trim(),
      customerPhone: custPhone.trim(),
      deliveryMethod,
      deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress.trim() : '',
      items: manualItems,
      subtotal: manualSubtotal,
      discount: discountObj,
      total: manualTotal,
      source: 'staff',
      channel: 'online'
    };

    const success = await onCreateManualOrder(payload);
    if (success) {
      setShowManualOrder(false);
      setCustName('');
      setCustPhone('');
      setDeliveryAddress('');
      setManualItems([]);
      setManualDiscountVal('');
    }
    setCreating(false);
  };

  // WhatsApp notification helper
  const sendWhatsAppUpdate = (order: Order) => {
    const rawPhone = order.customerPhone || prompt(isAr ? 'أدخل رقم جوال العميل للواتساب:' : 'Enter customer WhatsApp phone number:');
    if (!rawPhone) return;
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.length <= 8 && !digits.startsWith('974')) digits = '974' + digits;

    const itemsStr = order.items.map(i => {
      const mods = i.selectedModifiers?.map(m => m.optionName).join(', ') || '';
      return `${i.qty}x ${i.name} ${mods ? `(${mods})` : ''} - ${fmt(i.price * i.qty)}`;
    }).join('\n');
    const statusLabel = statusLabels[order.status] || order.status;
    const discStr = order.discount && order.discount.amount > 0 ? (isAr ? `\nالخصم: ${fmt(order.discount.amount)}` : `\nDiscount: ${fmt(order.discount.amount)}`) : '';
    const trackingUrl = `${window.location.origin}${window.location.pathname}?customer=1&track=${order.id}`;
    
    const text = encodeURIComponent(
      isAr
        ? `مرحباً ${order.customerName || 'عميلنا العزيز'}! تم تحديث حالة طلبك #${order.id} إلى: *${statusLabel}*.\n\n${itemsStr}${discStr}\n\nالإجمالي: ${fmt(order.total)}\n\n📍 *رابط التتبع المباشر:*\n${trackingUrl}\n\nشكراً لتعاملكم معنا في ناس آب (Nasapp)!`
        : `Hi ${order.customerName || 'Customer'}! Your order #${order.id} status is now: *${statusLabel}*.\n\n${itemsStr}${discStr}\n\nTotal: ${fmt(order.total)}\n\n📍 *Live Order Tracker:*\n${trackingUrl}\n\nThank you for ordering with Nasapp!`
    );
    window.open(`https://wa.me/${digits}?text=${text}`, '_blank');
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-5">
      
      {/* Header and Manual Order Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1E1E21]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-semibold text-2xl text-[#F5F5F4]">{t.liveOrdersQueue}</h2>
            {pendingOrders.length > 0 && (
              <span className="animate-pulse px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-xs font-bold font-mono">
                {pendingOrders.length} {isAr ? 'في الانتظار' : 'Pending'}
              </span>
            )}
          </div>
          <p className="text-xs text-[#9C9DA3] mt-0.5">
            {isAr ? 'قبول وإدارة طلبات العملاء المباشرة (QR Menu والواتساب) وتحديث مراحل التجهيز والتسليم.' : 'Accept and manage live customer orders, update kitchen preparation stages, and record completed sales.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const demoNames = ['Maryam Al-Thani', 'Saad Al-Kuwari', 'Khalid Al-Marri', 'Sara Al-Hajri'];
              const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
              const p = products[Math.floor(Math.random() * products.length)] || products[0];
              if (p) {
                onCreateManualOrder({
                  customerName: randomName,
                  customerPhone: '+974 7731 5415',
                  deliveryMethod: 'pickup',
                  deliveryAddress: '',
                  items: [{ productId: p.id, name: p.name, price: p.price, qty: 1 }],
                  subtotal: p.price,
                  discount: { type: 'fixed', value: 0, amount: 0 },
                  total: p.price,
                  source: 'customer',
                  channel: 'online'
                });
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#151517] hover:bg-[#1E1E21] border border-[#39FFB0]/40 text-[#39FFB0] rounded-lg text-xs font-semibold transition cursor-pointer"
            title={isAr ? 'إنشاء طلب تجريبي للاختبار الفوري' : 'Create a live test order to verify accepting'}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? '+ تجربة طلب فوري' : '+ Test Order'}</span>
          </button>
          <button
            onClick={() => setShowManualOrder(!showManualOrder)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#39FFB0] text-[#04120C] rounded-lg text-xs font-bold transition shadow-sm cursor-pointer hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            <span>{showManualOrder ? (isAr ? 'إغلاق النموذج' : 'Close Form') : (isAr ? '+ تسجيل طلب يدوي' : '+ Manual Order')}</span>
          </button>
        </div>
      </div>

      {/* PENDING ORDERS ALERT & QUICK ACCEPT BANNER */}
      {pendingOrders.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-950/40 via-[#1C170B] to-amber-950/40 border border-amber-500/50 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">
                {isAr ? `تنبيه: يوجد ${pendingOrders.length} طلب جديد بانتظار القبول والاعتماد!` : `Action Required: ${pendingOrders.length} new order(s) waiting for acceptance!`}
              </h3>
              <p className="text-xs text-amber-300/80">
                {isAr ? 'انقر على "قبول الطلب" لتأكيد الطلب للعميل والبدء في تجهيزه في المطبخ.' : 'Click "Accept Order" below to confirm to the customer and initiate kitchen prep.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleAcceptAllPending}
              className="flex-1 md:flex-initial px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl transition shadow cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? `قبول جميع الطلبات المعلقة (${pendingOrders.length})` : `Accept All Pending (${pendingOrders.length})`}</span>
            </button>
            <button
              onClick={() => setFilter('pending')}
              className="px-3 py-2 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs font-semibold rounded-xl cursor-pointer"
            >
              {isAr ? 'عرض فقط' : 'View Only'}
            </button>
          </div>
        </div>
      )}

      {/* Manual Order Drawer */}
      {showManualOrder && (
        <form onSubmit={handleCreateOrderSubmit} className="p-4 bg-[#0F0F12] border border-[#39FFB0]/30 rounded-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#1E1E21] pb-2">
            <h3 className="text-sm font-semibold text-[#F5F5F4]">{isAr ? 'تسجيل طلب جديد من الكاشير' : 'Create Staff Order'}</h3>
            <span className="text-[11px] text-[#9C9DA3]">{isAr ? 'تأكيد مباشر في قاعدة البيانات' : 'Direct database insertion'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] text-[#9C9DA3] uppercase tracking-wider mb-1">{t.yourName} *</label>
              <input
                type="text"
                required
                value={custName}
                onChange={e => setCustName(e.target.value)}
                placeholder="e.g. Mohammed"
                className="w-full bg-[#151517] border border-[#1E1E21] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#9C9DA3] uppercase tracking-wider mb-1">{t.yourPhone}</label>
              <input
                type="tel"
                value={custPhone}
                onChange={e => setCustPhone(e.target.value)}
                placeholder="e.g. +974 55123456"
                className="w-full bg-[#151517] border border-[#1E1E21] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#9C9DA3] uppercase tracking-wider mb-1">{t.orderType}</label>
              <select
                value={deliveryMethod}
                onChange={e => setDeliveryMethod(e.target.value as any)}
                className="w-full bg-[#151517] border border-[#1E1E21] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
              >
                <option value="pickup">{t.dineInPickup}</option>
                <option value="delivery">{t.homeDelivery}</option>
              </select>
            </div>
            {deliveryMethod === 'delivery' && (
              <div>
                <label className="block text-[10px] text-[#9C9DA3] uppercase tracking-wider mb-1">{t.deliveryAddress}</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="Street / Flat / Zone"
                  className="w-full bg-[#151517] border border-[#1E1E21] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
                />
              </div>
            )}
          </div>

          {/* Add item to manual order */}
          <div className="p-3 bg-[#151517] border border-[#1E1E21] rounded-lg space-y-2">
            <span className="text-[11px] font-semibold text-[#9C9DA3]">{isAr ? 'إضافة أصناف للطلب:' : 'Add Items to Order:'}</span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedProdId}
                onChange={e => setSelectedProdId(e.target.value)}
                className="flex-1 min-w-[180px] bg-[#0A0A0B] border border-[#1E1E21] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({fmt(p.price)})</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={selectedQty}
                onChange={e => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-[#0A0A0B] border border-[#1E1E21] rounded-lg px-2 py-1.5 text-xs text-center text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
              />
              <button
                type="button"
                onClick={handleAddManualItem}
                className="px-3 py-1.5 bg-[#1E1E21] hover:bg-[#2A2A30] text-[#39FFB0] rounded-lg text-xs font-semibold cursor-pointer"
              >
                + {isAr ? 'إضافة' : 'Add Item'}
              </button>
            </div>

            {manualItems.length > 0 && (
              <div className="mt-2 space-y-1.5 pt-2 border-t border-[#1E1E21]">
                {manualItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-[#F5F5F4]">
                    <span>{item.qty}x {item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#39FFB0]">{fmt(item.price * item.qty)}</span>
                      <button
                        type="button"
                        onClick={() => setManualItems(manualItems.filter((_, i) => i !== idx))}
                        className="text-[#9C9DA3] hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold text-[#F5F5F4] pt-1">
                  <span>{t.total}:</span>
                  <span className="font-mono text-[#39FFB0]">{fmt(manualTotal)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowManualOrder(false)}
              className="px-3 py-1.5 bg-[#151517] text-xs text-[#9C9DA3] rounded-lg cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={creating || manualItems.length === 0}
              className="px-4 py-1.5 bg-[#39FFB0] text-[#04120C] text-xs font-bold rounded-lg cursor-pointer disabled:opacity-40"
            >
              {creating ? (isAr ? 'جاري الحفظ...' : 'Creating...') : (isAr ? 'تأكيد الطلب' : 'Create Order')}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#1E1E21] no-scrollbar">
        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map(st => {
          const count = st === 'all' ? orders.length : orders.filter(o => o.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                filter === st
                  ? 'bg-[#1E1E21] text-[#39FFB0] border border-[#39FFB0]/40'
                  : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#121215]'
              }`}
            >
              <span>{st === 'all' ? (isAr ? 'جميع الطلبات' : 'All Orders') : (statusLabels[st] || st)}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                st === 'pending' && count > 0 
                  ? 'bg-amber-500/20 text-amber-300 font-bold' 
                  : 'bg-[#151517] text-[#9C9DA3]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl text-[#9C9DA3] text-xs space-y-2">
            <Clock className="w-8 h-8 mx-auto text-[#5E5F64] opacity-40" />
            <p>{isAr ? 'لا توجد طلبات مطابقة لهذا الفلتر حالياً.' : 'No orders found matching this filter.'}</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isExpanded = expandedOrderId === order.id;
            const badgeClass = statusColors[order.status] || 'bg-[#1E1E21] text-[#F5F5F4]';
            const isPending = order.status === 'pending';
            const isProcessing = updatingId === order.id;

            return (
              <div
                key={order.id}
                className={`bg-[#0A0A0B] border rounded-2xl p-4 transition space-y-3.5 shadow-sm ${
                  isPending 
                    ? 'border-amber-500/50 bg-gradient-to-b from-[#141006] to-[#0A0A0B]' 
                    : 'border-[#1E1E21] hover:border-[#2A2A30]'
                }`}
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${badgeClass}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                    <span className="font-mono text-sm font-bold text-[#F5F5F4]">#{order.id}</span>
                    <span className="text-[11px] text-[#9C9DA3]">
                      {new Date(order.timestamp).toLocaleTimeString(isAr ? 'ar-QA' : 'en-QA', { hour: '2-digit', minute: '2-digit' })} • {new Date(order.timestamp).toLocaleDateString(isAr ? 'ar-QA' : 'en-QA')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      order.channel === 'online' ? 'bg-[#39B0FF]/15 text-[#39B0FF]' : 'bg-[#39FFB0]/15 text-[#39FFB0]'
                    }`}>
                      {order.channel === 'online' ? 'ONLINE (QR)' : 'POS STAFF'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="font-mono text-base font-bold text-[#39FFB0]">{fmt(order.total)}</span>
                    <div className="flex items-center gap-1.5">
                      {onPrintReceipt && (
                        <button
                          onClick={() => onPrintReceipt(order)}
                          className="p-1.5 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4] rounded-lg transition cursor-pointer"
                          title={isAr ? 'طباعة الإيصال / تذكرة المطبخ' : 'Print Receipt / Kitchen Ticket'}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-1.5 bg-[#151517] hover:bg-[#1E1E21] text-[#9C9DA3] rounded-lg cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Customer Details info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#9C9DA3] bg-[#0F0F12] p-2 rounded-xl border border-[#1E1E21]">
                  <span>👤 <strong className="text-[#F5F5F4]">{order.customerName || (isAr ? 'عميل' : 'Customer')}</strong></span>
                  {order.customerPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#39FFB0]" />
                      <a href={`tel:${order.customerPhone}`} className="text-[#39FFB0] hover:underline">{order.customerPhone}</a>
                    </span>
                  )}
                  <span>
                    {order.deliveryMethod === 'delivery' 
                      ? (isAr ? `🚚 توصيل: ${order.deliveryAddress || 'عنوان العميل'}` : `🚚 Delivery: ${order.deliveryAddress || 'Customer Address'}`) 
                      : (isAr ? '🏬 استلام من المتجر' : '🏬 Pickup in-store')}
                  </span>
                </div>

                {/* INTERACTIVE STATUS PROGRESS STEPPER */}
                <div className="py-2 border-y border-[#1E1E21]/60">
                  <div className="text-[10px] uppercase tracking-wider text-[#9C9DA3] mb-1.5 font-semibold">
                    {isAr ? 'المرحلة الحالية للطلب (انقر للتغيير الفوري):' : 'Order Lifecycle Stage (Click step to advance):'}
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {PIPELINE_STEPS.map((step, sIdx) => {
                      const currentIdx = PIPELINE_STEPS.findIndex(s => s.key === order.status);
                      const isCurrent = order.status === step.key;
                      const isPast = currentIdx > sIdx && order.status !== 'cancelled';
                      
                      return (
                        <button
                          key={step.key}
                          disabled={isProcessing}
                          onClick={() => handleStatusChange(order.id, step.key)}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer disabled:opacity-50 ${
                            isCurrent
                              ? 'bg-[#39FFB0] text-[#04120C] shadow-md'
                              : isPast
                              ? 'bg-[#1A2E24] text-[#39FFB0] hover:bg-[#203D30]'
                              : 'bg-[#151517] text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#1E1E21]'
                          }`}
                        >
                          <span className="text-xs">{step.icon}</span>
                          <span className="truncate w-full">{isAr ? step.labelAr : step.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Items Summary */}
                <div className="p-3 bg-[#0F0F12] border border-[#1E1E21] rounded-xl text-xs space-y-2">
                  {order.items.map((i, idx) => (
                    <div key={idx} className="flex items-start justify-between text-[#F5F5F4] pb-1.5 border-b border-[#1E1E21]/50 last:border-0 last:pb-0">
                      <div>
                        <span className="font-semibold text-sm">{i.qty}x {i.name}</span>
                        {i.selectedModifiers && i.selectedModifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {i.selectedModifiers.map((m, mIdx) => (
                              <span key={mIdx} className="px-1.5 py-0.5 bg-[#1A2E24] text-[#39FFB0] rounded text-[10px] font-mono">
                                + {m.optionName} {m.price > 0 && `(+${m.price} QR)`}
                              </span>
                            ))}
                          </div>
                        )}
                        {i.notes && (
                          <p className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded mt-1 inline-block">
                            📝 {i.notes}
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-[#9C9DA3] font-bold shrink-0 pt-0.5">{fmt(i.price * i.qty)}</span>
                    </div>
                  ))}
                  {order.discount && order.discount.amount > 0 && (
                    <div className="flex items-center justify-between text-xs text-[#39FFB0] pt-1">
                      <span>{t.discount}:</span>
                      <span className="font-mono">−{fmt(order.discount.amount)}</span>
                    </div>
                  )}
                </div>

                {/* PRIMARY ACTION BUTTONS & STATUS BAR */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  
                  {/* Status Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* 1. Pending -> Accept Order */}
                    {order.status === 'pending' && (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleStatusChange(order.id, 'confirmed', 'Accepted by cashier')}
                        className="px-4 py-2 bg-[#39FFB0] text-[#04120C] hover:bg-[#32e09b] text-xs font-bold rounded-xl cursor-pointer transition shadow flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isAr ? '✓ قبول وتأكيد الطلب' : '✓ Accept Order'}</span>
                      </button>
                    )}

                    {/* 2. Confirmed / Pending -> Start Preparing */}
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleStatusChange(order.id, 'preparing', 'Kitchen preparation started')}
                        className="px-3.5 py-2 bg-[#B039FF]/20 hover:bg-[#B039FF]/30 border border-[#B039FF]/40 text-[#B039FF] text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>{isAr ? '👨‍🍳 بدء التجهيز بالمطبخ' : '👨‍🍳 Start Preparing'}</span>
                      </button>
                    )}

                    {/* 3. Preparing -> Mark Ready */}
                    {order.status === 'preparing' && (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleStatusChange(order.id, 'ready', 'Order ready for delivery/pickup')}
                        className="px-3.5 py-2 bg-[#39B0FF]/20 hover:bg-[#39B0FF]/30 border border-[#39B0FF]/40 text-[#39B0FF] text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Bell className="w-4 h-4" />
                        <span>{isAr ? '🛎️ تحديد كجاهز للتسليم' : '🛎️ Mark Ready'}</span>
                      </button>
                    )}

                    {/* 4. Ready / Preparing / Confirmed -> Mark Completed & Add to Sales */}
                    {(order.status === 'ready' || order.status === 'preparing' || order.status === 'confirmed') && (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleStatusChange(order.id, 'completed', 'Order fulfilled and closed')}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl cursor-pointer transition shadow flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isAr ? '✅ إتمام الطلب وتسجيل البيع' : '✅ Complete & Log Sale'}</span>
                      </button>
                    )}

                    {/* Cancel Order */}
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <button
                        disabled={isProcessing}
                        onClick={() => {
                          if (confirm(isAr ? 'هل أنت متأكد من إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this order?')) {
                            handleStatusChange(order.id, 'cancelled', 'Cancelled by cashier');
                          }
                        }}
                        className="px-2.5 py-2 bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-red-400 text-xs rounded-xl cursor-pointer transition disabled:opacity-50"
                      >
                        ✕ {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                    )}

                    {/* Re-open if cancelled/completed */}
                    {(order.status === 'cancelled' || order.status === 'completed') && (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleStatusChange(order.id, 'pending', 'Order re-opened by cashier')}
                        className="px-2.5 py-1.5 bg-[#151517] hover:bg-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4] text-xs rounded-lg cursor-pointer transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إعادة فتح الطلب' : 'Re-open'}</span>
                      </button>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}${window.location.pathname}?customer=1&track=${order.id}`;
                        navigator.clipboard.writeText(link);
                        alert(isAr ? `✓ تم نسخ رابط تتبع الطلب #${order.id}` : `✓ Copied tracking link for #${order.id}`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] text-[#39FFB0] text-xs font-semibold rounded-xl cursor-pointer transition"
                      title={isAr ? 'نسخ رابط التتبع المباشر' : 'Copy Live Tracking Link'}
                    >
                      <span>🔗 {isAr ? 'نسخ رابط التتبع' : 'Copy Tracking Link'}</span>
                    </button>

                    {/* WhatsApp Quick Update */}
                    <button
                      onClick={() => sendWhatsAppUpdate(order)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold rounded-xl cursor-pointer transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{isAr ? 'إرسال تحديث بالواتساب' : 'WhatsApp Status'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default OrdersView;
