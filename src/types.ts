export interface ModifierOption {
  id: string;
  name: string;
  nameAr?: string;
  price: number; // additional price in QR (e.g. 0, 2, 3)
}

export interface ModifierGroup {
  id: string;
  name: string;
  nameAr?: string;
  required?: boolean;
  multiSelect?: boolean; // false: single selection (radio), true: multi-selection (checkbox)
  options: ModifierOption[];
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  createdAt?: string;
  station?: 'kitchen' | 'beverage' | 'dessert';
  modifierGroups?: ModifierGroup[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number; // total calculated unit price (base + modifiers)
  basePrice?: number;
  qty: number;
  stock?: number;
  station?: 'kitchen' | 'beverage' | 'dessert';
  completedInKds?: boolean;
  selectedModifiers?: SelectedModifier[];
  notes?: string;
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  amount: number;
  promoCode?: string;
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
  deliveryMethod: 'pickup' | 'delivery' | 'dine_in';
  deliveryAddress?: string;
  tableId?: string;
  tableName?: string;
  guestsCount?: number;
  items: CartItem[];
  subtotal: number;
  discount: Discount;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  source: 'pos' | 'customer' | 'staff';
  channel: 'instore' | 'online';
  statusHistory?: StatusHistory[];
  isKdsBumped?: boolean;
  kdsStartedAt?: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  channel: 'instore' | 'online';
  customerPhone?: string;
  customerName?: string;
  deliveryMethod?: 'pickup' | 'delivery' | 'dine_in';
  deliveryAddress?: string;
  tableId?: string;
  tableName?: string;
  paymentMethod?: 'cash' | 'card' | 'online';
  items: CartItem[];
  subtotal: number;
  discount: Discount;
  total: number;
  status: 'completed';
  source: 'pos' | 'customer' | 'staff';
  shiftId?: string;
}

export interface DiningTable {
  id: string;
  number: string;
  name: string;
  nameAr?: string;
  section: 'main_hall' | 'terrace' | 'vip_majlis' | 'outdoor';
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'billing';
  activeOrderId?: string;
  currentTotal?: number;
  customerName?: string;
  openedAt?: number;
  notes?: string;
}

export interface CashShift {
  id: string;
  cashierName: string;
  openedAt: number;
  closedAt?: number;
  status: 'open' | 'closed';
  openingFloat: number;
  cashIn: number;
  cashOut: number;
  cashSales: number;
  cardSales: number;
  onlineSales: number;
  totalSales: number;
  expectedCash: number;
  actualCash?: number;
  discrepancy?: number;
  notes?: string;
  transactions: Array<{
    id: string;
    type: 'cash_in' | 'cash_out' | 'sale';
    amount: number;
    time: number;
    note: string;
  }>;
}

export interface PromoCoupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrder?: number;
  description: string;
  descriptionAr?: string;
  isActive: boolean;
}

export interface DashboardStats {
  revenue: number;
  salesCount: number;
  avgOrder: number;
  itemsSold: number;
  pendingOrders: number;
  categoryRevenue: Record<string, number>;
  daysTrend: Array<{ date: string; label: string; revenue: number }>;
  channelBreakdown: { online: number; instore: number };
  lowStock: Product[];
}

export interface BackendEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ALL';
  name: string;
  category: string;
  description: string;
  defaultPayload?: any;
  defaultParams?: Record<string, string>;
}

export interface StoredItem {
  id: string;
  title: string;
  category?: string;
  data?: Record<string, any>;
  createdAt: string;
  status?: string;
}

export interface HtmlTemplate {
  id: string;
  name?: string;
  title?: string;
  category: string;
  description: string;
  targetEndpoint?: string;
  html: string;
}
