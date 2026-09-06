import React, { useState } from 'react';
import { 
  Send, 
  Copy, 
  Check, 
  Clock, 
  Code, 
  Activity,
  RefreshCw
} from 'lucide-react';
import { BackendEndpoint } from '../types';

const ENDPOINTS: BackendEndpoint[] = [
  {
    path: '/api/health',
    method: 'GET',
    name: 'Health Check & Server Status',
    category: 'System',
    description: 'Returns server status, uptime, node version, environment, and registered endpoint catalog.'
  },
  {
    path: '/api/items',
    method: 'GET',
    name: 'Get All Data Items',
    category: 'Data',
    description: 'Retrieves stored records from the backend database with optional ?search= or ?category= filter params.',
    defaultParams: { category: '', search: '' }
  },
  {
    path: '/api/items',
    method: 'POST',
    name: 'Create New Record',
    category: 'Data',
    description: 'Stores a new record with custom metadata in the backend memory database.',
    defaultPayload: {
      title: 'New Customer Lead #204',
      category: 'Sales',
      data: { budget: 5000, company: 'Acme Corp', priority: 'High' }
    }
  },
  {
    path: '/api/submit-form',
    method: 'POST',
    name: 'Process Form Submission',
    category: 'Forms',
    description: 'Common endpoint for contact forms, newsletter signups, inquiries, and customer feedback.',
    defaultPayload: {
      name: 'Sarah Connor',
      email: 'sarah@skynet-defense.org',
      subject: 'Inquiry about cloud API deployment',
      message: 'Can this express backend run on Google Cloud Run and handle 10k requests/min?'
    }
  },
  {
    path: '/api/auth/demo',
    method: 'POST',
    name: 'User Authentication / Login',
    category: 'Auth',
    description: 'Validates user credentials, returns signed JWT token, profile info and role claims.',
    defaultPayload: {
      username: 'admin_user',
      password: 'mypassword123'
    }
  },
  {
    path: '/api/echo',
    method: 'POST',
    name: 'Request Inspector & Echo',
    category: 'Utility',
    description: 'Echoes back full request structure: headers, body payload, query parameters, IP, and timestamp.',
    defaultPayload: {
      clientApp: 'HTML5 Frontend App',
      customHeaderCheck: true,
      timestamp: new Date().toISOString()
    }
  }
];

export const BackendInspector: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<BackendEndpoint>(ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState<string>(
    ENDPOINTS[0].defaultPayload ? JSON.stringify(ENDPOINTS[0].defaultPayload, null, 2) : ''
  );
  const [queryParams, setQueryParams] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedFetch, setCopiedFetch] = useState<boolean>(false);

  // Switch endpoint
  const handleSelectEndpoint = (ep: BackendEndpoint) => {
    setSelectedEndpoint(ep);
    setRequestBody(ep.defaultPayload ? JSON.stringify(ep.defaultPayload, null, 2) : '');
    setQueryParams('');
    setResponse(null);
    setResponseStatus(null);
  };

  // Execute request
  const handleSend = async () => {
    setLoading(true);
    const startTime = performance.now();
    
    try {
      const fullUrl = selectedEndpoint.path + (queryParams ? `?${queryParams}` : '');
      const options: RequestInit = {
        method: selectedEndpoint.method === 'ALL' ? 'POST' : selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (['POST', 'PUT', 'PATCH', 'ALL'].includes(selectedEndpoint.method) && requestBody.trim()) {
        try {
          JSON.parse(requestBody);
          options.body = requestBody;
        } catch (e) {
          alert('Invalid JSON in request body');
          setLoading(false);
          return;
        }
      }

      const res = await fetch(fullUrl, options);
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setResponseStatus(res.status);

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setResponseStatus(500);
      setResponse({ error: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  // Generate cURL command
  const getCurlCommand = () => {
    const fullUrl = `http://localhost:3000${selectedEndpoint.path}${queryParams ? `?${queryParams}` : ''}`;
    let curl = `curl -X ${selectedEndpoint.method === 'ALL' ? 'POST' : selectedEndpoint.method} "${fullUrl}"`;
    if (['POST', 'PUT', 'PATCH', 'ALL'].includes(selectedEndpoint.method) && requestBody.trim()) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody.replace(/\n/g, '')}'`;
    }
    return curl;
  };

  // Generate JS Fetch snippet
  const getFetchSnippet = () => {
    const fullUrl = `${selectedEndpoint.path}${queryParams ? `?${queryParams}` : ''}`;
    if (selectedEndpoint.method === 'GET') {
      return `const response = await fetch('${fullUrl}');\nconst data = await response.json();\nconsole.log(data);`;
    }
    return `const response = await fetch('${fullUrl}', {\n  method: '${selectedEndpoint.method === 'ALL' ? 'POST' : selectedEndpoint.method}',\n  headers: {\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify(${requestBody || '{}'})\n});\nconst data = await response.json();\nconsole.log(data);`;
  };

  const copyToClipboard = async (text: string, type: 'curl' | 'fetch') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'curl') {
        setCopiedCurl(true);
        setTimeout(() => setCopiedCurl(false), 2000);
      } else {
        setCopiedFetch(true);
        setTimeout(() => setCopiedFetch(false), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Intro Box */}
      <div className="bg-[#0F0F12] border border-[#1F1F23] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1A1A1E] text-indigo-400 border border-[#2D2D33]">
                Express.js on Port 3000
              </span>
              <span className="text-xs text-[#71717A]">Live REST Endpoints</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#EDEDED] tracking-tight">
              Backend API Explorer & Test Bench
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl">
              Inspect real routes running on the server, execute requests with custom payloads, and copy clean <code className="text-indigo-400 font-mono">fetch()</code> snippets for your HTML frontend.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-md text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Send Request</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Endpoint Selector List (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-[10px] uppercase tracking-widest text-[#71717A] font-bold px-1 mb-2">
            API Endpoints ({ENDPOINTS.length})
          </h3>

          <div className="space-y-1.5">
            {ENDPOINTS.map((ep, idx) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.name === ep.name;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-lg border transition cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-[#1A1A1E] border-[#3F3F46] shadow-sm'
                      : 'bg-[#0F0F12] border-[#1F1F23] hover:bg-[#16161A] hover:border-[#2D2D33]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                        ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        ep.method === 'POST' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {ep.method}
                      </span>
                      <span className="text-xs font-semibold text-[#EDEDED] font-mono">{ep.path}</span>
                    </div>
                    <span className="text-[10px] text-[#71717A] uppercase tracking-wider">{ep.category}</span>
                  </div>
                  <p className="text-xs text-[#EDEDED] font-medium">{ep.name}</p>
                  <p className="text-[11px] text-[#71717A] line-clamp-2 leading-relaxed">{ep.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Request & Response Inspector (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Request Header Bar */}
          <div className="bg-[#0A0A0B] border border-[#1F1F23] rounded-xl p-4 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1F1F23]">
              <div className="flex items-center gap-2.5">
                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                  selectedEndpoint.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  selectedEndpoint.method === 'POST' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {selectedEndpoint.method}
                </span>
                <span className="text-sm sm:text-base font-bold text-[#EDEDED] font-mono">
                  {selectedEndpoint.path}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(getCurlCommand(), 'curl')}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#1A1A1E] hover:bg-[#2D2D33] border border-[#2D2D33] rounded text-[11px] text-[#A1A1AA] hover:text-[#EDEDED] transition cursor-pointer"
                  title="Copy cURL Command"
                >
                  {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>cURL</span>
                </button>

                <button
                  onClick={() => copyToClipboard(getFetchSnippet(), 'fetch')}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#1A1A1E] hover:bg-[#2D2D33] border border-[#2D2D33] rounded text-[11px] text-[#A1A1AA] hover:text-[#EDEDED] transition cursor-pointer"
                  title="Copy JS fetch snippet"
                >
                  {copiedFetch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5" />}
                  <span>JS fetch()</span>
                </button>
              </div>
            </div>

            {/* Query parameters for GET requests */}
            {selectedEndpoint.method === 'GET' && (
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1">
                  Query Parameters (e.g. <code className="text-indigo-400">search=lead</code>)
                </label>
                <input
                  type="text"
                  value={queryParams}
                  onChange={(e) => setQueryParams(e.target.value)}
                  placeholder="search=feedback"
                  className="w-full px-3 py-2 bg-[#0F0F12] border border-[#1F1F23] rounded-md text-xs font-mono text-[#EDEDED] focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* JSON Body Editor for POST/PUT */}
            {['POST', 'PUT', 'PATCH', 'ALL'].includes(selectedEndpoint.method) && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#EDEDED]">Request Body (JSON)</label>
                  <span className="text-[11px] text-[#71717A] font-mono">application/json</span>
                </div>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows={5}
                  spellCheck={false}
                  className="w-full p-3 bg-[#0F0F12] border border-[#1F1F23] rounded-lg font-mono text-xs text-[#EDEDED] focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                />
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={loading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-md text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Execute {selectedEndpoint.method} {selectedEndpoint.path}</span>
            </button>

          </div>

          {/* Response Viewer Panel */}
          <div className="bg-[#0A0A0B] border border-[#1F1F23] rounded-xl overflow-hidden">
            
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F0F12] border-b border-[#1F1F23]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 mr-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3F3F46]"></div>
                </div>
                <span className="text-xs font-semibold text-[#EDEDED]">Response Terminal</span>
                {responseStatus !== null && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    HTTP {responseStatus}
                  </span>
                )}
              </div>

              {latency !== null && (
                <div className="flex items-center gap-1 text-[11px] text-[#71717A] font-mono">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{latency} ms</span>
                </div>
              )}
            </div>

            <div className="p-4">
              {response === null ? (
                <div className="py-10 text-center text-[#52525B] space-y-2">
                  <Activity className="w-7 h-7 mx-auto text-[#3F3F46]" />
                  <p className="text-xs">Click "Execute" or "Send Request" to trigger this endpoint</p>
                </div>
              ) : (
                <pre className="p-4 bg-[#16161A] rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-80 leading-relaxed border border-[#1F1F23]">
                  {JSON.stringify(response, null, 2)}
                </pre>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
