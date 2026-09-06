import React, { useState } from 'react';
import { 
  Printer, 
  MessageSquare, 
  Search, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  ShoppingBag,
  Clock,
  Filter
} from 'lucide-react';
import { Sale } from '../../types';
import { Language, translations } from '../../i18n';

interface SalesLogViewProps {
  sales: Sale[];
  onPrintReceipt: (sale: Sale) => void;
  lang?: Language;
}

export const SalesLogView: React.FC<SalesLogViewProps> = ({
  sales,
  onPrintReceipt,
  lang = 'en'
}) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  const [channelFilter, setChannelFilter] = useState<string>('all');
  const fmt = (n: number) => (isAr ? `${Number(n).toFixed(2)} ر.ق` : `QR ${Number(n).toFixed(2)}`);

  const filteredSales = sales.filter(s => {
    if (channelFilter === 'all') return true;
    return s.channel === channelFilter;
  });

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
        ? `مرحباً! إليك إيصال مشترياتك من ناس آب (Nasapp)\n\n${lines}${disc}\n\nالإجمالي: ${fmt(sale.total)}\nالتاريخ: ${new Date(sale.timestamp).toLocaleString('ar-QA')}\n\nشكراً لتسوقكم معنا!`
        : `Hi! Here's your receipt from Nasapp\n\n${lines}${disc}\n\nTotal: ${fmt(sale.total)}\n${new Date(sale.timestamp).toLocaleString()}\n\nThank you for shopping with us!`
    );
    window.open(`https://wa.me/${digits}?text=${text}`, '_blank');
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-5">
      
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1E1E21]">
        <div>
          <h2 className="font-display font-semibold text-2xl text-[#F5F5F4]">{t.salesHistory}</h2>
          <p className="text-xs text-[#9C9DA3] mt-0.5">
            {isAr ? 'سجل العمليات والفواتير المكتملة وطباعة الإيصالات.' : 'Historical ledger of all completed sales and transactions.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setChannelFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              channelFilter === 'all'
                ? 'bg-[#39FFB0] text-[#04120C]'
                : 'bg-[#151517] text-[#9C9DA3] hover:text-[#F5F5F4]'
            }`}
          >
            {t.allSales} ({sales.length})
          </button>
          <button
            onClick={() => setChannelFilter('instore')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              channelFilter === 'instore'
                ? 'bg-[#39FFB0] text-[#04120C]'
                : 'bg-[#151517] text-[#9C9DA3] hover:text-[#F5F5F4]'
            }`}
          >
            {t.inStore} ({sales.filter(s => s.channel === 'instore').length})
          </button>
          <button
            onClick={() => setChannelFilter('online')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              channelFilter === 'online'
                ? 'bg-[#39FFB0] text-[#04120C]'
                : 'bg-[#151517] text-[#9C9DA3] hover:text-[#F5F5F4]'
            }`}
          >
            {t.onlineQr} ({sales.filter(s => s.channel === 'online').length})
          </button>
        </div>
      </div>

      {/* Sales Cards */}
      <div className="space-y-3">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-[#5E5F64] bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">{t.noSalesYet}</p>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div key={sale.id} className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4 space-y-3">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs text-[#39FFB0]">#{sale.id}</span>
                  <span className="text-xs text-[#9C9DA3]">
                    {new Date(sale.timestamp).toLocaleString(isAr ? 'ar-QA' : 'en-QA')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    sale.channel === 'online' ? 'bg-[#39B0FF]/15 text-[#39B0FF]' : 'bg-[#39FFB0]/15 text-[#39FFB0]'
                  }`}>
                    {sale.channel === 'online' ? 'ONLINE' : 'POS'}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="font-mono font-bold text-sm text-[#F5F5F4]">
                    {fmt(sale.total)}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onPrintReceipt(sale)}
                      className="p-1.5 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4] rounded-lg transition cursor-pointer"
                      title={t.printReceipt}
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => sendWhatsAppReceipt(sale)}
                      className="p-1.5 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 rounded-lg transition cursor-pointer"
                      title={t.whatsappOrder}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Items summary */}
              <div className="p-2.5 bg-[#0F0F12] border border-[#1E1E21] rounded-xl text-xs space-y-1.5">
                {sale.items.map((i, idx) => (
                  <div key={idx} className="flex items-start justify-between text-[#F5F5F4]">
                    <div>
                      <span className="font-semibold">{i.qty}x {i.name}</span>
                      {i.selectedModifiers && i.selectedModifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {i.selectedModifiers.map((m, mIdx) => (
                            <span key={mIdx} className="px-1.5 py-0.2 bg-[#1A2E24] text-[#39FFB0] rounded text-[9px] font-mono">
                              +{m.optionName} {m.price > 0 && `(${m.price} QR)`}
                            </span>
                          ))}
                        </div>
                      )}
                      {i.notes && (
                        <p className="text-[10px] text-amber-300 italic mt-0.5">
                          📝 {i.notes}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-[#9C9DA3] shrink-0 pt-0.5">{fmt(i.price * i.qty)}</span>
                  </div>
                ))}
                {sale.discount && sale.discount.amount > 0 && (
                  <div className="flex items-center justify-between text-xs text-[#39FFB0] pt-1 border-t border-[#1E1E21]">
                    <span>{t.discount}:</span>
                    <span className="font-mono">−{fmt(sale.discount.amount)}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default SalesLogView;
