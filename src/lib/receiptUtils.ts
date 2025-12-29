import { CartItem } from '@/store/useCartStore';

interface ReceiptData {
  transactionId: string;
  date: Date;
  cashierName: string;
  items: CartItem[];
  subtotal: number;
  itemsDiscount: number;
  cartDiscount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

export const printReceipt = (data: ReceiptData) => {
  const {
    transactionId,
    date,
    cashierName,
    items,
    subtotal,
    total,
    paymentMethod,
    amountPaid,
    change,
    storeName = 'TOKO SEMBAKO',
    storeAddress = 'Jl. Contoh No. 123',
    storePhone = '(021) 1234567',
  } = data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const paymentMethodLabel = {
    cash: 'Tunai',
    qris: 'QRIS',
    transfer: 'Transfer',
  }[paymentMethod] || paymentMethod;

  // Create receipt HTML
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Struk - ${transactionId}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          padding: 10px;
          max-width: 300px;
          margin: 0 auto;
          background: #fff;
          color: #000;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .store-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .store-info {
          font-size: 10px;
          color: #555;
        }
        .meta {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px dashed #000;
        }
        .items {
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px dashed #000;
        }
        .item {
          margin-bottom: 6px;
        }
        .item-name {
          font-weight: bold;
        }
        .item-detail {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #555;
        }
        .totals {
          margin-bottom: 10px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .total-row.grand {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        .payment {
          border-top: 1px dashed #000;
          padding-top: 10px;
          margin-bottom: 15px;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #555;
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">${storeName}</div>
        <div class="store-info">${storeAddress}</div>
        <div class="store-info">Telp: ${storePhone}</div>
      </div>

      <div class="meta">
        <div>
          <div>No: ${transactionId}</div>
          <div>Kasir: ${cashierName}</div>
        </div>
        <div style="text-align: right;">
          <div>${formatDate(date)}</div>
        </div>
      </div>

      <div class="items">
        ${items
          .map(
            (item) => `
          <div class="item">
            <div class="item-name">${item.product.name}</div>
            <div class="item-detail">
              <span>${item.quantity} x ${formatCurrency(item.product.price)}</span>
              <span>${formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        `
          )
          .join('')}
      </div>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        <div class="total-row grand">
          <span>TOTAL</span>
          <span>${formatCurrency(total)}</span>
        </div>
      </div>

      <div class="payment">
        <div class="total-row">
          <span>Metode</span>
          <span>${paymentMethodLabel}</span>
        </div>
        <div class="total-row">
          <span>Dibayar</span>
          <span>${formatCurrency(amountPaid)}</span>
        </div>
        ${
          change > 0
            ? `
        <div class="total-row" style="font-weight: bold;">
          <span>Kembalian</span>
          <span>${formatCurrency(change)}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="footer">
        <p>Terima kasih atas kunjungan Anda</p>
        <p>Barang yang sudah dibeli</p>
        <p>tidak dapat ditukar/dikembalikan</p>
      </div>
    </body>
    </html>
  `;

  // Open print window
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
};

export const generateTransactionId = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TRX-${dateStr}-${random}`;
};
