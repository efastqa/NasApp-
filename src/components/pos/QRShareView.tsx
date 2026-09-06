import React, { useEffect, useRef, useState } from 'react';
import { QrCode, Copy, Check, ExternalLink, Smartphone } from 'lucide-react';

declare global {
  interface Window {
    QRCode?: any;
  }
}

interface QRShareViewProps {
  onOpenCustomerMode: () => void;
}

export const QRShareView: React.FC<QRShareViewProps> = ({
  onOpenCustomerMode
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const customerLink = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?customer=1`
    : 'https://nasapp.pos?customer=1';

  useEffect(() => {
    if (!qrRef.current) return;
    qrRef.current.innerHTML = '';

    if (window.QRCode) {
      try {
        new window.QRCode(qrRef.current, {
          text: customerLink,
          width: 180,
          height: 180,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.H
        });
      } catch (e) {
        console.error('QR generation error:', e);
      }
    }
  }, [customerLink]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(customerLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="pb-2 border-b border-[#1E1E21]">
        <h2 className="font-display font-semibold text-2xl text-[#F5F5F4]">Customer Self-Order & QR Code</h2>
        <p className="text-xs text-[#9C9DA3] mt-0.5">Let customers scan your QR code to browse products and place WhatsApp orders.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left: QR Code Box */}
        <div className="md:col-span-5 bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="p-3 bg-white rounded-2xl shadow-xl inline-block">
            <div ref={qrRef} id="qrCanvas" className="flex items-center justify-center" />
          </div>
          <p className="text-xs text-[#5E5F64] max-w-xs leading-relaxed">
            Customers can point any smartphone camera at this code to view the live online store.
          </p>
        </div>

        {/* Right: Link & Workflow */}
        <div className="md:col-span-7 bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-6 space-y-5 flex flex-col justify-between">
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-[#5E5F64] mb-1.5">
                Direct Customer Web Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={customerLink}
                  className="flex-1 px-3 py-2 bg-[#000000] border border-[#1E1E21] rounded-lg font-mono text-xs text-[#39FFB0] focus:outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] text-xs font-semibold text-[#F5F5F4] rounded-lg transition cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-[#39FFB0]" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* 4-Step Instructions */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-3 text-xs text-[#9C9DA3]">
                <span className="w-5 h-5 rounded-full bg-[#39FFB0]/15 text-[#39FFB0] font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span>Print or display this QR code on store counters, flyers, or social media bio links.</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-[#9C9DA3]">
                <span className="w-5 h-5 rounded-full bg-[#39FFB0]/15 text-[#39FFB0] font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span>Customers browse your real-time catalogue without installing any app.</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-[#9C9DA3]">
                <span className="w-5 h-5 rounded-full bg-[#39FFB0]/15 text-[#39FFB0] font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span>When they tap "Send Order", the backend registers a new order and opens WhatsApp.</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-[#9C9DA3]">
                <span className="w-5 h-5 rounded-full bg-[#39FFB0]/15 text-[#39FFB0] font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                  4
                </span>
                <span>Manage order stages (Confirm → Prepare → Ready → Completed) directly in your Orders tab.</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1E1E21] flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCustomerMode}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#39FFB0] hover:opacity-90 text-[#04120C] font-bold rounded-lg text-xs transition cursor-pointer shadow-md"
            >
              <Smartphone className="w-4 h-4" />
              <span>Preview Customer View</span>
            </button>
            <a
              href={customerLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#9C9DA3] hover:text-[#F5F5F4] transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in new tab</span>
            </a>
          </div>

        </div>

      </div>

    </div>
  );
};
