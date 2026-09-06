import { Router } from 'express';

export const apiRouter = Router();

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  createdAt?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  amount: number;
}

export interface StatusHistory {
  status: string;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  timestamp: number;
  customerName?: string;
  customerPhone?: string;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
  items: OrderItem[];
  subtotal: number;
  discount: Discount;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  source: 'pos' | 'customer' | 'staff';
  channel: 'instore' | 'online';
  statusHistory: StatusHistory[];
}

export interface Sale {
  id: string;
  timestamp: number;
  channel: 'instore' | 'online';
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: Discount;
  total: number;
  status: 'completed';
  source: 'pos' | 'customer' | 'staff';
  customerName?: string;
  deliveryMethod?: 'pickup' | 'delivery';
  deliveryAddress?: string;
}

// Initial default products from user app
let productsDb: Product[] = [
  { id: 'p_1', name: 'Storck Alffrucht 425g', sku: 'ZST110DRY00181', price: 16.57, stock: 125, category: 'Chocolate', image: '' },
  { id: 'p_2', name: 'Storck Paradise Fruits 200g', sku: 'ZST110DRY00187', price: 8.00, stock: 8, category: 'Chocolate', image: '' },
  { id: 'p_3', name: 'Storck Mamba 6x48x26.5g', sku: 'ZST110DRY00216', price: 1.20, stock: 1248, category: 'Chocolate', image: '' },
  { id: 'p_4', name: 'Caramel Popcorn 140g', sku: 'ZST110DRY00210', price: 17.50, stock: 2664, category: 'Snacks', image: '' },
  { id: 'p_5', name: 'Storck Knoppers 6x24x25g', sku: 'ZST110DRY00195', price: 1.94, stock: 703, category: 'Chocolate', image: '' },
  { id: 'p_6', name: 'Storck Knoppers Minis 12x200g', sku: 'ZST110DRY00222', price: 19.50, stock: 4216, category: 'Chocolate', image: '' },
  { id: 'p_7', name: 'Storck Mamba Frt/Ch 110g', sku: 'ZST110DRY00178', price: 4.49, stock: 1782, category: 'Chocolate', image: '' }
];

// Initial seeded sales
let salesDb: Sale[] = [
  {
    id: 'sale_101',
    timestamp: Date.now() - 7200000,
    channel: 'instore',
    customerPhone: '+974 7731 5415',
    items: [
      { productId: 'p_1', name: 'Storck Alffrucht 425g', price: 16.57, qty: 2 },
      { productId: 'p_4', name: 'Caramel Popcorn 140g', price: 17.50, qty: 1 }
    ],
    subtotal: 50.64,
    discount: { type: 'percentage', value: 0, amount: 0 },
    total: 50.64,
    status: 'completed',
    source: 'pos',
    customerName: 'Fatima Al-Kuwari',
    deliveryMethod: 'pickup'
  },
  {
    id: 'sale_102',
    timestamp: Date.now() - 14400000,
    channel: 'online',
    customerPhone: '+974 5512 3456',
    items: [
      { productId: 'p_6', name: 'Storck Knoppers Minis 12x200g', price: 19.50, qty: 3 }
    ],
    subtotal: 58.50,
    discount: { type: 'fixed', value: 5, amount: 5 },
    total: 53.50,
    status: 'completed',
    source: 'customer',
    customerName: 'Ahmed Al-Thani',
    deliveryMethod: 'delivery',
    deliveryAddress: 'The Pearl, Tower 12, Apt 402'
  }
];

// Initial seeded orders
let ordersDb: Order[] = [
  {
    id: 'ord_101',
    timestamp: Date.now() - 3600000,
    customerName: 'Jassim Al-Sulaiti',
    customerPhone: '+974 3322 1100',
    deliveryMethod: 'pickup',
    items: [
      { productId: 'p_1', name: 'Storck Alffrucht 425g', price: 16.57, qty: 1 },
      { productId: 'p_5', name: 'Storck Knoppers 6x24x25g', price: 1.94, qty: 4 }
    ],
    subtotal: 24.33,
    discount: { type: 'percentage', value: 0, amount: 0 },
    total: 24.33,
    status: 'pending',
    source: 'customer',
    channel: 'online',
    statusHistory: [
      { status: 'pending', timestamp: new Date(Date.now() - 3600000).toISOString(), note: 'Order received via QR Menu' }
    ]
  }
];

// Stored Items In-Memory DB for Generic Database Viewer / HTML Sandboxes
export interface StoredItem {
  id: string;
  title: string;
  category?: string;
  data?: Record<string, any>;
  createdAt: string;
  status?: string;
}

let itemsDb: StoredItem[] = [
  {
    id: 'item_1',
    title: 'Store Grand Opening Campaign Lead',
    category: 'Sales',
    data: { budget: 12000, company: 'Al Maha Trading', priority: 'High', source: 'Instagram' },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'active'
  },
  {
    id: 'item_2',
    title: 'Customer Feedback & Suggestion',
    category: 'Forms',
    data: { name: 'Mariam', rating: 5, comment: 'Loved the fast delivery and receipt on WhatsApp!' },
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    status: 'reviewed'
  }
];

// ==========================================
// GENERIC ITEMS & DB MANAGER ENDPOINTS
// ==========================================
apiRouter.get('/items', (req, res) => {
  const { category, search } = req.query;
  let list = [...itemsDb];

  if (category && typeof category === 'string' && category !== 'all') {
    list = list.filter(i => i.category?.toLowerCase() === category.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(i => 
      i.title.toLowerCase().includes(q) || 
      (i.category && i.category.toLowerCase().includes(q)) ||
      JSON.stringify(i.data || {}).toLowerCase().includes(q)
    );
  }

  res.json({ success: true, items: list });
});

apiRouter.post('/items', (req, res) => {
  const { title, category, data } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }

  const newItem: StoredItem = {
    id: uid(),
    title: String(title).trim(),
    category: category ? String(category).trim() : 'General',
    data: data || {},
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  itemsDb.unshift(newItem);
  res.status(201).json({ success: true, item: newItem });
});

apiRouter.delete('/items/:id', (req, res) => {
  const { id } = req.params;
  itemsDb = itemsDb.filter(i => i.id !== id);
  res.json({ success: true, message: 'Item deleted successfully' });
});

// ==========================================
// FORM SUBMISSION & UTILITY ENDPOINTS
// ==========================================
apiRouter.post('/submit-form', (req, res) => {
  const payload = req.body;
  const formItem: StoredItem = {
    id: uid(),
    title: payload.subject || payload.name || 'Web Form Submission',
    category: 'Forms',
    data: payload,
    createdAt: new Date().toISOString(),
    status: 'received'
  };
  itemsDb.unshift(formItem);

  res.json({
    success: true,
    message: 'Form submission received and stored',
    submissionId: formItem.id,
    receivedData: payload
  });
});

apiRouter.post('/auth/demo', (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: 'Username is required' });
  }

  res.json({
    success: true,
    token: `jwt_demo_${uid()}_${Date.now()}`,
    user: {
      id: 'usr_admin',
      username: username || 'admin',
      role: 'store_manager',
      email: `${username || 'admin'}@nasapp.local`
    }
  });
});

apiRouter.all('/echo', (req, res) => {
  res.json({
    success: true,
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
});


// Helper uid
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ==========================================
// SYSTEM & HEALTH
// ==========================================
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    app: 'NasApp POS & Inventory Engine',
    counts: {
      products: productsDb.length,
      orders: ordersDb.length,
      sales: salesDb.length,
      pendingOrders: ordersDb.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length
    }
  });
});

// ==========================================
// PRODUCTS ENDPOINTS
// ==========================================
apiRouter.get('/products', (req, res) => {
  const { search, category } = req.query;
  let list = [...productsDb];

  if (category && typeof category === 'string' && category !== 'All') {
    list = list.filter(p => p.category?.toLowerCase() === category.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, products: list });
});

apiRouter.post('/products', (req, res) => {
  const { name, sku, price, stock, category, image } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Product name is required' });
  }

  const newProduct: Product = {
    id: uid(),
    name: name.trim(),
    sku: sku ? sku.trim() : '',
    price: Number(price) || 0,
    stock: parseInt(stock, 10) || 0,
    category: category ? category.trim() : '',
    image: image || '',
    createdAt: new Date().toISOString()
  };

  productsDb.unshift(newProduct);
  res.status(201).json({ success: true, product: newProduct });
});

apiRouter.post('/products/bulk', (req, res) => {
  const { products: itemsToImport } = req.body;
  if (!Array.isArray(itemsToImport) || itemsToImport.length === 0) {
    return res.status(400).json({ success: false, error: 'Array of products is required' });
  }

  let added = 0;
  for (const item of itemsToImport) {
    if (item.name && !isNaN(Number(item.price))) {
      productsDb.push({
        id: uid(),
        name: String(item.name).trim(),
        sku: item.sku ? String(item.sku).trim() : '',
        price: Number(item.price) || 0,
        stock: parseInt(item.stock, 10) || 0,
        category: item.category ? String(item.category).trim() : '',
        image: item.image || '',
        createdAt: new Date().toISOString()
      });
      added++;
    }
  }

  res.json({ success: true, addedCount: added, totalProducts: productsDb.length });
});

apiRouter.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const index = productsDb.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  productsDb[index] = {
    ...productsDb[index],
    ...req.body,
    id: productsDb[index].id
  };

  res.json({ success: true, product: productsDb[index] });
});

apiRouter.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  const exists = productsDb.some(p => p.id === id);
  if (!exists) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  productsDb = productsDb.filter(p => p.id !== id);
  res.json({ success: true, message: 'Product deleted successfully' });
});

// ==========================================
// ORDERS ENDPOINTS
// ==========================================
apiRouter.get('/orders', (req, res) => {
  const { status } = req.query;
  let list = [...ordersDb];

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(o => o.status === status);
  }

  // Sort: active statuses first, then most recent
  const statusWeight: Record<string, number> = {
    pending: 1,
    confirmed: 2,
    preparing: 3,
    ready: 4,
    completed: 5,
    cancelled: 6
  };

  list.sort((a, b) => {
    const diff = (statusWeight[a.status] || 99) - (statusWeight[b.status] || 99);
    if (diff !== 0) return diff;
    return b.timestamp - a.timestamp;
  });

  res.json({ success: true, orders: list });
});

apiRouter.post('/orders', (req, res) => {
  const {
    customerName,
    customerPhone,
    deliveryMethod,
    deliveryAddress,
    items,
    subtotal,
    discount,
    total,
    source,
    channel
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Order must contain at least one item' });
  }

  // Deduct inventory stock
  for (const item of items) {
    const p = productsDb.find(prod => prod.id === item.productId);
    if (p) {
      p.stock = Math.max(0, p.stock - (item.qty || 1));
    }
  }

  const newOrder: Order = {
    id: uid(),
    timestamp: Date.now(),
    customerName: customerName ? String(customerName).trim() : '',
    customerPhone: customerPhone ? String(customerPhone).trim() : '',
    deliveryMethod: deliveryMethod === 'delivery' ? 'delivery' : 'pickup',
    deliveryAddress: deliveryMethod === 'delivery' ? String(deliveryAddress || '').trim() : '',
    items,
    subtotal: Number(subtotal) || Number(total) || 0,
    discount: discount || { type: 'percentage', value: 0, amount: 0 },
    total: Number(total) || 0,
    status: 'pending',
    source: source || 'customer',
    channel: channel || 'online',
    statusHistory: [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: source === 'customer' ? 'Order submitted by customer' : 'Manual order created by staff'
      }
    ]
  };

  ordersDb.unshift(newOrder);
  res.status(201).json({ success: true, order: newOrder });
});

apiRouter.patch('/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const order = ordersDb.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid order status' });
  }

  order.status = status;
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status,
    timestamp: new Date().toISOString(),
    note: note || `Status updated to ${status}`
  });

  // If completed, ensure recorded in salesDb
  if (status === 'completed') {
    const alreadyInSales = salesDb.some(s => s.id === order.id);
    if (!alreadyInSales) {
      salesDb.unshift({
        id: order.id,
        timestamp: order.timestamp,
        channel: order.channel || 'online',
        customerPhone: order.customerPhone || '',
        items: order.items,
        subtotal: order.subtotal || order.total,
        discount: order.discount || { type: 'percentage', value: 0, amount: 0 },
        total: order.total,
        status: 'completed',
        source: order.source || 'customer',
        customerName: order.customerName || '',
        deliveryMethod: order.deliveryMethod,
        deliveryAddress: order.deliveryAddress
      });
    }
  }

  res.json({ success: true, order });
});

// ==========================================
// SALES ENDPOINTS
// ==========================================
apiRouter.get('/sales', (req, res) => {
  const { channel } = req.query;
  let list = [...salesDb];

  if (channel && typeof channel === 'string' && channel !== 'all') {
    list = list.filter(s => s.channel === channel);
  }

  list.sort((a, b) => b.timestamp - a.timestamp);
  res.json({ success: true, sales: list });
});

apiRouter.post('/sales', (req, res) => {
  const { channel, customerPhone, items, subtotal, discount, total, source, customerName } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Sale must have items' });
  }

  // Deduct inventory
  for (const item of items) {
    const p = productsDb.find(prod => prod.id === item.productId);
    if (p) {
      p.stock = Math.max(0, p.stock - (item.qty || 1));
    }
  }

  const saleId = uid();
  const timestamp = Date.now();

  const newSale: Sale = {
    id: saleId,
    timestamp,
    channel: channel === 'online' ? 'online' : 'instore',
    customerPhone: customerPhone || '',
    items,
    subtotal: Number(subtotal) || Number(total) || 0,
    discount: discount || { type: 'percentage', value: 0, amount: 0 },
    total: Number(total) || 0,
    status: 'completed',
    source: source || 'pos',
    customerName: customerName || '',
    deliveryMethod: 'pickup'
  };

  salesDb.unshift(newSale);

  // Also sync to orders as completed
  ordersDb.unshift({
    id: saleId,
    timestamp,
    customerName: customerName || '',
    customerPhone: customerPhone || '',
    deliveryMethod: 'pickup',
    items,
    subtotal: newSale.subtotal,
    discount: newSale.discount,
    total: newSale.total,
    status: 'completed',
    source: 'pos',
    channel: newSale.channel,
    statusHistory: [
      { status: 'completed', timestamp: new Date().toISOString(), note: 'Completed via POS checkout' }
    ]
  });

  res.status(201).json({ success: true, sale: newSale });
});

// ==========================================
// DASHBOARD STATS
// ==========================================
apiRouter.get('/dashboard/stats', (req, res) => {
  const revenue = salesDb.reduce((s, x) => s + (x.total || 0), 0);
  const salesCount = salesDb.length;
  const avgOrder = salesCount > 0 ? revenue / salesCount : 0;
  const itemsSold = salesDb.reduce((sum, s) => sum + s.items.reduce((a, i) => a + (i.qty || 0), 0), 0);
  const pendingOrders = ordersDb.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length;

  // Category revenue breakdown
  const categoryRevenue: Record<string, number> = {};
  salesDb.forEach(s => {
    s.items.forEach(item => {
      const p = productsDb.find(prod => prod.id === item.productId);
      const cat = p?.category || 'Uncategorized';
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.price * item.qty);
    });
  });

  // 7 days trend
  const daysTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const start = new Date(d).setHours(0, 0, 0, 0);
    const end = new Date(d).setHours(23, 59, 59, 999);

    const dayTotal = salesDb
      .filter(s => s.timestamp >= start && s.timestamp <= end)
      .reduce((sum, s) => sum + s.total, 0);

    daysTrend.push({
      date: d.toISOString(),
      label: d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: dayTotal
    });
  }

  // Channel revenue
  const onlineRev = salesDb.filter(s => s.channel === 'online').reduce((sum, s) => sum + s.total, 0);
  const instoreRev = salesDb.filter(s => s.channel === 'instore').reduce((sum, s) => sum + s.total, 0);

  // Low stock list (stock <= 10)
  const lowStock = productsDb
    .filter(p => p.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8);

  res.json({
    success: true,
    stats: {
      revenue,
      salesCount,
      avgOrder,
      itemsSold,
      pendingOrders,
      categoryRevenue,
      daysTrend,
      channelBreakdown: { online: onlineRev, instore: instoreRev },
      lowStock
    }
  });
});
