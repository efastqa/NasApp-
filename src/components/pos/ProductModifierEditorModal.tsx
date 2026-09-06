import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Sparkles, Coffee, Utensils, Ruler } from 'lucide-react';
import { Product, ModifierGroup, ModifierOption } from '../../types';
import { Language, translations } from '../../i18n';

interface ProductModifierEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (productId: string, groups: ModifierGroup[]) => Promise<boolean>;
  lang?: Language;
}

export const ProductModifierEditorModal: React.FC<ProductModifierEditorModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
  lang = 'en'
}) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (product && isOpen) {
      setGroups(product.modifierGroups ? JSON.parse(JSON.stringify(product.modifierGroups)) : []);
    } else {
      setGroups([]);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  // Add new empty group
  const handleAddGroup = () => {
    const newGroup: ModifierGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: isAr ? 'مجموعة خيارات جديدة' : 'New Option Group',
      nameAr: isAr ? 'مجموعة خيارات جديدة' : '',
      required: false,
      multiSelect: false,
      options: [
        { id: `opt_${Date.now()}_1`, name: isAr ? 'خيار 1' : 'Option 1', nameAr: isAr ? 'خيار 1' : '', price: 0 },
        { id: `opt_${Date.now()}_2`, name: isAr ? 'خيار 2' : 'Option 2', nameAr: isAr ? 'خيار 2' : '', price: 2 }
      ]
    };
    setGroups([...groups, newGroup]);
  };

  // Remove group
  const handleRemoveGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  // Add option to group
  const handleAddOption = (groupId: string) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      const newOpt: ModifierOption = {
        id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: isAr ? 'إضافة جديدة' : 'New Option',
        nameAr: isAr ? 'إضافة جديدة' : '',
        price: 0
      };
      return { ...g, options: [...g.options, newOpt] };
    }));
  };

  // Remove option from group
  const handleRemoveOption = (groupId: string, optionId: string) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, options: g.options.filter(o => o.id !== optionId) };
    }));
  };

  // Apply 1-Click Preset
  const applyPreset = (presetType: 'karak' | 'food' | 'size') => {
    if (presetType === 'karak') {
      const karakPreset: ModifierGroup[] = [
        {
          id: `grp_sugar_${Date.now()}`,
          name: 'Sugar Level',
          nameAr: 'مستوى السكر',
          required: true,
          multiSelect: false,
          options: [
            { id: 'opt_s1', name: 'Regular Sugar', nameAr: 'سكر عادي', price: 0 },
            { id: 'opt_s2', name: 'Less Sugar (Khafeef)', nameAr: 'سكر خفيف', price: 0 },
            { id: 'opt_s3', name: 'No Sugar (Sada)', nameAr: 'بدون سكر (سادة)', price: 0 },
            { id: 'opt_s4', name: 'Extra Sugar (Ziyada)', nameAr: 'سكر زيادة', price: 0 }
          ]
        },
        {
          id: `grp_extras_${Date.now()}`,
          name: 'Flavor & Spices Add-ons',
          nameAr: 'النكهات والإضافات',
          required: false,
          multiSelect: true,
          options: [
            { id: 'opt_e1', name: 'Extra Saffron (Zafran)', nameAr: 'زعفران إضافي', price: 2.00 },
            { id: 'opt_e2', name: 'Fresh Ginger (Zanjabeel)', nameAr: 'زنجبيل طازج', price: 1.00 },
            { id: 'opt_e3', name: 'Cardamom (Hail)', nameAr: 'هيل مميز', price: 1.00 }
          ]
        }
      ];
      setGroups(karakPreset);
    } else if (presetType === 'food') {
      const foodPreset: ModifierGroup[] = [
        {
          id: `grp_size_${Date.now()}`,
          name: 'Portion Size',
          nameAr: 'حجم الوجبة',
          required: true,
          multiSelect: false,
          options: [
            { id: 'opt_sz1', name: 'Regular / Single', nameAr: 'عادي / مفرد', price: 0 },
            { id: 'opt_sz2', name: 'Large / Combo', nameAr: 'كبير / كومبو مع بطاطس ومشروب', price: 6.00 }
          ]
        },
        {
          id: `grp_top_${Date.now()}`,
          name: 'Extras & Add-ons',
          nameAr: 'الإضافات والصوصات',
          required: false,
          multiSelect: true,
          options: [
            { id: 'opt_t1', name: 'Extra Melted Cheddar', nameAr: 'جبن شيدر ذائب إضافي', price: 3.00 },
            { id: 'opt_t2', name: 'Spicy Jalapeños & Hot Sauce', nameAr: 'هلابينو وصوص حار', price: 1.50 },
            { id: 'opt_t3', name: 'Tahini & Garlic Sauce', nameAr: 'طحينة وثوم إضافي', price: 1.00 }
          ]
        }
      ];
      setGroups(foodPreset);
    } else if (presetType === 'size') {
      const sizePreset: ModifierGroup[] = [
        {
          id: `grp_sz_${Date.now()}`,
          name: 'Size Selection',
          nameAr: 'اختيار المقاس',
          required: true,
          multiSelect: false,
          options: [
            { id: 'opt_s', name: 'Small (S)', nameAr: 'صغير (S)', price: 0 },
            { id: 'opt_m', name: 'Medium (M)', nameAr: 'وسط (M)', price: 2.00 },
            { id: 'opt_l', name: 'Large (L)', nameAr: 'كبير (L)', price: 4.00 },
            { id: 'opt_xl', name: 'Extra Large (XL)', nameAr: 'كبير جداً (XL)', price: 6.00 }
          ]
        }
      ];
      setGroups(sizePreset);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(product.id, groups);
    setSaving(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div 
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div 
        className="bg-[#0A0A0B] border border-[#1E1E21] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E1E21] flex items-center justify-between gap-3 bg-[#0F0F12]">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#39FFB0] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#39FFB0]" />
              <span>{t.modifiersTitle}</span>
            </h3>
            <p className="text-xs text-[#9C9DA3] mt-0.5">
              {product.name} ({product.price.toFixed(2)} {t.currency})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#151517] hover:bg-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick 1-Click Presets */}
        <div className="p-3 sm:px-5 bg-[#121215] border-b border-[#1E1E21] flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-[#9C9DA3]">{isAr ? 'نماذج جاهزة سريعة:' : 'Quick Presets:'}</span>
          <button
            type="button"
            onClick={() => applyPreset('karak')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] hover:border-[#39FFB0]/40 text-[#F5F5F4] text-[11px] font-semibold rounded-lg transition cursor-pointer"
          >
            <Coffee className="w-3 h-3 text-[#39FFB0]" />
            <span>{t.quickPresetKarak}</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('food')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] hover:border-[#39FFB0]/40 text-[#F5F5F4] text-[11px] font-semibold rounded-lg transition cursor-pointer"
          >
            <Utensils className="w-3 h-3 text-[#39FFB0]" />
            <span>{t.quickPresetFood}</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('size')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] hover:border-[#39FFB0]/40 text-[#F5F5F4] text-[11px] font-semibold rounded-lg transition cursor-pointer"
          >
            <Ruler className="w-3 h-3 text-[#39FFB0]" />
            <span>{t.quickPresetSize}</span>
          </button>
        </div>

        {/* Groups Builder Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {groups.length === 0 ? (
            <div className="text-center py-10 text-[#5E5F64] space-y-3">
              <p className="text-xs">{t.noModifiers}</p>
              <p className="text-[11px] text-[#9C9DA3]">{isAr ? 'انقر على أحد النماذج الجاهزة أعلاه أو أضف مجموعة جديدة بالأسفل' : 'Click one of the presets above or add a new group below.'}</p>
            </div>
          ) : (
            groups.map((group, gIdx) => (
              <div key={group.id} className="p-3.5 bg-[#000000] border border-[#1E1E21] rounded-2xl space-y-3 relative group/card">
                
                {/* Group Header Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#1E1E21]">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGroups(groups.map(g => g.id === group.id ? { ...g, name: val } : g));
                      }}
                      placeholder={t.groupName}
                      className="px-2.5 py-1.5 bg-[#151517] border border-[#1E1E21] focus:border-[#39FFB0] rounded-lg text-xs font-bold text-[#F5F5F4] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={group.nameAr || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGroups(groups.map(g => g.id === group.id ? { ...g, nameAr: val } : g));
                      }}
                      placeholder="الاسم بالعربية (اختياري)"
                      className="px-2.5 py-1.5 bg-[#151517] border border-[#1E1E21] focus:border-[#39FFB0] rounded-lg text-xs text-[#F5F5F4] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="flex items-center gap-1.5 text-[11px] text-[#9C9DA3] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={group.required || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setGroups(groups.map(g => g.id === group.id ? { ...g, required: checked } : g));
                        }}
                        className="rounded border-[#1E1E21] text-[#39FFB0]"
                      />
                      <span>{t.isRequired}</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-[11px] text-[#9C9DA3] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={group.multiSelect || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setGroups(groups.map(g => g.id === group.id ? { ...g, multiSelect: checked } : g));
                        }}
                        className="rounded border-[#1E1E21] text-[#39FFB0]"
                      />
                      <span>{t.multiSelect}</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(group.id)}
                      className="p-1.5 text-[#9C9DA3] hover:text-red-400 hover:bg-[#1E1E21] rounded-lg transition cursor-pointer"
                      title="Delete Group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-mono text-[#5E5F64] px-1">
                    {isAr ? 'الخيارات والأسعار:' : 'Options & Extra Prices:'}
                  </div>

                  {group.options.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGroups(groups.map(g => {
                            if (g.id !== group.id) return g;
                            return {
                              ...g,
                              options: g.options.map(o => o.id === opt.id ? { ...o, name: val } : o)
                            };
                          }));
                        }}
                        placeholder={t.optionName}
                        className="flex-1 px-2.5 py-1.5 bg-[#121215] border border-[#1E1E21] focus:border-[#39FFB0] rounded-lg text-xs text-[#F5F5F4] focus:outline-none"
                      />

                      <input
                        type="text"
                        value={opt.nameAr || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGroups(groups.map(g => {
                            if (g.id !== group.id) return g;
                            return {
                              ...g,
                              options: g.options.map(o => o.id === opt.id ? { ...o, nameAr: val } : o)
                            };
                          }));
                        }}
                        placeholder="الخيار بالعربية"
                        className="flex-1 px-2.5 py-1.5 bg-[#121215] border border-[#1E1E21] focus:border-[#39FFB0] rounded-lg text-xs text-[#F5F5F4] focus:outline-none"
                      />

                      <div className="flex items-center gap-1 w-28 shrink-0">
                        <span className="text-[10px] text-[#9C9DA3] font-mono">+QR</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={opt.price}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setGroups(groups.map(g => {
                              if (g.id !== group.id) return g;
                              return {
                                ...g,
                                options: g.options.map(o => o.id === opt.id ? { ...o, price: val } : o)
                              };
                            }));
                          }}
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 bg-[#121215] border border-[#1E1E21] focus:border-[#39FFB0] rounded-lg text-xs font-mono text-[#39FFB0] font-bold focus:outline-none text-center"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveOption(group.id, opt.id)}
                        className="p-1.5 text-[#5E5F64] hover:text-red-400 rounded-lg transition cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddOption(group.id)}
                    className="flex items-center gap-1 text-xs text-[#39FFB0] hover:underline pt-1 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t.addOption}</span>
                  </button>
                </div>

              </div>
            ))
          )}

          <button
            type="button"
            onClick={handleAddGroup}
            className="w-full py-2.5 border-2 border-dashed border-[#1E1E21] hover:border-[#39FFB0]/40 text-[#9C9DA3] hover:text-[#39FFB0] rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addModifierGroup}</span>
          </button>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#1E1E21] bg-[#0F0F12] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#151517] hover:bg-[#1E1E21] text-xs text-[#9C9DA3] hover:text-[#F5F5F4] rounded-xl transition cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2 bg-[#39FFB0] hover:opacity-90 disabled:opacity-40 text-[#04120C] font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#39FFB0]/10"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : t.saveModifiers}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
export default ProductModifierEditorModal;
