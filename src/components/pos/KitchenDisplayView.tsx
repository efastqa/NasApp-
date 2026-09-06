import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Coffee, 
  Cake, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  Filter,
  Layers,
  ChefHat,
  BellRing,
  UtensilsCrossed,
  ArrowRight
} from 'lucide-react';
import { Order, CartItem } from '../../types';
import { Language, translations } from '../../i18n';

interface KitchenDisplayViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: string, note?: string) => Promise<boolean>;
  lang?: Language;
}

export const KitchenDisplayView: React.FC<KitchenDisplayViewProps> = ({
  orders,
  onUpdateOrderStatus,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';
  const [selectedStation, setSelectedStation] = useState<'all' | 'kitchen' | 'beverage' | 'dessert'>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  // Real-time clock update every 5 seconds for elapsed timer badges
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio chime generator on new incoming order
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  // Only active kitchen orders (pending, confirmed, preparing)
  const activeKdsOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing');

  // Filter items by selected station (Beverage, Kitchen, Dessert)
  const filterOrderItems = (items: CartItem[]) => {
    if (selectedStation === 'all') return items;
    return items.filter(item => {
      const n = item.name.toLowerCase();
      if (selectedStation === 'beverage') {
        return n.includes('tea') || n.includes('karak') || n.includes('coffee') || n.includes('latte') || n.includes('juice') || n.includes('drink') || n.includes('شاي') || n.includes('كرك') || n.includes('قهوة') || n.includes('عصير');
      }
      if (selectedStation === 'dessert') {
        return n.includes('cake') || n.includes('pastry') || n.includes('dessert') || n.includes('كيك') || n.includes('حلى');
      }
      if (selectedStation === 'kitchen') {
        return n.includes('burger') || n.includes('sandwich') || n.includes('fries') || n.includes('wedges') || n.includes('برجر') || n.includes('ساندويتش') || n.includes('وجبة');
      }
      return true;
    });
  };

  const getElapsedMinutes = (timestamp: number) => {
    return Math.floor((now - timestamp) / 60000);
  };

  const toggleItemDone = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCompletedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-4">
      {/* KDS Header Bar */}
      <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-[#F5F5F4]">
                {isAr ? 'شاشة المطبخ وإعداد الطلبات (KDS)' : 'Kitchen Display System (KDS)'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-mono text-xs font-bold border border-orange-500/30 animate-pulse">
                {activeKdsOrders.length} {isAr ? 'تذاكر نشطة' : 'Active Tickets'}
              </span>
            </div>
            <p className="text-xs text-[#9C9DA3] mt-0.5">
              {isAr ? 'توجيه المحطات الذكي، عداد وقت التجهيز التلقائي، وتنبيهات صوتية فورية.' : 'Station-split routing, real-time prep timers, ticket bump bar & audio alerts.'}
            </p>
          </div>
        </div>

        {/* Station Filters & Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Station Tabs */}
          <div className="flex items-center bg-[#151517] p-1 rounded-xl border border-[#1E1E21]">
            <button
              onClick={() => setSelectedStation('all')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedStation === 'all' ? 'bg-[#39FFB0] text-[#04120C]' : 'text-[#9C9DA3] hover:text-[#F5F5F4]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? 'الكل' : 'All'}</span>
            </button>

            <button
              onClick={() => setSelectedStation('kitchen')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedStation === 'kitchen' ? 'bg-orange-500 text-white' : 'text-[#9C9DA3] hover:text-[#F5F5F4]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isAr ? 'المطبخ / جريل' : 'Grill & Food'}</span>
            </button>

            <button
              onClick={() => setSelectedStation('beverage')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedStation === 'beverage' ? 'bg-amber-500 text-[#04120C]' : 'text-[#9C9DA3] hover:text-[#F5F5F4]'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>{isAr ? 'بار المشروبات' : 'Beverages'}</span>
            </button>

            <button
              onClick={() => setSelectedStation('dessert')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedStation === 'dessert' ? 'bg-pink-500 text-white' : 'text-[#9C9DA3] hover:text-[#F5F5F4]'
              }`}
            >
              <Cake className="w-3.5 h-3.5" />
              <span>{isAr ? 'الحلويات' : 'Desserts'}</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChime();
            }}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              soundEnabled 
                ? 'bg-[#1A2E24] border-[#39FFB0]/40 text-[#39FFB0]' 
                : 'bg-[#151517] border-[#1E1E21] text-[#9C9DA3]'
            }`}
            title={soundEnabled ? 'Mute Kitchen Chime' : 'Enable Kitchen Chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Manual Chime Test */}
          <button
            onClick={playChime}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4] rounded-xl text-xs cursor-pointer"
            title="Test Audio Chime"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isAr ? 'تجربة الجرس' : 'Test Bell'}</span>
          </button>
        </div>
      </div>

      {/* KDS Kitchen Ticket Grid */}
      {activeKdsOrders.length === 0 ? (
        <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-[#F5F5F4]">
            {isAr ? 'المطبخ مكتمل وجاهز!' : 'Kitchen All Caught Up!'}
          </h3>
          <p className="text-xs text-[#9C9DA3] max-w-sm mx-auto">
            {isAr 
              ? 'لا توجد طلبات معلقة قيد التحضير في الوقت الحالي. ستظهر التذاكر الجديدة هنا فور وصولها مع رنين صوتي.' 
              : 'No active prep orders in queue right now. New customer orders will pop up instantly with audio chime.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeKdsOrders.map((order) => {
            const elapsed = getElapsedMinutes(order.timestamp);
            const isOverdue = elapsed >= 15;
            const isWarning = elapsed >= 8 && elapsed < 15;
            const filteredItems = filterOrderItems(order.items);

            if (filteredItems.length === 0 && selectedStation !== 'all') {
              return null;
            }

            return (
              <div 
                key={order.id}
                className={`bg-[#0F0F12] rounded-2xl border flex flex-col justify-between overflow-hidden shadow-2xl transition-all ${
                  isOverdue 
                    ? 'border-red-500/80 ring-1 ring-red-500/50' 
                    : isWarning 
                    ? 'border-amber-500/70' 
                    : order.status === 'preparing'
                    ? 'border-[#39FFB0]/70'
                    : 'border-[#1E1E21]'
                }`}
              >
                {/* Ticket Header */}
                <div className={`p-3.5 border-b flex items-center justify-between ${
                  isOverdue 
                    ? 'bg-red-950/40 border-red-500/30' 
                    : isWarning 
                    ? 'bg-amber-950/40 border-amber-500/30' 
                    : order.status === 'preparing'
                    ? 'bg-[#1A2E24]/60 border-[#39FFB0]/30'
                    : 'bg-[#151517] border-[#1E1E21]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-[#F5F5F4]">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      order.deliveryMethod === 'dine_in'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : order.deliveryMethod === 'delivery'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {order.tableName || (isAr ? (order.deliveryMethod === 'delivery' ? 'توصيل' : 'استلام') : order.deliveryMethod)}
                    </span>
                  </div>

                  {/* Timer Badge */}
                  <div className={`flex items-center gap-1 font-mono font-bold text-xs px-2 py-1 rounded-lg ${
                    isOverdue 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : isWarning 
                      ? 'bg-amber-500 text-[#04120C]' 
                      : 'bg-[#000000] text-[#39FFB0]'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsed}m</span>
                  </div>
                </div>

                {/* Customer & Source Info */}
                <div className="px-3.5 py-2 bg-[#0A0A0B] border-b border-[#1E1E21]/60 flex items-center justify-between text-[11px] text-[#9C9DA3]">
                  <span className="font-medium text-[#F5F5F4] truncate max-w-[150px]">
                    {order.customerName || 'Walk-in'}
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#151517]">
                    {order.channel === 'online' ? (isAr ? '🌐 أونلاين' : '🌐 Online') : (isAr ? '💻 كاشير' : '💻 POS')}
                  </span>
                </div>

                {/* Ticket Items Checklist */}
                <div className="p-3.5 space-y-2.5 flex-1 max-h-72 overflow-y-auto">
                  {filteredItems.map((item, idx) => {
                    const isDone = completedItems[`${order.id}-${idx}`];

                    return (
                      <div 
                        key={idx}
                        onClick={() => toggleItemDone(order.id, idx)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer select-none ${
                          isDone 
                            ? 'bg-[#151517]/50 border-dashed border-[#1E1E21] opacity-50 line-through text-[#5E5F64]' 
                            : 'bg-[#121215] border-[#1E1E21] hover:border-[#39FFB0]/40 text-[#F5F5F4]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                              isDone ? 'bg-[#1E1E21] text-[#5E5F64]' : 'bg-[#39FFB0] text-[#04120C]'
                            }`}>
                              {item.qty}×
                            </span>
                            <span className="font-semibold text-xs text-[#F5F5F4] leading-tight">
                              {item.name}
                            </span>
                          </div>
                          <CheckCircle2 className={`w-4 h-4 shrink-0 transition ${isDone ? 'text-[#39FFB0]' : 'text-[#2A2A30]'}`} />
                        </div>

                        {/* Modifiers List */}
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <div className="mt-1.5 pl-7 pr-1 space-y-0.5 text-[10px] text-amber-300/90 font-medium">
                            {item.selectedModifiers.map((mod, mIdx) => (
                              <div key={mIdx} className="flex items-center gap-1">
                                <span className="text-[#39FFB0]">↳</span>
                                <span>{mod.optionName}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Special Kitchen Notes */}
                        {item.notes && (
                          <div className="mt-1.5 pl-7 pr-1 text-[10px] text-amber-400 font-semibold bg-amber-950/30 p-1 rounded border border-amber-500/20">
                            📝 {item.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Bump Bar Controls */}
                <div className="p-3 bg-[#0A0A0B] border-t border-[#1E1E21] space-y-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'preparing', 'Kitchen started cooking')}
                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-orange-500/20"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{isAr ? '👨‍🍳 بدء التحضير والطهي' : '👨‍🍳 Start Cooking'}</span>
                    </button>
                  )}

                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'preparing', 'Kitchen in progress')}
                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{isAr ? '👨‍🍳 بدء الطهي الآن' : '👨‍🍳 Start Prep'}</span>
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'ready', 'Order ready on pass')}
                      className="w-full py-2.5 bg-[#39FFB0] hover:bg-[#32e09b] text-[#04120C] font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-[#39FFB0]/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isAr ? '🛎️ جاهز للتسليم (Bump)' : '🛎️ Bump Ready'}</span>
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'completed', 'Completed & Served')}
                      className="w-full py-2 bg-[#1A2E24] hover:bg-[#204030] border border-[#39FFB0]/40 text-[#39FFB0] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span>{isAr ? '✓ تم التسليم بالكامل' : '✓ Mark Completed'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default KitchenDisplayView;
