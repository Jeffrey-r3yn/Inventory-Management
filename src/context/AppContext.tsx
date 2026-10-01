import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Brand, Item, Transaction, Role } from '../types';
import { mockUsers, mockBrands, mockItems, mockTransactions } from '../data/mockData';
import { supabase, TABLES } from '../lib/supabase';
import { readQueue, enqueueTransaction, flushQueue, setQueueOwner } from '../lib/offlineQueue';
interface AppState {
 currentUser: User; users: User[]; brands: Brand[]; items: Item[]; transactions: Transaction[];
 isOnline: boolean; offlineQueueCount: number; error: string | null; loading: boolean;
 switchRole: (role: Role) => void; switchUser: (id: string) => void;
 addUser: (name: string, role: Role) => Promise<void>;
 updateUser: (id: string, name: string, role: Role) => Promise<void>;
 deleteUser: (id: string) => Promise<void>;
 approveBrand: (id: string) => void; requestBrand: (name: string) => void;
 assignStaffToBrand: (id: string, staff: string[]) => void;
 addItem: (item: Omit<Item, 'id' | 'createdAt'>) => void;
 addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'synced'>) => void;
 getItemsByBrand: (id: string) => Item[]; getBrandsForUser: () => Brand[];
 getLowStockItems: (id?: string) => Item[];
}
const AppContext = createContext<AppState | null>(null);
type Data = { users: User[]; brands: Brand[]; items: Item[]; transactions: Transaction[] };
const demo: Data = { users: mockUsers, brands: mockBrands, items: mockItems, transactions: mockTransactions };
export function AppProvider({ children, profile }: { children: React.ReactNode; profile?: User }) {
 const owner = profile?.id ?? 'demo';
 const cacheKey = `inventory-data-${owner}`;
 const [data, setData] = useState<Data>(() => {
   try { const saved = localStorage.getItem(cacheKey); if (saved) return JSON.parse(saved); } catch { /* invalid cache */ }
   return supabase ? { users: [], brands: [], items: [], transactions: [] } : demo;
 });
 const [currentUser, setCurrentUser] = useState<User>(profile ?? mockUsers[0]);
 const [isOnline, setOnline] = useState(navigator.onLine);
 const [offlineQueueCount, setCount] = useState(0);
 const [error, setError] = useState<string | null>(null);
 const [loading, setLoading] = useState(Boolean(supabase));
 const { users, brands, items, transactions } = data;
 useEffect(() => { localStorage.setItem(cacheKey, JSON.stringify(data)); }, [data, cacheKey]);
 const refresh = useCallback(async () => {
   if (!supabase) return;
   const result = await Promise.all(Object.values(TABLES).map(table => supabase!.from(table).select('*')));
   const failed = result.find(r => r.error);
   if (failed?.error) throw new Error(failed.error.message);
   const [u,b,i,t] = result.map(r => r.data ?? []);
   setData({
    users: u.map(r => ({ id: r.id, fullName: r.full_name, role: r.role, avatar: r.avatar })),
    brands: b.map(r => ({ id: r.id, name: r.name, status: r.status, createdBy: r.created_by, createdAt: r.created_at, assignedStaff: r.assigned_staff ?? [] })),
    items: i.map(r => ({ id: r.id, brandId: r.brand_id, sku: r.sku, name: r.name, currentStock: r.current_stock, minStockThreshold: r.min_stock_threshold, costPrice: Number(r.cost_price), sellPrice: Number(r.sell_price), createdAt: r.created_at })),
    transactions: t.map(r => ({ id: r.id, itemId: r.item_id, userId: r.user_id, type: r.type, quantity: r.quantity, notes: r.notes, createdAt: r.created_at, synced: true })).sort((a,b) => b.createdAt.localeCompare(a.createdAt)),
   });
 }, []);
 const run = async (operation: () => Promise<void>) => {
   setError(null);
   try { await operation(); } catch (e) { setError(e instanceof Error ? e.message : 'Operasi gagal'); }
   finally { setCount(readQueue().length); }
 };
 useEffect(() => {
   setQueueOwner(owner); setCount(readQueue().length);
   const sync = async () => {
    setOnline(true);
    try { await flushQueue(); await refresh(); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat data'); }
    finally { setLoading(false); setCount(readQueue().length); }
   };
   const offline = () => setOnline(false);
   if (navigator.onLine) void sync(); else setLoading(false);
   window.addEventListener('online', sync); window.addEventListener('offline', offline);
   return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', offline); };
 }, [owner, refresh]);
 const mutate = async (table: string, row: object, id?: string) => {
   if (!supabase) return;
   const { error } = id ? await supabase.from(table).update(row).eq('id', id) : await supabase.from(table).insert(row);
   if (error) throw new Error(error.message);
   await refresh();
 };
 const switchUser = (id: string) => { if (!supabase) { const u = users.find(u => u.id === id); if (u) setCurrentUser(u); } };
 const addUser = async (name: string, role: Role) => run(async () => {
   if (supabase) throw new Error('Buat akun melalui Supabase Authentication. Profil staff dibuat otomatis; manager dapat mengubah perannya di sini.');
   setData(d => ({ ...d, users: [...d.users, { id: crypto.randomUUID(), fullName: name.trim(), role }] }));
 });
 const updateUser = async (id: string, name: string, role: Role) => run(async () => {
   if (supabase) await mutate(TABLES.users, { full_name: name.trim(), role }, id);
   else setData(d => ({ ...d, users: d.users.map(u => u.id === id ? { ...u, fullName: name.trim(), role } : u) }));
 });
 const deleteUser = async (id: string) => run(async () => {
   if (supabase) throw new Error('Hapus akun melalui Supabase Authentication untuk menjaga referensi audit transaksi.');
   if (id === currentUser.id) throw new Error('User aktif tidak dapat dihapus.');
   setData(d => ({ ...d, users: d.users.filter(u => u.id !== id) }));
 });
 const approveBrand = (id: string) => void run(async () => {
   if (supabase) await mutate(TABLES.brands, { status: 'active' }, id);
   else setData(d => ({ ...d, brands: d.brands.map(b => b.id === id ? { ...b, status: 'active' } : b) }));
 });
 const requestBrand = (name: string) => void run(async () => {
   const brand: Brand = { id: crypto.randomUUID(), name: name.trim(), status: 'pending', createdBy: currentUser.id, createdAt: new Date().toISOString(), assignedStaff: [] };
   if (supabase) await mutate(TABLES.brands, { id: brand.id, name: brand.name, status: brand.status, created_by: brand.createdBy, assigned_staff: [] });
   else setData(d => ({ ...d, brands: [...d.brands, brand] }));
 });
 const assignStaffToBrand = (id: string, staff: string[]) => void run(async () => {
   if (supabase) await mutate(TABLES.brands, { assigned_staff: staff }, id);
   else setData(d => ({ ...d, brands: d.brands.map(b => b.id === id ? { ...b, assignedStaff: staff } : b) }));
 });
 const addItem = (item: Omit<Item, 'id' | 'createdAt'>) => void run(async () => {
   const next = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
   if (supabase) await mutate(TABLES.items, { id: next.id, brand_id: next.brandId, sku: next.sku, name: next.name, current_stock: next.currentStock, min_stock_threshold: next.minStockThreshold, cost_price: next.costPrice, sell_price: next.sellPrice });
   else setData(d => ({ ...d, items: [...d.items, next] }));
 });
 const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt' | 'synced'>) => void run(async () => {
   if (!Number.isInteger(tx.quantity) || tx.quantity === 0 || (tx.type !== 'ADJUST' && tx.quantity < 0)) throw new Error('Jumlah transaksi tidak valid.');
   const delta = tx.type === 'OUT' ? -tx.quantity : tx.quantity;
   const item = items.find(i => i.id === tx.itemId);
   if (!item || item.currentStock + delta < 0) throw new Error('Stok tidak mencukupi.');
   if (supabase) {
    // Persist first; retry uses the same UUID so a lost response cannot duplicate stock.
    enqueueTransaction({ ...tx, userId: currentUser.id });
    setCount(readQueue().length);
    if (isOnline) { await flushQueue(); await refresh(); return; }
   }
   const next: Transaction = { ...tx, userId: currentUser.id, id: crypto.randomUUID(), createdAt: new Date().toISOString(), synced: !supabase };
   setData(d => ({ ...d, transactions: [next, ...d.transactions], items: d.items.map(i => i.id === tx.itemId ? { ...i, currentStock: i.currentStock + delta } : i) }));
 });
 const getBrandsForUser = () => currentUser.role === 'manager' ? brands : brands.filter(b => b.status === 'active' && b.assignedStaff.includes(currentUser.id));
 const getLowStockItems = (id?: string) => items.filter(i => i.currentStock <= i.minStockThreshold && (!id || i.brandId === id) && (currentUser.role === 'manager' || getBrandsForUser().some(b => b.id === i.brandId)));
 return <AppContext.Provider value={{ currentUser, users, brands, items, transactions, isOnline, offlineQueueCount, error, loading,
  switchUser, switchRole: role => { const u = users.find(u => u.role === role); if (u) switchUser(u.id); },
  addUser, updateUser, deleteUser, approveBrand, requestBrand, assignStaffToBrand, addItem, addTransaction,
  getItemsByBrand: id => items.filter(i => i.brandId === id), getBrandsForUser, getLowStockItems }}>{children}</AppContext.Provider>;
}
export function useApp() { const ctx = useContext(AppContext); if (!ctx) throw new Error('AppProvider diperlukan'); return ctx; }
