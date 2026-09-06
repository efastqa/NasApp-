import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  ClipboardList, 
  History, 
  BarChart3, 
  QrCode, 
  Terminal, 
  MessageSquare,
  Camera,
  Barcode as BarcodeIcon,
  Zap,
  Globe,
  Tag,
  ChefHat,
  Users,
  Banknote,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import { Product, Order, Sale, DashboardStats, DiningTable, CashShift } from './types';
import { Language, translations } from './i18n';
import { RegisterView } from './components/pos/RegisterView';
import { InventoryView } from './components/pos/InventoryView';
import { OrdersView } from './components/pos/OrdersView';
import { KitchenDisplayView } from './components/pos/KitchenDisplayView';
import { TableManagementView } from './components/pos/TableManagementView';
import { ShiftManagementView } from './components/pos/ShiftManagementView';
import { SalesLogView } from './components/pos/SalesLogView';
import { DashboardView } from './components/pos/DashboardView';
import { QRShareView } from './components/pos/QRShareView';
import { CustomerOrderView } from './components/pos/CustomerOrderView';
import { PrintReceiptArea } from './components/pos/PrintReceiptArea';
import { BarcodeScannerModal } from './components/pos/BarcodeScannerModal';
import { BarcodeLabelsView } from './components/pos/BarcodeLabelsView';
import { AdminLockScreen } from './components/pos/AdminLockScreen';
import { AdminSettingsModal } from './components/pos/AdminSettingsModal';
import { NasappBrandLogo } from './components/NasappBrandLogo';

// Developer Tools components
import { BackendInspector } from './components/BackendInspector';
import { LiveHtmlRunner } from './components/LiveHtmlRunner';
import { DatabaseViewer } from './components/DatabaseViewer';
import { StepByStepGuide } from './components/StepByStepGuide';

// Firebase Realtime
import { 
  db, 
  initFirestoreData, 
  handleFirestoreError, 
  OperationType,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_SALES,
  INITIAL_TABLES,
  INITIAL_SHIFT
} from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  writeBatch,
  onSnapshot 
} from 'firebase/firestore';

export const App: React.FC = () => {
  const { theme, isLight, toggleTheme } = useTheme();

  // Language State: 'en' (English) or 'ar' (العربية)
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('pos_lang');
      return (saved === 'ar' || saved === 'en') ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const toggleLang = () => {
    const nextLang = lang === 'en' ? 'ar' : 'en';
    setLang(nextLang);
    try {
      localStorage.setItem('pos_lang', nextLang);
    } catch {}
  };

  const t = translations[lang];
  const isAr = lang === 'ar';

  // Navigation State
  const [activeTab, setActiveTab] = useState<'register' | 'inventory' | 'kds' | 'tables' | 'shifts' | 'orders' | 'sales' | 'dashboard' | 'qr' | 'labels' | 'dev_workbench'>('register');
  const [devSubTab, setDevSubTab] = useState<'api_explorer' | 'db_viewer' | 'html_runner' | 'architecture_guide'>('api_explorer');
  const [isUrlCustomerMode, setIsUrlCustomerMode] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('customer') === '1';
    } catch {
      return false;
    }
  });
  const [customerMode, setCustomerMode] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('customer') === '1';
    } catch {
      return false;
    }
  });
  const [globalScannerOpen, setGlobalScannerOpen] = useState<boolean>(false);

  // Live Cloud Data State initialized with default dataset for instantaneous render
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [tables, setTables] = useState<DiningTable[]>(INITIAL_TABLES);
  const [shift, setShift] = useState<CashShift>(INITIAL_SHIFT);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<DiningTable | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cloudConnected, setCloudConnected] = useState<boolean>(false);
  const [lastPrintSale, setLastPrintSale] = useState<Sale | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Store Custom Logo state (null defaults to the original Nasapp vector mark)
  const [storeLogo, setStoreLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('nasapp_store_logo') || null;
    } catch {
      return null;
    }
  });

  const handleUpdateStoreLogo = (newLogo: string | null) => {
    setStoreLogo(newLogo);
    try {
      if (newLogo) {
        localStorage.setItem('nasapp_store_logo', newLogo);
      } else {
        localStorage.removeItem('nasapp_store_logo');
      }
    } catch (e) {
      console.warn(e);
    }
    showToast(isAr ? '✓ تم تحديث شعار المتجر بنجاح' : '✓ Store logo updated successfully');
  };

  // Admin PIN / Password Lock State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('nasapp_admin_session') === 'unlocked';
    } catch {
      return false;
    }
  });

  const handleUnlockAdmin = () => {
    setIsAdminUnlocked(true);
    try {
      sessionStorage.setItem('nasapp_admin_session', 'unlocked');
    } catch (e) {
      console.warn(e);
    }
    showToast(isAr ? '✓ تم فتح لوحة التحكم بنجاح' : '✓ POS Admin Unlocked');
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    try {
      sessionStorage.removeItem('nasapp_admin_session');
    } catch (e) {
      console.warn(e);
    }
    showToast(isAr ? '🔒 تم قفل لوحة التحكم' : '🔒 POS Admin Locked');
  };

  // Admin Security & Settings Modal
  const [showAdminSettingsModal, setShowAdminSettingsModal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGlobalScan = (code: string) => {
    const found = products.find(p => 
      (p.sku && p.sku.toLowerCase() === code.toLowerCase()) ||
      p.id.toLowerCase() === code.toLowerCase() ||
      p.name.toLowerCase().includes(code.toLowerCase())
    );

    if (found) {
      showToast(isAr ? `✓ تم المسح: ${found.name} (${found.price.toFixed(2)} ر.ق)` : `✓ Scanned: ${found.name} (QR ${found.price.toFixed(2)})`);
      setActiveTab('register');
    } else {
      showToast(isAr ? `الكود: ${code}` : `Scanned: ${code}`);
    }
  };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Check URL query parameters for ?customer=1 or ?track=ORD-xxx
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('customer') === '1' || params.get('track') || params.get('orderId')) {
        setCustomerMode(true);
      }
      if (params.get('lang') === 'ar') {
        setLang('ar');
      }
    } catch (e) {
      console.warn('URL param parse error:', e);
    }
  }, []);

  // Initialize and attach Live Firestore Real-Time listeners
  useEffect(() => {
    initFirestoreData();

    // 1. Real-time Products listener
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach((d) => list.push(d.data() as Product));
          setProducts(list);
        }
        setCloudConnected(true);
      },
      (error) => {
        console.warn('Products Firestore snapshot fallback:', error);
        handleFirestoreError(error, OperationType.GET, 'products');
      }
    );

    // 2. Real-time Orders listener
    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Order[] = [];
          snapshot.forEach((d) => list.push(d.data() as Order));
          // Sort descending by timestamp
          list.sort((a, b) => b.timestamp - a.timestamp);
          setOrders(list);
        }
      },
      (error) => {
        console.warn('Orders Firestore snapshot fallback:', error);
        handleFirestoreError(error, OperationType.GET, 'orders');
      }
    );

    // 3. Real-time Sales listener
    const unsubSales = onSnapshot(
      collection(db, 'sales'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Sale[] = [];
          snapshot.forEach((d) => list.push(d.data() as Sale));
          list.sort((a, b) => b.timestamp - a.timestamp);
          setSales(list);
        }
      },
      (error) => {
        console.warn('Sales Firestore snapshot fallback:', error);
        handleFirestoreError(error, OperationType.GET, 'sales');
      }
    );

    return () => {
      unsubProducts();
      unsubOrders();
      unsubSales();
    };
  }, []);

  // Compute live analytical dashboard metrics from real data
  useEffect(() => {
    const rev = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const count = sales.length;
    const avg = count > 0 ? rev / count : 0;
    const sold = sales.reduce((acc, s) => acc + s.items.reduce((sum, item) => sum + item.qty, 0), 0);
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;

    const catRev: Record<string, number> = {};
    sales.forEach(s => {
      s.items.forEach(i => {
        const prod = products.find(p => p.id === i.productId);
        const cat = prod?.category || 'General';
        catRev[cat] = (catRev[cat] || 0) + (i.price * i.qty);
      });
    });

    const channelBreakdown = {
      online: sales.filter(s => s.channel === 'online').length,
      instore: sales.filter(s => s.channel === 'instore').length
    };

    // Calculate last 7 days daily trend
    const daysTrend: Array<{ date: string; label: string; revenue: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString(isAr ? 'ar-QA' : 'en-US', { weekday: 'short' });
      
      const daySales = sales.filter(s => {
        const sDate = new Date(s.timestamp).toISOString().split('T')[0];
        return sDate === dateStr;
      });
      const dayRev = daySales.reduce((acc, s) => acc + s.total, 0);

      daysTrend.push({
        date: dateStr,
        label: dayLabel,
        revenue: dayRev
      });
    }

    const lowStock = products.filter(p => p.stock <= 5);

    setStats({
      revenue: rev,
      salesCount: count,
      avgOrder: avg,
      itemsSold: sold,
      pendingOrders: pending,
      categoryRevenue: catRev,
      daysTrend,
      channelBreakdown,
      lowStock
    });
  }, [products, orders, sales, isAr]);

  // Handle POS Sale Completion with Cloud persistence
  const handleSaleComplete = async (salePayload: any): Promise<Sale | null> => {
    try {
      const newSaleId = `SAL-${uid()}`;
      const newSale: Sale = {
        id: newSaleId,
        timestamp: Date.now(),
        channel: salePayload.channel || 'instore',
        customerPhone: salePayload.customerPhone,
        items: salePayload.items,
        subtotal: salePayload.subtotal,
        discount: salePayload.discount,
        total: salePayload.total,
        status: 'completed',
        source: 'pos'
      };

      // 1. Save to Cloud Firestore
      await setDoc(doc(db, 'sales', newSaleId), newSale);

      // 2. Decrement inventory stock in Cloud Firestore
      for (const item of newSale.items) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          const updatedStock = Math.max(0, prod.stock - item.qty);
          await updateDoc(doc(db, 'products', prod.id), {
            stock: updatedStock
          });
        }
      }

      showToast(isAr ? `✓ تم تسجيل الفاتورة بنجاح: ${newSale.total.toFixed(2)} ر.ق` : `✓ Sale completed: QR ${newSale.total.toFixed(2)}`);
      return newSale;
    } catch (error) {
      console.error('Error completing sale:', error);
      handleFirestoreError(error, OperationType.CREATE, 'sales');
      return null;
    }
  };

  // Add Product to Cloud Firestore
  const handleAddProduct = async (prodData: Partial<Product>): Promise<boolean> => {
    try {
      const id = `PRD-${uid()}`;
      const fullProd: Product = {
        id,
        name: prodData.name || 'New Item',
        sku: prodData.sku || `SKU-${uid().toUpperCase()}`,
        price: prodData.price || 0,
        stock: prodData.stock || 0,
        category: prodData.category || 'General',
        image: prodData.image,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'products', id), fullProd);
      showToast(isAr ? `✓ تمت إضافة: ${fullProd.name}` : `✓ Added ${fullProd.name}`);
      return true;
    } catch (error) {
      console.error('Error adding product:', error);
      handleFirestoreError(error, OperationType.CREATE, 'products');
      return false;
    }
  };

  // Bulk Add Products with Batched Cloud Firestore Writes
  const handleBulkAdd = async (prods: Array<Partial<Product>>): Promise<boolean> => {
    if (!prods || prods.length === 0) return false;
    try {
      const createdProducts: Product[] = [];
      const batchSize = 400; // Firestore limit is 500 ops per batch

      for (let i = 0; i < prods.length; i += batchSize) {
        const chunk = prods.slice(i, i + batchSize);
        const batch = writeBatch(db);

        for (const p of chunk) {
          const id = `PRD-${uid()}-${Math.random().toString(36).substring(2, 6)}`;
          const fullProd: Product = {
            id,
            name: p.name || 'Item',
            sku: p.sku || `SKU-${uid().toUpperCase()}`,
            price: Number(p.price) || 0,
            stock: Number(p.stock) ?? 10,
            category: p.category || 'General',
            image: p.image || '',
            createdAt: new Date().toISOString()
          };
          createdProducts.push(fullProd);
          batch.set(doc(db, 'products', id), fullProd);
        }

        await batch.commit();
      }

      // Optimistically prepend new products so UI updates immediately
      setProducts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const nonDuplicate = createdProducts.filter(p => !existingIds.has(p.id));
        return [...nonDuplicate, ...prev];
      });

      showToast(isAr ? `✓ تمت إضافة ${createdProducts.length} منتج بنجاح في قاعدة البيانات` : `✓ Successfully imported ${createdProducts.length} products to database!`);
      return true;
    } catch (error) {
      console.error('Bulk add error:', error);
      handleFirestoreError(error, OperationType.CREATE, 'products');
      showToast(isAr ? '⚠️ حدث خطأ أثناء الاستيراد الجماعي' : '⚠️ Error saving bulk products');
      return false;
    }
  };

  // Update Product
  const handleUpdateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'products', id), updates);
      showToast(isAr ? '✓ تم تحديث المخزون' : '✓ Product updated');
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      handleFirestoreError(error, OperationType.UPDATE, 'products');
      return false;
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'products', id));
      showToast(isAr ? '✓ تم حذف المنتج' : '✓ Product deleted');
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      handleFirestoreError(error, OperationType.DELETE, 'products');
      return false;
    }
  };

  // Create Customer / Online Order
  const handleCustomerSubmitOrder = async (orderPayload: any): Promise<Order | null> => {
    try {
      const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const newOrder: Order = {
        id: orderId,
        timestamp: Date.now(),
        customerName: orderPayload.customerName || 'Valued Customer',
        customerPhone: orderPayload.customerPhone || '',
        deliveryMethod: orderPayload.deliveryMethod || 'pickup',
        deliveryAddress: orderPayload.deliveryAddress || '',
        items: orderPayload.items || [],
        subtotal: orderPayload.subtotal || 0,
        discount: orderPayload.discount || { type: 'fixed', value: 0, amount: 0 },
        total: orderPayload.total || 0,
        status: 'pending',
        source: orderPayload.source || 'customer',
        channel: orderPayload.channel || 'online',
        statusHistory: [
          { status: 'pending', timestamp: new Date().toISOString(), note: 'Order submitted' }
        ]
      };

      // 1. Instantly update React state
      setOrders(prev => [newOrder, ...prev.filter(o => o.id !== orderId)]);

      // 2. Persist to Firestore
      try {
        await setDoc(doc(db, 'orders', orderId), newOrder);
      } catch (fErr) {
        console.warn('Firestore setDoc orders note:', fErr);
      }

      showToast(isAr ? `✓ تم استلام الطلب #${orderId}` : `✓ Order #${orderId} received!`);
      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  };

  // Update Order Status (Confirmed, Preparing, Ready, Completed, Cancelled)
  const handleUpdateOrderStatus = async (orderId: string, status: string, note?: string): Promise<boolean> => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        console.warn(`Order #${orderId} not found in state`);
        return false;
      }

      const history = order.statusHistory || [];
      const updatedHistory = [
        ...history,
        { status, timestamp: new Date().toISOString(), note: note || `Status updated to ${status}` }
      ];

      const updatedOrder: Order = {
        ...order,
        status: status as any,
        statusHistory: updatedHistory
      };

      // Optimistically update order in state immediately
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));

      // Attempt Firestore sync using setDoc with merge: true so it works even if unseeded
      try {
        await setDoc(doc(db, 'orders', orderId), updatedOrder, { merge: true });
      } catch (fErr) {
        console.warn('Firestore order status sync warning:', fErr);
      }

      // If marked completed, also record into sales log if not already recorded
      if (status === 'completed') {
        const saleId = `SAL-${Date.now().toString(36).toUpperCase()}`;
        const newSale: Sale = {
          id: saleId,
          timestamp: Date.now(),
          channel: order.channel || 'online',
          customerPhone: order.customerPhone,
          customerName: order.customerName,
          deliveryMethod: order.deliveryMethod,
          deliveryAddress: order.deliveryAddress,
          items: order.items,
          subtotal: order.subtotal,
          discount: order.discount,
          total: order.total,
          status: 'completed',
          source: order.source
        };

        // Optimistically update sales and stock
        setSales(prev => [newSale, ...prev]);
        setProducts(prev => prev.map(p => {
          const matchedItem = order.items.find(i => i.productId === p.id);
          if (matchedItem) {
            return { ...p, stock: Math.max(0, p.stock - matchedItem.qty) };
          }
          return p;
        }));

        try {
          await setDoc(doc(db, 'sales', saleId), newSale, { merge: true });
          for (const item of order.items) {
            const prod = products.find(p => p.id === item.productId);
            if (prod) {
              await setDoc(doc(db, 'products', prod.id), {
                ...prod,
                stock: Math.max(0, prod.stock - item.qty)
              }, { merge: true });
            }
          }
        } catch (sErr) {
          console.warn('Firestore sale completion sync warning:', sErr);
        }
      }

      showToast(isAr ? `✓ تم تحديث حالة الطلب #${orderId} إلى: ${status}` : `✓ Order #${orderId} status: ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  };

  // Create Manual Order from staff
  const handleCreateManualOrder = async (orderData: any): Promise<boolean> => {
    const res = await handleCustomerSubmitOrder({ ...orderData, source: 'staff' });
    return res !== null;
  };

  // Table Management Handlers
  const handleUpdateTable = async (id: string, updates: Partial<DiningTable>): Promise<boolean> => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    try {
      await setDoc(doc(db, 'tables', id), updates, { merge: true });
    } catch (e) {
      console.warn('Firestore updateTable note:', e);
    }
    return true;
  };

  const handleOpenTableOrder = (table: DiningTable) => {
    setSelectedTableForOrder(table);
    setActiveTab('register');
    showToast(isAr ? `✓ تم تحديد ${table.name}` : `✓ Selected ${table.name}`);
  };

  // Shift & Cash Drawer Handlers
  const handleUpdateShift = async (updatedShift: CashShift): Promise<boolean> => {
    setShift(updatedShift);
    showToast(isAr ? '✓ تم تسجيل حركة النقد' : '✓ Cash transaction recorded');
    return true;
  };

  const handleCloseShift = async (actualCash: number, notes?: string): Promise<boolean> => {
    const closed: CashShift = {
      ...shift,
      status: 'closed',
      closedAt: Date.now(),
      actualCash,
      discrepancy: actualCash - shift.expectedCash,
      notes
    };
    setShift(closed);
    showToast(isAr ? '✓ تم إغلاق الوردية وإصدار تقرير Z-Report' : '✓ Shift closed & Z-Report ready');
    return true;
  };

  const handleOpenNewShift = async (openingFloat: number, cashierName: string): Promise<boolean> => {
    const newShift: CashShift = {
      id: `SHIFT-${Date.now().toString().slice(-4)}`,
      cashierName,
      openedAt: Date.now(),
      status: 'open',
      openingFloat,
      cashIn: 0,
      cashOut: 0,
      cashSales: 0,
      cardSales: 0,
      onlineSales: 0,
      totalSales: 0,
      expectedCash: openingFloat,
      transactions: [
        { id: `tx_${Date.now()}`, type: 'cash_in', amount: openingFloat, time: Date.now(), note: 'Opening Float' }
      ]
    };
    setShift(newShift);
    showToast(isAr ? `✓ تم فتح وردية جديدة باسم ${cashierName}` : `✓ New shift opened for ${cashierName}`);
    return true;
  };

  // Trigger Native Browser Print for Thermal Receipt
  const handlePrintReceipt = (sale: Sale) => {
    setLastPrintSale(sale);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Switch to standalone Customer Self-Order view
  if (customerMode) {
    return (
      <CustomerOrderView
        products={products}
        orders={orders}
        onSubmitOrder={handleCustomerSubmitOrder}
        onExitCustomerMode={isUrlCustomerMode ? undefined : () => {
          setIsAdminUnlocked(false);
          try {
            sessionStorage.removeItem('nasapp_admin_session');
          } catch (e) {
            console.warn(e);
          }
          setCustomerMode(false);
        }}
        lang={lang}
        onToggleLang={toggleLang}
        storeLogo={storeLogo}
        onUpdateStoreLogo={handleUpdateStoreLogo}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // Admin PIN / Password Lock Screen Protection
  if (!isAdminUnlocked) {
    return (
      <AdminLockScreen
        onUnlock={handleUnlockAdmin}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenCustomerView={() => setCustomerMode(true)}
        storeLogo={storeLogo}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#000000] text-[#F5F5F4]'}`}>
      
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className={`fixed top-4 ${isAr ? 'left-4' : 'right-4'} z-50 border px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2 flex items-center gap-2 ${
          isLight ? 'bg-white border-emerald-500 text-emerald-800 shadow-emerald-500/10' : 'bg-[#0A0A0B] border-[#39FFB0] text-[#39FFB0]'
        }`}>
          <span className={`w-2 h-2 rounded-full animate-ping ${isLight ? 'bg-emerald-600' : 'bg-[#39FFB0]'}`}></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <aside className={`w-64 flex flex-col justify-between p-4 shrink-0 overflow-y-auto transition-colors duration-200 ${
        isLight ? 'bg-white border-r border-slate-200' : 'bg-[#0A0A0B] border-r border-[#1E1E21]'
      }`}>
        
        <div className="space-y-4">
          
          {/* Brand Logo & Title */}
          <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-100' : 'border-[#1E1E21]/80'}`}>
            <div className="flex items-center gap-3">
              {storeLogo ? (
                <div className={`w-8 h-8 rounded-xl border overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-sm ${
                  isLight ? 'bg-white border-slate-200' : 'bg-black border-[#39FFB0]/40'
                }`}>
                  <img src={storeLogo} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                </div>
              ) : (
                <NasappBrandLogo theme={theme} className="w-8 h-8" />
              )}
              <div>
                <h1 className={`font-display font-bold text-sm leading-tight ${isLight ? 'text-slate-900' : 'text-[#F5F5F4]'}`}>
                  {t.brandName}
                </h1>
                <p className={`font-mono text-[9px] uppercase tracking-wider mt-0.5 ${isLight ? 'text-slate-500' : 'text-[#5E5F64]'}`}>
                  {t.brandSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Bilingual Language Switcher & Modern Theme Switcher */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleLang}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer border shadow-sm ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-[#151517] hover:bg-[#1E1E21] border-[#39FFB0]/40 text-[#39FFB0]'
              }`}
              title="Switch Language (English / العربية)"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </button>

            <button
              onClick={toggleTheme}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer border shadow-sm ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-[#151517] hover:bg-[#1E1E21] border-[#1E1E21] text-amber-300'
              }`}
              title={isAr ? 'تغيير المظهر (فاتح / داكن)' : 'Toggle Light / Dark Theme'}
            >
              {isLight ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isAr ? 'داكن' : 'Dark'}</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'فاتح' : 'Light'}</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Scan Code / Barcode Button */}
          <button
            onClick={() => setGlobalScannerOpen(true)}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-md group ${
              isLight
                ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800'
                : 'bg-gradient-to-r from-[#1A2E24] to-[#12221A] hover:from-[#223D30] hover:to-[#172D22] border border-[#39FFB0]/50 text-[#39FFB0]'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center group-hover:scale-110 transition ${
                isLight ? 'bg-emerald-600 text-white' : 'bg-[#39FFB0]/20 text-[#39FFB0]'
              }`}>
                <Camera className="w-3.5 h-3.5" />
              </div>
              <span>{t.scanBarcodeBtn}</span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
              isLight ? 'bg-emerald-600 text-white' : 'bg-[#39FFB0] text-[#04120C]'
            }`}>
              CAMERA
            </span>
          </button>

          {/* Navigation Items */}
          <nav className="space-y-1">
            
            {/* 01 Register */}
            <button
              onClick={() => setActiveTab('register')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'register'
                  ? `bg-[#151517] text-[#F5F5F4] ${isAr ? 'border-r-3' : 'border-l-3'} border-[#39FFB0]`
                  : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] text-[#5E5F64]">01</span>
                <ShoppingBag className="w-4 h-4" />
                <span>{t.register}</span>
              </div>
            </button>

            {/* 02 Inventory */}
            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'inventory'
                  ? `bg-[#151517] text-[#F5F5F4] ${isAr ? 'border-r-3' : 'border-l-3'} border-[#39FFB0]`
                  : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] text-[#5E5F64]">02</span>
                <Package className="w-4 h-4" />
                <span>{t.inventory}</span>
              </div>
              <span className="font-mono text-[10px] text-[#5E5F64]">{products.length}</span>
            </button>

            {/* 03 Kitchen KDS */}
            <button
              onClick={() => setActiveTab('kds')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'kds'
                  ? `bg-[#151517] text-[#39FFB0] ${isAr ? 'border-r-3' : 'border-l-3'} border-[#39FFB0]`
                  : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] text-[#5E5F64]">03</span>
                <ChefHat className="w-4 h-4 text-[#39FFB0]" />
                <span className="font-bold">{t.kds}</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 text-[9px] font-mono font-bold border border-emerald-500/40">
                LIVE
              </span>
            </button>

            {/* 04 Tables & Floor Plan */}
            <button
              onClick={() => setActiveTab('tables')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'tables'
                  ? `bg-[#151517] text-[#B039FF] ${isAr ? 'border-r-3' : 'border-l-3'} border-[#B039FF]`
                  : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] text-[#5E5F64]">04</span>
                <Users className="w-4 h-4 text-purple-400" />
                <span>{t.tables}</span>
              </div>
              <span className="font-mono text-[10px] text-purple-300">
                {tables.filter(t => t.status === 'occupied').length}/{tables.length}
              </span>
            </button>

            {/* 05 Shifts & Cash Drawer */}
            <button
              onClick={() => setActiveTab('shifts')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'shifts'
                  ? `bg-[#151517] text-[#39FFB0] ${isAr ? 'border-r-3' : 'border-l-3'} border-[#39FFB0]`
                  : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] text-[#5E5F64]">05</span>
                <Banknote className="w-4 h-4 text-[#39FFB0]" />
                <span>{t.shifts}</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${shift.status === 'open' ? 'bg-[#39FFB0]' : 'bg-red-500'}`}></span>
            </button>

            {/* 06 Live Orders Queue */}
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'orders'
                  ? `bg-[#151517] text-[#F5F5F4] ${isAr ? 'border-r-3' : 'border-l-3'} border-[#39FFB0]`
                  : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] text-[#5E5F64]">06</span>
                <ClipboardList className="w-4 h-4" />
                <span>{t.orders}</span>
              </div>
              {pendingOrdersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FFB039] text-[#000000] text-[10px] font-mono font-bold">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            {/* 07 Sales Log & Receipts */}
            <button
              onClick={() => setActiveTab('sales')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'sales'
                  ? `bg-[#151517] text-[#F5F5F4] ${isAr ? 'border-r-3' : 'border-l-3'} border-[#39FFB0]`
                  : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] text-[#5E5F64]">07</span>
                <History className="w-4 h-4" />
                <span>{t.sales}</span>
              </div>
              <span className="font-mono text-[10px] text-[#5E5F64]">{sales.length}</span>
            </button>

            {/* 08 Dashboard Analytics */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? `bg-[#151517] text-[#F5F5F4] ${isAr ? 'border-r-3' : 'border-l-3'} border-[#39FFB0]`
                  : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] text-[#5E5F64]">08</span>
                <BarChart3 className="w-4 h-4" />
                <span>{t.dashboard}</span>
              </div>
            </button>

            {/* 09 Customer QR Menu */}
            <button
              onClick={() => setActiveTab('qr')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'qr'
                  ? `bg-[#151517] text-[#F5F5F4] ${isAr ? 'border-r-3' : 'border-l-3'} border-[#39FFB0]`
                  : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] text-[#5E5F64]">09</span>
                <QrCode className="w-4 h-4" />
                <span>{t.qrCode}</span>
              </div>
            </button>

            {/* 10 Barcode Labels */}
            <button
              onClick={() => setActiveTab('labels')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'labels'
                  ? `bg-[#151517] text-[#F5F5F4] ${isAr ? 'border-r-3' : 'border-l-3'} border-[#39FFB0]`
                  : 'text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#151517]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] text-[#5E5F64]">10</span>
                <Tag className="w-4 h-4 text-[#39FFB0]" />
                <span>{t.barcodeLabels}</span>
              </div>
              <span className="px-1.5 py-0.2 bg-[#1A2E24] text-[#39FFB0] rounded text-[9px] font-mono font-bold">
                PRINT
              </span>
            </button>

            {/* Dev API workbench tab */}
            <div className="pt-3">
              <button
                onClick={() => setActiveTab('dev_workbench')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  activeTab === 'dev_workbench'
                    ? 'bg-[#151517] text-[#39B0FF] border-[#39B0FF]/40'
                    : 'text-[#5E5F64] border-transparent hover:text-[#9C9DA3] hover:bg-[#151517]/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{t.devWorkbench}</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#151517] text-[#39B0FF]">
                  REST
                </span>
              </button>
            </div>

          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 space-y-2">
          
          {/* Admin Security & Settings */}
          <button
            onClick={() => setShowAdminSettingsModal(true)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              isLight
                ? 'bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800'
                : 'bg-[#121215] hover:bg-[#1E1E21] border-[#1E1E21] hover:border-[#39FFB0]/40 text-[#9C9DA3] hover:text-[#39FFB0]'
            }`}
            title={isAr ? 'حماية ورمز المشرف' : 'Admin Security & PIN'}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isAr ? 'حماية ورمز المشرف' : 'Admin Security & PIN'}</span>
          </button>

          {/* Quick Lock POS Button */}
          <button
            onClick={handleLockAdmin}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              isLight
                ? 'bg-slate-50 hover:bg-red-50 border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-700'
                : 'bg-[#121215] hover:bg-red-950/40 border-[#1E1E21] hover:border-red-500/40 text-[#9C9DA3] hover:text-red-300'
            }`}
            title="Lock POS Admin"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isAr ? 'قفل لوحة التحكم' : 'Lock POS Screen'}</span>
          </button>

          {/* Switch to Customer Online Store */}
          <button
            onClick={() => setCustomerMode(true)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              isLight
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'bg-[#151517] hover:bg-[#1E1E21] border-[#39FFB0]/30 text-[#39FFB0]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isAr ? 'عرض متجر العملاء' : 'Customer View (Store)'}</span>
          </button>

          <a
            href="https://wa.me/97477315415?text=Hi%2C%20I%20have%20a%20question"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-xs font-semibold transition ${
              isLight
                ? 'border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                : 'border-[#39FFB0]/40 text-[#39FFB0] hover:bg-[#39FFB0]/10'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isAr ? 'الدعم الفني عبر واتساب' : 'Contact on WhatsApp'}</span>
          </a>

          <div className={`text-[10px] font-mono leading-relaxed border-t pt-2 flex items-center justify-between ${
            isLight ? 'text-slate-500 border-slate-200' : 'text-[#5E5F64] border-[#1E1E21]'
          }`}>
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${cloudConnected ? 'bg-[#39FFB0] animate-pulse' : 'bg-[#FFB039]'}`}></span>
              <span>{cloudConnected ? (isAr ? 'سحابة فايربيس متصلة' : 'Live Cloud Firestore') : (isAr ? 'جاري الاتصال...' : 'Connecting...')}</span>
            </span>
          </div>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors duration-200 ${
        isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#000000] text-[#F5F5F4]'
      }`}>
        
        {/* VIEW 1: REGISTER */}
        {activeTab === 'register' && (
          <RegisterView
            products={products}
            onSaleComplete={handleSaleComplete}
            onPrintReceipt={handlePrintReceipt}
            onRefreshProducts={() => {}}
            lang={lang}
          />
        )}

        {/* VIEW 2: INVENTORY */}
        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            onAddProduct={handleAddProduct}
            onBulkAdd={handleBulkAdd}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onNavigateToLabels={() => setActiveTab('labels')}
            lang={lang}
          />
        )}

        {/* VIEW 3: KITCHEN DISPLAY SYSTEM (KDS) */}
        {activeTab === 'kds' && (
          <KitchenDisplayView
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            lang={lang}
          />
        )}

        {/* VIEW 4: TABLE MANAGEMENT & FLOOR PLAN */}
        {activeTab === 'tables' && (
          <TableManagementView
            tables={tables}
            orders={orders}
            onUpdateTable={handleUpdateTable}
            onOpenTableOrder={handleOpenTableOrder}
            lang={lang}
          />
        )}

        {/* VIEW 5: SHIFT & CASH DRAWER MANAGEMENT */}
        {activeTab === 'shifts' && (
          <ShiftManagementView
            shift={shift}
            sales={sales}
            onUpdateShift={handleUpdateShift}
            onCloseShift={handleCloseShift}
            onOpenNewShift={handleOpenNewShift}
            lang={lang}
          />
        )}

        {/* VIEW 6: LIVE ORDERS */}
        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            products={products}
            onUpdateStatus={handleUpdateOrderStatus}
            onCreateManualOrder={handleCreateManualOrder}
            onPrintReceipt={handlePrintReceipt}
            lang={lang}
          />
        )}

        {/* VIEW 4: SALES LOG */}
        {activeTab === 'sales' && (
          <SalesLogView
            sales={sales}
            onPrintReceipt={handlePrintReceipt}
            lang={lang}
          />
        )}

        {/* VIEW 5: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            orders={orders}
          />
        )}

        {/* VIEW 6: CUSTOMER QR */}
        {activeTab === 'qr' && (
          <QRShareView
            onOpenCustomerMode={() => setCustomerMode(true)}
          />
        )}

        {/* VIEW 7: THERMAL BARCODE LABELS GENERATOR */}
        {activeTab === 'labels' && (
          <BarcodeLabelsView
            products={products}
            lang={lang}
          />
        )}

        {/* VIEW 7: DEV WORKBENCH */}
        {activeTab === 'dev_workbench' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E21]">
              <div>
                <h2 className="font-display font-semibold text-xl text-[#F5F5F4]">Developer API Bench</h2>
                <p className="text-xs text-[#9C9DA3]">Inspect and query the live Express.js backend endpoints</p>
              </div>

              <div className="flex items-center gap-1.5 bg-[#0A0A0B] p-1 rounded-lg border border-[#1E1E21] text-xs">
                <button
                  onClick={() => setDevSubTab('api_explorer')}
                  className={`px-3 py-1 rounded-md transition ${
                    devSubTab === 'api_explorer' ? 'bg-[#151517] text-[#39B0FF] font-semibold' : 'text-[#9C9DA3]'
                  }`}
                >
                  API Explorer
                </button>
                <button
                  onClick={() => setDevSubTab('db_viewer')}
                  className={`px-3 py-1 rounded-md transition ${
                    devSubTab === 'db_viewer' ? 'bg-[#151517] text-[#39FFB0] font-semibold' : 'text-[#9C9DA3]'
                  }`}
                >
                  DB Store
                </button>
                <button
                  onClick={() => setDevSubTab('architecture_guide')}
                  className={`px-3 py-1 rounded-md transition ${
                    devSubTab === 'architecture_guide' ? 'bg-[#151517] text-[#F5F5F4] font-semibold' : 'text-[#9C9DA3]'
                  }`}
                >
                  Architecture Guide
                </button>
                <button
                  onClick={() => setDevSubTab('html_runner')}
                  className={`px-3 py-1 rounded-md transition ${
                    devSubTab === 'html_runner' ? 'bg-[#151517] text-[#B039FF] font-semibold' : 'text-[#9C9DA3]'
                  }`}
                >
                  HTML Sandbox
                </button>
              </div>
            </div>

            {devSubTab === 'api_explorer' && <BackendInspector />}
            {devSubTab === 'db_viewer' && <DatabaseViewer />}
            {devSubTab === 'architecture_guide' && <StepByStepGuide />}
            {devSubTab === 'html_runner' && <LiveHtmlRunner />}
          </div>
        )}

      </main>

      {/* Hidden Print Receipt Template */}
      <PrintReceiptArea sale={lastPrintSale} lang={lang} storeLogo={storeLogo} />

      {/* Global Barcode & QR Code Scanner Modal */}
      <BarcodeScannerModal
        isOpen={globalScannerOpen}
        onClose={() => setGlobalScannerOpen(false)}
        onDetected={handleGlobalScan}
        products={products}
        lang={lang}
      />

      {/* Admin Security & Store Branding Modal */}
      <AdminSettingsModal
        isOpen={showAdminSettingsModal}
        onClose={() => setShowAdminSettingsModal(false)}
        lang={lang}
        storeLogo={storeLogo}
        onUpdateStoreLogo={handleUpdateStoreLogo}
        theme={theme}
      />

    </div>
  );
};

export default App;
