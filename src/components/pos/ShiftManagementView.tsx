import React, { useState } from 'react';
import { 
  Banknote, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Lock, 
  Unlock, 
  Printer, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  PlusCircle, 
  FileText,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { CashShift, Sale } from '../../types';
import { Language, translations } from '../../i18n';

interface ShiftManagementViewProps {
  shift: CashShift;
  sales: Sale[];
  onUpdateShift: (shift: CashShift) => Promise<boolean>;
  onCloseShift: (actualCash: number, notes?: string) => Promise<boolean>;
  onOpenNewShift: (openingFloat: number, cashierName: string) => Promise<boolean>;
  lang?: Language;
}

export const ShiftManagementView: React.FC<ShiftManagementViewProps> = ({
  shift,
  sales,
  onUpdateShift,
  onCloseShift,
  onOpenNewShift,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';
  const fmt = (n: number) => (isAr ? `${Number(n).toFixed(2)} ر.ق` : `QR ${Number(n).toFixed(2)}`);

  // Cash In / Cash Out Modal State
  const [cashActionModal, setCashActionModal] = useState<'cash_in' | 'cash_out' | null>(null);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [cashNote, setCashNote] = useState<string>('');

  // Close Shift Modal State
  const [closeShiftModal, setCloseShiftModal] = useState<boolean>(false);
  const [countedCash, setCountedCash] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');

  // Open New Shift State
  const [newFloat, setNewFloat] = useState<string>('500');
  const [newCashier, setNewCashier] = useState<string>('Ahmad Al-Kuwari');

  // Print Z-Report Preview State
  const [showZReport, setShowZReport] = useState<boolean>(false);

  // Compute live shift stats based on sales made during current shift
  const shiftStartTime = shift.openedAt;
  const shiftSales = sales.filter(s => s.timestamp >= shiftStartTime);
  const totalSalesCount = shiftSales.length;
  
  const cashSalesTotal = shiftSales
    .filter(s => !s.paymentMethod || s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.total, 0);

  const cardSalesTotal = shiftSales
    .filter(s => s.paymentMethod === 'card')
    .reduce((sum, s) => sum + s.total, 0);

  const onlineSalesTotal = shiftSales
    .filter(s => s.channel === 'online')
    .reduce((sum, s) => sum + s.total, 0);

  const grandTotalSales = shiftSales.reduce((sum, s) => sum + s.total, 0);

  // Expected Cash Drawer in Register = Opening Float + Cash In - Cash Out + Cash Sales
  const expectedCashInDrawer = shift.openingFloat + shift.cashIn - shift.cashOut + (cashSalesTotal || shift.cashSales);

  const handleAddCashTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(cashAmount);
    if (!amount || amount <= 0 || !cashActionModal) return;

    const newTx = {
      id: `tx_${Date.now()}`,
      type: cashActionModal,
      amount,
      time: Date.now(),
      note: cashNote.trim() || (cashActionModal === 'cash_in' ? 'Cash In addition' : 'Petty cash expense')
    };

    const updatedShift: CashShift = {
      ...shift,
      cashIn: cashActionModal === 'cash_in' ? shift.cashIn + amount : shift.cashIn,
      cashOut: cashActionModal === 'cash_out' ? shift.cashOut + amount : shift.cashOut,
      transactions: [newTx, ...shift.transactions]
    };

    await onUpdateShift(updatedShift);
    setCashActionModal(null);
    setCashAmount('');
    setCashNote('');
  };

  const handleConfirmCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(countedCash);
    if (isNaN(actual)) return;

    await onCloseShift(actual, closeNotes.trim());
    setCloseShiftModal(false);
    setShowZReport(true);
  };

  const handleConfirmOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const openFloat = parseFloat(newFloat) || 0;
    await onOpenNewShift(openFloat, newCashier.trim() || 'Cashier');
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-4">
      {/* Header */}
      <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#39FFB0]/15 border border-[#39FFB0]/30 flex items-center justify-center text-[#39FFB0]">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-[#F5F5F4]">
                {isAr ? 'إدارة ورديات الكاشير ودرج النقد (Shift & Cash Drawer)' : 'Cash Shifts & Drawer Management (Z-Report)'}
              </h2>
              <span className={`px-2 py-0.5 rounded-full font-mono text-xs font-bold border ${
                shift.status === 'open'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {shift.status === 'open' ? (isAr ? '🟢 وردية نشطة مفتوحة' : '🟢 Active Shift Open') : (isAr ? '🔴 مغلقة' : '🔴 Closed')}
              </span>
            </div>
            <p className="text-xs text-[#9C9DA3] mt-0.5">
              {isAr ? `الكاشير المسؤول: ${shift.cashierName} • بدأت: ${new Date(shift.openedAt).toLocaleTimeString()}` : `Cashier on duty: ${shift.cashierName} • Started: ${new Date(shift.openedAt).toLocaleTimeString()}`}
            </p>
          </div>
        </div>

        {/* Quick Shift Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {shift.status === 'open' ? (
            <>
              <button
                onClick={() => setCashActionModal('cash_in')}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1A2E24] hover:bg-[#204030] border border-[#39FFB0]/40 text-[#39FFB0] rounded-xl text-xs font-bold cursor-pointer transition"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>{isAr ? '+ إيداع نقد (Float)' : '+ Cash In'}</span>
              </button>

              <button
                onClick={() => setCashActionModal('cash_out')}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#151517] hover:bg-[#1E1E21] border border-red-500/30 text-red-400 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{isAr ? '- مصروفات / سحب' : '- Cash Out (Petty)'}</span>
              </button>

              <button
                onClick={() => setCloseShiftModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer hover:opacity-90 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isAr ? 'إغلاق الوردية وإصدار Z-Report' : 'Close Shift (Z-Report)'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setNewFloat('500');
                setNewCashier('Ahmad Al-Kuwari');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#39FFB0] text-[#04120C] rounded-xl text-xs font-black shadow-md cursor-pointer hover:opacity-90 transition"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{isAr ? 'فتح وردية جديدة' : 'Open New Shift'}</span>
            </button>
          )}

          <button
            onClick={() => setShowZReport(true)}
            className="p-2 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4] rounded-xl text-xs cursor-pointer"
            title="Preview Z-Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Expected Drawer Total */}
        <div className="bg-[#0A0A0B] border-2 border-[#39FFB0]/50 rounded-2xl p-4.5 space-y-1.5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#9C9DA3]">
            <span>{isAr ? 'النقد المفترض بدرج الكاشير' : 'Expected Drawer Cash'}</span>
            <Banknote className="w-4 h-4 text-[#39FFB0]" />
          </div>
          <p className="font-mono font-black text-2xl text-[#39FFB0]">
            {fmt(expectedCashInDrawer)}
          </p>
          <p className="text-[11px] text-[#9C9DA3]">
            {isAr ? `عهدة البداية: ${fmt(shift.openingFloat)} + مبيعات نقدية` : `Opening float: ${fmt(shift.openingFloat)} + cash sales`}
          </p>
        </div>

        {/* Card 2: Total Shift Sales */}
        <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4.5 space-y-1.5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-[#9C9DA3]">
            <span>{isAr ? 'إجمالي مبيعات الوردية' : 'Total Shift Sales'}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-mono font-black text-2xl text-[#F5F5F4]">
            {fmt(grandTotalSales || shift.totalSales)}
          </p>
          <p className="text-[11px] text-[#9C9DA3]">
            {totalSalesCount} {isAr ? 'فواتير محررة في الوردية' : 'Orders closed'}
          </p>
        </div>

        {/* Card 3: Payment Breakdown */}
        <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4.5 space-y-1.5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-[#9C9DA3]">
            <span>{isAr ? 'دفع إلكتروني / بطاقات' : 'Card & Electronic'}</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <p className="font-mono font-black text-2xl text-blue-300">
            {fmt(cardSalesTotal || shift.cardSales)}
          </p>
          <p className="text-[11px] text-[#9C9DA3]">
            {isAr ? 'تسوية بنكية مباشرة' : 'Direct POS card terminal'}
          </p>
        </div>

        {/* Card 4: Petty Cash & Adjustments */}
        <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4.5 space-y-1.5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-[#9C9DA3]">
            <span>{isAr ? 'حركات الدرج (إيداع/سحب)' : 'Float In / Petty Out'}</span>
            <History className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-emerald-400">+{fmt(shift.cashIn)}</span>
            <span className="text-[#5E5F64]">/</span>
            <span className="text-red-400">-{fmt(shift.cashOut)}</span>
          </div>
          <p className="text-[11px] text-[#9C9DA3]">
            {shift.transactions.length} {isAr ? 'عمليات نقد مسجلة' : 'Drawer events'}
          </p>
        </div>
      </div>

      {/* Transactions & Cash Movement Log */}
      <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#1E1E21] pb-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#F5F5F4] flex items-center gap-2">
            <History className="w-4 h-4 text-[#39FFB0]" />
            <span>{isAr ? 'سجل حركات النقد بالوردية (Cash Drawer Audit Log)' : 'Shift Cash Drawer Audit Log'}</span>
          </h3>
          <span className="font-mono text-xs text-[#9C9DA3]">{shift.transactions.length} entries</span>
        </div>

        <div className="divide-y divide-[#1E1E21]/60">
          {shift.transactions.map((tx) => (
            <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                  tx.type === 'cash_in'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {tx.type === 'cash_in' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-medium text-[#F5F5F4]">{tx.note}</p>
                  <span className="text-[10px] text-[#9C9DA3] font-mono">{new Date(tx.time).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`font-mono font-bold text-sm ${
                  tx.type === 'cash_in' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {tx.type === 'cash_in' ? '+' : '-'}{fmt(tx.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CASH IN / OUT MODAL */}
      {cashActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleAddCashTransaction} className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-[#F5F5F4]">
              {cashActionModal === 'cash_in' ? (isAr ? 'إيداع نقد إضافي بالدرج (+ Cash In)' : 'Add Cash In (Float Refill)') : (isAr ? 'سحب نقد / مصروفات مصغرة (- Petty Cash Out)' : 'Petty Cash Out / Expense')}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-[#9C9DA3] uppercase mb-1">{isAr ? 'المبلغ (ر.ق) *' : 'Amount (QR) *'}</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  autoFocus
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[#000000] border border-[#1E1E21] rounded-xl text-base font-mono text-[#39FFB0] focus:outline-none focus:border-[#39FFB0]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#9C9DA3] uppercase mb-1">{isAr ? 'سبب الحركة / البيان *' : 'Reason / Note *'}</label>
                <input
                  type="text"
                  required
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  placeholder={cashActionModal === 'cash_in' ? 'Float refill, small change...' : 'Supplies, ice, emergency purchase...'}
                  className="w-full px-3 py-2 bg-[#000000] border border-[#1E1E21] rounded-xl text-xs text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCashActionModal(null)}
                className="flex-1 py-2.5 bg-[#151517] text-[#9C9DA3] rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#39FFB0] text-[#04120C] font-bold rounded-xl text-xs cursor-pointer hover:opacity-90"
              >
                {isAr ? 'تأكيد وحفظ الحركة' : 'Confirm Movement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CLOSE SHIFT (Z-REPORT) MODAL */}
      {closeShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleConfirmCloseShift} className="bg-[#0A0A0B] border-2 border-red-500/50 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div>
              <h3 className="font-bold text-base text-[#F5F5F4] flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" />
                <span>{isAr ? 'إغلاق الوردية وإصدار تقرير Z-Report' : 'Close Shift & Generate Z-Report'}</span>
              </h3>
              <p className="text-xs text-[#9C9DA3] mt-0.5">
                {isAr ? 'يرجى عد النقد الفعلي الموجود في الدرج بدقة لمقارنته مع المجموع المحسوب.' : 'Count physical cash in the drawer to calculate any variance or discrepancy.'}
              </p>
            </div>

            <div className="p-3 bg-[#151517] rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-[#9C9DA3]">
                <span>{isAr ? 'النقد المتوقع في الدرج' : 'Expected Drawer Cash'}:</span>
                <span className="font-mono font-bold text-[#39FFB0]">{fmt(expectedCashInDrawer)}</span>
              </div>
              <div className="flex justify-between text-[#9C9DA3]">
                <span>{isAr ? 'إجمالي المبيعات' : 'Total Sales'}:</span>
                <span className="font-mono font-bold text-[#F5F5F4]">{fmt(grandTotalSales || shift.totalSales)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#F5F5F4] uppercase mb-1">
                  {isAr ? 'النقد الفعلي المعدود في الدرج (ر.ق) *' : 'Counted Actual Physical Cash (QR) *'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  autoFocus
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  placeholder="Enter counted amount..."
                  className="w-full px-3 py-2 bg-[#000000] border border-[#1E1E21] rounded-xl text-base font-mono text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {countedCash && (
                <div className="p-2.5 bg-[#000000] rounded-xl border border-[#1E1E21] flex justify-between items-center text-xs">
                  <span className="text-[#9C9DA3]">{isAr ? 'الفارق / العجز أو الفائض:' : 'Discrepancy (Variance):'}</span>
                  {(() => {
                    const diff = (parseFloat(countedCash) || 0) - expectedCashInDrawer;
                    if (Math.abs(diff) < 0.01) {
                      return <span className="font-mono font-bold text-emerald-400">✓ Perfect Match (0.00)</span>;
                    }
                    return (
                      <span className={`font-mono font-bold ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {diff > 0 ? `+${fmt(diff)} (Surplus)` : `${fmt(diff)} (Shortage)`}
                      </span>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-[11px] text-[#9C9DA3] uppercase mb-1">{isAr ? 'ملاحظات إغلاق الوردية' : 'Closing Notes / Handover'}</label>
                <textarea
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Notes for next shift cashier..."
                  className="w-full p-2.5 bg-[#000000] border border-[#1E1E21] rounded-xl text-xs text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCloseShiftModal(false)}
                className="flex-1 py-2.5 bg-[#151517] text-[#9C9DA3] rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg"
              >
                {isAr ? 'تأكيد الإغلاق وطباعة Z-Report' : 'Confirm Close & Print Z-Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRINTABLE THERMAL Z-REPORT MODAL */}
      {showZReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E21] pb-3">
              <h3 className="font-bold text-sm text-[#F5F5F4]">{isAr ? 'معاينة تقرير الوردية (Z-Report)' : 'End-of-Day Shift Z-Report'}</h3>
              <button onClick={() => setShowZReport(false)} className="text-[#9C9DA3] hover:text-[#F5F5F4]">✕</button>
            </div>

            {/* 80mm Receipt Look */}
            <div className="bg-white text-black p-4 rounded-xl font-mono text-xs space-y-2 shadow-inner">
              <div className="text-center border-b border-black/20 pb-2">
                <p className="font-black text-sm">NASAPP POS DOHA</p>
                <p className="text-[10px]">DAILY SHIFT Z-REPORT</p>
                <p className="text-[9px] text-gray-600">{new Date().toLocaleString()}</p>
                <p className="text-[9px]">Shift #{shift.id} • Cashier: {shift.cashierName}</p>
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span className="font-bold">QR {shift.openingFloat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash-In Refills:</span>
                  <span>+QR {shift.cashIn.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Petty Cash Out:</span>
                  <span>-QR {shift.cashOut.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-black/30 pt-1">
                  <span>Gross Cash Sales:</span>
                  <span className="font-bold">QR {(cashSalesTotal || shift.cashSales).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card Sales (POS):</span>
                  <span>QR {(cardSalesTotal || shift.cardSales).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Online / QR Orders:</span>
                  <span>QR {(onlineSalesTotal || shift.onlineSales).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t-2 border-black pt-1 font-bold text-xs">
                  <span>TOTAL GROSS REVENUE:</span>
                  <span>QR {(grandTotalSales || shift.totalSales).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-black/20 pt-1 text-[10px]">
                  <span>EXPECTED DRAWER CASH:</span>
                  <span className="font-bold">QR {expectedCashInDrawer.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center border-t border-black/20 pt-2 text-[9px] text-gray-500">
                *** END OF SHIFT AUDIT ***
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#39FFB0] text-[#04120C] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة تقرير Z-Report' : 'Print Z-Report'}</span>
              </button>
              <button
                onClick={() => setShowZReport(false)}
                className="px-4 py-2.5 bg-[#151517] text-[#9C9DA3] rounded-xl text-xs cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ShiftManagementView;
