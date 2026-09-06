import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  CheckCircle2, 
  Code2,
  Cpu
} from 'lucide-react';

interface DirectAssistantHelperProps {
  onLoadIntoRunner: (html: string) => void;
}

export const DirectAssistantHelper: React.FC<DirectAssistantHelperProps> = ({
  onLoadIntoRunner
}) => {
  const [userHtml, setUserHtml] = useState<string>('');
  const [backendFeatures, setBackendFeatures] = useState<string[]>([
    'Database Storage (Save & Query Records)',
    'Form Submission API'
  ]);
  const [customRequirement, setCustomRequirement] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const availableFeatures = [
    'Database Storage (Save & Query Records)',
    'Form Submission API',
    'User Sign-In & Authentication',
    'AI / Gemini Smart Assistant API',
    'Payment / Checkout Flow',
    'Email Notification Trigger',
    'PostgreSQL / SQL Relational Schema'
  ];

  const toggleFeature = (feature: string) => {
    if (backendFeatures.includes(feature)) {
      setBackendFeatures(backendFeatures.filter(f => f !== feature));
    } else {
      setBackendFeatures([...backendFeatures, feature]);
    }
  };

  const generatePrompt = () => {
    return `Here is the HTML code for my app:

\`\`\`html
${userHtml.trim() || '<!-- Paste your HTML here -->'}
\`\`\`

Please convert this HTML into a complete fullstack application in this project with:
${backendFeatures.map(f => `- ${f}`).join('\n')}
${customRequirement ? `- Custom note: ${customRequirement}` : ''}

Please create the necessary Express API backend routes in /server/routes.ts, connect the frontend fetch calls to these endpoints, and make it completely interactive and live!`;
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatePrompt());
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Banner */}
      <div className="bg-[#0F0F12] border border-[#1F1F23] rounded-xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1A1A1E] text-indigo-400 border border-[#2D2D33] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Direct Conversion Assistant
          </span>
          <span className="text-xs text-[#71717A]">AI Fullstack Pipeline</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#EDEDED] tracking-tight">
          Convert Your HTML into a Live Fullstack App
        </h2>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl">
          Paste your HTML code below to test it immediately in the live runner or generate a structured prompt for this AI engineer to build the backend for you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 bg-[#0A0A0B] border border-[#1F1F23] rounded-xl p-5 space-y-4">
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#71717A] mb-1.5">
              1. Paste HTML Code
            </label>
            <textarea
              rows={7}
              value={userHtml}
              onChange={(e) => setUserHtml(e.target.value)}
              placeholder="<div class='card'><h1>My App</h1><button>Submit</button></div>"
              className="w-full p-3 bg-[#0F0F12] border border-[#1F1F23] rounded-lg font-mono text-xs text-[#EDEDED] focus:outline-none focus:border-indigo-500 transition leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#71717A] mb-2">
              2. Select Backend Capabilities
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableFeatures.map(feat => {
                const active = backendFeatures.includes(feat);
                return (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => toggleFeature(feat)}
                    className={`p-2.5 rounded-lg border text-left text-xs font-medium transition cursor-pointer flex items-center justify-between gap-2 ${
                      active
                        ? 'bg-[#1A1A1E] border-[#3F3F46] text-[#EDEDED] font-semibold'
                        : 'bg-[#0F0F12] text-[#71717A] border-[#1F1F23] hover:text-[#EDEDED] hover:bg-[#16161A]'
                    }`}
                  >
                    <span>{feat}</span>
                    {active ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-[#2D2D33] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#71717A] mb-1.5">
              3. Extra Requirements (Optional)
            </label>
            <input
              type="text"
              value={customRequirement}
              onChange={(e) => setCustomRequirement(e.target.value)}
              placeholder="e.g. Email confirmation, export CSV, admin panel"
              className="w-full px-3 py-2 bg-[#0F0F12] border border-[#1F1F23] rounded-md text-xs text-[#EDEDED] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {userHtml.trim() && (
              <button
                type="button"
                onClick={() => onLoadIntoRunner(userHtml)}
                className="w-full sm:w-auto px-4 py-2 bg-[#1A1A1E] hover:bg-[#2D2D33] text-[#EDEDED] rounded-md text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer border border-[#2D2D33]"
              >
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>Load in Live Runner</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyPrompt}
              className="w-full sm:flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {copiedPrompt ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPrompt ? 'Prompt Copied to Clipboard!' : 'Copy AI Prompt to Chat'}</span>
            </button>
          </div>

        </div>

        {/* Right Preview of Prompt: 5 cols */}
        <div className="lg:col-span-5 bg-[#0A0A0B] border border-[#1F1F23] rounded-xl p-5 flex flex-col justify-between space-y-4">
          
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1F1F23]">
              <span className="text-xs font-semibold text-[#EDEDED] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" /> Generated AI Prompt
              </span>
              <span className="text-[11px] text-[#71717A]">Ready to send</span>
            </div>

            <pre className="p-3 bg-[#16161A] rounded-lg font-mono text-[11px] text-indigo-300 overflow-y-auto max-h-72 leading-relaxed whitespace-pre-wrap border border-[#1F1F23]">
              {generatePrompt()}
            </pre>
          </div>

          <div className="p-3.5 bg-indigo-600/5 border border-indigo-500/20 rounded-lg text-xs text-[#EDEDED] space-y-1">
            <p className="font-semibold text-indigo-400 text-xs">Direct Conversion</p>
            <p className="text-[11px] text-[#A1A1AA]">
              Paste your HTML into the chat. I will build and wire the Express API backend routes, connect database models, and verify the build for you.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
