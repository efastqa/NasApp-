import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Server, 
  Globe, 
  Database, 
  Code2,
  Cpu
} from 'lucide-react';

export const StepByStepGuide: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copySnippet = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const steps = [
    {
      id: 1,
      title: '1. Connecting HTML to Backend via fetch()',
      subtitle: 'Use standard JavaScript fetch() inside your HTML <script> tags',
      icon: Code2,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-[#A1A1AA]">
          <p>
            In plain HTML, connect to your backend using the browser's built-in <code className="text-indigo-400 font-mono">window.fetch()</code> API. When frontend and backend are hosted together on the same domain (like in this project), use relative paths like <code className="text-indigo-400 font-mono">/api/your-endpoint</code>.
          </p>

          <div className="bg-[#0A0A0B] border border-[#1F1F23] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#0F0F12] border-b border-[#1F1F23]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#3F3F46]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#3F3F46]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#3F3F46]"></div>
                </div>
                <span className="font-mono text-xs text-[#EDEDED]">frontend-fetch.html</span>
              </div>
              <button
                onClick={() => copySnippet('fetch-ex', `// 1. Submit Form Data to Backend API
async function submitData(formData) {
  try {
    const response = await fetch('/api/submit-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    if (response.ok && result.success) {
      console.log('Saved to backend:', result);
    } else {
      console.error('Backend returned error:', result.error);
    }
  } catch (networkError) {
    console.error('Network request failed:', networkError);
  }
}`)}
                className="flex items-center gap-1 text-[11px] text-[#71717A] hover:text-[#EDEDED]"
              >
                {copiedId === 'fetch-ex' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-4 font-mono text-xs text-[#EDEDED] overflow-x-auto leading-relaxed bg-[#16161A]">
{`// 1. Submit Form Data to Backend API
async function submitData(formData) {
  try {
    const response = await fetch('/api/submit-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    if (response.ok && result.success) {
      console.log('Saved to backend:', result);
    } else {
      console.error('Backend returned error:', result.error);
    }
  } catch (networkError) {
    console.error('Network request failed:', networkError);
  }
}`}
            </pre>
          </div>

          <div className="p-4 bg-[#1A1A1E]/50 border border-[#2D2D33] rounded-xl space-y-1">
            <p className="font-bold text-[#EDEDED] text-xs">💡 Why Relative URLs (/api/*) are best:</p>
            <p className="text-[#71717A] text-xs">
              Using relative paths like <code className="text-[#A1A1AA] font-mono">/api/items</code> eliminates CORS (Cross-Origin Resource Sharing) headaches because both frontend HTML and backend Express routes are served on the same domain and port in production!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '2. Setting Up the Express.js Backend',
      subtitle: 'Create routes to handle requests, parse JSON bodies, and send responses',
      icon: Server,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-[#A1A1AA]">
          <p>
            The backend server runs with <strong>Node.js and Express</strong>. It listens for incoming HTTP requests (GET, POST, PUT, DELETE), validates input data, interacts with databases or external APIs, and returns JSON.
          </p>

          <div className="bg-[#0A0A0B] border border-[#1F1F23] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#0F0F12] border-b border-[#1F1F23]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#3F3F46]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#3F3F46]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#3F3F46]"></div>
                </div>
                <span className="font-mono text-xs text-[#EDEDED]">server/routes.ts</span>
              </div>
              <button
                onClick={() => copySnippet('server-ex', `import { Router } from 'express';

export const apiRouter = Router();

// Handle POST submissions
apiRouter.post('/submit-form', (req, res) => {
  const { name, email, message } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  // Process data (e.g. save to database or send email)
  console.log('Received submission:', { name, email, message });

  res.json({
    success: true,
    message: 'Data successfully received and processed by backend!'
  });
});`)}
                className="flex items-center gap-1 text-[11px] text-[#71717A] hover:text-[#EDEDED]"
              >
                {copiedId === 'server-ex' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-4 font-mono text-xs text-[#EDEDED] overflow-x-auto leading-relaxed bg-[#16161A]">
{`import { Router } from 'express';

export const apiRouter = Router();

// Handle POST submissions
apiRouter.post('/submit-form', (req, res) => {
  const { name, email, message } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  // Process data (e.g. save to database or send email)
  console.log('Received submission:', { name, email, message });

  res.json({
    success: true,
    message: 'Data successfully received and processed by backend!'
  });
});`}
            </pre>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: '3. Adding Persistent Database Storage',
      subtitle: 'Connect PostgreSQL, Firestore, or SQLite to save data permanently',
      icon: Database,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-[#A1A1AA]">
          <p>
            To keep your data safe even when servers restart, connect a database to your Express routes:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 bg-[#0F0F12] border border-[#2D2D33] rounded-xl space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1A1A1E] text-indigo-400 border border-[#2D2D33]">
                Option A: Relational
              </span>
              <h4 className="font-semibold text-[#EDEDED] text-sm">PostgreSQL / Cloud SQL</h4>
              <p className="text-xs text-[#71717A]">
                Ideal for structured data, e-commerce orders, relational models, user accounts, and financial transactions.
              </p>
            </div>

            <div className="p-4 bg-[#0F0F12] border border-[#2D2D33] rounded-xl space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1A1A1E] text-emerald-400 border border-[#2D2D33]">
                Option B: NoSQL / Realtime
              </span>
              <h4 className="font-semibold text-[#EDEDED] text-sm">Firestore / MongoDB</h4>
              <p className="text-xs text-[#71717A]">
                Ideal for flexible JSON documents, live chat feeds, real-time sync, and rapid prototyping.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: '4. Production Deployment & Live URLs',
      subtitle: 'How this application runs live on Google Cloud Run with HTTPS',
      icon: Globe,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-[#A1A1AA]">
          <p>
            In this environment, your fullstack application is already live. Here is how the production architecture operates:
          </p>

          <div className="p-4 bg-[#16161A] border border-[#1F1F23] rounded-xl space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-[#EDEDED] font-bold">
              <Cpu className="w-4 h-4 text-indigo-400" /> Fullstack Engine Pipeline:
            </div>
            <div className="pl-4 border-l-2 border-indigo-500 space-y-2 text-[#A1A1AA]">
              <p>1. <span className="text-emerald-400">Build:</span> <code className="text-[#EDEDED]">npm run build</code> bundles frontend into static assets in <code className="text-[#EDEDED]">dist/</code>.</p>
              <p>2. <span className="text-indigo-400">Start Server:</span> <code className="text-[#EDEDED]">node server.ts</code> starts Express on Port 3000.</p>
              <p>3. <span className="text-purple-400">Serve Frontend:</span> Express serves <code className="text-[#EDEDED]">dist/index.html</code> for all page visits.</p>
              <p>4. <span className="text-emerald-400">Serve API:</span> Express routes all <code className="text-[#EDEDED]">/api/*</code> requests to backend controllers.</p>
            </div>
          </div>

          <div className="p-4 bg-indigo-600/5 border border-indigo-500/20 rounded-xl text-xs text-[#EDEDED] space-y-1">
            <p className="font-semibold text-indigo-400">Expert Tip</p>
            <p className="text-[11px] text-[#A1A1AA]">
              Use environment variables to store your backend secret keys securely. Never hardcode them in your HTML.
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5">
      
      {/* Banner */}
      <div className="bg-[#0F0F12] border border-[#1F1F23] rounded-xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1A1A1E] text-indigo-400 border border-[#2D2D33]">
            Architecture Guide
          </span>
          <span className="text-xs text-[#71717A]">Static HTML to Fullstack Production</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#EDEDED] tracking-tight">
          How to Make Your HTML App Live with a Backend
        </h2>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl">
          Follow this 4-step blueprint to understand how HTML, Express APIs, databases, and cloud hosting tie together.
        </p>
      </div>

      {/* Step Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map(s => {
          const Icon = s.icon;
          const isCurrent = activeStep === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-3 ${
                isCurrent
                  ? 'bg-[#1A1A1E] border-[#3F3F46] shadow-sm'
                  : 'bg-[#0F0F12] border-[#1F1F23] hover:bg-[#16161A] hover:border-[#2D2D33]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-md ${isCurrent ? 'bg-indigo-600 text-white' : 'bg-[#1A1A1E] text-[#A1A1AA]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-indigo-400' : 'text-[#71717A]'}`}>
                  Step 0{s.id}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#EDEDED] line-clamp-1">{s.title.split('. ')[1]}</h4>
                <p className="text-[11px] text-[#71717A] line-clamp-2 mt-0.5">{s.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Content Display */}
      <div className="bg-[#0F0F12] border border-[#1F1F23] rounded-xl p-5 sm:p-6 space-y-5">
        <div>
          <h3 className="text-base font-bold text-[#EDEDED] flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              0{activeStep}
            </span>
            <span>{steps.find(s => s.id === activeStep)?.title}</span>
          </h3>
          <p className="text-xs text-[#71717A] mt-1">
            {steps.find(s => s.id === activeStep)?.subtitle}
          </p>
        </div>

        <div className="border-t border-[#1F1F23] pt-4">
          {steps.find(s => s.id === activeStep)?.content}
        </div>

        {/* Step Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1F1F23]">
          <button
            disabled={activeStep === 1}
            onClick={() => setActiveStep(prev => prev - 1)}
            className="px-3.5 py-1.5 bg-[#1A1A1E] hover:bg-[#2D2D33] border border-[#2D2D33] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium text-[#EDEDED] rounded-md transition"
          >
            ← Previous Step
          </button>

          <span className="text-xs text-[#71717A]">Step {activeStep} of 4</span>

          <button
            disabled={activeStep === 4}
            onClick={() => setActiveStep(prev => prev + 1)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-md transition"
          >
            Next Step →
          </button>
        </div>
      </div>

    </div>
  );
};
