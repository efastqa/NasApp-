import { HtmlTemplate } from '../types';

export const HTML_TEMPLATES: HtmlTemplate[] = [
  {
    id: 'contact-form',
    name: 'Form Submission & Lead Capture',
    category: 'Forms & Backend Storage',
    description: 'A clean HTML form that submits user data via fetch() to POST /api/submit-form and displays backend response.',
    targetEndpoint: '/api/submit-form',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Customer Inquiry Form</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6 flex items-center justify-center font-sans">
  <div class="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-bold">📩</div>
      <div>
        <h2 class="text-xl font-bold text-white">Contact & Support</h2>
        <p class="text-xs text-slate-400">Submits directly to Express API (/api/submit-form)</p>
      </div>
    </div>

    <form id="contactForm" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Your Full Name</label>
        <input type="text" id="name" required placeholder="Jane Doe" 
          class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition" />
      </div>

      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
        <input type="email" id="email" required placeholder="jane@example.com" 
          class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition" />
      </div>

      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Inquiry Subject</label>
        <input type="text" id="subject" placeholder="Project Inquiry / Feedback" 
          class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition" />
      </div>

      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Message</label>
        <textarea id="message" rows="3" required placeholder="Tell us how we can assist you..." 
          class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition"></textarea>
      </div>

      <button type="submit" id="submitBtn" 
        class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer">
        <span>Send to Live Backend</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </button>
    </form>

    <!-- Backend Response Box -->
    <div id="responseBox" class="mt-5 hidden rounded-xl p-4 text-xs font-mono border">
      <p id="responseStatus" class="font-bold mb-1"></p>
      <pre id="responseContent" class="overflow-x-auto text-slate-300"></pre>
    </div>
  </div>

  <script>
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const responseBox = document.getElementById('responseBox');
    const responseStatus = document.getElementById('responseStatus');
    const responseContent = document.getElementById('responseContent');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const payload = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
      };

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Processing request...</span>';
      responseBox.classList.add('hidden');

      try {
        // Calling backend API
        const response = await fetch('/api/submit-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        responseBox.classList.remove('hidden');
        if (response.ok && data.success) {
          responseBox.className = 'mt-5 rounded-xl p-4 text-xs font-mono border border-emerald-500/40 bg-emerald-950/40 text-emerald-300';
          responseStatus.textContent = '✅ Backend Success (HTTP 200): ' + data.message;
          responseContent.textContent = JSON.stringify(data, null, 2);
          form.reset();
        } else {
          responseBox.className = 'mt-5 rounded-xl p-4 text-xs font-mono border border-rose-500/40 bg-rose-950/40 text-rose-300';
          responseStatus.textContent = '❌ Backend Error: ' + (data.error || 'Request failed');
          responseContent.textContent = JSON.stringify(data, null, 2);
        }
      } catch (err) {
        responseBox.classList.remove('hidden');
        responseBox.className = 'mt-5 rounded-xl p-4 text-xs font-mono border border-rose-500/40 bg-rose-950/40 text-rose-300';
        responseStatus.textContent = '⚠️ Network Error connecting to /api/submit-form';
        responseContent.textContent = err.message;
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Send to Live Backend</span> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>';
      }
    });
  </script>
</body>
</html>`
  },
  {
    id: 'crud-dashboard',
    name: 'Dynamic Data Manager & CRUD API',
    category: 'Fullstack CRUD',
    description: 'HTML interface that performs live GET, POST, and DELETE operations against Express /api/items.',
    targetEndpoint: '/api/items',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Live Data Manager</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 font-sans">
  <div class="max-w-3xl mx-auto space-y-6">
    
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-2">
          <span>📦</span> Live Item Database Manager
        </h1>
        <p class="text-xs text-slate-400">Communicates with Express backend endpoints: GET /api/items & POST /api/items</p>
      </div>
      <button id="refreshBtn" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg border border-slate-700 transition flex items-center gap-1.5">
        🔄 Refresh Data
      </button>
    </div>

    <!-- Create Item Form -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 class="text-sm font-semibold text-indigo-400 mb-3">➕ Add New Record to Database</h3>
      <form id="addForm" class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input type="text" id="itemTitle" required placeholder="Item / Task Title" 
          class="md:col-span-2 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" />
        
        <select id="itemCategory" class="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500">
          <option value="Inventory">Inventory</option>
          <option value="Tasks">Tasks</option>
          <option value="Projects">Projects</option>
          <option value="Services">Services</option>
        </select>

        <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition">
          Create Item
        </button>
      </form>
    </div>

    <!-- Items Grid -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-slate-300">Live Records in Backend (<span id="itemCount">0</span>)</h3>
        <input type="text" id="filterInput" placeholder="Filter search..." class="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none" />
      </div>

      <div id="itemsContainer" class="space-y-2">
        <p class="text-xs text-slate-500 py-4 text-center">Loading items from backend...</p>
      </div>
    </div>

  </div>

  <script>
    const itemsContainer = document.getElementById('itemsContainer');
    const itemCount = document.getElementById('itemCount');
    const addForm = document.getElementById('addForm');
    const refreshBtn = document.getElementById('refreshBtn');
    const filterInput = document.getElementById('filterInput');

    let cachedItems = [];

    async function loadItems(search = '') {
      try {
        const url = search ? '/api/items?search=' + encodeURIComponent(search) : '/api/items';
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success) {
          cachedItems = data.items;
          renderItems(cachedItems);
        }
      } catch (err) {
        itemsContainer.innerHTML = '<p class="text-xs text-rose-400 py-4 text-center">Error fetching items: ' + err.message + '</p>';
      }
    }

    function renderItems(items) {
      itemCount.textContent = items.length;
      if (items.length === 0) {
        itemsContainer.innerHTML = '<p class="text-xs text-slate-500 py-6 text-center">No records found. Create one above!</p>';
        return;
      }

      itemsContainer.innerHTML = items.map(item => \`
        <div class="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition">
          <div class="flex items-center gap-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/40">
              \${item.category || 'General'}
            </span>
            <div>
              <p class="text-xs font-semibold text-slate-200">\${item.title}</p>
              <p class="text-[10px] text-slate-500">ID: \${item.id} • \${new Date(item.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>
          <button onclick="deleteItem('\${item.id}')" class="px-2.5 py-1 text-[11px] text-rose-400 hover:bg-rose-950/50 rounded transition border border-rose-900/30">
            Delete
          </button>
        </div>
      \`).join('');
    }

    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('itemTitle').value;
      const category = document.getElementById('itemCategory').value;

      try {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, category })
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById('itemTitle').value = '';
          loadItems();
        }
      } catch (err) {
        alert('Error adding item: ' + err.message);
      }
    });

    async function deleteItem(id) {
      try {
        const res = await fetch('/api/items/' + id, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          loadItems();
        }
      } catch (err) {
        alert('Error deleting item: ' + err.message);
      }
    }

    refreshBtn.addEventListener('click', () => loadItems());
    filterInput.addEventListener('input', (e) => loadItems(e.target.value));

    // Initial load
    loadItems();
  </script>
</body>
</html>`
  },
  {
    id: 'auth-jwt',
    name: 'Authentication & Session Flow',
    category: 'Auth & JWT Security',
    description: 'HTML login interface sending credentials to POST /api/auth/demo, receiving JWT token and saving session.',
    targetEndpoint: '/api/auth/demo',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fullstack Auth Flow</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6 flex items-center justify-center font-sans">
  <div class="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5">
    
    <div class="text-center">
      <div class="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold mb-2">🔐</div>
      <h2 class="text-xl font-bold text-white">Fullstack Authentication</h2>
      <p class="text-xs text-slate-400">Verifies credentials via Express /api/auth/demo</p>
    </div>

    <!-- Login Form -->
    <form id="authForm" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-slate-400 mb-1">Username</label>
        <input type="text" id="username" value="admin_user" required 
          class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500" />
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-400 mb-1">Password</label>
        <input type="password" id="password" value="supersecret123" required 
          class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500" />
      </div>

      <button type="submit" id="loginBtn" 
        class="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm transition shadow-lg">
        Sign In & Get Token
      </button>
    </form>

    <!-- Session User Profile -->
    <div id="sessionCard" class="hidden bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
      <div class="flex items-center gap-3">
        <img id="userAvatar" src="" class="w-10 h-10 rounded-full bg-slate-800 border border-amber-500/40" />
        <div>
          <h4 id="userDisplayName" class="text-sm font-bold text-white"></h4>
          <p id="userRole" class="text-xs text-amber-400 font-mono"></p>
        </div>
      </div>
      
      <div class="bg-slate-950 p-2.5 rounded text-[11px] font-mono text-slate-400 truncate">
        <span class="text-slate-500">JWT Bearer:</span> <span id="tokenString" class="text-amber-300"></span>
      </div>

      <button id="logoutBtn" class="w-full py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 border border-rose-900/40 rounded transition">
        Sign Out / Clear Token
      </button>
    </div>

  </div>

  <script>
    const form = document.getElementById('authForm');
    const sessionCard = document.getElementById('sessionCard');
    const userAvatar = document.getElementById('userAvatar');
    const userDisplayName = document.getElementById('userDisplayName');
    const userRole = document.getElementById('userRole');
    const tokenString = document.getElementById('tokenString');
    const logoutBtn = document.getElementById('logoutBtn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch('/api/auth/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
          form.classList.add('hidden');
          sessionCard.classList.remove('hidden');
          userAvatar.src = data.user.avatar;
          userDisplayName.textContent = data.user.username + ' (' + data.user.email + ')';
          userRole.textContent = 'Role: ' + data.user.role;
          tokenString.textContent = data.token.substring(0, 32) + '...';
        }
      } catch (err) {
        alert('Authentication failed: ' + err.message);
      }
    });

    logoutBtn.addEventListener('click', () => {
      sessionCard.classList.add('hidden');
      form.classList.remove('hidden');
    });
  </script>
</body>
</html>`
  }
];
