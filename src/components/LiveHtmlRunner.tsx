import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Code2, 
  Eye, 
  Terminal as TerminalIcon, 
  PlusCircle, 
  Trash2
} from 'lucide-react';
import { HTML_TEMPLATES } from '../data/templates';

interface LogEntry {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'network';
  message: string;
  timestamp: string;
}

export const LiveHtmlRunner: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('contact-form');
  const [code, setCode] = useState<string>(HTML_TEMPLATES[0].html);
  const [copied, setCopied] = useState<boolean>(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activePane, setActivePane] = useState<'both' | 'code' | 'preview'>('both');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load selected template
  const handleSelectTemplate = (templateId: string) => {
    const found = HTML_TEMPLATES.find(t => t.id === templateId);
    if (found) {
      setSelectedTemplate(templateId);
      setCode(found.html);
      setLogs([]);
      setIframeKey(prev => prev + 1);
    }
  };

  // Run code & refresh iframe
  const handleRun = () => {
    setIframeKey(prev => prev + 1);
    addLog('info', 'Executing live HTML bundle with backend connectivity...');
  };

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [
      {
        id: Math.random().toString(),
        type,
        message,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev.slice(0, 49)
    ]);
  };

  // Listen to messages from iframe
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'html-sandbox-runner') {
        addLog(event.data.type || 'log', event.data.message);
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  // Enhanced sandbox HTML with console logger proxy
  const processedHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <script>
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;

          console.log = function(...args) {
            originalLog.apply(console, args);
            window.parent.postMessage({
              source: 'html-sandbox-runner',
              type: 'log',
              message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
            }, '*');
          };

          console.error = function(...args) {
            originalError.apply(console, args);
            window.parent.postMessage({
              source: 'html-sandbox-runner',
              type: 'error',
              message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
            }, '*');
          };

          console.warn = function(...args) {
            originalWarn.apply(console, args);
            window.parent.postMessage({
              source: 'html-sandbox-runner',
              type: 'warn',
              message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
            }, '*');
          };
        </script>
      </head>
      <body>
        ${code}
      </body>
    </html>
  `;

  // Copy code
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Download HTML file
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Inject backend helper snippet
  const injectBackendSnippet = () => {
    const snippet = `
<!-- 🚀 Quick Backend Fetch Sample -->
<script>
  async function callMyBackend() {
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: 'New entry from HTML ' + new Date().toLocaleTimeString(),
          category: 'Custom Input'
        })
      });
      const data = await response.json();
      console.log('Backend response:', data);
      alert('Saved to backend: ' + JSON.stringify(data));
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }
</script>
<div style="margin-top: 20px; text-align: center;">
  <button onclick="callMyBackend()" style="padding: 10px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
    ⚡ Test Live Backend Call
  </button>
</div>
`;
    setCode(prev => prev + snippet);
    addLog('info', 'Injected backend fetch sample snippet at end of code.');
    setIframeKey(k => k + 1);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-[#0F0F12] border border-[#1F1F23] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1A1A1E] text-emerald-400 border border-[#2D2D33] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Connected to Express API (/api/*)
              </span>
              <span className="text-xs text-[#71717A]">Zero CORS Configuration</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#EDEDED] tracking-tight">
              Live HTML Sandbox & Backend Runner
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl">
              Paste your HTML/CSS/JS below. It runs live in the browser and connects directly to your live Express backend routes like <code className="text-indigo-400 font-mono">/api/submit-form</code> or <code className="text-indigo-400 font-mono">/api/items</code>.
            </p>
          </div>

          {/* Template Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#71717A] font-medium">Template:</span>
            {HTML_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition cursor-pointer ${
                  selectedTemplate === t.id
                    ? 'bg-[#1A1A1E] text-[#EDEDED] border-[#3F3F46] shadow-sm'
                    : 'bg-[#0A0A0B] text-[#71717A] border-[#1F1F23] hover:text-[#EDEDED] hover:bg-[#16161A]'
                }`}
              >
                {t.name.split('&')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor & Preview Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F0F12] border border-[#1F1F23] p-3 rounded-xl">
        
        {/* Left: View Modes */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0A0A0B] p-1 rounded-lg border border-[#1F1F23]">
            <button
              onClick={() => setActivePane('both')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                activePane === 'both' ? 'bg-[#1A1A1E] text-[#EDEDED] border border-[#3F3F46]' : 'text-[#71717A] hover:text-[#EDEDED]'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setActivePane('code')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                activePane === 'code' ? 'bg-[#1A1A1E] text-[#EDEDED] border border-[#3F3F46]' : 'text-[#71717A] hover:text-[#EDEDED]'
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setActivePane('preview')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                activePane === 'preview' ? 'bg-[#1A1A1E] text-[#EDEDED] border border-[#3F3F46]' : 'text-[#71717A] hover:text-[#EDEDED]'
              }`}
            >
              Preview
            </button>
          </div>

          <button
            onClick={injectBackendSnippet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1A1A1E] text-indigo-400 border border-[#2D2D33] hover:border-indigo-500/50 transition cursor-pointer"
            title="Inject fetch call to Express backend"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Inject Backend Fetch</span>
          </button>
        </div>

        {/* Right: Device Viewport & Run */}
        <div className="flex items-center gap-2">
          
          {/* Responsive device switch */}
          <div className="hidden sm:flex items-center bg-[#0A0A0B] p-1 rounded-lg border border-[#1F1F23]">
            <button
              onClick={() => setDeviceView('desktop')}
              className={`p-1.5 rounded transition ${
                deviceView === 'desktop' ? 'bg-[#1A1A1E] text-[#EDEDED]' : 'text-[#71717A] hover:text-[#EDEDED]'
              }`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceView('tablet')}
              className={`p-1.5 rounded transition ${
                deviceView === 'tablet' ? 'bg-[#1A1A1E] text-[#EDEDED]' : 'text-[#71717A] hover:text-[#EDEDED]'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceView('mobile')}
              className={`p-1.5 rounded transition ${
                deviceView === 'mobile' ? 'bg-[#1A1A1E] text-[#EDEDED]' : 'text-[#71717A] hover:text-[#EDEDED]'
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1.5 text-[#71717A] hover:text-[#EDEDED] bg-[#0A0A0B] border border-[#1F1F23] rounded-lg hover:bg-[#16161A] transition"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-1.5 text-[#71717A] hover:text-[#EDEDED] bg-[#0A0A0B] border border-[#1F1F23] rounded-lg hover:bg-[#16161A] transition"
            title="Download index.html"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Run Button */}
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-md text-xs font-semibold transition shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run / Refresh</span>
          </button>
        </div>

      </div>

      {/* Main Workspace (Code Editor + Iframe Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left: Code Editor */}
        {(activePane === 'both' || activePane === 'code') && (
          <div className={`bg-[#0A0A0B] border border-[#1F1F23] rounded-xl overflow-hidden flex flex-col ${
            activePane === 'code' ? 'lg:col-span-2' : ''
          }`} style={{ minHeight: '520px', height: '620px' }}>
            
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F0F12] border-b border-[#1F1F23] text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]"></div>
                </div>
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-[#EDEDED] font-mono">index.html</span>
              </div>
              <span className="text-[11px] text-[#71717A] font-mono">
                {code.split('\n').length} lines • {new Blob([code]).size} bytes
              </span>
            </div>

            <div className="flex-1 relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full h-full p-4 bg-[#0A0A0B] text-[#EDEDED] font-mono text-xs sm:text-[13px] leading-relaxed resize-none focus:outline-none selection:bg-indigo-600/30"
                placeholder="<!-- Paste your HTML here -->"
              />
            </div>

            <div className="px-4 py-2 bg-[#0F0F12] border-t border-[#1F1F23] text-[11px] text-[#71717A] flex items-center justify-between">
              <span>Use <code className="text-indigo-400">fetch('/api/...')</code> in your script tag to communicate with backend.</span>
              <button
                onClick={() => setCode('')}
                className="text-[#71717A] hover:text-rose-400 transition"
              >
                Clear
              </button>
            </div>

          </div>
        )}

        {/* Right: Live Preview & Debug Console */}
        {(activePane === 'both' || activePane === 'preview') && (
          <div className={`bg-[#0A0A0B] border border-[#1F1F23] rounded-xl overflow-hidden flex flex-col ${
            activePane === 'preview' ? 'lg:col-span-2' : ''
          }`} style={{ minHeight: '520px', height: '620px' }}>
            
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F0F12] border-b border-[#1F1F23] text-xs">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-[#EDEDED]">Live App Preview (Sandboxed)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#1A1A1E] text-[#A1A1AA] border border-[#2D2D33] font-mono">
                  {deviceView === 'desktop' ? '100% Width' : deviceView === 'tablet' ? '768px' : '375px'}
                </span>
                <button
                  onClick={() => setIframeKey(k => k + 1)}
                  className="p-1 text-[#71717A] hover:text-[#EDEDED] rounded"
                  title="Reload Iframe"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Iframe Viewport Container */}
            <div className="flex-1 bg-[#0A0A0B] p-2 overflow-auto flex justify-center items-start">
              <div 
                className="h-full bg-[#0A0A0B] border border-[#1F1F23] rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
                style={{
                  width: deviceView === 'desktop' ? '100%' : deviceView === 'tablet' ? '768px' : '375px',
                  height: '100%'
                }}
              >
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  srcDoc={processedHtml}
                  title="Live Sandbox Preview"
                  sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                  className="w-full h-full border-0 bg-[#0A0A0B]"
                />
              </div>
            </div>

            {/* Debug / Console Logs Drawer */}
            <div className="border-t border-[#1F1F23] bg-[#16161A] max-h-36 overflow-y-auto p-2.5 font-mono text-[11px]">
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#2D2D33] text-[#71717A]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#3F3F46]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#3F3F46]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#3F3F46]"></div>
                  </div>
                  <TerminalIcon className="w-3.5 h-3.5 text-indigo-400 ml-1" />
                  <span className="font-semibold text-[#EDEDED]">Terminal Events ({logs.length})</span>
                </div>
                {logs.length > 0 && (
                  <button
                    onClick={() => setLogs([])}
                    className="text-[10px] text-[#71717A] hover:text-rose-400 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <p className="text-[#52525B] italic py-1">Console logs and fetch events from your HTML will appear here...</p>
              ) : (
                <div className="space-y-1">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-start gap-2 leading-tight">
                      <span className="text-[#52525B] select-none text-[10px]">{log.timestamp}</span>
                      <span className={`px-1 rounded text-[9px] font-bold uppercase ${
                        log.type === 'error' ? 'bg-rose-500/20 text-rose-300' :
                        log.type === 'warn' ? 'bg-amber-500/20 text-amber-300' :
                        log.type === 'info' ? 'bg-indigo-500/20 text-indigo-300' :
                        'bg-[#1A1A1E] text-[#A1A1AA]'
                      }`}>
                        {log.type}
                      </span>
                      <span className={`break-all ${
                        log.type === 'error' ? 'text-rose-300' :
                        log.type === 'warn' ? 'text-amber-200' :
                        'text-[#EDEDED]'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
