import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Search, 
  Clock, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { StoredItem } from '../types';

const DEFAULT_STORED_ITEMS: StoredItem[] = [
  {
    id: 'item-101',
    title: 'Customer Order #1001',
    category: 'Sales',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    data: { amount: 128.5, status: 'completed', paymentMethod: 'Card' }
  },
  {
    id: 'item-102',
    title: 'Inventory Restock Alert - Coffee Beans',
    category: 'Inventory',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    data: { sku: 'BEANS-DARK-01', stock: 12, threshold: 20 }
  },
  {
    id: 'item-103',
    title: 'Store Feedback Entry',
    category: 'General',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    data: { rating: 5, comment: 'Great service & fast checkout!' }
  }
];

export const DatabaseViewer: React.FC = () => {
  const [items, setItems] = useState<StoredItem[]>(DEFAULT_STORED_ITEMS);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('General');
  const [newCustomJson, setNewCustomJson] = useState<string>('{\n  "note": "Created from Database Manager",\n  "priority": "High"\n}');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let url = '/api/items';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      
      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.items)) {
          setItems(data.items);
          return;
        }
      }
    } catch {
      // Graceful fallback for preview / offline environments
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Item ${id} deleted`);
        setTimeout(() => setActionSuccess(null), 3000);
        fetchItems();
      }
    } catch (err) {
      alert('Delete failed: ' + err);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let parsedData = {};
    try {
      if (newCustomJson.trim()) {
        parsedData = JSON.parse(newCustomJson);
      }
    } catch (e) {
      alert('Invalid JSON in custom metadata field');
      return;
    }

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          data: parsedData
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setShowAddModal(false);
        setActionSuccess('Record created successfully in backend database');
        setTimeout(() => setActionSuccess(null), 3000);
        fetchItems();
      }
    } catch (err) {
      alert('Failed to create item: ' + err);
    }
  };

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category || 'General')))];

  return (
    <div className="space-y-5">
      
      {/* Header Banner */}
      <div className="bg-[#0F0F12] border border-[#1F1F23] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1A1A1E] text-indigo-400 border border-[#2D2D33]">
                In-Memory Database
              </span>
              <span className="text-xs text-[#71717A]">Persistent REST Store</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#EDEDED] tracking-tight">
              Backend Database Viewer
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl">
              Any data submitted from your HTML frontend or API endpoints is stored here in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Insert Record</span>
            </button>

            <button
              onClick={fetchItems}
              disabled={loading}
              className="p-2 bg-[#1A1A1E] hover:bg-[#2D2D33] text-[#A1A1AA] hover:text-[#EDEDED] rounded-md border border-[#2D2D33] transition cursor-pointer"
              title="Refresh Database"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="mt-4 p-3 bg-[#16161A] border border-emerald-500/40 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0F0F12] border border-[#1F1F23] p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#71717A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or metadata..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#0A0A0B] border border-[#1F1F23] rounded-md text-xs text-[#EDEDED] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#1A1A1E] hover:bg-[#2D2D33] text-xs font-medium text-[#EDEDED] rounded-md border border-[#2D2D33] transition"
          >
            Search
          </button>
        </form>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-xs text-[#71717A] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#1A1A1E] text-[#EDEDED] border border-[#3F3F46] font-semibold'
                  : 'bg-[#0A0A0B] text-[#71717A] hover:bg-[#16161A] hover:text-[#EDEDED]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Data Items Table */}
      <div className="bg-[#0A0A0B] border border-[#1F1F23] rounded-xl overflow-hidden">
        
        <div className="px-4 py-2.5 bg-[#0F0F12] border-b border-[#1F1F23] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-[#EDEDED]">Stored Records ({items.length})</span>
          </div>
          <span className="text-[11px] text-[#71717A] font-mono">GET /api/items</span>
        </div>

        {loading ? (
          <div className="py-14 text-center text-[#71717A] space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-400" />
            <p className="text-xs">Fetching database state...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center text-[#52525B] space-y-2">
            <Database className="w-8 h-8 mx-auto text-[#3F3F46]" />
            <p className="text-xs">No records found matching criteria.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs text-indigo-400 hover:underline"
            >
              Insert new record
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#1F1F23]">
            {items.map(item => (
              <div 
                key={item.id}
                className="p-4 hover:bg-[#0F0F12] transition flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1A1A1E] text-indigo-400 border border-[#2D2D33]">
                      {item.category || 'General'}
                    </span>
                    <span className="text-xs font-semibold text-[#EDEDED]">{item.title}</span>
                    <span className="text-[10px] font-mono text-[#71717A]">ID: {item.id}</span>
                  </div>

                  {item.data && Object.keys(item.data).length > 0 && (
                    <div className="bg-[#16161A] p-2.5 rounded-md border border-[#1F1F23]">
                      <p className="text-[10px] font-bold uppercase text-[#71717A] mb-1">Payload:</p>
                      <pre className="text-[11px] font-mono text-[#EDEDED] overflow-x-auto">
                        {JSON.stringify(item.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-[#71717A]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#71717A]" />
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                    <span className="text-emerald-400">● {item.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-[#71717A] hover:text-rose-400 hover:bg-[#1A1A1E] rounded-md transition border border-[#1F1F23] hover:border-rose-900/50 cursor-pointer"
                    title="Delete record from backend"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F0F12] border border-[#1F1F23] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
              <h3 className="text-sm font-bold text-[#EDEDED] flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Add Record to Database
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#71717A] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1">Title / Name *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lead Inquiry from John"
                  className="w-full px-3 py-2 bg-[#0A0A0B] border border-[#1F1F23] rounded-md text-xs text-[#EDEDED] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0B] border border-[#1F1F23] rounded-md text-xs text-[#EDEDED] focus:outline-none focus:border-indigo-500"
                >
                  <option value="General">General</option>
                  <option value="Forms">Forms</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Authentication">Authentication</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1">Custom Data (JSON format)</label>
                <textarea
                  rows={4}
                  value={newCustomJson}
                  onChange={(e) => setNewCustomJson(e.target.value)}
                  className="w-full p-3 bg-[#0A0A0B] border border-[#1F1F23] rounded-md font-mono text-xs text-[#EDEDED] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F1F23]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-[#71717A] hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold transition"
                >
                  Save Record
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
