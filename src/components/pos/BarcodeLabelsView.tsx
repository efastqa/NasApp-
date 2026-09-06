import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Tag, 
  Settings2, 
  Plus, 
  Minus, 
  Check, 
  Sliders, 
  Eye, 
  Layers,
  Sparkles,
  Info,
  CheckSquare,
  Square
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { Product } from '../../types';
import { Language, translations } from '../../i18n';

interface BarcodeLabelsViewProps {
  products: Product[];
  lang?: Language;
}

type LabelSizePreset = '50x30' | '40x25' | '58mm' | '80mm';

export const BarcodeLabelsView: React.FC<BarcodeLabelsViewProps> = ({
  products,
  lang = 'en'
}) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  // State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    return products.slice(0, 4).map(p => p.id);
  });
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [labelSize, setLabelSize] = useState<LabelSizePreset>('50x30');

  // Customization Toggles
  const [showBrand, setShowBrand] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showBarcode, setShowBarcode] = useState<boolean>(true);
  const [showSku, setShowSku] = useState<boolean>(true);
  const [showDate, setShowDate] = useState<boolean>(false);
  const [currencySymbol, setCurrencySymbol] = useState<string>('QR');

  const barcodeSvgRefs = useRef<Map<string, SVGSVGElement>>(new Map());

  // Default quantities to 1
  const getQty = (id: string) => quantities[id] ?? 2;

  const setQty = (id: string, count: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, count) }));
  };

  const toggleSelectProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(pId => pId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  // Compile list of labels to render based on copies
  const labelsToPrint: Array<{ product: Product; index: number; uniqueKey: string }> = [];
  selectedProductIds.forEach(id => {
    const p = products.find(prod => prod.id === id);
    if (p) {
      const copies = getQty(id);
      for (let i = 0; i < copies; i++) {
        labelsToPrint.push({
          product: p,
          index: i + 1,
          uniqueKey: `lbl_${p.id}_${i}`
        });
      }
    }
  });

  // Render Barcodes via JsBarcode whenever labels or options change
  useEffect(() => {
    labelsToPrint.forEach(item => {
      const el = barcodeSvgRefs.current.get(item.uniqueKey);
      if (el && showBarcode) {
        try {
          const barcodeValue = item.product.sku || item.product.id || '000000';
          JsBarcode(el, barcodeValue, {
            format: 'CODE128',
            lineColor: '#000000',
            width: labelSize === '40x25' ? 1.2 : 1.6,
            height: labelSize === '40x25' ? 24 : 32,
            displayValue: false, // We render our own clean typography
            margin: 0
          });
        } catch (e) {
          console.warn('JsBarcode render warning:', e);
        }
      }
    });
  }, [labelsToPrint, showBarcode, labelSize]);

  // Trigger Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // Dimensions based on preset
  const getSizeStyles = () => {
    switch (labelSize) {
      case '40x25':
        return {
          containerWidth: 'w-[155px] min-h-[96px]',
          printClass: 'label-40x25',
          fontSizeTitle: 'text-[11px]',
          fontSizePrice: 'text-[13px]'
        };
      case '58mm':
        return {
          containerWidth: 'w-[200px] min-h-[120px]',
          printClass: 'label-58mm',
          fontSizeTitle: 'text-xs',
          fontSizePrice: 'text-base'
        };
      case '80mm':
        return {
          containerWidth: 'w-[270px] min-h-[140px]',
          printClass: 'label-80mm',
          fontSizeTitle: 'text-sm',
          fontSizePrice: 'text-lg'
        };
      case '50x30':
      default:
        return {
          containerWidth: 'w-[190px] min-h-[114px]',
          printClass: 'label-50x30',
          fontSizeTitle: 'text-xs',
          fontSizePrice: 'text-sm'
        };
    }
  };

  const sizeMeta = getSizeStyles();

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-5">
      
      {/* Header */}
      <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-sm sm:text-base text-[#F5F5F4] flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#39FFB0]" />
            <span>{t.barcodeLabelsTitle}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#1E1E21] text-[#39FFB0] font-mono text-[10px] font-bold">
              {labelsToPrint.length} {t.copies}
            </span>
          </h2>
          <p className="text-xs text-[#9C9DA3] mt-0.5">{t.barcodeLabelsSubtitle}</p>
        </div>

        <button
          onClick={handlePrint}
          disabled={labelsToPrint.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#39FFB0] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-[#04120C] font-black rounded-xl text-xs sm:text-sm transition shadow-lg shadow-[#39FFB0]/10 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>{t.printLabelsBtn} ({labelsToPrint.length})</span>
        </button>
      </div>

      {/* Control Panels: Product Selection (Left) + Template Settings (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Product Selection & Quantities (6 cols) */}
        <div className="lg:col-span-6 bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          
          <div className="flex items-center justify-between pb-3 border-b border-[#1E1E21]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#39FFB0] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#39FFB0]" />
              <span>{t.selectProductToPrint}</span>
            </h3>

            <button
              onClick={selectAll}
              className="text-xs text-[#9C9DA3] hover:text-[#39FFB0] flex items-center gap-1.5 transition cursor-pointer font-medium"
            >
              {selectedProductIds.length === products.length ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-[#39FFB0]" />
                  <span>{isAr ? 'إلغاء تحديد الكل' : 'Deselect All'}</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تحديد الكل' : 'Select All'}</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {products.map(p => {
              const isSelected = selectedProductIds.includes(p.id);
              const qty = getQty(p.id);

              return (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition select-none ${
                    isSelected
                      ? 'bg-[#121215] border-[#39FFB0]/50'
                      : 'bg-[#000000] border-[#1E1E21] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div 
                    onClick={() => toggleSelectProduct(p.id)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${
                      isSelected ? 'bg-[#39FFB0] border-[#39FFB0] text-[#04120C]' : 'border-[#2A2A30] bg-[#151517]'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-[#F5F5F4] truncate">{p.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-[#9C9DA3] font-mono">
                        <span className="text-[#39FFB0]">{p.price.toFixed(2)} QR</span>
                        <span>•</span>
                        <span>{p.sku || p.id}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 bg-[#000000] border border-[#1E1E21] rounded-lg p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQty(p.id, qty - 1)}
                        className="w-5 h-5 rounded bg-[#151517] hover:bg-[#1E1E21] text-[#F5F5F4] flex items-center justify-center text-xs transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs text-[#39FFB0]">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(p.id, qty + 1)}
                        className="w-5 h-5 rounded bg-[#151517] hover:bg-[#1E1E21] text-[#F5F5F4] flex items-center justify-center text-xs transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Template Size & Element Toggles (6 cols) */}
        <div className="lg:col-span-6 bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#39FFB0] flex items-center gap-2 pb-3 border-b border-[#1E1E21]">
            <Settings2 className="w-4 h-4 text-[#39FFB0]" />
            <span>{t.customizeLabel}</span>
          </h3>

          {/* Size Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#9C9DA3]">{t.labelSize}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLabelSize('50x30')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                  labelSize === '50x30'
                    ? 'bg-[#1A2E24] border-[#39FFB0] text-[#39FFB0]'
                    : 'bg-[#121215] border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4]'
                }`}
              >
                <div className="font-bold text-white">{t.labelSize50x30}</div>
                <div className="text-[10px] text-[#5E5F64] font-mono mt-0.5">Xprinter / Dymo / Zebra</div>
              </button>

              <button
                type="button"
                onClick={() => setLabelSize('40x25')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                  labelSize === '40x25'
                    ? 'bg-[#1A2E24] border-[#39FFB0] text-[#39FFB0]'
                    : 'bg-[#121215] border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4]'
                }`}
              >
                <div className="font-bold text-white">{t.labelSize40x25}</div>
                <div className="text-[10px] text-[#5E5F64] font-mono mt-0.5">Compact / Retail Item</div>
              </button>

              <button
                type="button"
                onClick={() => setLabelSize('58mm')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                  labelSize === '58mm'
                    ? 'bg-[#1A2E24] border-[#39FFB0] text-[#39FFB0]'
                    : 'bg-[#121215] border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4]'
                }`}
              >
                <div className="font-bold text-white">{t.labelSize58mm}</div>
                <div className="text-[10px] text-[#5E5F64] font-mono mt-0.5">58mm POS Receipt Paper</div>
              </button>

              <button
                type="button"
                onClick={() => setLabelSize('80mm')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                  labelSize === '80mm'
                    ? 'bg-[#1A2E24] border-[#39FFB0] text-[#39FFB0]'
                    : 'bg-[#121215] border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4]'
                }`}
              >
                <div className="font-bold text-white">{t.labelSize80mm}</div>
                <div className="text-[10px] text-[#5E5F64] font-mono mt-0.5">80mm Standard POS Printer</div>
              </button>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-2 pt-2 border-t border-[#1E1E21]">
            <div className="text-xs font-bold text-[#9C9DA3]">{isAr ? 'عناصر الملصق الظاهرة:' : 'Included Elements:'}</div>
            
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 bg-[#121215] border border-[#1E1E21] rounded-xl text-xs text-[#F5F5F4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={e => setShowPrice(e.target.checked)}
                  className="rounded text-[#39FFB0]"
                />
                <span>{t.showPrice}</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-[#121215] border border-[#1E1E21] rounded-xl text-xs text-[#F5F5F4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={e => setShowBarcode(e.target.checked)}
                  className="rounded text-[#39FFB0]"
                />
                <span>{t.showBarcode}</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-[#121215] border border-[#1E1E21] rounded-xl text-xs text-[#F5F5F4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBrand}
                  onChange={e => setShowBrand(e.target.checked)}
                  className="rounded text-[#39FFB0]"
                />
                <span>{t.showBrand}</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-[#121215] border border-[#1E1E21] rounded-xl text-xs text-[#F5F5F4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={e => setShowSku(e.target.checked)}
                  className="rounded text-[#39FFB0]"
                />
                <span>{t.showSku}</span>
              </label>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 bg-[#121215] border border-[#1E1E21] rounded-xl text-[11px] text-[#9C9DA3] flex items-center gap-2 font-mono">
            <Info className="w-4 h-4 text-[#39FFB0] shrink-0" />
            <span>
              {isAr 
                ? '💡 متوافق مع طابعات الباركود الحرارية (Zebra, Xprinter, Rongta, Dymo) بدون حبر.'
                : '💡 Direct thermal compatible with Xprinter, Zebra, Rongta, and POS roll printers.'}
            </span>
          </div>

        </div>

      </div>

      {/* Live Label Preview Gallery */}
      <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E1E21]">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#39FFB0] flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#39FFB0]" />
            <span>{t.printPreview} ({labelsToPrint.length} {t.copies})</span>
          </h3>

          <span className="text-[11px] font-mono text-[#5E5F64]">
            Preset: {labelSize}
          </span>
        </div>

        {labelsToPrint.length === 0 ? (
          <div className="py-12 text-center text-[#5E5F64] text-xs">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#39FFB0]" />
            <p>{isAr ? 'يرجى اختيار منتج واحد على الأقل لمعاينة ملصقاته' : 'Select at least one product above to preview labels'}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 p-4 bg-[#121215] rounded-2xl border border-[#1E1E21] min-h-[160px] max-h-[500px] overflow-y-auto">
            {labelsToPrint.map((item) => {
              const p = item.product;

              return (
                <div
                  key={item.uniqueKey}
                  className={`bg-white text-black font-sans p-2.5 rounded-lg border-2 border-black/20 shadow-md flex flex-col justify-between select-none ${sizeMeta.containerWidth}`}
                >
                  {/* Label Header: Brand & Category */}
                  <div className="flex items-center justify-between border-b border-black/80 pb-0.5 leading-none">
                    {showBrand && (
                      <span className="font-black text-[9px] uppercase tracking-wider">
                        NASAPP
                      </span>
                    )}
                    <span className="text-[8px] font-bold text-neutral-600 truncate max-w-[80px]">
                      {p.category || 'RETAIL'}
                    </span>
                  </div>

                  {/* Product Title */}
                  <div className="py-1">
                    <h4 className={`font-black ${sizeMeta.fontSizeTitle} leading-tight line-clamp-2 text-black`}>
                      {p.name}
                    </h4>
                  </div>

                  {/* Price Banner */}
                  {showPrice && (
                    <div className="bg-black text-white px-1.5 py-0.5 rounded flex items-center justify-between my-0.5">
                      <span className="text-[8px] font-bold uppercase tracking-wider">PRICE:</span>
                      <span className={`font-mono font-black ${sizeMeta.fontSizePrice}`}>
                        {p.price.toFixed(2)} QR
                      </span>
                    </div>
                  )}

                  {/* Barcode SVG rendering */}
                  {showBarcode && (
                    <div className="flex flex-col items-center justify-center pt-0.5">
                      <svg
                        ref={el => {
                          if (el) barcodeSvgRefs.current.set(item.uniqueKey, el);
                        }}
                        className="w-full max-h-8"
                      />
                    </div>
                  )}

                  {/* SKU & Footer Number */}
                  {showSku && (
                    <div className="text-center font-mono font-bold text-[9px] tracking-widest text-black/90">
                      {p.sku || p.id}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden Print-Specific Container that window.print() formats into thermal label rolls */}
      <div id="thermalBarcodePrintArea" className="hidden">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #thermalBarcodePrintArea, #thermalBarcodePrintArea * {
              visibility: visible;
            }
            #thermalBarcodePrintArea {
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
            }
            .thermal-label-sheet {
              display: flex;
              flex-wrap: wrap;
              gap: 4mm;
              padding: 2mm;
            }
            .thermal-label-box {
              page-break-inside: avoid;
              break-inside: avoid;
              border: 1px solid #000;
              box-sizing: border-box;
              font-family: Arial, sans-serif;
              padding: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: #fff;
              color: #000;
            }
            .size-50x30 {
              width: 50mm;
              height: 30mm;
            }
            .size-40x25 {
              width: 40mm;
              height: 25mm;
            }
            .size-58mm {
              width: 54mm;
              min-height: 35mm;
            }
            .size-80mm {
              width: 76mm;
              min-height: 40mm;
            }
          }
        `}} />

        <div className="thermal-label-sheet">
          {labelsToPrint.map((item) => {
            const p = item.product;
            const sizeClass = `size-${labelSize}`;

            return (
              <div key={item.uniqueKey + '_print'} className={`thermal-label-box ${sizeClass}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '1px', fontSize: '7pt', fontWeight: 'bold' }}>
                  {showBrand && <span>NASAPP</span>}
                  <span>{p.category || 'RETAIL'}</span>
                </div>

                <div style={{ fontSize: labelSize === '40x25' ? '7.5pt' : '9pt', fontWeight: 'bold', lineHeight: '1.1', margin: '2px 0' }}>
                  {p.name}
                </div>

                {showPrice && (
                  <div style={{ background: '#000', color: '#fff', padding: '1px 3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: labelSize === '40x25' ? '9pt' : '11pt', fontWeight: 'bold' }}>
                    <span style={{ fontSize: '6pt' }}>PRICE:</span>
                    <span>{p.price.toFixed(2)} QR</span>
                  </div>
                )}

                {showBarcode && (
                  <div style={{ textAlign: 'center', margin: '1px 0' }}>
                    <svg
                      ref={el => {
                        if (el) barcodeSvgRefs.current.set(item.uniqueKey + '_print', el);
                      }}
                      style={{ width: '100%', maxHeight: '20px' }}
                    />
                  </div>
                )}

                {showSku && (
                  <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '7pt', fontWeight: 'bold' }}>
                    {p.sku || p.id}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
export default BarcodeLabelsView;
