import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  Barcode as BarcodeIcon,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Product } from '../../types';
import { Language, translations } from '../../i18n';

declare global {
  interface Window {
    Quagga?: any;
    BarcodeDetector?: any;
  }
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  products?: Product[];
  lang?: Language;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onDetected,
  products = [],
  lang = 'en'
}) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual' | 'test'>('camera');
  const [manualCode, setManualCode] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [matchingProduct, setMatchingProduct] = useState<Product | null>(null);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const scanIntervalRef = React.useRef<any>(null);

  // Play synthetic scan beep using Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio beep error:', e);
    }
  };

  const handleSuccessfulCode = (rawCode: string) => {
    const clean = rawCode.trim();
    if (!clean) return;

    playBeep();
    setLastScanned(clean);

    // Look for matching product
    const found = products.find(p => 
      (p.sku && p.sku.toLowerCase() === clean.toLowerCase()) ||
      p.id.toLowerCase() === clean.toLowerCase() ||
      p.name.toLowerCase().includes(clean.toLowerCase())
    );
    setMatchingProduct(found || null);

    // Trigger parent callback
    onDetected(clean);
  };

  // Camera stream setup
  React.useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      // 1. Try Native BarcodeDetector + getUserMedia
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // If browser has BarcodeDetector API
        if ('BarcodeDetector' in window) {
          try {
            const formats = ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'];
            const barcodeDetector = new window.BarcodeDetector({ formats });

            scanIntervalRef.current = setInterval(async () => {
              if (videoRef.current && videoRef.current.readyState === 4) {
                try {
                  const barcodes = await barcodeDetector.detect(videoRef.current);
                  if (barcodes.length > 0) {
                    const code = barcodes[0].rawValue;
                    if (code) {
                      handleSuccessfulCode(code);
                    }
                  }
                } catch (e) {
                  // ignore frame detection errors
                }
              }
            }, 300);
            return;
          } catch (e) {
            console.warn('BarcodeDetector fallback to Quagga:', e);
          }
        }
      }

      // 2. Fallback to QuaggaJS if available
      if (window.Quagga) {
        window.Quagga.init(
          {
            inputStream: {
              name: 'Live',
              type: 'LiveStream',
              target: document.querySelector('#scannerViewport') as HTMLElement,
              constraints: { facingMode: 'environment' }
            },
            decoder: {
              readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_128_reader', 'code_39_reader']
            },
            locate: true
          },
          (err: any) => {
            if (err) {
              console.warn('Quagga camera error:', err);
              setCameraError(isAr ? 'تعذر فتح الكاميرا، يمكنك استخدام الأكواد التجريبية أو البحث اليدوي أدناه.' : 'Camera access not permitted. Use the Test Barcodes or Manual Code tab below.');
              return;
            }
            if (window.Quagga) {
              window.Quagga.start();
            }
          }
        );

        const onQuaggaDetected = (result: any) => {
          if (result?.codeResult?.code) {
            handleSuccessfulCode(result.codeResult.code);
          }
        };

        window.Quagga.onDetected(onQuaggaDetected);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(isAr ? 'الكاميرا غير متوفرة في هذا المتصفح. يمكنك اختيار باركود تجريبي بنقرة واحدة أدناه.' : 'Camera not available. You can test instant scanning below.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    try {
      if (window.Quagga) {
        window.Quagga.stop();
      }
    } catch (e) {}

    setIsScanning(false);
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode();

      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector();
        const detected = await barcodeDetector.detect(img);
        if (detected.length > 0) {
          handleSuccessfulCode(detected[0].rawValue);
          return;
        }
      }

      // Quagga image decode fallback
      if (window.Quagga) {
        window.Quagga.decodeSingle(
          {
            src: img.src,
            numOfWorkers: 0,
            decoder: { readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'code_128_reader'] }
          },
          (result: any) => {
            if (result && result.codeResult) {
              handleSuccessfulCode(result.codeResult.code);
            } else {
              alert(isAr ? 'لم يتم العثور على باركود واضح في الصورة.' : 'Could not detect barcode from image.');
            }
          }
        );
      } else {
        alert(isAr ? 'لم يتم اكتشاف باركود صالح.' : 'No clear barcode found.');
      }
    } catch (err) {
      console.error('File scan error:', err);
      alert('Error scanning uploaded image.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccessfulCode(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E21] bg-[#0F0F12]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#39FFB0]/15 text-[#39FFB0] flex items-center justify-center border border-[#39FFB0]/30 shadow-sm">
              <BarcodeIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#F5F5F4] flex items-center gap-2">
                <span>{t.scannerTitle}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#1E1E21] text-[#39FFB0]">LIVE</span>
              </h3>
              <p className="text-[11px] text-[#9C9DA3]">{t.scannerSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute scan beep' : 'Enable scan beep'}
              className="p-1.5 rounded-lg text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#1E1E21] transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#39FFB0]" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#1E1E21] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 px-5 py-2.5 bg-[#0A0A0B] border-b border-[#1E1E21] overflow-x-auto no-scrollbar">
          {[
            { id: 'camera', label: t.cameraTab, icon: Camera },
            { id: 'test', label: t.testCodesTab, icon: Zap },
            { id: 'manual', label: t.manualCodeTab, icon: Search },
            { id: 'upload', label: t.uploadPhotoTab, icon: Upload }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#1E1E21] text-[#39FFB0] border border-[#39FFB0]/40 shadow-sm'
                    : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Last Scanned Result Banner */}
          {lastScanned && (
            <div className="p-3 bg-[#39FFB0]/10 border border-[#39FFB0]/40 rounded-xl flex items-center justify-between animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#39FFB0] shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#39FFB0]">{t.scannedResult}:</span>
                    <span className="font-mono text-xs font-bold text-[#F5F5F4]">{lastScanned}</span>
                  </div>
                  {matchingProduct ? (
                    <p className="text-xs text-[#9C9DA3]">
                      {isAr ? 'تمت المطابقة:' : 'Matched:'} <span className="text-white font-medium">{matchingProduct.name}</span> • {isAr ? `${matchingProduct.price.toFixed(2)} ر.ق` : `QR ${matchingProduct.price.toFixed(2)}`} ({isAr ? 'المخزون:' : 'Stock:'} {matchingProduct.stock})
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#9C9DA3]">{isAr ? 'تم تمرير الكود بنجاح' : 'Code transmitted to active session'}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-[#39FFB0] text-[#04120C] text-xs font-bold rounded-lg hover:opacity-90 transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>{isAr ? 'تم' : 'Done'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* TAB 1: Live Camera Scanner */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div 
                id="scannerViewport" 
                className="w-full aspect-[4/3] bg-black rounded-xl overflow-hidden relative border border-[#1E1E21] flex items-center justify-center"
              >
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover" 
                />

                {/* Laser Targeting Overlay */}
                <div className="absolute inset-0 border-2 border-[#39FFB0]/20 rounded-xl pointer-events-none flex flex-col items-center justify-center p-6">
                  <div className="w-full h-36 border-2 border-dashed border-[#39FFB0] rounded-xl relative flex items-center justify-center bg-[#39FFB0]/5">
                    {/* Glowing scanning beam */}
                    <div className="w-full h-0.5 bg-[#39FFB0] shadow-[0_0_12px_#39FFB0] absolute animate-pulse"></div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#39FFB0] bg-black/80 px-2 py-0.5 rounded">
                      {t.alignBarcodePrompt}
                    </span>
                  </div>
                </div>
              </div>

              {cameraError ? (
                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-0.5">{isAr ? 'تنبيه الكاميرا' : 'Camera fallback activated'}</p>
                    <p className="text-[11px] text-amber-300/80">{cameraError}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('test')}
                        className="px-2.5 py-1 bg-amber-500 text-black font-bold rounded text-[11px] hover:bg-amber-400 transition cursor-pointer"
                      >
                        ⚡ {isAr ? 'استخدام باركود تجريبي فوراً' : 'Use One-Click Test Barcodes'}
                      </button>
                      <button
                        onClick={startCamera}
                        className="px-2.5 py-1 bg-[#1E1E21] text-[#F5F5F4] rounded text-[11px] hover:bg-[#2A2A30] transition flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{isAr ? 'إعادة المحاولة' : 'Retry Camera'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#9C9DA3] text-center">
                  {isAr 
                    ? 'وجّه الكاميرا نحو أي باركود (UPC / EAN / Code 128) أو رمز QR للمسح التلقائي.' 
                    : 'Point camera at any 1D barcode (UPC / EAN / Code 128) or 2D QR Code.'}
                </p>
              )}
            </div>
          )}

          {/* TAB 2: One-Click Test Simulation Barcodes */}
          {activeTab === 'test' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F5F5F4] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#39FFB0]" />
                  <span>{isAr ? 'انقر على أي باركود لمحاكاة المسح الفوري:' : 'Click Any Product Barcode to Simulate Instant Scan:'}</span>
                </span>
                <span className="text-[10px] text-[#9C9DA3] font-mono">{products.length} {isAr ? 'منتج متوفر' : 'products'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {products.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleSuccessfulCode(prod.sku || prod.id)}
                    className="p-2.5 bg-[#0F0F12] hover:bg-[#1E1E21] border border-[#1E1E21] hover:border-[#39FFB0] rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-[#F5F5F4] truncate group-hover:text-[#39FFB0] transition">
                        {prod.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-[#39FFB0] font-bold">
                          {prod.sku || prod.id}
                        </span>
                        <span className="text-[10px] text-[#9C9DA3]">
                          {isAr ? `${prod.price.toFixed(2)} ر.ق` : `QR ${prod.price.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-md bg-[#1E1E21] group-hover:bg-[#39FFB0] group-hover:text-black text-[#9C9DA3] flex items-center justify-center transition shrink-0">
                      <BarcodeIcon className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Manual SKU / Code Search */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9C9DA3] mb-1.5">
                    {isAr ? 'أدخل رمز الباركود، SKU، أو اسم المنتج' : 'Enter Barcode, SKU, or Product Code'}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <BarcodeIcon className={`w-4 h-4 absolute ${isAr ? 'right-3' : 'left-3'} top-3 text-[#5E5F64]`} />
                      <input
                        type="text"
                        autoFocus
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="e.g. ZST110DRY00181"
                        className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 bg-[#000000] border border-[#1E1E21] rounded-lg text-sm font-mono text-[#39FFB0] focus:outline-none focus:border-[#39FFB0]`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!manualCode.trim()}
                      className="px-4 py-2 bg-[#39FFB0] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-[#04120C] font-bold rounded-lg text-xs transition cursor-pointer"
                    >
                      {t.scanCode}
                    </button>
                  </div>
                </div>
              </form>

              {/* Instant matching preview */}
              {manualCode.trim() && (
                <div className="space-y-1.5 pt-2 border-t border-[#1E1E21]">
                  <p className="text-[11px] text-[#9C9DA3] font-semibold">{isAr ? 'المنتجات المطابقة في قاعدة البيانات:' : 'Matching Products in Database:'}</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {products
                      .filter(p => 
                        (p.sku && p.sku.toLowerCase().includes(manualCode.toLowerCase())) ||
                        p.name.toLowerCase().includes(manualCode.toLowerCase())
                      )
                      .slice(0, 5)
                      .map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => handleSuccessfulCode(p.sku || p.id)}
                          className="p-2 bg-[#0F0F12] border border-[#1E1E21] hover:border-[#39FFB0] rounded-lg flex items-center justify-between cursor-pointer transition"
                        >
                          <div>
                            <p className="text-xs font-semibold text-[#F5F5F4]">{p.name}</p>
                            <span className="font-mono text-[10px] text-[#39FFB0]">{p.sku}</span>
                          </div>
                          <span className="text-xs font-bold text-[#F5F5F4]">
                            {isAr ? `${p.price.toFixed(2)} ر.ق` : `QR ${p.price.toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Upload Image / Photo of Barcode */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[16/9] border-2 border-dashed border-[#1E1E21] hover:border-[#39FFB0] rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition bg-[#0F0F12] hover:bg-[#151517]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#1E1E21] text-[#39FFB0] flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[#F5F5F4]">{isAr ? 'انقر لرفع صورة الباركود' : 'Click to Upload Barcode Photo'}</p>
                <p className="text-xs text-[#9C9DA3] mt-1">{isAr ? 'يدعم صور JPEG, PNG, WEBP التي تحتوي على باركود أو QR' : 'Supports JPEG, PNG, WEBP containing 1D Barcode or QR Code'}</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1E1E21] bg-[#0F0F12] flex items-center justify-between text-xs text-[#9C9DA3]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#39FFB0] animate-pulse"></span>
            <span>{isAr ? 'محرك المسح المباشر نشط' : 'Auto-detect engine active'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1E1E21] hover:bg-[#2A2A30] text-[#F5F5F4] rounded-lg transition cursor-pointer font-medium"
          >
            {t.closeScanner}
          </button>
        </div>

      </div>
    </div>
  );
};
