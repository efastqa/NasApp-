import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  getDocs,
  setDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Product, Order, Sale, DiningTable, PromoCoupon, CashShift } from './types';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Warning: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initial default products with customizable modifiers
export const INITIAL_PRODUCTS: Product[] = [
  { 
    id: 'p_karak', 
    name: 'Doha Royal Karak Tea', 
    sku: 'BEV-KRK-001', 
    price: 3.50, 
    stock: 250, 
    category: 'Beverages', 
    image: '',
    modifierGroups: [
      {
        id: 'grp_sugar',
        name: 'Sugar Preference',
        nameAr: 'مستوى السكر',
        required: true,
        multiSelect: false,
        options: [
          { id: 'opt_s1', name: 'Regular Sugar', nameAr: 'سكر عادي', price: 0 },
          { id: 'opt_s2', name: 'Less Sugar (Khafeef)', nameAr: 'سكر خفيف', price: 0 },
          { id: 'opt_s3', name: 'No Sugar (Sada)', nameAr: 'بدون سكر (سادة)', price: 0 },
          { id: 'opt_s4', name: 'Extra Sweet (Ziyada)', nameAr: 'سكر زيادة', price: 0 }
        ]
      },
      {
        id: 'grp_spices',
        name: 'Flavor & Spices Add-ons',
        nameAr: 'النكهات والإضافات',
        required: false,
        multiSelect: true,
        options: [
          { id: 'opt_sp1', name: 'Pure Iranian Saffron (Zafran)', nameAr: 'زعفران إيراني أصلي', price: 2.00 },
          { id: 'opt_sp2', name: 'Fresh Crushed Ginger', nameAr: 'زنجبيل طازج', price: 1.00 },
          { id: 'opt_sp3', name: 'Aromatic Cardamom (Hail)', nameAr: 'هيل مميز', price: 1.00 }
        ]
      }
    ]
  },
  { 
    id: 'p_burger', 
    name: 'Nasapp Angus Beef Burger', 
    sku: 'FOD-BGR-002', 
    price: 24.00, 
    stock: 80, 
    category: 'Food', 
    image: '',
    modifierGroups: [
      {
        id: 'grp_combo',
        name: 'Combo Meal Size',
        nameAr: 'حجم الوجبة',
        required: true,
        multiSelect: false,
        options: [
          { id: 'opt_c1', name: 'Single Burger Only', nameAr: 'ساندوتش مفرد فقط', price: 0 },
          { id: 'opt_c2', name: 'Combo (With Fries & Drink)', nameAr: 'كومبو (مع بطاطس ومشروب)', price: 7.00 }
        ]
      },
      {
        id: 'grp_cheese',
        name: 'Extras & Add-ons',
        nameAr: 'الإضافات والصوصات',
        required: false,
        multiSelect: true,
        options: [
          { id: 'opt_ch1', name: 'Extra Melted Cheddar Cheese', nameAr: 'جبن شيدر ذائب إضافي', price: 3.00 },
          { id: 'opt_ch2', name: 'Crispy Jalapeños & Hot Sauce', nameAr: 'هلابينو وصوص حار', price: 2.00 },
          { id: 'opt_ch3', name: 'Truffle Mayo Sauce', nameAr: 'صوص المايونيز بالكمأة', price: 2.50 }
        ]
      }
    ]
  },
  { id: 'p_1', name: 'Storck Alffrucht 425g', sku: 'ZST110DRY00181', price: 16.57, stock: 125, category: 'Chocolate', image: '' },
  { id: 'p_2', name: 'Storck Paradise Fruits 200g', sku: 'ZST110DRY00187', price: 8.00, stock: 8, category: 'Chocolate', image: '' },
  { id: 'p_3', name: 'Storck Mamba 6x48x26.5g', sku: 'ZST110DRY00216', price: 1.20, stock: 1248, category: 'Chocolate', image: '' },
  { id: 'p_4', name: 'Caramel Popcorn 140g', sku: 'ZST110DRY00210', price: 17.50, stock: 2664, category: 'Snacks', image: '' },
  { id: 'p_5', name: 'Storck Knoppers 6x24x25g', sku: 'ZST110DRY00195', price: 1.94, stock: 703, category: 'Chocolate', image: '' },
  { id: 'p_6', name: 'Storck Knoppers Minis 12x200g', sku: 'ZST110DRY00222', price: 19.50, stock: 4216, category: 'Chocolate', image: '' },
  { id: 'p_7', name: 'Storck Mamba Frt/Ch 110g', sku: 'ZST110DRY00178', price: 4.49, stock: 1782, category: 'Chocolate', image: '' }
];

// Initial seeded sales
export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale_101',
    timestamp: Date.now() - 7200000,
    channel: 'instore',
    customerPhone: '+974 7731 5415',
    items: [
      { 
        productId: 'p_karak', 
        name: 'Doha Royal Karak Tea', 
        price: 5.50, 
        qty: 2,
        selectedModifiers: [
          { groupId: 'grp_sugar', groupName: 'Sugar Preference', optionId: 'opt_s2', optionName: 'Less Sugar (Khafeef)', price: 0 },
          { groupId: 'grp_spices', groupName: 'Flavor & Spices Add-ons', optionId: 'opt_sp1', optionName: 'Pure Iranian Saffron (Zafran)', price: 2.00 }
        ],
        notes: 'Extra hot'
      },
      { productId: 'p_4', name: 'Caramel Popcorn 140g', price: 17.50, qty: 1 }
    ],
    subtotal: 28.50,
    discount: { type: 'percentage', value: 0, amount: 0 },
    total: 28.50,
    status: 'completed',
    source: 'pos',
    customerName: 'Fatima Al-Kuwari',
    deliveryMethod: 'pickup'
  }
];

// Initial seeded orders
export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-902',
    timestamp: Date.now() - 300000,
    customerName: 'Nasser Al-Attiyah',
    customerPhone: '+974 6699 8811',
    deliveryMethod: 'delivery',
    deliveryAddress: 'Lusail Fox Hills, Building B4, Apt 301',
    channel: 'online',
    source: 'customer',
    items: [
      { 
        productId: 'p_karak', 
        name: 'Doha Royal Karak Tea', 
        price: 5.50, 
        qty: 2,
        selectedModifiers: [
          { groupId: 'grp_sugar', groupName: 'Sugar Preference', optionId: 'opt_s1', optionName: 'Regular Sugar', price: 0 },
          { groupId: 'grp_spices', groupName: 'Flavor & Spices Add-ons', optionId: 'opt_sp1', optionName: 'Pure Iranian Saffron (Zafran)', price: 2.00 }
        ],
        notes: 'Please keep extra hot'
      },
      { 
        productId: 'p_burger', 
        name: 'Nasapp Angus Beef Burger', 
        price: 31.00, 
        qty: 1,
        selectedModifiers: [
          { groupId: 'grp_combo', groupName: 'Combo Meal Size', optionId: 'opt_c2', optionName: 'Combo (With Fries & Drink)', price: 7.00 }
        ]
      }
    ],
    subtotal: 42.00,
    discount: { type: 'fixed', value: 0, amount: 0 },
    total: 52.00,
    status: 'pending',
    statusHistory: [
      { status: 'pending', timestamp: new Date(Date.now() - 300000).toISOString(), note: 'Customer submitted online via QR menu' }
    ]
  },
  {
    id: 'ord_201',
    timestamp: Date.now() - 1800000,
    customerName: 'Sheikh Jassim',
    customerPhone: '+974 5512 3456',
    deliveryMethod: 'pickup',
    deliveryAddress: '',
    channel: 'online',
    source: 'customer',
    items: [
      { 
        productId: 'p_burger', 
        name: 'Nasapp Angus Beef Burger', 
        price: 33.50, 
        qty: 2,
        selectedModifiers: [
          { groupId: 'grp_combo', groupName: 'Combo Meal Size', optionId: 'opt_c2', optionName: 'Combo (With Fries & Drink)', price: 7.00 },
          { groupId: 'grp_cheese', groupName: 'Extras & Add-ons', optionId: 'opt_ch1', optionName: 'Extra Melted Cheddar Cheese', price: 3.00 },
          { groupId: 'grp_cheese', groupName: 'Extras & Add-ons', optionId: 'opt_ch3', optionName: 'Truffle Mayo Sauce', price: 2.50 }
        ],
        notes: 'No raw onions please'
      }
    ],
    subtotal: 67.00,
    discount: { type: 'fixed', value: 0, amount: 0 },
    total: 67.00,
    status: 'preparing',
    statusHistory: [
      { status: 'pending', timestamp: new Date(Date.now() - 1800000).toISOString(), note: 'Submitted online' },
      { status: 'confirmed', timestamp: new Date(Date.now() - 1500000).toISOString(), note: 'Accepted by cashier' },
      { status: 'preparing', timestamp: new Date(Date.now() - 1200000).toISOString(), note: 'Kitchen prep in progress' }
    ]
  }
];

// Initial seeded dining tables
export const INITIAL_TABLES: DiningTable[] = [
  { id: 'tbl_1', number: 'T-01', name: 'Table 1 - Main Hall', nameAr: 'طاولة 1 - الصالة الرئيسية', section: 'main_hall', capacity: 4, status: 'available' },
  { id: 'tbl_2', number: 'T-02', name: 'Table 2 - Main Hall', nameAr: 'طاولة 2 - الصالة الرئيسية', section: 'main_hall', capacity: 2, status: 'occupied', activeOrderId: 'ord_201', currentTotal: 67.00, customerName: 'Sheikh Jassim', openedAt: Date.now() - 1800000 },
  { id: 'tbl_3', number: 'T-03', name: 'Table 3 - Window View', nameAr: 'طاولة 3 - إطلالة الواجهة', section: 'main_hall', capacity: 6, status: 'available' },
  { id: 'tbl_4', number: 'T-04', name: 'Table 4 - Terrace Sea Breeze', nameAr: 'طاولة 4 - التراس الخارجي', section: 'terrace', capacity: 4, status: 'available' },
  { id: 'tbl_5', number: 'T-05', name: 'Table 5 - Terrace Pergola', nameAr: 'طاولة 5 - برجولة التراس', section: 'terrace', capacity: 4, status: 'reserved', customerName: 'Nasser Al-Attiyah', openedAt: Date.now() + 3600000 },
  { id: 'tbl_6', number: 'VIP-1', name: 'VIP Majlis Suite A', nameAr: 'مجلس VIP الخاص أ', section: 'vip_majlis', capacity: 10, status: 'available' },
  { id: 'tbl_7', number: 'VIP-2', name: 'VIP Majlis Suite B', nameAr: 'مجلس VIP الخاص ب', section: 'vip_majlis', capacity: 12, status: 'available' },
  { id: 'tbl_8', number: 'OD-1', name: 'Outdoor Garden 1', nameAr: 'حديقة خارجية 1', section: 'outdoor', capacity: 4, status: 'available' }
];

// Initial seeded promo coupons
export const INITIAL_COUPONS: PromoCoupon[] = [
  { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, minOrder: 20, description: '10% Welcome Discount', descriptionAr: 'خصم ترحيبي 10%', isActive: true },
  { code: 'DOHA20', discountType: 'percentage', discountValue: 20, minOrder: 50, description: '20% Doha Gourmet Promo', descriptionAr: 'خصم الذواقة 20%', isActive: true },
  { code: 'VIP50', discountType: 'fixed', discountValue: 50, minOrder: 150, description: 'QR 50 Off on orders above QR 150', descriptionAr: 'خصم 50 ر.ق للطلبات فوق 150 ر.ق', isActive: true },
  { code: 'KARAKFREE', discountType: 'fixed', discountValue: 5.50, minOrder: 25, description: 'Complimentary Royal Karak', descriptionAr: 'كرك مجاني للطلبات فوق 25 ر.ق', isActive: true }
];

// Initial active Cash Shift
export const INITIAL_SHIFT: CashShift = {
  id: 'SHIFT-01',
  cashierName: 'Ahmad Al-Kuwari',
  openedAt: Date.now() - 14400000,
  status: 'open',
  openingFloat: 500.00,
  cashIn: 100.00,
  cashOut: 45.00,
  cashSales: 185.00,
  cardSales: 420.00,
  onlineSales: 210.00,
  totalSales: 815.00,
  expectedCash: 740.00, // 500 opening + 100 in - 45 out + 185 cash sales
  transactions: [
    { id: 'tx_open', type: 'cash_in', amount: 500.00, time: Date.now() - 14400000, note: 'Opening Cash Register Float' },
    { id: 'tx_in_1', type: 'cash_in', amount: 100.00, time: Date.now() - 10800000, note: 'Change Addition / Float Refill' },
    { id: 'tx_out_1', type: 'cash_out', amount: 45.00, time: Date.now() - 7200000, note: 'Petty cash: Fresh Mint & Ice Supply' }
  ]
};

// Initial Firestore seed check
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network connection.");
    }
  }
}
testConnection();

export async function initFirestoreData() {
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty) {
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod, { merge: true });
      }
      for (const order of INITIAL_ORDERS) {
        await setDoc(doc(db, 'orders', order.id), order, { merge: true });
      }
      for (const sale of INITIAL_SALES) {
        await setDoc(doc(db, 'sales', sale.id), sale, { merge: true });
      }
    }
  } catch (error) {
    console.info('Firestore initializing with local storage offline cache:', error);
  }
}
