import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  QrCode, 
  Clock, 
  CheckCircle2, 
  Receipt, 
  Edit3, 
  Trash2, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  Printer,
  X,
  Compass,
  AlertCircle
} from 'lucide-react';
import { DiningTable, Order } from '../../types';
import { Language, translations } from '../../i18n';

interface TableManagementViewProps {
  tables: DiningTable[];
  orders: Order[];
  onUpdateTable: (id: string, updates: Partial<DiningTable>) => Promise<boolean>;
  onOpenTableOrder: (table: DiningTable) => void;
  lang?: Language;
}

export const TableManagementView: React.FC<TableManagementViewProps> = ({
  tables,
  orders,
  onUpdateTable,
  onOpenTableOrder,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';
  const [activeSection, setActiveSection] = useState<'all' | 'main_hall' | 'terrace' | 'vip_majlis' | 'outdoor'>('all');
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
  const [qrModalTable, setQrModalTable] = useState<DiningTable | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied' | 'reserved'>('all');

  const fmt = (n: number) => (isAr ? `${Number(n).toFixed(2)} ر.ق` : `QR ${Number(n).toFixed(2)}`);

  const filteredTables = tables.filter(t => {
    const matchSection = activeSection === 'all' || t.section === activeSection;
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSection && matchStatus;
  });

  const getSectionLabel = (sec: string) => {
    switch (sec) {
      case 'main_hall': return isAr ? 'الصالة الرئيسية' : 'Main Dining Hall';
      case 'terrace': return isAr ? 'التراس الخارجي' : 'Terrace Breeze';
      case 'vip_majlis': return isAr ? 'مجلس كبار الشخصيات (VIP)' : 'VIP Majlis Suites';
      case 'outdoor': return isAr ? 'الحديقة الخارجية' : 'Outdoor Garden';
      default: return sec;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400';
      case 'occupied': return 'border-purple-500/60 bg-purple-950/30 text-purple-300';
      case 'reserved': return 'border-blue-500/50 bg-blue-950/25 text-blue-300';
      case 'billing': return 'border-amber-500/60 bg-amber-950/30 text-amber-300';
      default: return 'border-[#1E1E21] bg-[#121215] text-[#9C9DA3]';
    }
  };

  const handleTableStatusChange = async (table: DiningTable, newStatus: any) => {
    await onUpdateTable(table.id, { 
      status: newStatus,
      openedAt: newStatus === 'occupied' ? Date.now() : undefined,
      currentTotal: newStatus === 'available' ? 0 : table.currentTotal,
      activeOrderId: newStatus === 'available' ? undefined : table.activeOrderId
    });
    if (selectedTable?.id === table.id) {
      setSelectedTable({ ...selectedTable, status: newStatus });
    }
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-4">
      {/* Top Header */}
      <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-[#F5F5F4]">
                {isAr ? 'إدارة الطاولات ومخطط الصالة (Floor Plan)' : 'Dining Floor Plan & Table Management'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-500/30">
                {tables.length} {isAr ? 'طاولات' : 'Tables'}
              </span>
            </div>
            <p className="text-xs text-[#9C9DA3] mt-0.5">
              {isAr ? 'مخطط الصالة التفاعلي، رموز QR لكل طاولة، والربط المباشر مع نقاط البيع.' : 'Interactive floor map, dine-in table QR ordering, status indicators & fast billing.'}
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#151517] p-1 rounded-xl border border-[#1E1E21]">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSection === 'all' ? 'bg-[#39FFB0] text-[#04120C]' : 'text-[#9C9DA3] hover:text-[#F5F5F4]'
            }`}
          >
            {isAr ? 'كل الأقسام' : 'All Areas'}
          </button>
          <button
            onClick={() => setActiveSection('main_hall')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSection === 'main_hall' ? 'bg-[#39FFB0] text-[#04120C]' : 'text-[#9C9DA3] hover:text-[#F5F5F4]'
            }`}
          >
            {isAr ? 'الصالة' : 'Main Hall'}
          </button>
          <button
            onClick={() => setActiveSection('terrace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSection === 'terrace' ? 'bg-[#39FFB0] text-[#04120C]' : 'text-[#9C9DA3] hover:text-[#F5F5F4]'
            }`}
          >
            {isAr ? 'التراس' : 'Terrace'}
          </button>
          <button
            onClick={() => setActiveSection('vip_majlis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSection === 'vip_majlis' ? 'bg-[#39FFB0] text-[#04120C]' : 'text-[#9C9DA3] hover:text-[#F5F5F4]'
            }`}
          >
            {isAr ? 'VIP مجلس' : 'VIP Majlis'}
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border cursor-pointer transition ${
            statusFilter === 'all' ? 'bg-[#151517] border-[#39FFB0]' : 'bg-[#0A0A0B] border-[#1E1E21]'
          }`}
        >
          <span className="text-[10px] text-[#9C9DA3] uppercase block">{isAr ? 'إجمالي الطاولات' : 'Total Tables'}</span>
          <span className="font-mono font-black text-lg text-[#F5F5F4]">{tables.length}</span>
        </div>

        <div 
          onClick={() => setStatusFilter('available')}
          className={`p-3 rounded-xl border cursor-pointer transition ${
            statusFilter === 'available' ? 'bg-emerald-950/30 border-emerald-500' : 'bg-[#0A0A0B] border-[#1E1E21]'
          }`}
        >
          <span className="text-[10px] text-emerald-400 uppercase block">{isAr ? 'طاولات شاغرة' : 'Available'}</span>
          <span className="font-mono font-black text-lg text-emerald-400">{tables.filter(t => t.status === 'available').length}</span>
        </div>

        <div 
          onClick={() => setStatusFilter('occupied')}
          className={`p-3 rounded-xl border cursor-pointer transition ${
            statusFilter === 'occupied' ? 'bg-purple-950/30 border-purple-500' : 'bg-[#0A0A0B] border-[#1E1E21]'
          }`}
        >
          <span className="text-[10px] text-purple-300 uppercase block">{isAr ? 'مشغولة حالياً' : 'Occupied / Seated'}</span>
          <span className="font-mono font-black text-lg text-purple-300">{tables.filter(t => t.status === 'occupied').length}</span>
        </div>

        <div 
          onClick={() => setStatusFilter('reserved')}
          className={`p-3 rounded-xl border cursor-pointer transition ${
            statusFilter === 'reserved' ? 'bg-blue-950/30 border-blue-500' : 'bg-[#0A0A0B] border-[#1E1E21]'
          }`}
        >
          <span className="text-[10px] text-blue-300 uppercase block">{isAr ? 'محجوزة' : 'Reserved'}</span>
          <span className="font-mono font-black text-lg text-blue-300">{tables.filter(t => t.status === 'reserved').length}</span>
        </div>
      </div>

      {/* Interactive Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const isOccupied = table.status === 'occupied';
          const isReserved = table.status === 'reserved';
          const statusClass = getStatusColor(table.status);

          return (
            <div
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 hover:scale-[1.02] shadow-lg ${statusClass}`}
            >
              {/* Card Top */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                    {getSectionLabel(table.section)}
                  </span>
                  <h3 className="font-display font-black text-xl text-[#F5F5F4]">
                    {table.number}
                  </h3>
                  <p className="text-xs text-[#F5F5F4]/80 font-medium">
                    {isAr ? table.nameAr || table.name : table.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQrModalTable(table);
                  }}
                  className="p-1.5 rounded-lg bg-[#000000]/40 hover:bg-[#000000] text-[#39FFB0] border border-[#39FFB0]/30 transition"
                  title="Generate Table QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>

              {/* Status & Capacity */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 opacity-60" />
                  <span>{table.capacity} {isAr ? 'أشخاص' : 'Seats'}</span>
                </div>

                <span className="font-bold text-[11px] uppercase">
                  {table.status === 'available' ? (isAr ? '🟢 شاغرة' : '🟢 Available') :
                   table.status === 'occupied' ? (isAr ? '🟣 مشغولة' : '🟣 Occupied') :
                   table.status === 'reserved' ? (isAr ? '🔵 محجوزة' : '🔵 Reserved') :
                   (isAr ? '🟡 حساب' : '🟡 Billing')}
                </span>
              </div>

              {/* Active Bill / Customer if Occupied */}
              {isOccupied && (
                <div className="p-2.5 bg-black/40 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9C9DA3]">{isAr ? 'الضيف' : 'Guest'}:</span>
                    <span className="font-medium text-[#F5F5F4]">{table.customerName || 'Dine-in Customer'}</span>
                  </div>
                  {table.currentTotal !== undefined && table.currentTotal > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#9C9DA3]">{isAr ? 'الحساب الحالي' : 'Bill Total'}:</span>
                      <span className="font-mono font-bold text-[#39FFB0]">{fmt(table.currentTotal)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-1 flex items-center gap-2">
                {isOccupied ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTableOrder(table);
                    }}
                    className="w-full py-2 bg-[#39FFB0] text-[#04120C] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:opacity-95 shadow-md cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{isAr ? 'عرض الحساب والمحاسبة' : 'View Bill & Settle'}</span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTableOrder(table);
                    }}
                    className="w-full py-2 bg-[#151517] hover:bg-[#1E1E21] border border-white/20 text-[#F5F5F4] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#39FFB0]" />
                    <span>{isAr ? 'جلوس عميل وطلب' : 'Seat & Take Order'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TABLE DETAILS & MANAGEMENT MODAL */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#1E1E21] pb-3">
              <div>
                <span className="text-[10px] text-[#39FFB0] uppercase font-mono font-bold">
                  {getSectionLabel(selectedTable.section)}
                </span>
                <h3 className="font-bold text-lg text-[#F5F5F4]">
                  {selectedTable.number} - {isAr ? selectedTable.nameAr || selectedTable.name : selectedTable.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="p-1.5 text-[#9C9DA3] hover:text-[#F5F5F4] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status Toggles */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#9C9DA3] uppercase">{isAr ? 'تغيير حالة الطاولة فوراً:' : 'Quick Status Change:'}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleTableStatusChange(selectedTable, 'available')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    selectedTable.status === 'available'
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : 'bg-[#151517] text-[#9C9DA3] border-[#1E1E21] hover:border-emerald-500/50'
                  }`}
                >
                  {isAr ? '🟢 شاغرة' : 'Available'}
                </button>

                <button
                  onClick={() => handleTableStatusChange(selectedTable, 'occupied')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    selectedTable.status === 'occupied'
                      ? 'bg-purple-500 text-white border-purple-400'
                      : 'bg-[#151517] text-[#9C9DA3] border-[#1E1E21] hover:border-purple-500/50'
                  }`}
                >
                  {isAr ? '🟣 مشغولة' : 'Occupied'}
                </button>

                <button
                  onClick={() => handleTableStatusChange(selectedTable, 'reserved')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    selectedTable.status === 'reserved'
                      ? 'bg-blue-500 text-white border-blue-400'
                      : 'bg-[#151517] text-[#9C9DA3] border-[#1E1E21] hover:border-blue-500/50'
                  }`}
                >
                  {isAr ? '🔵 حجز مسبق' : 'Reserved'}
                </button>
              </div>
            </div>

            {/* Table Details */}
            <div className="p-3.5 bg-[#0F0F12] border border-[#1E1E21] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-[#9C9DA3]">
                <span>{isAr ? 'سعة الجلوس' : 'Seating Capacity'}:</span>
                <span className="text-[#F5F5F4] font-bold">{selectedTable.capacity} {isAr ? 'مقاعد' : 'Persons'}</span>
              </div>

              {selectedTable.customerName && (
                <div className="flex justify-between text-[#9C9DA3]">
                  <span>{isAr ? 'اسم الضيف / الحاجز' : 'Guest / Reserved By'}:</span>
                  <span className="text-[#F5F5F4] font-medium">{selectedTable.customerName}</span>
                </div>
              )}

              {selectedTable.currentTotal !== undefined && selectedTable.currentTotal > 0 && (
                <div className="flex justify-between text-[#9C9DA3] pt-1 border-t border-[#1E1E21]">
                  <span>{isAr ? 'الحساب الإجمالي النشط' : 'Active Tab Amount'}:</span>
                  <span className="text-[#39FFB0] font-mono font-bold text-sm">{fmt(selectedTable.currentTotal)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setQrModalTable(selectedTable);
                  setSelectedTable(null);
                }}
                className="flex-1 py-2.5 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] text-[#F5F5F4] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-[#39FFB0]" />
                <span>{isAr ? 'رمز QR للطاولة' : 'Table QR Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenTableOrder(selectedTable);
                  setSelectedTable(null);
                }}
                className="flex-1 py-2.5 bg-[#39FFB0] text-[#04120C] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>{isAr ? 'فتح الطلب في الكاشير' : 'Open POS Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE QR CODE MODAL FOR INSTANT DINE-IN SELF-ORDERING */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#0A0A0B] border-2 border-[#39FFB0]/50 rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#1E1E21] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#F5F5F4]">
                  {isAr ? `رمز QR طاولة ${qrModalTable.number}` : `Table ${qrModalTable.number} QR Code`}
                </h3>
                <p className="text-xs text-[#39FFB0]">{getSectionLabel(qrModalTable.section)}</p>
              </div>
              <button
                onClick={() => setQrModalTable(null)}
                className="p-1 text-[#9C9DA3] hover:text-[#F5F5F4] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Generated QR Code Box */}
            <div className="p-4 bg-white rounded-2xl inline-block shadow-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `${window.location.origin}${window.location.pathname}?customer=1&table=${qrModalTable.number}&section=${qrModalTable.section}`
                )}`}
                alt="Table QR"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <p className="text-xs text-[#9C9DA3] leading-relaxed">
              {isAr 
                ? `يمكن لضيوف طاولة (${qrModalTable.number}) مسح هذا الرمز للطلب فوراً من هواتفهم وإرسال الطلب للمطبخ باسم هذه الطاولة.`
                : `Dine-in guests seated at (${qrModalTable.number}) scan this QR to order from their phones directly to the kitchen.`}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#39FFB0] text-[#04120C] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة بطاقة الطاولة' : 'Print Table Stand'}</span>
              </button>
              <button
                onClick={() => setQrModalTable(null)}
                className="px-4 py-2.5 bg-[#151517] text-[#9C9DA3] hover:text-[#F5F5F4] rounded-xl text-xs font-semibold cursor-pointer"
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
export default TableManagementView;
