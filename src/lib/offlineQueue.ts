import { supabase } from './supabase';
import type { OfflineQueueItem, Transaction } from '../types';
let storageKey = 'inventory-demo-queue';
let flushing: Promise<number> | null = null;
export function setQueueOwner(id: string) { storageKey = `inventory-queue-${id}`; }
export function readQueue(): OfflineQueueItem[] {
  try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]'); } catch { return []; }
}
export function enqueueTransaction(payload: Omit<Transaction, 'id' | 'createdAt' | 'synced'>): OfflineQueueItem {
  const item: OfflineQueueItem = { id: crypto.randomUUID(), action: 'transaction', payload, timestamp: new Date().toISOString() };
  localStorage.setItem(storageKey, JSON.stringify([...readQueue(), item]));
  return item;
}
export function flushQueue(): Promise<number> {
  if (flushing) return flushing;
  const key = storageKey;
  flushing = (async () => {
    if (!supabase) return 0;
    let synced = 0;
    for (const q of readQueue()) {
      const { error } = await supabase.rpc('inventory_record_transaction', {
        p_id: q.id, p_item_id: q.payload.itemId, p_type: q.payload.type,
        p_quantity: q.payload.quantity, p_notes: q.payload.notes, p_created_at: q.timestamp,
      });
      if (error) throw new Error(`Sinkronisasi tertunda: ${error.message}`);
      const latest: OfflineQueueItem[] = JSON.parse(localStorage.getItem(key) ?? '[]');
      localStorage.setItem(key, JSON.stringify(latest.filter(x => x.id !== q.id)));
      synced++;
    }
    return synced;
  })().finally(() => { flushing = null; });
  return flushing;
}
