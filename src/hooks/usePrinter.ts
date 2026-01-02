import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  printerService, 
  BluetoothDevice, 
  PrinterSettings, 
  getPrinterSettings, 
  savePrinterSettings,
  ReceiptPrintData,
  isNativePlatform
} from '@/lib/bluetoothPrinter';
import { toast } from 'sonner';

export interface UsePrinterReturn {
  // State
  isScanning: boolean;
  isPrinting: boolean;
  isConnected: boolean;
  isAutoConnecting: boolean;
  connectedDevice: BluetoothDevice | null;
  availableDevices: BluetoothDevice[];
  settings: PrinterSettings;
  isNative: boolean;
  
  // Actions
  scanDevices: () => Promise<void>;
  connectDevice: (device: BluetoothDevice) => Promise<boolean>;
  disconnectDevice: () => Promise<void>;
  printReceipt: (data: ReceiptPrintData) => Promise<boolean>;
  updateSettings: (settings: Partial<PrinterSettings>) => void;
  testPrint: () => Promise<boolean>;
}

export const usePrinter = (): UsePrinterReturn => {
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [settings, setSettings] = useState<PrinterSettings>(getPrinterSettings());
  const [isNative] = useState(isNativePlatform());
  const autoConnectAttempted = useRef(false);

  // Auto-connect to last used printer on mount
  useEffect(() => {
    const autoConnect = async () => {
      // Only attempt once and only on native platform
      if (autoConnectAttempted.current || !isNative) return;
      autoConnectAttempted.current = true;

      const savedSettings = getPrinterSettings();
      
      // Check if auto-connect is enabled and we have a saved device
      if (!savedSettings.autoConnect || !savedSettings.deviceAddress) {
        return;
      }

      setIsAutoConnecting(true);
      
      try {
        const device: BluetoothDevice = {
          id: savedSettings.deviceId || savedSettings.deviceAddress,
          name: savedSettings.deviceName || 'Printer',
          address: savedSettings.deviceAddress,
        };

        console.log('Auto-connecting to printer:', device.name);
        
        const success = await printerService.connect(device);
        if (success) {
          setIsConnected(true);
          setConnectedDevice(device);
          toast.success(`Terhubung otomatis ke ${device.name}`);
        }
      } catch (error) {
        console.error('Auto-connect failed:', error);
        // Silent fail for auto-connect - don't show error toast
      } finally {
        setIsAutoConnecting(false);
      }
    };

    autoConnect();
  }, [isNative]);

  // Check connection status on mount
  useEffect(() => {
    const status = printerService.getConnectionStatus();
    setIsConnected(status.isConnected);
    setConnectedDevice(status.device);
  }, []);

  // Scan for devices
  const scanDevices = useCallback(async () => {
    if (!isNative) {
      toast.info('Fitur scan printer hanya tersedia di aplikasi Android');
      return;
    }

    setIsScanning(true);
    try {
      const devices = await printerService.scanDevices();
      setAvailableDevices(devices);
      
      if (devices.length === 0) {
        toast.info('Tidak ditemukan printer Bluetooth. Pastikan printer sudah di-pair.');
      } else {
        toast.success(`Ditemukan ${devices.length} perangkat`);
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal mencari printer');
    } finally {
      setIsScanning(false);
    }
  }, [isNative]);

  // Connect to device
  const connectDevice = useCallback(async (device: BluetoothDevice): Promise<boolean> => {
    try {
      const success = await printerService.connect(device);
      if (success) {
        setIsConnected(true);
        setConnectedDevice(device);
        toast.success(`Terhubung ke ${device.name}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Connect error:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal terhubung');
      return false;
    }
  }, []);

  // Disconnect
  const disconnectDevice = useCallback(async () => {
    await printerService.disconnect();
    setIsConnected(false);
    setConnectedDevice(null);
    toast.success('Printer terputus');
  }, []);

  // Print receipt
  const printReceipt = useCallback(async (data: ReceiptPrintData): Promise<boolean> => {
    setIsPrinting(true);
    try {
      const success = await printerService.printReceipt(data);
      if (success) {
        toast.success('Struk berhasil dicetak');
      }
      return success;
    } catch (error) {
      console.error('Print error:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal mencetak');
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<PrinterSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    savePrinterSettings(updated);
  }, [settings]);

  // Test print
  const testPrint = useCallback(async (): Promise<boolean> => {
    const testData: ReceiptPrintData = {
      storeName: 'TOKO SEMBAKO',
      storeAddress: 'Jl. Test No. 123',
      storePhone: '(021) 1234567',
      invoice: 'TEST-001',
      date: new Date(),
      cashierName: 'Test Kasir',
      items: [
        { name: 'Produk Test 1', qty: 2, price: 10000, subtotal: 20000 },
        { name: 'Produk Test 2', qty: 1, price: 15000, subtotal: 15000 },
      ],
      subtotal: 35000,
      discount: 0,
      tax: 0,
      total: 35000,
      paymentMethod: 'cash',
      paidAmount: 50000,
      change: 15000,
    };

    return printReceipt(testData);
  }, [printReceipt]);

  return {
    isScanning,
    isPrinting,
    isConnected,
    isAutoConnecting,
    connectedDevice,
    availableDevices,
    settings,
    isNative,
    scanDevices,
    connectDevice,
    disconnectDevice,
    printReceipt,
    updateSettings,
    testPrint,
  };
};
