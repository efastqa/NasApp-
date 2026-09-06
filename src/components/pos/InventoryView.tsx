import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  FileText, 
  Check, 
  Download,
  AlertCircle,
  Camera,
  Barcode as BarcodeIcon,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  Sliders,
  Printer,
  FileDown,
  FileUp,
  Table,
  Link,
  Edit2,
  X
} from 'lucide-react';
import { Product, ModifierGroup } from '../../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ProductModifierEditorModal } from './ProductModifierEditorModal';
import { Language, translations } from '../../i18n';

interface InventoryViewProps {
  products: Product[];
  onAddProduct: (prod: any) => Promise<boolean>;
  onBulkAdd: (prods: any[]) => Promise<boolean>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<boolean>;
  onNavigateToLabels?: () => void;
  lang?: Language;
}

interface ParsedBulkRow {
  name: string;
  price: number;
  sku: string;
  category: string;
  stock: number;
  image?: string;
  isValid: boolean;
  errorReason?: string;
  raw: string;
}

// Curated Instant Food & Beverage Presets for fast 1-click photo assignment
const QUICK_PRESET_IMAGES = [
  { name: 'Karak Tea', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80' },
  { name: 'Burger & Fries', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
  { name: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80' },
  { name: 'Coffee / Latte', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80' },
  { name: 'Fresh Juice', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80' },
  { name: 'Cake / Pastry', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80' },
  { name: 'Appetizers', url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=400&q=80' }
];

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onAddProduct,
  onBulkAdd,
  onUpdateProduct,
  onDeleteProduct,
  onNavigateToLabels,
  lang = 'en'
}) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  // Single Product Form
  const [name, setName] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);

  // Quick edit photo modal for existing product
  const [photoEditProduct, setPhotoEditProduct] = useState<Product | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState<string>('');
  const [editPhotoSaving, setEditPhotoSaving] = useState<boolean>(false);

  // Modifiers Editor Modal State
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);

  // Bulk Import States
  const [bulkOpen, setBulkOpen] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fmt = (n: number) => (isAr ? `${Number(n).toFixed(2)} ر.ق` : `QR ${Number(n).toFixed(2)}`);

  // Resize and encode image to compact data URL
  const processImageFile = (file: File, callback: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const data = canvas.toDataURL('image/jpeg', 0.85);
          callback(data);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || saving) return;

    setSaving(true);
    const prodData = {
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      category: category.trim() || 'General',
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      image: imageDataUrl || imageUrlInput.trim() || undefined
    };

    const ok = await onAddProduct(prodData);
    if (ok) {
      setName('');
      setSku('');
      setCategory('');
      setPrice('');
      setStock('');
      setImageDataUrl('');
      setImageFileName('');
      setImageUrlInput('');
      setShowUrlInput(false);
    }
    setSaving(false);
  };

  // Robust Smart Parser for CSV, Excel copy-paste (Tabs), Semicolons, and Arabic commas
  const parsedBulkResult = useMemo(() => {
    if (!bulkText || !bulkText.trim()) {
      return { items: [], validCount: 0, invalidCount: 0 };
    }

    const lines = bulkText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const parsedRows: ParsedBulkRow[] = [];

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];

      // Detect and skip header row automatically
      const lower = rawLine.toLowerCase();
      const isHeader = (
        (lower.includes('name') || lower.includes('الاسم') || lower.includes('product') || lower.includes('صنف') || lower.includes('منتج') || lower.includes('item')) &&
        (lower.includes('price') || lower.includes('سعر') || lower.includes('sku') || lower.includes('stock') || lower.includes('مخزون') || lower.includes('category') || lower.includes('فئة'))
      );
      if (isHeader) {
        continue;
      }

      let parts: string[] = [];
      if (rawLine.includes('\t')) {
        parts = rawLine.split('\t').map(s => s.trim());
      } else if (rawLine.includes(';')) {
        parts = rawLine.split(';').map(s => s.trim());
      } else {
        const matches = rawLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (matches) {
          parts = matches.map(s => s.replace(/^"|"$/g, '').trim());
        } else {
          parts = rawLine.split(',').map(s => s.trim());
        }
      }

      if (parts.length < 2) {
        parsedRows.push({
          name: rawLine,
          price: 0,
          sku: '',
          category: 'General',
          stock: 0,
          isValid: false,
          errorReason: isAr ? 'بيانات غير كافية (مطلوب على الأقل الاسم والسعر)' : 'Missing name or price',
          raw: rawLine
        });
        continue;
      }

      const pName = parts[0] || '';
      let pSku = '';
      let pPrice = 0;
      let pCat = 'General';
      let pStock = 100;
      let pImg: string | undefined = undefined;

      const priceStr = parts[1]?.replace(/[^\d.]/g, '');
      pPrice = parseFloat(priceStr) || 0;

      if (parts.length >= 3 && parts[2]) {
        pSku = parts[2];
      } else {
        pSku = `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
      }

      if (parts.length >= 4 && parts[3]) {
        pCat = parts[3];
      }

      if (parts.length >= 5 && parts[4]) {
        pStock = parseInt(parts[4].replace(/[^\d]/g, ''), 10) || 0;
      }

      if (parts.length >= 6 && parts[5] && parts[5].startsWith('http')) {
        pImg = parts[5];
      }

      const isValid = Boolean(pName && pPrice > 0);
      let errorReason: string | undefined = undefined;
      if (!pName) errorReason = isAr ? 'الاسم مفقود' : 'Product name missing';
      else if (pPrice <= 0) errorReason = isAr ? 'السعر غير صالح' : 'Invalid price';

      parsedRows.push({
        name: pName,
        price: pPrice,
        sku: pSku,
        category: pCat,
        stock: pStock,
        image: pImg,
        isValid,
        errorReason,
        raw: rawLine
      });
    }

    const validCount = parsedRows.filter(r => r.isValid).length;
    const invalidCount = parsedRows.length - validCount;

    return { items: parsedRows, validCount, invalidCount };
  }, [bulkText, isAr]);

  const handleBulkSubmit = async () => {
    const validItems = parsedBulkResult.items.filter(r => r.isValid);
    if (validItems.length === 0 || saving) return;

    setSaving(true);
    const toImport = validItems.map(r => ({
      name: r.name,
      price: r.price,
      sku: r.sku,
      category: r.category,
      stock: r.stock,
      image: r.image
    }));

    const ok = await onBulkAdd(toImport);
    if (ok) {
      setBulkText('');
      setBulkOpen(false);
    }
    setSaving(false);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setBulkText(text);
        setBulkOpen(true);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const templateContent = [
      'Product Name,Price,SKU,Category,Stock,ImageURL',
      'Doha Signature Karak Tea,4.50,BEV-101,Beverages,250,https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
      'Crispy Chicken Burger,28.00,BGR-202,Food,80,https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
      'Fresh Mango Juice,14.00,JUC-303,Beverages,120,https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
      'Special Saffron Cake,22.00,DS-404,Desserts,45,https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
      'Classic Club Sandwich,18.50,SND-505,Food,90,https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80'
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'nasapp_bulk_products_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadDemoItems = () => {
    const demoItems = [
      'Product Name,Price,SKU,Category,Stock,ImageURL',
      'Royal Karak Tea with Saffron,6.00,BEV-K01,Hot Drinks,300,https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
      'Double Angus Truffle Burger,36.00,BGR-A02,Main Burgers,75,https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
      'Cheesy Loaded Potato Wedges,16.50,APP-W03,Appetizers,120,https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=400&q=80',
      'Spanish Iced Latte,20.00,BEV-L04,Cold Coffee,95,https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
      'Pistachio Milk Cake,24.00,DES-M05,Desserts,50,https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80'
    ].join('\n');
    setBulkText(demoItems);
    setBulkOpen(true);
  };

  const handleExportProductsCSV = () => {
    if (products.length === 0) return;
    const headers = ['ID', 'Product Name', 'Price (QR)', 'SKU', 'Category', 'Stock Quantity', 'Modifiers Count', 'Image'];
    const rows = products.map(p => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      p.price.toFixed(2),
      `"${p.sku || ''}"`,
      `"${p.category || 'General'}"`,
      p.stock,
      p.modifierGroups?.length || 0,
      `"${p.image || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nasapp_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveModifiers = async (productId: string, groups: ModifierGroup[]) => {
    const ok = await onUpdateProduct(productId, { modifierGroups: groups });
    if (ok) {
      setModifierProduct(null);
    }
    return ok;
  };

  // Save quick photo update for existing product
  const handleUpdateProductPhoto = async () => {
    if (!photoEditProduct) return;
    setEditPhotoSaving(true);
    await onUpdateProduct(photoEditProduct.id, { image: editPhotoUrl.trim() || undefined });
    setEditPhotoSaving(false);
    setPhotoEditProduct(null);
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-5">
      
      {/* Header & Quick Action Buttons */}
      <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-semibold text-lg sm:text-xl text-[#F5F5F4]">
              {t.inventoryTitle}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#1A2E24] border border-[#39FFB0]/40 text-[#39FFB0] font-mono text-xs font-bold">
              {products.length} {isAr ? 'أصناف مسجلة' : 'Items'}
            </span>
          </div>
          <p className="text-xs text-[#9C9DA3] mt-0.5">
            {isAr ? 'إدارة كتالوج المنتجات، رفع الصور أو اختيارها بنقرة واحدة، واستيراد CSV/Excel.' : 'Manage catalog items, 1-click photo upload / URLs / presets, barcodes, and custom modifiers.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setBulkOpen(!bulkOpen)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-md ${
              bulkOpen
                ? 'bg-[#39FFB0] text-[#04120C] ring-2 ring-[#39FFB0]/50'
                : 'bg-gradient-to-r from-[#1A2E24] to-[#151517] border border-[#39FFB0]/50 text-[#39FFB0] hover:bg-[#224032]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#39FFB0]" />
            <span>{isAr ? '⚡ استيراد بالجملة (Excel / CSV)' : '⚡ Bulk Import (CSV / Excel)'}</span>
          </button>

          {onNavigateToLabels && (
            <button
              onClick={onNavigateToLabels}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] text-[#F5F5F4] rounded-xl text-xs font-semibold transition cursor-pointer"
              title={t.barcodeLabels}
            >
              <Printer className="w-3.5 h-3.5 text-[#9C9DA3]" />
              <span>{t.barcodeLabels}</span>
            </button>
          )}

          <button
            onClick={handleExportProductsCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4] rounded-xl text-xs font-semibold transition cursor-pointer"
            title={isAr ? 'تصدير الكتالوج الحالي إلى CSV' : 'Export catalog to CSV'}
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصدير CSV' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* BULK IMPORT COMPREHENSIVE DRAWER */}
      {bulkOpen && (
        <div className="bg-[#0A0A0B] border-2 border-[#39FFB0]/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1E1E21]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#39FFB0]/15 flex items-center justify-center text-[#39FFB0]">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#F5F5F4] flex items-center gap-2">
                  <span>{isAr ? 'استيراد وإضافة المنتجات بالجملة (Bulk Product Import)' : 'Bulk Add Products from CSV / Excel'}</span>
                </h3>
                <p className="text-[11px] text-[#9C9DA3]">
                  {isAr 
                    ? 'يمكنك لصق البيانات مباشرة من Excel أو رفع ملف CSV أو تحميل النموذج الجاهز.'
                    : 'Paste directly from Excel / Google Sheets, upload a .CSV file, or use the sample template.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] text-[#39FFB0] rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحميل نموذج CSV' : 'Download Template'}</span>
              </button>

              <button
                type="button"
                onClick={handleLoadDemoItems}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1A2E24] hover:bg-[#204030] border border-[#39FFB0]/40 text-[#39FFB0] rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'ملء بيانات تجريبية' : 'Load Demo Items'}</span>
              </button>

              <button
                onClick={() => setBulkOpen(false)}
                className="p-1.5 text-[#9C9DA3] hover:text-[#F5F5F4] rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Drag and Drop / File Picker */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className={`p-3.5 border border-dashed rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start transition ${
              isDragging ? 'border-[#39FFB0] bg-[#1A2E24]/30' : 'border-[#1E1E21] bg-[#0F0F12]'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileUp className="w-5 h-5 text-[#39FFB0] shrink-0" />
              <div className="text-xs">
                <span className="text-[#F5F5F4] font-medium">
                  {isAr ? 'اسحب وأفلت ملف CSV هنا، أو ' : 'Drag & drop a CSV / TSV file here, or '}
                </span>
                <span className="text-[#9C9DA3] block sm:inline text-[11px]">
                  {isAr ? 'الصيغ المدعومة: Comma separated, Tabs من Excel' : 'Supports Comma-separated & Tab-separated lines'}
                </span>
              </div>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#1E1E21] hover:bg-[#2A2A30] text-[#F5F5F4] text-xs font-semibold rounded-lg cursor-pointer"
              >
                {isAr ? 'اختيار ملف من الجهاز' : 'Choose CSV File'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#9C9DA3]">
                <span>{isAr ? 'مربع لصق البيانات (الاسم، السعر، الباركود SKU، الفئة، المخزون، رابط الصورة):' : 'Paste text (Name, Price, SKU, Category, Stock, ImageURL):'}</span>
                <span className="font-mono">{parsedBulkResult.items.length} {isAr ? 'أسطر تم رصدها' : 'lines detected'}</span>
              </div>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={7}
                placeholder={`Example:\nKarak Tea, 4.50, BEV001, Drinks, 500\nChicken Burger, 25.00, BGR002, Food, 100\nMango Juice, 12.00, BEV003, Drinks, 150`}
                className="w-full p-3 bg-[#050507] border border-[#1E1E21] rounded-xl text-xs font-mono text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0] resize-y"
              />
            </div>

            <div className="lg:col-span-4 flex flex-col justify-between bg-[#0F0F12] border border-[#1E1E21] rounded-xl p-4 space-y-3">
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-[#9C9DA3] uppercase tracking-wider block">
                  {isAr ? 'ملخص الفحص والمعاينة:' : 'Validation Summary:'}
                </span>

                <div className="p-2.5 bg-[#151517] rounded-lg space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9C9DA3] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#39FFB0]" />
                      <span>{isAr ? 'أصناف جاهزة للإضافة' : 'Valid items ready'}:</span>
                    </span>
                    <span className="font-mono font-bold text-[#39FFB0] text-sm">{parsedBulkResult.validCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#9C9DA3] flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? 'أسطر غير صالحة' : 'Invalid rows'}:</span>
                    </span>
                    <span className="font-mono font-bold text-amber-400">{parsedBulkResult.invalidCount}</span>
                  </div>
                </div>

                <p className="text-[10px] text-[#9C9DA3] leading-relaxed">
                  {isAr 
                    ? 'سيتم حفظ كافة الأصناف الصالحة دفعة واحدة ومزامنتها تلقائياً مع قاعدة البيانات.'
                    : 'Valid items will be imported simultaneously in batch and synced to Firestore.'}
                </p>
              </div>

              <button
                disabled={parsedBulkResult.validCount === 0 || saving}
                onClick={handleBulkSubmit}
                className="w-full py-3 bg-[#39FFB0] hover:bg-[#32e09b] disabled:opacity-30 disabled:cursor-not-allowed text-[#04120C] font-black rounded-xl text-xs transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isAr ? 'جاري الاستيراد والتسجيل...' : 'Importing Products...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isAr ? `تأكيد إضافة (${parsedBulkResult.validCount}) منتج الآن` : `Import (${parsedBulkResult.validCount}) Products`}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {parsedBulkResult.items.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#1E1E21]">
              <div className="flex items-center justify-between text-[11px] text-[#9C9DA3]">
                <span className="font-semibold">{isAr ? 'معاينة الأصناف قبل الإضافة:' : 'Import Preview Grid:'}</span>
                <span>{parsedBulkResult.validCount} / {parsedBulkResult.items.length} {isAr ? 'صالح' : 'valid'}</span>
              </div>
              <div className="max-h-44 overflow-y-auto border border-[#1E1E21] rounded-xl bg-[#050507] text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#121215] text-[10px] text-[#9C9DA3] sticky top-0 uppercase border-b border-[#1E1E21]">
                    <tr>
                      <th className="py-1.5 px-3">Status</th>
                      <th className="py-1.5 px-3">{t.productName}</th>
                      <th className="py-1.5 px-3">{t.price}</th>
                      <th className="py-1.5 px-3">{t.skuBarcode}</th>
                      <th className="py-1.5 px-3">{t.category}</th>
                      <th className="py-1.5 px-3">{t.stockCount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1E21]/60 font-mono text-[11px]">
                    {parsedBulkResult.items.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-[#121215]' : 'bg-red-950/20 text-red-300'}>
                        <td className="py-1.5 px-3">
                          {row.isValid ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-sans font-semibold">Ready</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-sans font-semibold">{row.errorReason}</span>
                          )}
                        </td>
                        <td className="py-1.5 px-3 font-sans font-medium text-[#F5F5F4]">{row.name || '—'}</td>
                        <td className="py-1.5 px-3 text-[#39FFB0]">{fmt(row.price)}</td>
                        <td className="py-1.5 px-3 text-[#9C9DA3]">{row.sku}</td>
                        <td className="py-1.5 px-3 text-[#9C9DA3]">{row.category}</td>
                        <td className="py-1.5 px-3 text-[#F5F5F4]">{row.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add New Single Product Form (With Easy Photo Options) */}
      <form onSubmit={handleAddSubmit} className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#39FFB0] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#39FFB0]" />
            <span>{t.addNewProduct}</span>
          </h3>
          <span className="text-[11px] text-[#9C9DA3]">
            {isAr ? 'إمكانية رفع صورة من الجهاز أو رابط أو اختيار صورة فورية' : 'Add via file upload, web URL, or 1-click presets'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`${t.productName} *`}
            className="px-3 py-2 bg-[#000000] border border-[#1E1E21] rounded-lg text-xs text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
          />

          <div className="flex items-center gap-1">
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder={t.skuBarcode}
              className="w-full px-3 py-2 bg-[#000000] border border-[#1E1E21] rounded-lg text-xs font-mono text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="p-2 bg-[#1A2E24] hover:bg-[#224032] border border-[#39FFB0]/40 text-[#39FFB0] rounded-lg transition cursor-pointer shrink-0"
              title={t.scanBarcodeBtn}
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t.category}
            className="px-3 py-2 bg-[#000000] border border-[#1E1E21] rounded-lg text-xs text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
          />

          <input
            type="number"
            step="0.25"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={`${t.price} *`}
            className="px-3 py-2 bg-[#000000] border border-[#1E1E21] rounded-lg text-xs font-mono text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
          />

          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder={t.initialStock}
            className="px-3 py-2 bg-[#000000] border border-[#1E1E21] rounded-lg text-xs font-mono text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
          />
        </div>

        {/* EASY IMAGE SECTION: File Upload + Image URL + Instant Presets */}
        <div className="p-3.5 bg-[#0F0F12] border border-[#1E1E21] rounded-xl space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#F5F5F4] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#39FFB0]" />
              <span>{isAr ? 'صورة المنتج (سهلة ومباشرة):' : 'Product Photo Options (Super Easy):'}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-[#39FFB0] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Link className="w-3 h-3" />
                <span>{showUrlInput ? (isAr ? 'إخفاء الرابط' : 'Hide URL input') : (isAr ? '+ إدخال رابط صورة (URL)' : '+ Add Photo URL')}</span>
              </button>
              {(imageDataUrl || imageUrlInput) && (
                <button
                  type="button"
                  onClick={() => { setImageDataUrl(''); setImageUrlInput(''); setImageFileName(''); }}
                  className="text-[11px] text-red-400 hover:underline cursor-pointer"
                >
                  {isAr ? 'إزالة الصورة' : 'Clear Photo'}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* 1. File Upload Button */}
            <label className="flex items-center gap-2 px-3 py-2 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] hover:border-[#39FFB0]/40 rounded-xl text-xs text-[#F5F5F4] cursor-pointer transition">
              <Upload className="w-4 h-4 text-[#39FFB0]" />
              <span>{imageFileName ? imageFileName : (isAr ? '📁 رفع صورة من جهازك' : '📁 Upload from Device')}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    processImageFile(f, (dUrl) => {
                      setImageDataUrl(dUrl);
                      setImageFileName(f.name);
                      setImageUrlInput('');
                    });
                  }
                }}
              />
            </label>

            {/* 2. Direct Image URL Input (if toggled) */}
            {showUrlInput && (
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => {
                  setImageUrlInput(e.target.value);
                  if (e.target.value) {
                    setImageDataUrl('');
                    setImageFileName('');
                  }
                }}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 min-w-[200px] px-3 py-1.5 bg-[#050507] border border-[#1E1E21] rounded-xl text-xs font-mono text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
              />
            )}

            {/* Current Active Preview */}
            {(imageDataUrl || imageUrlInput) && (
              <div className="flex items-center gap-2 bg-[#151517] px-2.5 py-1 rounded-xl border border-[#39FFB0]/40">
                <img 
                  src={imageDataUrl || imageUrlInput} 
                  alt="Preview" 
                  className="w-8 h-8 rounded-lg object-cover border border-[#39FFB0]" 
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <span className="text-[10px] text-[#39FFB0] font-bold">{isAr ? '✓ جاهزة للعرض' : '✓ Ready'}</span>
              </div>
            )}
          </div>

          {/* 3. 1-Click Curated Presets Bar */}
          <div className="pt-2 border-t border-[#1E1E21]/60">
            <span className="text-[10px] text-[#9C9DA3] block mb-1.5">
              {isAr ? 'أو اختر صورة جاهزة بنقرة واحدة (أطعمة ومشروبات):' : 'Or Pick a 1-Click Fast Photo Preset:'}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setImageUrlInput(preset.url);
                    setImageDataUrl('');
                    setImageFileName(`Preset: ${preset.name}`);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium transition cursor-pointer ${
                    imageUrlInput === preset.url
                      ? 'bg-[#1A2E24] border-[#39FFB0] text-[#39FFB0]'
                      : 'bg-[#151517] border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4] hover:bg-[#1E1E21]'
                  }`}
                >
                  <img src={preset.url} alt={preset.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving || !name.trim() || !price}
            className="px-6 py-2.5 bg-[#39FFB0] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-[#04120C] font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#39FFB0]/10"
          >
            <Plus className="w-4 h-4" />
            <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : t.addProductBtn}</span>
          </button>
        </div>
      </form>

      {/* Inventory Table with 1-Click Photo Editing */}
      <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0F0F12] border-b border-[#1E1E21] text-[11px] font-semibold text-[#9C9DA3] uppercase tracking-wider">
              <tr>
                <th className={`${isAr ? 'text-right' : 'text-left'} py-3 px-4`}>{t.productName}</th>
                <th className={`${isAr ? 'text-right' : 'text-left'} py-3 px-4`}>{t.skuBarcode}</th>
                <th className={`${isAr ? 'text-right' : 'text-left'} py-3 px-4`}>{t.category}</th>
                <th className={`${isAr ? 'text-right' : 'text-left'} py-3 px-4`}>{t.modifiers}</th>
                <th className={`${isAr ? 'text-left' : 'text-right'} py-3 px-4`}>{t.price}</th>
                <th className="py-3 px-4 text-center">{t.stockCount}</th>
                <th className="py-3 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E21]">
              {products.map((p) => {
                const modifierCount = p.modifierGroups?.length || 0;

                return (
                  <tr key={p.id} className="hover:bg-[#121215] transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoEditProduct(p);
                            setEditPhotoUrl(p.image || '');
                          }}
                          className="relative group shrink-0 cursor-pointer"
                          title={isAr ? 'تغيير صورة المنتج' : 'Click to change photo'}
                        >
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-[#1E1E21] group-hover:border-[#39FFB0] transition" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-[#151517] border border-[#1E1E21] flex items-center justify-center text-[#5E5F64] group-hover:border-[#39FFB0] transition">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Edit2 className="w-3 h-3 text-[#39FFB0]" />
                          </div>
                        </button>
                        <div>
                          <p className="font-semibold text-[#F5F5F4]">{p.name}</p>
                          <span className="text-[10px] text-[#5E5F64] font-mono">{p.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[#39FFB0]">
                      {p.sku || '—'}
                    </td>

                    <td className="py-3 px-4 text-[#9C9DA3]">
                      <span className="px-2 py-0.5 rounded bg-[#151517] border border-[#1E1E21] text-[11px]">
                        {p.category || 'General'}
                      </span>
                    </td>

                    {/* Modifiers Column */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setModifierProduct(p)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer border ${
                          modifierCount > 0
                            ? 'bg-[#1A2E24] border-[#39FFB0]/40 text-[#39FFB0] hover:bg-[#224032]'
                            : 'bg-[#151517] border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4] hover:border-[#2A2A30]'
                        }`}
                        title="Configure item options and add-ons"
                      >
                        <Sparkles className="w-3 h-3 text-[#39FFB0]" />
                        <span>
                          {modifierCount > 0 
                            ? (isAr ? `${modifierCount} مجموعات خيارات` : `${modifierCount} Option Groups`)
                            : (isAr ? '+ إضافة خيارات' : '+ Add Options')}
                        </span>
                      </button>
                    </td>

                    <td className={`py-3 px-4 ${isAr ? 'text-left' : 'text-right'} font-mono font-bold text-[#F5F5F4]`}>
                      {fmt(p.price)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <input
                          type="number"
                          defaultValue={p.stock}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val !== p.stock) {
                              onUpdateProduct(p.id, { stock: val });
                            }
                          }}
                          className="w-16 px-2 py-1 bg-[#000000] border border-[#1E1E21] rounded text-center text-xs font-mono text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
                        />
                        {p.stock <= 5 && (
                          <span title={t.lowStockWarning} className="shrink-0 flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            if (confirm(isAr ? `هل أنت متأكد من حذف ${p.name}؟` : `Delete product ${p.name}?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 text-[#9C9DA3] hover:text-red-400 hover:bg-[#1E1E21] rounded-lg transition cursor-pointer"
                          title={t.deleteProduct}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK PHOTO EDIT MODAL */}
      {photoEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E21] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#F5F5F4]">{isAr ? 'تعديل صورة المنتج' : 'Update Product Photo'}</h3>
                <p className="text-xs text-[#9C9DA3]">{photoEditProduct.name}</p>
              </div>
              <button 
                onClick={() => setPhotoEditProduct(null)}
                className="p-1.5 text-[#9C9DA3] hover:text-[#F5F5F4] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center p-3 bg-[#000000] border border-[#1E1E21] rounded-xl">
                {editPhotoUrl ? (
                  <img src={editPhotoUrl} alt="Preview" className="w-24 h-24 rounded-xl object-cover border border-[#39FFB0]" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-[#151517] flex items-center justify-center text-[#9C9DA3]">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                  </div>
                )}
              </div>

              {/* Upload file */}
              <div>
                <label className="block text-[11px] text-[#9C9DA3] uppercase tracking-wider mb-1">
                  {isAr ? 'رفع ملف صورة من الجهاز:' : 'Upload Image File:'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      processImageFile(f, (dUrl) => {
                        setEditPhotoUrl(dUrl);
                      });
                    }
                  }}
                  className="w-full text-xs text-[#9C9DA3] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1A2E24] file:text-[#39FFB0] hover:file:bg-[#204030] cursor-pointer"
                />
              </div>

              {/* Direct URL */}
              <div>
                <label className="block text-[11px] text-[#9C9DA3] uppercase tracking-wider mb-1">
                  {isAr ? 'أو رابط صورة مباشر (URL):' : 'Or Direct Photo URL:'}
                </label>
                <input
                  type="url"
                  value={editPhotoUrl}
                  onChange={(e) => setEditPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-[#000000] border border-[#1E1E21] rounded-xl text-xs font-mono text-[#F5F5F4] focus:outline-none focus:border-[#39FFB0]"
                />
              </div>

              {/* Quick presets */}
              <div>
                <span className="text-[10px] text-[#9C9DA3] block mb-1">
                  {isAr ? 'أو اختر صورة جاهزة:' : 'Or pick instant preset:'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {QUICK_PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditPhotoUrl(preset.url)}
                      className="px-2 py-1 bg-[#151517] hover:bg-[#1E1E21] border border-[#1E1E21] text-[#9C9DA3] hover:text-[#F5F5F4] rounded-lg text-[10px] cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1E1E21]">
              <button
                type="button"
                onClick={() => setEditPhotoUrl('')}
                className="text-xs text-red-400 hover:underline cursor-pointer"
              >
                {isAr ? 'إزالة الصورة' : 'Remove Image'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoEditProduct(null)}
                  className="px-3 py-1.5 bg-[#151517] text-xs text-[#9C9DA3] rounded-lg cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={editPhotoSaving}
                  onClick={handleUpdateProductPhoto}
                  className="px-4 py-1.5 bg-[#39FFB0] text-[#04120C] text-xs font-bold rounded-lg cursor-pointer hover:opacity-90"
                >
                  {editPhotoSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ الصورة' : 'Save Photo')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Modifiers Editor Modal */}
      {modifierProduct && (
        <ProductModifierEditorModal
          isOpen={Boolean(modifierProduct)}
          onClose={() => setModifierProduct(null)}
          product={modifierProduct}
          onSave={handleSaveModifiers}
          lang={lang}
        />
      )}

      {/* Barcode scanner modal */}
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => {
          setSku(code);
          setScannerOpen(false);
        }}
        products={products}
        lang={lang}
      />

    </div>
  );
};

export default InventoryView;
