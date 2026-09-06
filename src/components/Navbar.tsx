import React from 'react';
import { 
  Terminal, 
  Layers, 
  Database, 
  BookOpen, 
  Sparkles, 
  Code2
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  serverOnline: boolean;
  serverLatency: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  serverOnline,
  serverLatency
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0F0F12] border-b border-[#1F1F23]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-600/30">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base sm:text-lg text-[#EDEDED] tracking-tight">
                DeployFlow <span className="text-[#71717A] font-normal text-xs ml-1">v2.4</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-medium tracking-wide bg-[#1A1A1E] text-[#A1A1AA] border border-[#2D2D33] rounded">
                Fullstack Engine
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#0A0A0B] p-1 rounded-lg border border-[#1F1F23]">
            <button
              onClick={() => setActiveTab('runner')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'runner'
                  ? 'bg-[#1A1A1E] text-[#EDEDED] border border-[#3F3F46] shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#16161A]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Live HTML Runner</span>
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'api'
                  ? 'bg-[#1A1A1E] text-[#EDEDED] border border-[#3F3F46] shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#16161A]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Backend API</span>
            </button>

            <button
              onClick={() => setActiveTab('db')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'db'
                  ? 'bg-[#1A1A1E] text-[#EDEDED] border border-[#3F3F46] shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#16161A]'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Database</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-[#1A1A1E] text-[#EDEDED] border border-[#3F3F46] shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#16161A]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Make It Live Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeTab === 'assistant'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Convert My HTML</span>
            </button>
          </nav>

          {/* Live Status Indicator & Go Live Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#1A1A1E] border border-[#2D2D33] rounded-full text-xs">
              <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className={`${serverOnline ? 'text-emerald-400' : 'text-amber-400'} font-medium text-[11px]`}>
                {serverOnline ? 'Engine Online' : 'Reconnecting...'}
              </span>
              {serverLatency !== null && (
                <span className="text-[10px] text-[#71717A] font-mono pl-1 border-l border-[#2D2D33]">
                  {serverLatency}ms
                </span>
              )}
            </div>

            <button
              onClick={() => setActiveTab('guide')}
              className="bg-[#EDEDED] hover:bg-white text-[#0A0A0B] px-3.5 py-1.5 rounded-md text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              Go Live
            </button>
          </div>

        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1.5 border-t border-[#1F1F23] no-scrollbar">
          {[
            { id: 'runner', label: 'HTML Runner', icon: Terminal },
            { id: 'api', label: 'Backend API', icon: Layers },
            { id: 'db', label: 'Database', icon: Database },
            { id: 'guide', label: 'Deploy Guide', icon: BookOpen },
            { id: 'assistant', label: 'Convert HTML', icon: Sparkles },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-[#1A1A1E] text-[#EDEDED] border border-[#3F3F46] font-medium'
                    : 'text-[#71717A] hover:text-[#EDEDED] bg-[#0F0F12] border border-[#1F1F23]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
