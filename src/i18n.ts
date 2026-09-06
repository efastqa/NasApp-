export type Language = 'en' | 'ar';

export interface TranslationDict {
  brandName: string;
  brandSubtitle: string;
  currency: string;
  currencySymbol: string;
  register: string;
  inventory: string;
  orders: string;
  sales: string;
  dashboard: string;
  qrCode: string;
  devWorkbench: string;
  scanBarcodeBtn: string;
  customerModeBtn: string;
  exitCustomerMode: string;

  // Register & POS
  searchProducts: string;
  allCategories: string;
  currentSale: string;
  emptyCart: string;
  emptyCartDesc: string;
  items: string;
  subtotal: string;
  discount: string;
  applyDiscount: string;
  total: string;
  completePayment: string;
  clearCart: string;
  quickCash: string;
  cardPayment: string;
  whatsappOrder: string;
  printReceipt: string;
  orderCompleted: string;
  stockLeft: string;
  outOfStock: string;
  customDiscount: string;
  scanCode: string;

  // Inventory
  inventoryTitle: string;
  inventorySubtitle: string;
  addNewProduct: string;
  productName: string;
  skuBarcode: string;
  price: string;
  category: string;
  initialStock: string;
  productImage: string;
  addProductBtn: string;
  bulkImport: string;
  bulkImportTitle: string;
  bulkImportSubtitle: string;
  uploadCsvFile: string;
  downloadTemplate: string;
  loadExample: string;
  readyToImport: string;
  invalidRows: string;
  importCountBtn: string;
  exportCsv: string;
  stockCount: string;
  actions: string;
  deleteProduct: string;
  editProduct: string;
  lowStockWarning: string;

  // Modifiers & Add-ons
  modifiers: string;
  modifiersTitle: string;
  modifiersSubtitle: string;
  manageModifiers: string;
  addModifierGroup: string;
  groupName: string;
  groupType: string;
  singleSelect: string;
  multiSelect: string;
  isRequired: string;
  optionName: string;
  optionPrice: string;
  addOption: string;
  saveModifiers: string;
  customNotes: string;
  selectModifiersPrompt: string;
  quickPresetKarak: string;
  quickPresetFood: string;
  quickPresetSize: string;
  noModifiers: string;

  // Barcode Labels Generator
  barcodeLabels: string;
  barcodeLabelsTitle: string;
  barcodeLabelsSubtitle: string;
  labelSize: string;
  printQuantity: string;
  printLabelsBtn: string;
  selectProductToPrint: string;
  customizeLabel: string;
  showPrice: string;
  kds: string;
  tables: string;
  shifts: string;
  showBarcode: string;
  showBrand: string;
  showSku: string;
  showDate: string;
  labelSize50x30: string;
  labelSize40x25: string;
  labelSize58mm: string;
  labelSize80mm: string;
  printPreview: string;
  copies: string;

  // Customer Self-Order
  welcomeMenu: string;
  welcomeMenuSubtitle: string;
  yourCart: string;
  orderType: string;
  dineInPickup: string;
  homeDelivery: string;
  yourName: string;
  yourPhone: string;
  deliveryAddress: string;
  placeOrderWhatsapp: string;
  orderReceived: string;
  orderReceivedDesc: string;
  orderId: string;
  whatsappConfirmation: string;
  continueShopping: string;
  addToCart: string;

  // Orders View
  liveOrdersQueue: string;
  pending: string;
  confirmed: string;
  preparing: string;
  ready: string;
  completed: string;
  cancelled: string;
  acceptOrder: string;
  markPreparing: string;
  markReady: string;
  markCompleted: string;
  cancelOrder: string;
  channelInstore: string;
  channelOnline: string;

  // Sales Log & Receipt
  salesHistory: string;
  allSales: string;
  inStore: string;
  onlineQr: string;
  noSalesYet: string;
  date: string;
  channel: string;
  cashierReceipt: string;
  thankYou: string;
  invoiceNo: string;
  tel: string;

  // Barcode Scanner Modal
  scannerTitle: string;
  scannerSubtitle: string;
  cameraTab: string;
  testCodesTab: string;
  manualCodeTab: string;
  uploadPhotoTab: string;
  alignBarcodePrompt: string;
  scannedResult: string;
  closeScanner: string;
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    brandName: 'Nasapp',
    brandSubtitle: 'Doha Retail Cloud',
    currency: 'QR',
    currencySymbol: 'ر.ق',
    register: 'Register & POS',
    inventory: 'Inventory & Stock',
    orders: 'Live Orders',
    sales: 'Sales & Receipts',
    dashboard: 'Analytics & Insights',
    qrCode: 'Customer QR Menu',
    devWorkbench: 'Developer Suite',
    scanBarcodeBtn: 'Scan Barcode / Code',
    customerModeBtn: 'Customer Menu View',
    exitCustomerMode: 'Exit to Staff POS',

    searchProducts: 'Search products by name or SKU…',
    allCategories: 'All Categories',
    currentSale: 'Current Register Sale',
    emptyCart: 'Register Cart is Empty',
    emptyCartDesc: 'Click items on the left or scan a barcode to add.',
    items: 'items',
    subtotal: 'Subtotal',
    discount: 'Discount',
    applyDiscount: 'Apply Discount',
    total: 'Total to Pay',
    completePayment: 'Complete & Pay',
    clearCart: 'Clear Register',
    quickCash: 'Cash Payment',
    cardPayment: 'Card / POS Terminal',
    whatsappOrder: 'Send via WhatsApp',
    printReceipt: 'Print Thermal Receipt',
    orderCompleted: 'Sale successfully completed!',
    stockLeft: 'in stock',
    outOfStock: 'Out of stock',
    customDiscount: 'Discount (QR or %)',
    scanCode: 'Scan Code',

    inventoryTitle: 'Inventory & Catalogue Management',
    inventorySubtitle: 'Manage products, barcodes, prices, item modifiers, and stock levels',
    addNewProduct: 'Add New Product',
    productName: 'Product Name',
    skuBarcode: 'SKU / Barcode',
    price: 'Price (QR)',
    category: 'Category',
    initialStock: 'Initial Stock',
    productImage: 'Product Image URL / Upload',
    addProductBtn: 'Add Product to Catalogue',
    bulkImport: 'Bulk Import (CSV / Excel)',
    bulkImportTitle: 'Bulk Product Import (CSV & Excel)',
    bulkImportSubtitle: 'Paste data from Excel/Sheets or upload a CSV file with automatic header & format detection',
    uploadCsvFile: 'Upload CSV / Text File',
    downloadTemplate: 'Download Sample CSV',
    loadExample: 'Load Sample Data',
    readyToImport: 'Ready to Import',
    invalidRows: 'Invalid Rows',
    importCountBtn: 'Import Products to Database',
    exportCsv: 'Export Inventory CSV',
    stockCount: 'Stock Count',
    actions: 'Actions',
    deleteProduct: 'Delete',
    editProduct: 'Edit',
    lowStockWarning: 'Low Stock Alert',

    // Modifiers
    modifiers: 'Item Modifiers & Add-ons',
    modifiersTitle: 'Product Customization & Modifiers',
    modifiersSubtitle: 'Set options like Sugar Level, Size, Extra Cheese, Saffron, Toppings',
    manageModifiers: 'Configure Modifiers',
    addModifierGroup: '+ Add Option Group',
    groupName: 'Group Name (e.g. Sugar Level, Size, Extras)',
    groupType: 'Selection Type',
    singleSelect: 'Single Choice (Radio)',
    multiSelect: 'Multiple Choices (Checkboxes)',
    isRequired: 'Required to choose',
    optionName: 'Option Name',
    optionPrice: 'Add Price (+QR)',
    addOption: '+ Add Option',
    saveModifiers: 'Save Modifiers',
    customNotes: 'Kitchen / Special Notes',
    selectModifiersPrompt: 'Select Options & Customizations',
    quickPresetKarak: '☕ Karak / Café Preset',
    quickPresetFood: '🍔 Burger / Food Preset',
    quickPresetSize: '📏 Sizes (S, M, L, XL)',
    noModifiers: 'No custom modifiers configured for this product',

    // Barcode Labels
    barcodeLabels: 'Barcode Labels',
    barcodeLabelsTitle: 'Thermal Barcode & Shelf Label Generator',
    barcodeLabelsSubtitle: 'Print sticky barcode price tags and shelf labels for thermal printers (58mm, 80mm, 50x30mm)',
    labelSize: 'Label Size',
    printQuantity: 'Label Copies',
    printLabelsBtn: 'Print Thermal Labels',
    selectProductToPrint: 'Select Products to Print',
    customizeLabel: 'Customize Label Elements',
    showPrice: 'Show Price (QR)',
    showBarcode: 'Show Barcode',
    showBrand: 'Show Brand (Nasapp)',
    showSku: 'Show SKU Code',
    showDate: 'Show Date / Batch',
    labelSize50x30: '50 × 30 mm (Standard Shelf Tag)',
    labelSize40x25: '40 × 25 mm (Compact Sticker)',
    labelSize58mm: '58 mm (Thermal Continuous Roll)',
    labelSize80mm: '80 mm (Wide Thermal Label)',
    printPreview: 'Live Thermal Print Preview',
    copies: 'copies',
    kds: 'Kitchen KDS',
    tables: 'Tables & Floor',
    shifts: 'Shifts & Cash Drawer',

    welcomeMenu: 'Nasapp Express Store',
    welcomeMenuSubtitle: 'Browse our fresh catalogue, customize your items, and order directly',
    yourCart: 'Your Order Cart',
    orderType: 'Order Method',
    dineInPickup: 'Pickup / Takeaway',
    homeDelivery: 'Express Delivery',
    yourName: 'Full Name',
    yourPhone: 'Qatar Mobile (+974)',
    deliveryAddress: 'Building / Street / Zone (Qatar)',
    placeOrderWhatsapp: 'Submit Order via WhatsApp',
    orderReceived: 'Thank you! Order Placed',
    orderReceivedDesc: 'Your order has been transmitted to our store counter and WhatsApp team.',
    orderId: 'Order ID',
    whatsappConfirmation: 'Chat on WhatsApp',
    continueShopping: 'Order More Items',
    addToCart: 'Add to Cart',

    liveOrdersQueue: 'Live Order Processing Queue',
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready for Pickup/Delivery',
    completed: 'Completed',
    cancelled: 'Cancelled',
    acceptOrder: 'Accept Order',
    markPreparing: 'Start Preparing',
    markReady: 'Mark Ready',
    markCompleted: 'Complete Order',
    cancelOrder: 'Cancel',
    channelInstore: 'In-Store POS',
    channelOnline: 'Online QR Order',

    salesHistory: 'Completed Sales & Transaction Log',
    allSales: 'All Sales',
    inStore: 'In-Store POS',
    onlineQr: 'Online QR',
    noSalesYet: 'No completed sales yet in this period',
    date: 'Date & Time',
    channel: 'Channel',
    cashierReceipt: 'Official Sales Receipt',
    thankYou: 'Thank you for shopping with us!',
    invoiceNo: 'Invoice #',
    tel: 'Tel / WhatsApp: +974 77315415',

    scannerTitle: 'Barcode & QR Code Scanner',
    scannerSubtitle: 'Scan products instantly into register or inventory',
    cameraTab: '📷 Camera Scanner',
    testCodesTab: '⚡ Test Barcodes',
    manualCodeTab: '⌨️ SKU / Code Search',
    uploadPhotoTab: '🖼️ Image Upload',
    alignBarcodePrompt: 'Align Barcode or QR Code in frame',
    scannedResult: 'Scanned Code',
    closeScanner: 'Close Scanner'
  },

  ar: {
    brandName: 'ناس آب (Nasapp)',
    brandSubtitle: 'نظام إدارة المبيعات والمخزون - الدوحة',
    currency: 'ر.ق',
    currencySymbol: 'ر.ق',
    register: 'الكاشير ونقاط البيع',
    inventory: 'المخزون والمنتجات',
    orders: 'الطلبات المباشرة',
    sales: 'المبيعات والفواتير',
    dashboard: 'التحليلات والتقارير',
    qrCode: 'قائمة QR للعملاء',
    devWorkbench: 'أدوات المطورين',
    scanBarcodeBtn: 'مسح الباركود / الكود',
    customerModeBtn: 'عرض قائمة العملاء',
    exitCustomerMode: 'العودة لنظام الكاشير',

    searchProducts: 'ابحث بالاسم أو الباركود SKU…',
    allCategories: 'جميع الفئات',
    currentSale: 'فاتورة البيع الحالية',
    emptyCart: 'سلة المشتريات فارغة',
    emptyCartDesc: 'انقر على المنتجات أو امسح الباركود للإضافة.',
    items: 'عناصر',
    subtotal: 'المجموع الفرعي',
    discount: 'الخصم',
    applyDiscount: 'تطبيق خصم',
    total: 'الإجمالي للدفع',
    completePayment: 'إتمام الدفع والفاتورة',
    clearCart: 'تفريغ السلة',
    quickCash: 'دفع نقدي (كاش)',
    cardPayment: 'دفع بطاقة / نقطة بيع',
    whatsappOrder: 'إرسال عبر الواتساب',
    printReceipt: 'طباعة الإيصال الحراري',
    orderCompleted: 'تمت عملية البيع بنجاح!',
    stockLeft: 'متوفر بالمخزن',
    outOfStock: 'نفد من المخزن',
    customDiscount: 'قيمة الخصم (ر.ق أو %)',
    scanCode: 'مسح الكود',

    inventoryTitle: 'إدارة المخزون وقائمة المنتجات',
    inventorySubtitle: 'إضافة وتعديل المنتجات والباركود والخيارات الإضافية والأسعار',
    addNewProduct: 'إضافة منتج جديد',
    productName: 'اسم المنتج',
    skuBarcode: 'رمز الباركود / SKU',
    price: 'السعر (ر.ق)',
    category: 'الفئة / التصنيف',
    initialStock: 'الكمية الأولية',
    productImage: 'رابط صورة المنتج',
    addProductBtn: 'حفظ المنتج في القائمة',
    bulkImport: 'استيراد جماعي (CSV / إكسل)',
    bulkImportTitle: 'استيراد جماعي للمنتجات (CSV وإكسل)',
    bulkImportSubtitle: 'الصق البيانات مباشرة من Excel أو ارفع ملف CSV مع التعرف التلقائي على التنسيق',
    uploadCsvFile: 'رفع ملف CSV / نصي',
    downloadTemplate: 'تحميل نموذج CSV تجريبي',
    loadExample: 'تعبئة بيانات تجريبية',
    readyToImport: 'جاهز للاستيراد',
    invalidRows: 'أسطر تحتاج تصحيح',
    importCountBtn: 'حفظ المنتجات في قاعدة البيانات',
    exportCsv: 'تصدير المخزون CSV',
    stockCount: 'الكمية الحالية',
    actions: 'الإجراءات',
    deleteProduct: 'حذف',
    editProduct: 'تعديل',
    lowStockWarning: 'تنبيه: مخزون منخفض',

    // Modifiers
    modifiers: 'الخيارات والإضافات',
    modifiersTitle: 'تخصيص الخيارات والإضافات للمنتج',
    modifiersSubtitle: 'تحديد خيارات مثل: مستوى السكر، الحجم، جبن إضافي، زعفران، نكهات',
    manageModifiers: 'إعداد الخيارات والإضافات',
    addModifierGroup: '+ إضافة مجموعة خيارات جديدة',
    groupName: 'اسم المجموعة (مثل: درجة السكر، الحجم، الإضافات)',
    groupType: 'نوع الاختيار',
    singleSelect: 'اختيار واحد فقط (Radio)',
    multiSelect: 'اختيارات متعددة (Checkboxes)',
    isRequired: 'اختيار إجباري',
    optionName: 'اسم الخيار',
    optionPrice: 'السعر الإضافي (+ر.ق)',
    addOption: '+ إضافة خيار',
    saveModifiers: 'حفظ الخيارات والإضافات',
    customNotes: 'ملاحظات خاصة للمطبخ / الطلب',
    selectModifiersPrompt: 'اختر الخيارات والإضافات المطلوبة',
    quickPresetKarak: '☕ نموذج كرك ومشروبات',
    quickPresetFood: '🍔 نموذج ساندويتش ووجبات',
    quickPresetSize: '📏 نموذج المقاسات (S, M, L, XL)',
    noModifiers: 'لا توجد خيارات إضافية مخصصة لهذا المنتج',

    // Barcode Labels
    barcodeLabels: 'ملصقات الباركود',
    barcodeLabelsTitle: 'طباعة وتوليد ملصقات الباركود والأسعار الحرارية',
    barcodeLabelsSubtitle: 'تصميم وطباعة ملصقات الباركود والأسعار اللاصقة لرفوف المحلات والعبوات (58mm, 80mm, 50x30mm)',
    labelSize: 'مقاس الملصق',
    printQuantity: 'عدد النسخ',
    printLabelsBtn: 'طباعة ملصقات الباركود الحرارية',
    selectProductToPrint: 'اختر المنتجات المراد طباعتها',
    customizeLabel: 'تخصيص عناصر الملصق',
    showPrice: 'إظهار السعر (ر.ق)',
    showBarcode: 'إظهار رمز الباركود',
    showBrand: 'إظهار اسم المتجر (ناس آب)',
    showSku: 'إظهار رمز SKU',
    showDate: 'إظهار التاريخ / الدفعة',
    labelSize50x30: '50 × 30 مم (ملصق رفوف قياسي)',
    labelSize40x25: '40 × 25 مم (ملصق منتج صغير)',
    labelSize58mm: '58 مم (رول حراري متصل)',
    labelSize80mm: '80 مم (ملصق حراري عريض)',
    printPreview: 'معاينة الطباعة الحرارية المباشرة',
    copies: 'نسخ',
    kds: 'شاشة المطبخ (KDS)',
    tables: 'الطاولات والصالة',
    shifts: 'الورديات ودرج النقد',

    welcomeMenu: 'متجر ناس آب (Nasapp)',
    welcomeMenuSubtitle: 'تصفح قائمة منتجاتنا، خصص طلبك، واطلب مباشرة للاستلام أو التوصيل',
    yourCart: 'سلة طلبك',
    orderType: 'طريقة الاستلام',
    dineInPickup: 'استلام من المتجر',
    homeDelivery: 'توصيل للمنزل',
    yourName: 'الاسم الكامل',
    yourPhone: 'رقم الجوال القطري (+974)',
    deliveryAddress: 'المبنى / الشارع / المنطقة (قطر)',
    placeOrderWhatsapp: 'تأكيد وإرسال الطلب عبر واتساب',
    orderReceived: 'شكراً لك! تم استلام طلبك',
    orderReceivedDesc: 'تم إرسال تفاصيل طلبك مباشرة للكاشير وفريق خدمة الواتساب.',
    orderId: 'رقم الطلب',
    whatsappConfirmation: 'المحادثة عبر واتساب',
    continueShopping: 'طلب منتجات إضافية',
    addToCart: 'إضافة للسلة',

    liveOrdersQueue: 'شاشة متابعة الطلبات المباشرة',
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    preparing: 'جاري التجهيز',
    ready: 'جاهز للاستلام/التوصيل',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    acceptOrder: 'قبول الطلب',
    markPreparing: 'بدء التجهيز',
    markReady: 'تحديد كجاهز',
    markCompleted: 'إتمام الطلب',
    cancelOrder: 'إلغاء',
    channelInstore: 'طلب مباشر بالمتجر',
    channelOnline: 'طلب أونلاين عبر QR',

    salesHistory: 'سجل العمليات والمبيعات المكتملة',
    allSales: 'جميع المبيعات',
    inStore: 'مبيعات الكاشير',
    onlineQr: 'طلبات الأونلاين (QR)',
    noSalesYet: 'لا توجد مبيعات مكتملة مسجلة بعد في هذه القائمة',
    date: 'التاريخ والوقت',
    channel: 'قناة البيع',
    cashierReceipt: 'إيصال البيع الرسمي',
    thankYou: 'شكراً لتعاملكم معنا!',
    invoiceNo: 'رقم الفاتورة #',
    tel: 'هاتف / واتساب: +974 77315415',

    scannerTitle: 'قارئ الباركود ورموز QR',
    scannerSubtitle: 'مسح سريع للمنتجات مباشرة للكاشير أو المخزون',
    cameraTab: '📷 كاميرا المسح',
    testCodesTab: '⚡ أكواد تجريبية',
    manualCodeTab: '⌨️ بحث بالرمز / SKU',
    uploadPhotoTab: '🖼️ رفع صورة باركود',
    alignBarcodePrompt: 'وجّه الكاميرا نحو الباركود أو رمز QR',
    scannedResult: 'الكود الممسوح',
    closeScanner: 'إغلاق الماسح'
  }
};
