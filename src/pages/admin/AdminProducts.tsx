import { useState, useRef } from 'react';
import { useProducts, SupabaseProduct, ProductFormData } from '@/hooks/useProducts';
import {
  Search,
  Plus,
  Package,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CATEGORY_OPTIONS = [
  'Beras & Tepung',
  'Minyak Goreng',
  'Gula & Kopi',
  'Mie & Bumbu',
  'Susu & Telur',
  'Sabun & Deterjen',
  'Minuman',
  'Snack',
  'Lainnya',
];

const AdminProducts = () => {
  const {
    products,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    getFilteredProducts,
    getCategories,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useProducts();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupabaseProduct | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<SupabaseProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form refs
  const nameRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const buyPriceRef = useRef<HTMLInputElement>(null);
  const sellPriceRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);
  const unitRef = useRef<HTMLInputElement>(null);
  const minStockRef = useRef<HTMLInputElement>(null);

  const filteredProducts = getFilteredProducts();
  const categories = getCategories();

  const handleSaveProduct = async () => {
    const name = nameRef.current?.value?.trim();
    if (!name) {
      toast.error('Nama produk harus diisi');
      return;
    }

    const productData: ProductFormData = {
      name,
      category: categoryRef.current?.value || '',
      barcode: barcodeRef.current?.value || '',
      buy_price: Number(buyPriceRef.current?.value) || 0,
      sell_price: Number(sellPriceRef.current?.value) || 0,
      stock: Number(stockRef.current?.value) || 0,
      unit: unitRef.current?.value || 'pcs',
      min_stock: Number(minStockRef.current?.value) || 0,
    };

    setIsSaving(true);

    if (editingProduct) {
      const success = await updateProduct(editingProduct.id, productData);
      if (success) {
        setShowAddModal(false);
        setEditingProduct(null);
      }
    } else {
      const success = await addProduct(productData);
      if (success) {
        setShowAddModal(false);
      }
    }

    setIsSaving(false);
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirm) return;
    
    const success = await deleteProduct(deleteConfirm.id);
    if (success) {
      setDeleteConfirm(null);
    }
  };

  const openEditModal = (product: SupabaseProduct) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Produk & Inventory</h1>
          <p className="text-muted-foreground">{products.length} produk tersedia</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-pos-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk atau barcode..."
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="h-12 pl-4 pr-10 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Categories Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
            !selectedCategory
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Produk</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Barcode</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Kategori</th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-muted-foreground">Harga Beli</th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-muted-foreground">Harga Jual</th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-muted-foreground">Stok</th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-mono text-sm">{product.barcode || '-'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      {product.category || 'Lainnya'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-muted-foreground">
                    {formatCurrency(product.buy_price)}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-primary">
                    {formatCurrency(product.sell_price)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {product.stock <= product.min_stock ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium badge-warning">
                        <AlertTriangle className="w-3 h-3" />
                        {product.stock}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium badge-success">
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product)}
                        className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Tidak ada produk ditemukan</p>
            <p className="text-muted-foreground">
              {products.length === 0 
                ? 'Mulai tambah produk pertama Anda' 
                : 'Coba ubah kata kunci atau filter kategori'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] bg-card rounded-2xl shadow-2xl border border-border animate-scale-in overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border shrink-0">
              <h2 className="text-lg sm:text-xl font-bold">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto flex-1">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2 text-foreground">Nama Produk *</label>
                <input
                  ref={nameRef}
                  type="text"
                  defaultValue={editingProduct?.name}
                  placeholder="Nama produk"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2 text-foreground">Kategori</label>
                <div className="relative">
                  <select
                    ref={categoryRef}
                    defaultValue={editingProduct?.category || ''}
                    className="w-full h-12 px-4 pr-10 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer transition-all"
                  >
                    <option value="">Pilih Kategori</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Barcode</label>
                <input
                  ref={barcodeRef}
                  type="text"
                  defaultValue={editingProduct?.barcode || ''}
                  placeholder="Barcode"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Satuan</label>
                <input
                  ref={unitRef}
                  type="text"
                  defaultValue={editingProduct?.unit || 'pcs'}
                  placeholder="pcs, kg, liter"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Harga Beli</label>
                <input
                  ref={buyPriceRef}
                  type="number"
                  defaultValue={editingProduct?.buy_price || 0}
                  placeholder="0"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Harga Jual</label>
                <input
                  ref={sellPriceRef}
                  type="number"
                  defaultValue={editingProduct?.sell_price || 0}
                  placeholder="0"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Stok</label>
                <input
                  ref={stockRef}
                  type="number"
                  defaultValue={editingProduct?.stock || 0}
                  placeholder="0"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Minimum Stok</label>
                <input
                  ref={minStockRef}
                  type="number"
                  defaultValue={editingProduct?.min_stock || 10}
                  placeholder="10"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 sm:p-6 border-t border-border shrink-0">
              <button onClick={closeModal} className="flex-1 btn-pos-secondary">
                Batal
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isSaving}
                className="flex-1 btn-pos-primary flex items-center justify-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus "{deleteConfirm?.name}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProducts;
