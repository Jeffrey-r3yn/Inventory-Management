import { User, Brand, Item, Transaction } from '../types';

export const mockUsers: User[] = [
  { id: 'user-1', fullName: 'Ahmad Manager', role: 'manager' },
  { id: 'user-2', fullName: 'Budi Staff', role: 'staff' },
  { id: 'user-3', fullName: 'Citra Staff', role: 'staff' },
  { id: 'user-4', fullName: 'Dedi Staff', role: 'staff' },
];

export const mockBrands: Brand[] = [
  {
    id: 'brand-1',
    name: 'Kopi Kenangan',
    status: 'active',
    createdBy: 'user-2',
    createdAt: '2024-01-15T08:00:00Z',
    assignedStaff: ['user-2', 'user-3'],
  },
  {
    id: 'brand-2',
    name: 'Teh Pucuk Harum',
    status: 'active',
    createdBy: 'user-1',
    createdAt: '2024-01-20T08:00:00Z',
    assignedStaff: ['user-2'],
  },
  {
    id: 'brand-3',
    name: 'Indofood',
    status: 'pending',
    createdBy: 'user-3',
    createdAt: '2024-02-01T08:00:00Z',
    assignedStaff: [],
  },
  {
    id: 'brand-4',
    name: 'Wardah Beauty',
    status: 'pending',
    createdBy: 'user-2',
    createdAt: '2024-02-05T08:00:00Z',
    assignedStaff: [],
  },
  {
    id: 'brand-5',
    name: 'Unilever',
    status: 'active',
    createdBy: 'user-1',
    createdAt: '2024-01-10T08:00:00Z',
    assignedStaff: ['user-3', 'user-4'],
  },
];

export const mockItems: Item[] = [
  { id: 'item-1', brandId: 'brand-1', sku: 'KK-001', name: 'Kopi Arabika 250g', currentStock: 45, minStockThreshold: 10, costPrice: 35000, sellPrice: 55000, createdAt: '2024-01-15T08:00:00Z' },
  { id: 'item-2', brandId: 'brand-1', sku: 'KK-002', name: 'Kopi Robusta 500g', currentStock: 8, minStockThreshold: 15, costPrice: 45000, sellPrice: 72000, createdAt: '2024-01-15T08:00:00Z' },
  { id: 'item-3', brandId: 'brand-1', sku: 'KK-003', name: 'Latte Botol 330ml', currentStock: 120, minStockThreshold: 30, costPrice: 12000, sellPrice: 22000, createdAt: '2024-01-16T08:00:00Z' },
  { id: 'item-4', brandId: 'brand-1', sku: 'KK-004', name: 'Gula Aren Sachet', currentStock: 200, minStockThreshold: 50, costPrice: 3000, sellPrice: 6000, createdAt: '2024-01-17T08:00:00Z' },
  { id: 'item-5', brandId: 'brand-2', sku: 'TP-001', name: 'Teh Pucuk 350ml', currentStock: 300, minStockThreshold: 100, costPrice: 4000, sellPrice: 7000, createdAt: '2024-01-20T08:00:00Z' },
  { id: 'item-6', brandId: 'brand-2', sku: 'TP-002', name: 'Teh Pucuk 1L', currentStock: 5, minStockThreshold: 20, costPrice: 12000, sellPrice: 20000, createdAt: '2024-01-21T08:00:00Z' },
  { id: 'item-7', brandId: 'brand-5', sku: 'UL-001', name: 'Sabun Lifebuoy 100g', currentStock: 150, minStockThreshold: 40, costPrice: 5000, sellPrice: 8500, createdAt: '2024-01-10T08:00:00Z' },
  { id: 'item-8', brandId: 'brand-5', sku: 'UL-002', name: 'Shampoo Clear 200ml', currentStock: 3, minStockThreshold: 15, costPrice: 22000, sellPrice: 38000, createdAt: '2024-01-11T08:00:00Z' },
  { id: 'item-9', brandId: 'brand-5', sku: 'UL-003', name: 'Pasta Gigi Pepsodent 190g', currentStock: 80, minStockThreshold: 25, costPrice: 15000, sellPrice: 25000, createdAt: '2024-01-12T08:00:00Z' },
  { id: 'item-10', brandId: 'brand-1', sku: 'KK-005', name: 'Espresso Capsule 10pcs', currentStock: 2, minStockThreshold: 10, costPrice: 50000, sellPrice: 85000, createdAt: '2024-02-01T08:00:00Z' },
];

export const mockTransactions: Transaction[] = [
  { id: 'tx-1', itemId: 'item-1', userId: 'user-2', type: 'IN', quantity: 50, notes: 'Restok dari supplier', createdAt: '2024-02-10T09:00:00Z', synced: true },
  { id: 'tx-2', itemId: 'item-2', userId: 'user-2', type: 'OUT', quantity: 10, notes: 'Penjualan harian', createdAt: '2024-02-10T10:00:00Z', synced: true },
  { id: 'tx-3', itemId: 'item-3', userId: 'user-3', type: 'IN', quantity: 100, notes: 'Pengiriman batch', createdAt: '2024-02-11T08:00:00Z', synced: true },
  { id: 'tx-4', itemId: 'item-5', userId: 'user-2', type: 'OUT', quantity: 50, notes: 'Distribusi ke toko', createdAt: '2024-02-11T14:00:00Z', synced: true },
  { id: 'tx-5', itemId: 'item-7', userId: 'user-3', type: 'IN', quantity: 200, notes: 'Restok bulanan', createdAt: '2024-02-12T09:00:00Z', synced: true },
  { id: 'tx-6', itemId: 'item-8', userId: 'user-4', type: 'ADJUST', quantity: -5, notes: 'Barang rusak', createdAt: '2024-02-12T11:00:00Z', synced: true },
];
