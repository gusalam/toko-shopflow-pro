/**
 * Bluetooth Thermal Printer Service
 * Supports ESC/POS commands for 58mm & 80mm thermal printers
 */

import { Capacitor } from '@capacitor/core';

// ESC/POS Commands
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

export const ESC_POS = {
  // Initialize printer
  INIT: [ESC, 0x40],
  
  // Text alignment
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  
  // Text formatting
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT_ON: [ESC, 0x21, 0x10],
  DOUBLE_WIDTH_ON: [ESC, 0x21, 0x20],
  DOUBLE_SIZE_ON: [ESC, 0x21, 0x30],
  NORMAL_SIZE: [ESC, 0x21, 0x00],
  UNDERLINE_ON: [ESC, 0x2D, 0x01],
  UNDERLINE_OFF: [ESC, 0x2D, 0x00],
  
  // Line spacing
  LINE_SPACING_DEFAULT: [ESC, 0x32],
  LINE_SPACING: (n: number) => [ESC, 0x33, n],
  
  // Paper
  FEED_LINE: [LF],
  FEED_LINES: (n: number) => [ESC, 0x64, n],
  CUT_PAPER: [GS, 0x56, 0x00],
  CUT_PAPER_PARTIAL: [GS, 0x56, 0x01],
  
  // Character set
  CHARSET_PC437: [ESC, 0x74, 0x00],
  CHARSET_PC850: [ESC, 0x74, 0x02],
};

export interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  isConnected?: boolean;
}

export interface PrinterSettings {
  deviceId: string | null;
  deviceName: string | null;
  deviceAddress: string | null;
  paperWidth: '58mm' | '80mm';
  autoCut: boolean;
  autoConnect: boolean;
}

const PRINTER_SETTINGS_KEY = 'pos_printer_settings';

// Get saved printer settings
export const getPrinterSettings = (): PrinterSettings => {
  try {
    const saved = localStorage.getItem(PRINTER_SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading printer settings:', e);
  }
  return {
    deviceId: null,
    deviceName: null,
    deviceAddress: null,
    paperWidth: '58mm',
    autoCut: true,
    autoConnect: true,
  };
};

// Save printer settings
export const savePrinterSettings = (settings: PrinterSettings): void => {
  try {
    localStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving printer settings:', e);
  }
};

// Check if running on native platform
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Text encoder for ESC/POS
const textEncoder = new TextEncoder();

export const encodeText = (text: string): number[] => {
  return Array.from(textEncoder.encode(text));
};

// Build receipt data as byte array
export interface ReceiptPrintData {
  storeName: string;
  storeAddress: string;
  storePhone?: string;
  invoice: string;
  date: Date;
  cashierName: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  change: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  bank: 'Transfer',
  credit: 'Kredit',
};

// Create separator line
const createSeparator = (width: number, char = '-'): string => {
  return char.repeat(width);
};

// Pad string to width
const padText = (text: string, width: number, align: 'left' | 'right' | 'center' = 'left'): string => {
  if (text.length >= width) return text.substring(0, width);
  const padding = width - text.length;
  
  if (align === 'right') {
    return ' '.repeat(padding) + text;
  } else if (align === 'center') {
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
  }
  return text + ' '.repeat(padding);
};

// Create two column row
const twoColumns = (left: string, right: string, width: number): string => {
  const rightWidth = right.length;
  const leftWidth = width - rightWidth - 1;
  return padText(left, leftWidth) + ' ' + right;
};

// Printer service class
export class BluetoothPrinterService {
  private static instance: BluetoothPrinterService;
  private isConnectedState = false;
  private connectedDevice: BluetoothDevice | null = null;
  private discoveredDevices: BluetoothDevice[] = [];

  static getInstance(): BluetoothPrinterService {
    if (!BluetoothPrinterService.instance) {
      BluetoothPrinterService.instance = new BluetoothPrinterService();
    }
    return BluetoothPrinterService.instance;
  }

  // Check if Bluetooth is available
  async isBluetoothAvailable(): Promise<boolean> {
    if (!isNativePlatform()) {
      console.log('Not running on native platform');
      return false;
    }
    
    try {
      const { CapacitorThermalPrinter } = await import('capacitor-thermal-printer');
      return CapacitorThermalPrinter !== undefined;
    } catch (e) {
      console.error('Bluetooth not available:', e);
      return false;
    }
  }

  // Scan for Bluetooth devices
  async scanDevices(): Promise<BluetoothDevice[]> {
    if (!isNativePlatform()) {
      console.log('Scanning only available on native platform');
      return [];
    }

    try {
      const { CapacitorThermalPrinter } = await import('capacitor-thermal-printer');
      
      this.discoveredDevices = [];
      
      // Set up listener for discovered devices
      const listener = await CapacitorThermalPrinter.addListener('discoverDevices', (data) => {
        this.discoveredDevices = data.devices.map((d) => ({
          id: d.address,
          name: d.name || 'Unknown Printer',
          address: d.address,
          isConnected: false,
        }));
      });

      // Create a promise that resolves when discovery finishes
      const scanPromise = new Promise<BluetoothDevice[]>((resolve) => {
        CapacitorThermalPrinter.addListener('discoveryFinish', () => {
          listener.remove();
          resolve(this.discoveredDevices);
        });
        
        // Timeout after 15 seconds
        setTimeout(() => {
          CapacitorThermalPrinter.stopScan();
          listener.remove();
          resolve(this.discoveredDevices);
        }, 15000);
      });

      // Start scanning
      await CapacitorThermalPrinter.startScan();
      
      return scanPromise;
    } catch (e) {
      console.error('Error scanning devices:', e);
      throw new Error('Gagal mencari printer. Pastikan Bluetooth aktif.');
    }
  }

  // Connect to a printer
  async connect(device: BluetoothDevice): Promise<boolean> {
    if (!isNativePlatform()) {
      console.log('Connection only available on native platform');
      return false;
    }

    try {
      const { CapacitorThermalPrinter } = await import('capacitor-thermal-printer');
      const result = await CapacitorThermalPrinter.connect({ address: device.address || device.id });
      
      if (result) {
        this.isConnectedState = true;
        this.connectedDevice = device;
        
        // Save as preferred printer
        const settings = getPrinterSettings();
        savePrinterSettings({
          ...settings,
          deviceId: device.id,
          deviceName: device.name,
          deviceAddress: device.address,
        });
        
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error connecting:', e);
      this.isConnectedState = false;
      this.connectedDevice = null;
      throw new Error('Gagal terhubung ke printer');
    }
  }

  // Disconnect from printer
  async disconnect(): Promise<void> {
    if (isNativePlatform()) {
      try {
        const { CapacitorThermalPrinter } = await import('capacitor-thermal-printer');
        await CapacitorThermalPrinter.disconnect();
      } catch (e) {
        console.error('Error disconnecting:', e);
      }
    }
    this.isConnectedState = false;
    this.connectedDevice = null;
  }

  // Check if connected
  async checkConnection(): Promise<boolean> {
    if (!isNativePlatform()) return false;
    
    try {
      const { CapacitorThermalPrinter } = await import('capacitor-thermal-printer');
      return await CapacitorThermalPrinter.isConnected();
    } catch {
      return false;
    }
  }

  // Print receipt
  async printReceipt(data: ReceiptPrintData): Promise<boolean> {
    const settings = getPrinterSettings();
    
    // If not on native platform, fall back to web printing
    if (!isNativePlatform()) {
      console.log('Using web printing fallback');
      this.printWebReceipt(data);
      return true;
    }

    try {
      const { CapacitorThermalPrinter } = await import('capacitor-thermal-printer');
      
      // Build and send receipt using the plugin's builder
      const charWidth = settings.paperWidth === '58mm' ? 32 : 48;
      const separator = '-'.repeat(charWidth);
      const doubleSeparator = '='.repeat(charWidth);

      // Header
      await CapacitorThermalPrinter.begin()
        .align('center')
        .bold(true)
        .doubleWidth(true)
        .doubleHeight(true)
        .text(data.storeName + '\n')
        .doubleWidth(false)
        .doubleHeight(false)
        .bold(false)
        .text(data.storeAddress + '\n')
        .text(data.storePhone ? `Telp: ${data.storePhone}\n` : '')
        .text('\n')
        .text(doubleSeparator + '\n')
        .align('left')
        .text(`No    : ${data.invoice}\n`)
        .text(`Tgl   : ${formatDate(data.date)}\n`)
        .text(`Kasir : ${data.cashierName}\n`)
        .text(separator + '\n')
        .write();

      // Print items
      for (const item of data.items) {
        const subtotalStr = formatCurrency(item.subtotal);
        await CapacitorThermalPrinter.begin()
          .align('left')
          .text(item.name + '\n')
          .text(twoColumns(`  ${item.qty} x ${formatCurrency(item.price)}`, subtotalStr, charWidth) + '\n')
          .write();
      }

      // Print totals
      await CapacitorThermalPrinter.begin()
        .text(separator + '\n')
        .text(twoColumns('Subtotal', formatCurrency(data.subtotal), charWidth) + '\n')
        .write();
      
      if (data.discount > 0) {
        await CapacitorThermalPrinter.begin()
          .text(twoColumns('Diskon', `-${formatCurrency(data.discount)}`, charWidth) + '\n')
          .write();
      }

      if (data.tax > 0) {
        await CapacitorThermalPrinter.begin()
          .text(twoColumns('Pajak', formatCurrency(data.tax), charWidth) + '\n')
          .write();
      }

      await CapacitorThermalPrinter.begin()
        .text(separator + '\n')
        .bold(true)
        .text(twoColumns('TOTAL', formatCurrency(data.total), charWidth) + '\n')
        .bold(false)
        .text(separator + '\n')
        .text(twoColumns('Metode', paymentMethodLabels[data.paymentMethod] || data.paymentMethod, charWidth) + '\n')
        .text(twoColumns('Bayar', formatCurrency(data.paidAmount), charWidth) + '\n')
        .write();

      if (data.change > 0) {
        await CapacitorThermalPrinter.begin()
          .bold(true)
          .text(twoColumns('Kembali', formatCurrency(data.change), charWidth) + '\n')
          .bold(false)
          .write();
      }

      // Footer
      await CapacitorThermalPrinter.begin()
        .text('\n')
        .text(doubleSeparator + '\n')
        .align('center')
        .text('\nTerima kasih atas kunjungan Anda\n')
        .text('Barang yang sudah dibeli\n')
        .text('tidak dapat ditukar/dikembalikan\n')
        .text('\n\n\n\n')
        .write();

      // Cut paper if enabled
      if (settings.autoCut) {
        await CapacitorThermalPrinter.begin().cutPaper().write();
      }

      return true;
    } catch (e) {
      console.error('Error printing:', e);
      throw new Error('Gagal mencetak struk. Periksa koneksi printer.');
    }
  }

  // Web printing fallback
  private printWebReceipt(data: ReceiptPrintData): void {
    const receiptHTML = this.generateReceiptHTML(data);
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }

  // Generate HTML for web printing
  private generateReceiptHTML(data: ReceiptPrintData): string {
    const formatCurrencyLocal = (value: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(value);
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Struk - ${data.invoice}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
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
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .store-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .store-info { font-size: 10px; color: #555; }
          .meta { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #000; }
          .items { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #000; }
          .item { margin-bottom: 6px; }
          .item-name { font-weight: bold; }
          .item-detail { display: flex; justify-content: space-between; font-size: 11px; color: #555; }
          .totals { margin-bottom: 10px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .total-row.grand { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
          .payment { border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px; }
          .footer { text-align: center; font-size: 10px; color: #555; border-top: 1px dashed #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">${data.storeName}</div>
          <div class="store-info">${data.storeAddress}</div>
          ${data.storePhone ? `<div class="store-info">Telp: ${data.storePhone}</div>` : ''}
        </div>
        <div class="meta">
          <div>
            <div>No: ${data.invoice}</div>
            <div>Kasir: ${data.cashierName}</div>
          </div>
          <div style="text-align: right;">
            <div>${formatDate(data.date)}</div>
          </div>
        </div>
        <div class="items">
          ${data.items.map(item => `
            <div class="item">
              <div class="item-name">${item.name}</div>
              <div class="item-detail">
                <span>${item.qty} x ${formatCurrencyLocal(item.price)}</span>
                <span>${formatCurrencyLocal(item.subtotal)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="totals">
          <div class="total-row"><span>Subtotal</span><span>${formatCurrencyLocal(data.subtotal)}</span></div>
          ${data.discount > 0 ? `<div class="total-row"><span>Diskon</span><span>-${formatCurrencyLocal(data.discount)}</span></div>` : ''}
          ${data.tax > 0 ? `<div class="total-row"><span>Pajak</span><span>${formatCurrencyLocal(data.tax)}</span></div>` : ''}
          <div class="total-row grand"><span>TOTAL</span><span>${formatCurrencyLocal(data.total)}</span></div>
        </div>
        <div class="payment">
          <div class="total-row"><span>Metode</span><span>${paymentMethodLabels[data.paymentMethod] || data.paymentMethod}</span></div>
          <div class="total-row"><span>Dibayar</span><span>${formatCurrencyLocal(data.paidAmount)}</span></div>
          ${data.change > 0 ? `<div class="total-row" style="font-weight: bold;"><span>Kembalian</span><span>${formatCurrencyLocal(data.change)}</span></div>` : ''}
        </div>
        <div class="footer">
          <p>Terima kasih atas kunjungan Anda</p>
          <p>Barang yang sudah dibeli</p>
          <p>tidak dapat ditukar/dikembalikan</p>
        </div>
      </body>
      </html>
    `;
  }

  // Get connection status
  getConnectionStatus(): { isConnected: boolean; device: BluetoothDevice | null } {
    return {
      isConnected: this.isConnectedState,
      device: this.connectedDevice,
    };
  }
}

// Export singleton instance
export const printerService = BluetoothPrinterService.getInstance();
