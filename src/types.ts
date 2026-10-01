export type Role = 'manager' | 'staff';
export type BrandStatus = 'active' | 'pending';
export type TransactionType = 'IN' | 'OUT' | 'ADJUST';

export interface User {
  id: string;
  fullName: string;
  role: Role;
  avatar?: string;
}

export interface Brand {
  id: string;
  name: string;
  status: BrandStatus;
  createdBy: string;
  createdAt: string;
  assignedStaff: string[];
}

export interface Item {
  id: string;
  brandId: string;
  sku: string;
  name: string;
  currentStock: number;
  minStockThreshold: number;
  costPrice: number;
  sellPrice: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  userId: string;
  type: TransactionType;
  quantity: number;
  notes: string;
  createdAt: string;
  synced: boolean;
}

export interface OfflineQueueItem {
  id: string;
  action: 'transaction';
  payload: Omit<Transaction, 'id' | 'createdAt' | 'synced'>;
  timestamp: string;
}
