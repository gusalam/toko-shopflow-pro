import { create } from 'zustand';
import type { Product } from './useCartStore';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface ProductState {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  selectedCategory: string | null;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  getFilteredProducts: () => Product[];
  getProductByBarcode: (barcode: string) => Product | undefined;
  getLowStockProducts: () => Product[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => boolean;
  getCategoryProductCount: (categoryId: string) => number;
}

// Dummy data untuk demo
const dummyCategories: Category[] = [
  { id: '1', name: 'Beras & Tepung', icon: '🌾', color: 'bg-amber-500' },
  { id: '2', name: 'Minyak Goreng', icon: '🫗', color: 'bg-yellow-500' },
  { id: '3', name: 'Gula & Kopi', icon: '☕', color: 'bg-orange-500' },
  { id: '4', name: 'Mie & Bumbu', icon: '🍜', color: 'bg-red-500' },
  { id: '5', name: 'Susu & Telur', icon: '🥛', color: 'bg-blue-500' },
  { id: '6', name: 'Sabun & Deterjen', icon: '🧴', color: 'bg-cyan-500' },
  { id: '7', name: 'Minuman', icon: '🥤', color: 'bg-green-500' },
  { id: '8', name: 'Snack', icon: '🍿', color: 'bg-purple-500' },
];

const dummyProducts: Product[] = [
  // Beras & Tepung
  { id: '1', name: 'Beras Premium 5kg', sku: 'BRS001', barcode: '8991001', categoryId: '1', categoryName: 'Beras & Tepung', price: 75000, costPrice: 68000, stock: 50, unit: 'karung', minStock: 10, image: undefined },
  { id: '2', name: 'Beras Medium 5kg', sku: 'BRS002', barcode: '8991002', categoryId: '1', categoryName: 'Beras & Tepung', price: 62000, costPrice: 55000, stock: 45, unit: 'karung', minStock: 10, image: undefined },
  { id: '3', name: 'Tepung Terigu Segitiga 1kg', sku: 'TPG001', barcode: '8991003', categoryId: '1', categoryName: 'Beras & Tepung', price: 14000, costPrice: 12000, stock: 30, unit: 'bungkus', minStock: 15, image: undefined },
  { id: '4', name: 'Tepung Beras 500g', sku: 'TPG002', barcode: '8991004', categoryId: '1', categoryName: 'Beras & Tepung', price: 8500, costPrice: 7000, stock: 25, unit: 'bungkus', minStock: 10, image: undefined },

  // Minyak Goreng
  { id: '5', name: 'Minyak Goreng Bimoli 2L', sku: 'MNY001', barcode: '8992001', categoryId: '2', categoryName: 'Minyak Goreng', price: 38000, costPrice: 34000, stock: 40, unit: 'botol', minStock: 15, image: undefined },
  { id: '6', name: 'Minyak Goreng Filma 1L', sku: 'MNY002', barcode: '8992002', categoryId: '2', categoryName: 'Minyak Goreng', price: 19000, costPrice: 17000, stock: 35, unit: 'botol', minStock: 15, image: undefined },
  { id: '7', name: 'Minyak Goreng Curah 1L', sku: 'MNY003', barcode: '8992003', categoryId: '2', categoryName: 'Minyak Goreng', price: 16000, costPrice: 14000, stock: 8, unit: 'liter', minStock: 20, image: undefined },

  // Gula & Kopi
  { id: '8', name: 'Gula Pasir 1kg', sku: 'GLA001', barcode: '8993001', categoryId: '3', categoryName: 'Gula & Kopi', price: 15000, costPrice: 13500, stock: 60, unit: 'kg', minStock: 20, image: undefined },
  { id: '9', name: 'Gula Merah 500g', sku: 'GLA002', barcode: '8993002', categoryId: '3', categoryName: 'Gula & Kopi', price: 12000, costPrice: 10000, stock: 25, unit: 'bungkus', minStock: 10, image: undefined },
  { id: '10', name: 'Kopi Kapal Api 165g', sku: 'KOP001', barcode: '8993003', categoryId: '3', categoryName: 'Gula & Kopi', price: 18000, costPrice: 15000, stock: 30, unit: 'bungkus', minStock: 10, image: undefined },
  { id: '11', name: 'Kopi ABC Susu 31g x 10', sku: 'KOP002', barcode: '8993004', categoryId: '3', categoryName: 'Gula & Kopi', price: 22000, costPrice: 18000, stock: 5, unit: 'renceng', minStock: 15, image: undefined },

  // Mie & Bumbu
  { id: '12', name: 'Indomie Goreng', sku: 'MIE001', barcode: '8994001', categoryId: '4', categoryName: 'Mie & Bumbu', price: 3500, costPrice: 3000, stock: 200, unit: 'bungkus', minStock: 50, image: undefined },
  { id: '13', name: 'Indomie Kuah Ayam', sku: 'MIE002', barcode: '8994002', categoryId: '4', categoryName: 'Mie & Bumbu', price: 3500, costPrice: 3000, stock: 180, unit: 'bungkus', minStock: 50, image: undefined },
  { id: '14', name: 'Mie Sedaap Goreng', sku: 'MIE003', barcode: '8994003', categoryId: '4', categoryName: 'Mie & Bumbu', price: 3300, costPrice: 2800, stock: 150, unit: 'bungkus', minStock: 50, image: undefined },
  { id: '15', name: 'Royco Ayam 100g', sku: 'BMB001', barcode: '8994004', categoryId: '4', categoryName: 'Mie & Bumbu', price: 8500, costPrice: 7000, stock: 40, unit: 'bungkus', minStock: 15, image: undefined },
  { id: '16', name: 'Masako 250g', sku: 'BMB002', barcode: '8994005', categoryId: '4', categoryName: 'Mie & Bumbu', price: 12000, costPrice: 10000, stock: 35, unit: 'bungkus', minStock: 15, image: undefined },

  // Susu & Telur
  { id: '17', name: 'Susu Indomilk Coklat 190ml', sku: 'SSU001', barcode: '8995001', categoryId: '5', categoryName: 'Susu & Telur', price: 6000, costPrice: 5000, stock: 48, unit: 'kotak', minStock: 24, image: undefined },
  { id: '18', name: 'Susu Kental Manis Frisian 370g', sku: 'SSU002', barcode: '8995002', categoryId: '5', categoryName: 'Susu & Telur', price: 14000, costPrice: 12000, stock: 30, unit: 'kaleng', minStock: 15, image: undefined },
  { id: '19', name: 'Telur Ayam 1kg', sku: 'TLR001', barcode: '8995003', categoryId: '5', categoryName: 'Susu & Telur', price: 28000, costPrice: 25000, stock: 20, unit: 'kg', minStock: 10, image: undefined },

  // Sabun & Deterjen
  { id: '20', name: 'Rinso Anti Noda 900g', sku: 'DTR001', barcode: '8996001', categoryId: '6', categoryName: 'Sabun & Deterjen', price: 22000, costPrice: 18000, stock: 25, unit: 'bungkus', minStock: 10, image: undefined },
  { id: '21', name: 'Sunlight 800ml', sku: 'SBN001', barcode: '8996002', categoryId: '6', categoryName: 'Sabun & Deterjen', price: 18000, costPrice: 15000, stock: 30, unit: 'botol', minStock: 10, image: undefined },
  { id: '22', name: 'Lifebuoy 75g', sku: 'SBN002', barcode: '8996003', categoryId: '6', categoryName: 'Sabun & Deterjen', price: 4500, costPrice: 3800, stock: 50, unit: 'batang', minStock: 20, image: undefined },
  { id: '23', name: 'Molto 900ml', sku: 'DTR002', barcode: '8996004', categoryId: '6', categoryName: 'Sabun & Deterjen', price: 28000, costPrice: 24000, stock: 3, unit: 'botol', minStock: 10, image: undefined },

  // Minuman
  { id: '24', name: 'Aqua 600ml', sku: 'MNM001', barcode: '8997001', categoryId: '7', categoryName: 'Minuman', price: 4000, costPrice: 3000, stock: 100, unit: 'botol', minStock: 48, image: undefined },
  { id: '25', name: 'Teh Pucuk 350ml', sku: 'MNM002', barcode: '8997002', categoryId: '7', categoryName: 'Minuman', price: 4500, costPrice: 3500, stock: 72, unit: 'botol', minStock: 24, image: undefined },
  { id: '26', name: 'Sprite 390ml', sku: 'MNM003', barcode: '8997003', categoryId: '7', categoryName: 'Minuman', price: 6000, costPrice: 4500, stock: 48, unit: 'botol', minStock: 24, image: undefined },

  // Snack
  { id: '27', name: 'Chitato 68g', sku: 'SNK001', barcode: '8998001', categoryId: '8', categoryName: 'Snack', price: 11000, costPrice: 9000, stock: 30, unit: 'bungkus', minStock: 12, image: undefined },
  { id: '28', name: 'Tango Wafer 176g', sku: 'SNK002', barcode: '8998002', categoryId: '8', categoryName: 'Snack', price: 12500, costPrice: 10000, stock: 24, unit: 'bungkus', minStock: 12, image: undefined },
  { id: '29', name: 'Oreo 137g', sku: 'SNK003', barcode: '8998003', categoryId: '8', categoryName: 'Snack', price: 10000, costPrice: 8000, stock: 2, unit: 'bungkus', minStock: 12, image: undefined },
];

export const useProductStore = create<ProductState>((set, get) => ({
  products: dummyProducts,
  categories: dummyCategories,
  searchQuery: '',
  selectedCategory: null,

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSelectedCategory: (categoryId: string | null) => {
    set({ selectedCategory: categoryId });
  },

  getFilteredProducts: () => {
    const { products, searchQuery, selectedCategory } = get();
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.barcode.includes(query) ||
          p.sku.toLowerCase().includes(query)
      );
    }

    return filtered;
  },

  getProductByBarcode: (barcode: string) => {
    return get().products.find((p) => p.barcode === barcode);
  },

  getLowStockProducts: () => {
    return get().products.filter((p) => p.stock <= p.minStock);
  },

  addCategory: (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
    };
    set((state) => ({
      categories: [...state.categories, newCategory],
    }));
  },

  updateCategory: (id: string, category: Partial<Category>) => {
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...category } : c
      ),
      products: state.products.map((p) =>
        p.categoryId === id && category.name
          ? { ...p, categoryName: category.name }
          : p
      ),
    }));
  },

  deleteCategory: (id: string) => {
    const hasProducts = get().products.some((p) => p.categoryId === id);
    if (hasProducts) return false;
    
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
    return true;
  },

  getCategoryProductCount: (categoryId: string) => {
    return get().products.filter((p) => p.categoryId === categoryId).length;
  },
}));
