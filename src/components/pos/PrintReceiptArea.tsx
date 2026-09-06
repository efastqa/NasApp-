import React from 'react';
import { Sale } from '../../types';
import { Language, translations } from '../../i18n';
import { NasappBrandLogo } from '../NasappBrandLogo';

interface PrintReceiptAreaProps {
  sale: Sale | null;
  lang?: Language;
  storeLogo?: string | null;
}

export const PrintReceiptArea: React.FC<PrintReceiptAreaProps> = ({ sale, lang = 'en', storeLogo: initialStoreLogo }) => {
  if (!sale) return <div id="printArea" style={{ display: 'none' }} />;

  const storeLogo = initialStoreLogo !== undefined
    ? initialStoreLogo
    : (typeof window !== 'undefined' ? localStorage.getItem('nasapp_store_logo') : null);
  const t = translations[lang];
  const date = new Date(sale.timestamp);
  const fmt = (n: number) => (lang === 'ar' ? `${Number(n).toFixed(2)} ر.ق` : `QR ${Number(n).toFixed(2)}`);
  const isAr = lang === 'ar';

  return (
    <div id="printArea" dir={isAr ? 'rtl' : 'ltr'} className="hidden font-mono text-black p-4 text-xs">
      <div className="text-center mb-3 flex flex-col items-center">
        {storeLogo ? (
          <img src={storeLogo} alt="Nasapp Logo" className="w-12 h-12 object-contain mb-1 rounded-lg grayscale contrast-125" />
        ) : (
          <NasappBrandLogo className="w-12 h-12 mb-1" />
        )}
        <h2 className="font-bold text-lg">{isAr ? 'ناس آب (Nasapp)' : 'Nasapp'}</h2>
        <p className="text-[10px] uppercase tracking-wider text-neutral-600">
          {isAr ? 'فاتورة بيع رسمية - الدوحة' : 'Official Sales Receipt - Doha'}
        </p>
      </div>

      <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-black mb-2">
        <div className="flex justify-between">
          <span>{isAr ? 'التاريخ والوقت:' : 'Date:'}</span>
          <span>{date.toLocaleDateString(isAr ? 'ar-QA' : 'en-QA')} {date.toLocaleTimeString()}</span>
        </div>
        <div className="flex justify-between">
          <span>{isAr ? 'قناة البيع:' : 'Channel:'}</span>
          <span className="font-bold">
            {sale.channel === 'online' 
              ? (isAr ? 'أونلاين (QR)' : 'Online (QR)') 
              : (isAr ? 'الكاشير المباشر' : 'In-Store POS')}
          </span>
        </div>
        <div className="flex justify-between">
          <span>{isAr ? 'رقم الإيصال:' : 'Receipt #:'}</span>
          <span className="font-mono">{sale.id}</span>
        </div>
        {sale.customerPhone && (
          <div className="flex justify-between">
            <span>{isAr ? 'العميل:' : 'Customer:'}</span>
            <span>{sale.customerPhone} {sale.customerName ? `(${sale.customerName})` : ''}</span>
          </div>
        )}
        {sale.discount && sale.discount.amount > 0 && (
          <div className="flex justify-between">
            <span>{isAr ? 'الخصم:' : 'Discount:'}</span>
            <span>−{fmt(sale.discount.amount)}</span>
          </div>
        )}
      </div>

      <table className="w-full text-[11px] border-collapse mb-2">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className={`${isAr ? 'text-right' : 'text-left'} py-1`}>{isAr ? 'الصنف' : 'Item'}</th>
            <th className="text-center py-1">{isAr ? 'العدد' : 'Qty'}</th>
            <th className={`${isAr ? 'text-left' : 'text-right'} py-1`}>{isAr ? 'المبلغ' : 'Amt'}</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, idx) => (
            <tr key={idx} className="border-b border-dotted border-neutral-300">
              <td className="py-1 pr-1">
                <div>
                  <span className="font-bold">{item.name}</span>
                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <div className="text-[10px] text-neutral-700 pl-2">
                      + {item.selectedModifiers.map(m => m.optionName).join(', ')}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-[9px] italic text-neutral-600 pl-2">
                      [{item.notes}]
                    </div>
                  )}
                </div>
              </td>
              <td className="text-center py-1 font-mono align-top">{item.qty}</td>
              <td className={`${isAr ? 'text-left' : 'text-right'} py-1 whitespace-nowrap font-mono align-top`}>
                {fmt(item.price * item.qty)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between font-bold text-sm pt-2 border-t-2 border-black mb-4">
        <span>{isAr ? 'الإجمالي النهائي' : 'TOTAL AMOUNT'}</span>
        <span className="font-mono text-base">{fmt(sale.total)}</span>
      </div>

      <div className="text-center text-[10px] text-neutral-600 space-y-1">
        <p className="font-semibold">{isAr ? 'شكراً لتعاملكم معنا! نتمنى لكم يوماً سعيداً' : 'Thank you for shopping with us!'}</p>
        <p dir="ltr">WhatsApp / Support: +974 7731 5415</p>
      </div>
    </div>
  );
};

export default PrintReceiptArea;
