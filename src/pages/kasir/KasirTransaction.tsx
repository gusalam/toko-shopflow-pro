import { useState, useRef } from 'react';
import { useProducts, SupabaseProduct } from '@/hooks/useProducts';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { createTransaction, PaymentMethod } from '@/lib/transactionService';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, X, Printer, Check, ShoppingCart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { printReceipt, generateTransactionId } from '@/lib/receiptUtils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const KasirTransaction = () => {
  const { 
    products,
    isLoading: productsLoading,
    searchQuery, 
    setSearchQuery, 
    selectedCategory, 
    setSelectedCategory, 
    getFilteredProducts,
    getCategories,
    getProductByBarcode 
  } = useProducts();
  
  const { items, addItem, removeItem, updateQuantity, getTotal, getTotalItems, clearCart, getSubtotal, getItemsDiscount, getCartDiscount } = useCartStore();
  const { user, currentShift } = useAuthStore();
  
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredProducts = getFilteredProducts();
  const categories = getCategories();
  const total = getTotal();
  const change = Number(amountPaid) - total;
  const totalItems = getTotalItems();

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery) {
      const product = getProductByBarcode(searchQuery);
      if (product) {
        addItem(product);
        setSearchQuery('');
        toast.success(`${product.name} ditambahkan`);
      } else {
        toast.error('Produk tidak ditemukan');
      }
    }
  };

  // handleAddProduct is defined below handleBarcodeScan

  const handleAddProduct = (product: SupabaseProduct) => {
    if (!currentShift?.isActive) {
      toast.error('Silakan buka shift terlebih dahulu sebelum transaksi');
      return;
    }
    if (product.stock <= 0) {
      toast.error('Stok habis');
      return;
    }
    addItem(product);
    toast.success(`${product.name} +1`);
  };

  const handlePayment = () => {
    if (!currentShift?.isActive) {
      toast.error('Silakan buka shift terlebih dahulu');
      return;
    }
    if (items.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }
    setShowPayment(true);
    setAmountPaid(total.toString());
  };

  const processPayment = async () => {
    if (paymentMethod === 'cash' && Number(amountPaid) < total) {
      toast.error('Uang bayar kurang');
      return;
    }

    setIsProcessing(true);

    try {
      // Call Supabase create_transaction function
      const result = await createTransaction({
        items,
        customerId: null,
        subtotal: getSubtotal(),
        discount: getItemsDiscount() + getCartDiscount(),
        tax: 0,
        total,
        paymentMethod,
        paidAmount: Number(amountPaid),
        changeAmount: paymentMethod === 'cash' ? change : 0,
        notes: '',
        shiftId: currentShift?.id || null,
      });

      if (!result.success) {
        toast.error(result.error || 'Gagal memproses transaksi');
        setIsProcessing(false);
        return;
      }

      // Use transaction ID from Supabase or generate local one
      const transactionId = result.transactionId || generateTransactionId();
      setCurrentTransactionId(transactionId);

      setShowPayment(false);
      setShowReceipt(true);
      setShowMobileCart(false);
      toast.success('Transaksi berhasil!');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  const finishTransaction = (print: boolean) => {
    if (print) {
      printReceipt({
        transactionId: currentTransactionId,
        date: new Date(),
        cashierName: user?.name || 'Kasir',
        items,
        subtotal: getSubtotal(),
        itemsDiscount: getItemsDiscount(),
        cartDiscount: getCartDiscount(),
        tax: 0,
        total,
        paymentMethod,
        amountPaid: Number(amountPaid),
        change: paymentMethod === 'cash' ? change : 0,
      });
      toast.success('Struk sedang dicetak...');
    }
    clearCart();
    setShowReceipt(false);
    setAmountPaid('');
    setCurrentTransactionId('');
    toast.success('Transaksi selesai!');
  };

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col lg:flex-row relative">
      {/* Products Section */}
      <div className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6 overflow-hidden">
        {/* Search */}
        <div className="relative mb-3 sm:mb-4">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleBarcodeScan}
            placeholder="Cari atau scan barcode..."
            className="w-full h-11 sm:h-14 pl-10 sm:pl-12 pr-4 rounded-xl bg-input border border-border text-sm sm:text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-3 mb-3 sm:mb-4 scrollbar-hide">
          <button 
            onClick={() => setSelectedCategory(null)} 
            className={cn(
              'px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all', 
              !selectedCategory ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted hover:bg-muted/80'
            )}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)} 
              className={cn(
                'px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all', 
                selectedCategory === cat ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted hover:bg-muted/80'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          {productsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
              <p>{products.length === 0 ? 'Belum ada produk' : 'Produk tidak ditemukan'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 content-start pb-20 lg:pb-4">
              {filteredProducts.map((product) => (
                <button 
                  key={product.id} 
                  onClick={() => handleAddProduct(product)}
                  disabled={product.stock <= 0}
                  className={cn(
                    "bg-card border border-border rounded-xl p-3 sm:p-4 text-left hover:border-primary/50 hover:shadow-lg transition-all active:scale-95",
                    product.stock <= 0 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <p className="font-medium text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2 min-h-[2rem] sm:min-h-[2.5rem]">{product.name}</p>
                  <p className="text-primary font-bold text-sm sm:text-base">{formatCurrency(product.sell_price)}</p>
                  <p className={cn(
                    "text-2xs sm:text-xs mt-0.5",
                    product.stock <= product.min_stock ? "text-destructive" : "text-muted-foreground"
                  )}>
                    Stok: {product.stock}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Cart Section */}
      <div className="hidden lg:flex w-80 xl:w-96 bg-pos-cart border-l border-border flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg">Keranjang ({totalItems})</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
              <p>Keranjang kosong</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="bg-card rounded-xl p-3 border border-border">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-sm flex-1 pr-2 line-clamp-2">{item.product.name}</p>
                  <button 
                    onClick={() => removeItem(item.product.id)} 
                    className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-primary font-bold">{formatCurrency(item.subtotal)}</p>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)} 
                      className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)} 
                      className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-border space-y-4 bg-card">
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
          <button 
            onClick={handlePayment} 
            disabled={items.length === 0} 
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <CreditCard className="w-5 h-5" /> Bayar
          </button>
        </div>
      </div>

      {/* Mobile Cart Button */}
      <button
        onClick={() => setShowMobileCart(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>

      {/* Mobile Cart Modal */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-bold text-lg">Keranjang ({totalItems})</h2>
            <button onClick={() => setShowMobileCart(false)} className="p-2 rounded-lg hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
                <p>Keranjang kosong</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="bg-card rounded-xl p-3 border border-border">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-sm flex-1 pr-2">{item.product.name}</p>
                    <button 
                      onClick={() => removeItem(item.product.id)} 
                      className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-primary font-bold">{formatCurrency(item.subtotal)}</p>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)} 
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)} 
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-border space-y-4 bg-card">
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            <button 
              onClick={handlePayment} 
              disabled={items.length === 0} 
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" /> Bayar
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border sticky top-0 bg-card">
              <h2 className="text-lg sm:text-xl font-bold">Pembayaran</h2>
              <button onClick={() => setShowPayment(false)} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Total Bayar</p>
                <p className="text-3xl sm:text-4xl font-bold text-primary">{formatCurrency(total)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { id: 'cash', label: 'Tunai', icon: Banknote }, 
                  { id: 'qris', label: 'QRIS', icon: QrCode }, 
                  { id: 'bank', label: 'Transfer', icon: CreditCard }
                ].map((m) => (
                  <button 
                    key={m.id} 
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)} 
                    className={cn(
                      'p-3 sm:p-4 rounded-xl border-2 flex flex-col items-center gap-1 sm:gap-2 transition-all', 
                      paymentMethod === m.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    )}
                  >
                    <m.icon className="w-5 sm:w-6 h-5 sm:h-6" />
                    <span className="text-xs sm:text-sm font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
              {paymentMethod === 'cash' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Uang Diterima</label>
                    <input 
                      type="number" 
                      value={amountPaid} 
                      onChange={(e) => setAmountPaid(e.target.value)} 
                      className="w-full h-12 sm:h-14 px-4 rounded-xl bg-input border border-border text-xl sm:text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/50" 
                    />
                  </div>
                  {Number(amountPaid) >= total && (
                    <div className="p-3 sm:p-4 rounded-xl bg-success/20 text-center">
                      <p className="text-xs sm:text-sm text-muted-foreground">Kembalian</p>
                      <p className="text-xl sm:text-2xl font-bold text-success">{formatCurrency(change)}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-4 sm:p-6 border-t border-border sticky bottom-0 bg-card">
              <button 
                onClick={processPayment}
                disabled={isProcessing}
                className="w-full h-12 rounded-xl bg-success text-success-foreground font-semibold flex items-center justify-center gap-2 hover:bg-success/90 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card rounded-2xl shadow-xl border border-border animate-bounce-in text-center p-6 sm:p-8">
            <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4 animate-pulse-success">
              <Check className="w-8 sm:w-10 h-8 sm:h-10 text-success" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Pembayaran Berhasil!</h2>
            <p className="text-muted-foreground mb-6">Transaksi telah selesai</p>
            
            <div className="space-y-2 mb-6 text-left bg-muted/50 rounded-xl p-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bayar</span>
                <span>{formatCurrency(Number(amountPaid))}</span>
              </div>
              {paymentMethod === 'cash' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kembalian</span>
                  <span className="text-success font-bold">{formatCurrency(change)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => finishTransaction(false)}
                className="flex-1 h-12 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 transition-all"
              >
                Selesai
              </button>
              <button
                onClick={() => finishTransaction(true)}
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
              >
                <Printer className="w-4 h-4" />
                Cetak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KasirTransaction;
