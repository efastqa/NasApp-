import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Minus, FileText, Sparkles } from 'lucide-react';
import { Product, ModifierGroup, SelectedModifier, CartItem } from '../../types';
import { Language, translations } from '../../i18n';

interface ProductModifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  initialItem?: CartItem | null;
  onConfirm: (item: CartItem) => void;
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const ProductModifierModal: React.FC<ProductModifierModalProps> = ({
  isOpen,
  onClose,
  product,
  initialItem,
  onConfirm,
  lang = 'en',
  theme = 'light'
}) => {
  const t = translations[lang];
  const isAr = lang === 'ar';
  const isLight = theme === 'light';

  const [selectedMap, setSelectedMap] = useState<Record<string, string[]>>({}); // groupId -> array of optionIds
  const [qty, setQty] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const fmt = (n: number) => (isAr ? `${Number(n).toFixed(2)} ر.ق` : `QR ${Number(n).toFixed(2)}`);

  // Initialize selections when product or modal opens
  useEffect(() => {
    if (!isOpen || !product) {
      setSelectedMap({});
      setQty(1);
      setNotes('');
      setValidationError(null);
      return;
    }

    if (initialItem) {
      setQty(initialItem.qty || 1);
      setNotes(initialItem.notes || '');
      const map: Record<string, string[]> = {};
      if (initialItem.selectedModifiers) {
        initialItem.selectedModifiers.forEach(m => {
          if (!map[m.groupId]) map[m.groupId] = [];
          map[m.groupId].push(m.optionId);
        });
      }
      setSelectedMap(map);
    } else {
      setQty(1);
      setNotes('');
      // Default select first option for required single-select groups
      const map: Record<string, string[]> = {};
      if (product.modifierGroups) {
        product.modifierGroups.forEach(g => {
          if (g.required && !g.multiSelect && g.options.length > 0) {
            map[g.id] = [g.options[0].id];
          }
        });
      }
      setSelectedMap(map);
    }
    setValidationError(null);
  }, [isOpen, product, initialItem]);

  if (!isOpen || !product) return null;

  const modifierGroups = product.modifierGroups || [];

  // Toggle modifier option selection
  const handleToggleOption = (group: ModifierGroup, optionId: string) => {
    setValidationError(null);
    setSelectedMap(prev => {
      const currentSelected = prev[group.id] || [];
      if (group.multiSelect) {
        if (currentSelected.includes(optionId)) {
          return { ...prev, [group.id]: currentSelected.filter(id => id !== optionId) };
        } else {
          return { ...prev, [group.id]: [...currentSelected, optionId] };
        }
      } else {
        // Single select (radio)
        if (currentSelected.includes(optionId) && !group.required) {
          return { ...prev, [group.id]: [] };
        }
        return { ...prev, [group.id]: [optionId] };
      }
    });
  };

  // Calculate total unit price (base price + sum of selected modifiers)
  let extraPrice = 0;
  const compiledModifiers: SelectedModifier[] = [];

  modifierGroups.forEach(group => {
    const selectedIds = selectedMap[group.id] || [];
    selectedIds.forEach(id => {
      const opt = group.options.find(o => o.id === id);
      if (opt) {
        extraPrice += opt.price || 0;
        compiledModifiers.push({
          groupId: group.id,
          groupName: (isAr && group.nameAr) ? group.nameAr : group.name,
          optionId: opt.id,
          optionName: (isAr && opt.nameAr) ? opt.nameAr : opt.name,
          price: opt.price || 0
        });
      }
    });
  });

  const unitPrice = product.price + extraPrice;
  const totalPrice = unitPrice * qty;

  const handleSave = () => {
    // Validate required groups
    for (const group of modifierGroups) {
      if (group.required) {
        const selected = selectedMap[group.id] || [];
        if (selected.length === 0) {
          setValidationError(
            isAr 
              ? `يرجى اختيار خيار من: ${(group.nameAr || group.name)}`
              : `Please select an option for: ${group.name}`
          );
          return;
        }
      }
    }

    const cartItem: CartItem = {
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      price: unitPrice,
      qty,
      stock: product.stock,
      selectedModifiers: compiledModifiers,
      notes: notes.trim() || undefined
    };

    onConfirm(cartItem);
    onClose();
  };

  return (
    <div 
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div 
        className={`border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0A0A0B] border-[#1E1E21] text-[#F5F5F4]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-start justify-between gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0F0F12] border-[#1E1E21]'
        }`}>
          <div className="flex items-center gap-3">
            {product.image ? (
              <img src={product.image} alt={product.name} className={`w-12 h-12 rounded-xl object-cover border ${isLight ? 'border-slate-200' : 'border-[#1E1E21]'}`} />
            ) : (
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-sm ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-[#151517] border-[#1E1E21] text-[#39FFB0]'
              }`}>
                <Sparkles className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-[#39FFB0]'}`} />
              </div>
            )}
            <div>
              <span className={`text-[10px] uppercase font-mono tracking-wider block font-semibold ${
                isLight ? 'text-emerald-700' : 'text-[#5E5F64]'
              }`}>
                {product.category || 'Store'}
              </span>
              <h3 className={`font-bold text-base leading-tight ${isLight ? 'text-slate-900' : 'text-[#F5F5F4]'}`}>
                {product.name}
              </h3>
              <p className={`text-xs font-mono font-bold mt-0.5 ${isLight ? 'text-emerald-700' : 'text-[#39FFB0]'}`}>
                {fmt(product.price)} {extraPrice > 0 && <span className={`font-normal text-[11px] ${isLight ? 'text-slate-500' : 'text-[#9C9DA3]'}`}>(+{fmt(extraPrice)})</span>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer border ${
              isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-[#151517] hover:bg-[#1E1E21] border-transparent text-[#9C9DA3] hover:text-[#F5F5F4]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modifiers List & Notes */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* Validation Banner */}
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold animate-shake">
              ⚠️ {validationError}
            </div>
          )}

          {modifierGroups.length === 0 ? (
            <div className={`text-center py-6 text-xs ${isLight ? 'text-slate-400' : 'text-[#9C9DA3]'}`}>
              <p>{t.noModifiers}</p>
            </div>
          ) : (
            modifierGroups.map((group) => {
              const selectedIds = selectedMap[group.id] || [];
              const groupTitle = (isAr && group.nameAr) ? group.nameAr : group.name;

              return (
                <div key={group.id} className={`space-y-2.5 p-3.5 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121215] border-[#1E1E21]'
                }`}>
                  
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold text-xs flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-[#F5F5F4]'}`}>
                      <span>{groupTitle}</span>
                      {group.required && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                          isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-950/60 border-red-500/40 text-red-300'
                        }`}>
                          {t.isRequired}
                        </span>
                      )}
                    </h4>
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-[#5E5F64]'}`}>
                      {group.multiSelect ? t.multiSelect : t.singleSelect}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.options.map((opt) => {
                      const isSelected = selectedIds.includes(opt.id);
                      const optTitle = (isAr && opt.nameAr) ? opt.nameAr : opt.name;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleToggleOption(group, opt.id)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition text-left cursor-pointer ${
                            isSelected
                              ? (isLight ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' : 'bg-[#1A2E24] border-[#39FFB0] text-[#39FFB0] shadow-sm')
                              : (isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300' : 'bg-[#0A0A0B] border-[#1E1E21] text-[#F5F5F4] hover:bg-[#151517] hover:border-[#2A2A30]')
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-4 h-4 rounded-${group.multiSelect ? 'md' : 'full'} border flex items-center justify-center text-[10px] shrink-0 ${
                              isSelected 
                                ? (isLight ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-[#39FFB0] border-[#39FFB0] text-[#04120C]')
                                : (isLight ? 'border-slate-300 bg-white' : 'border-[#2A2A30] bg-[#151517]')
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate">{optTitle}</span>
                          </div>

                          {opt.price > 0 ? (
                            <span className={`font-mono text-[11px] shrink-0 font-bold ${
                              isSelected 
                                ? (isLight ? 'text-emerald-800' : 'text-[#39FFB0]') 
                                : (isLight ? 'text-slate-500' : 'text-[#9C9DA3]')
                            }`}>
                              +{fmt(opt.price)}
                            </span>
                          ) : (
                            <span className={`text-[10px] font-mono shrink-0 ${isLight ? 'text-slate-400' : 'text-[#5E5F64]'}`}>
                              {isAr ? 'مجاني' : 'Free'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                </div>
              );
            })
          )}

          {/* Kitchen / Special Instructions */}
          <div className="space-y-1.5 pt-1">
            <label className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-[#9C9DA3]'}`}>
              <FileText className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-[#39FFB0]'}`} />
              <span>{t.customNotes}</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isAr ? 'مثال: بدون سكر، ساخن جداً، زيادة صوص…' : 'e.g., Extra hot, no pickles, sauce on side…'}
              className={`w-full p-2.5 rounded-xl text-xs transition border focus:outline-none ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                  : 'bg-[#000000] border-[#1E1E21] text-[#F5F5F4] placeholder:text-[#5E5F64] focus:border-[#39FFB0]'
              }`}
            />
          </div>

        </div>

        {/* Footer: Quantity & Confirm Button */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0F0F12] border-[#1E1E21]'
        }`}>
          {/* Quantity Controls */}
          <div className={`flex items-center gap-2 rounded-xl p-1 shrink-0 border ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#000000] border-[#1E1E21]'
          }`}>
            <button
              type="button"
              disabled={qty <= 1}
              onClick={() => setQty(Math.max(1, qty - 1))}
              className={`w-7 h-7 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#151517] hover:bg-[#1E1E21] text-[#F5F5F4]'
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className={`font-mono text-sm font-bold w-6 text-center ${isLight ? 'text-slate-900' : 'text-[#F5F5F4]'}`}>
              {qty}
            </span>
            <button
              type="button"
              disabled={product.stock > 0 && qty >= product.stock}
              onClick={() => setQty(qty + 1)}
              className={`w-7 h-7 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#151517] hover:bg-[#1E1E21] text-[#F5F5F4]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart / Order Button */}
          <button
            type="button"
            onClick={handleSave}
            className={`flex-1 py-3 font-black rounded-xl text-xs sm:text-sm transition flex items-center justify-between px-4 shadow-md cursor-pointer ${
              isLight 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                : 'bg-[#39FFB0] hover:opacity-90 text-[#04120C] shadow-[#39FFB0]/10'
            }`}
          >
            <span>{initialItem ? (isAr ? 'تحديث الصنف' : 'Update Item') : t.addToCart}</span>
            <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded-lg ${
              isLight ? 'bg-white/20 text-white' : 'bg-[#04120C]/10 text-[#04120C]'
            }`}>
              {fmt(totalPrice)}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
export default ProductModifierModal;
