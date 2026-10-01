import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, Minus, Package, AlertTriangle, Filter, X } from 'lucide-react';
import Fuse from 'fuse.js';

export default function InventoryPage() {
  const { currentUser, items, brands, getBrandsForUser, addTransaction, addItem } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [showAddItem, setShowAddItem] = useState(false);
  const [transactionSheet, setTransactionSheet] = useState<{ itemId: string; type: 'IN' | 'OUT' } | null>(null);
  const [txQuantity, setTxQuantity] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [newItem, setNewItem] = useState({ brandId: '', sku: '', name: '', costPrice: 0, sellPrice: 0, minStockThreshold: 10 });

  const userBrands = getBrandsForUser().filter(b => b.status === 'active');

  // Fuzzy search
  const fuse = useMemo(() => new Fuse(items, {
    keys: ['name', 'sku'],
    threshold: 0.4,
    includeScore: true,
  }), [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedBrand !== 'all') {
      result = result.filter(i => i.brandId === selectedBrand);
    }
    if (currentUser.role === 'staff') {
      const staffBrandIds = userBrands.map(b => b.id);
      result = result.filter(i => staffBrandIds.includes(i.brandId));
    }
    if (searchQuery.trim()) {
      const fuseResults = fuse.search(searchQuery);
      const fuseIds = new Set(fuseResults.map(r => r.item.id));
      result = result.filter(i => fuseIds.has(i.id));
    }
    return result;
  }, [items, selectedBrand, searchQuery, currentUser, userBrands, fuse]);

  const handleTransaction = () => {
    if (!transactionSheet || !txQuantity || Number(txQuantity) <= 0) return;
    addTransaction({
      itemId: transactionSheet.itemId,
      userId: currentUser.id,
      type: transactionSheet.type,
      quantity: Number(txQuantity),
      notes: txNotes || `${transactionSheet.type === 'IN' ? 'Stok masuk' : 'Stok keluar'}`,
    });
    setTransactionSheet(null);
    setTxQuantity('');
    setTxNotes('');
  };

  const handleAddItem = () => {
    if (!newItem.brandId || !newItem.sku || !newItem.name) return;
    addItem({
      brandId: newItem.brandId,
      sku: newItem.sku,
      name: newItem.name,
      currentStock: 0,
      minStockThreshold: newItem.minStockThreshold,
      costPrice: newItem.costPrice,
      sellPrice: newItem.sellPrice,
    });
    setNewItem({ brandId: '', sku: '', name: '', costPrice: 0, sellPrice: 0, minStockThreshold: 10 });
    setShowAddItem(false);
  };

  const formatCurrency = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Inventaris</h1>
          <p className="text-sm text-gray-500 mt-1">{filteredItems.length} item ditemukan</p>
        </div>
        <button
          disabled={currentUser.role !== "manager"}
          onClick={() => setShowAddItem(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah Item</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari produk... (fuzzy: coba 'kpi' untuk 'kopi')"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Brand</option>
            {userBrands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Produk</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Brand</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Stok</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Harga Beli</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Harga Jual</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Aksi Cepat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.map(item => {
              const brand = brands.find(b => b.id === item.brandId);
              const isLow = item.currentStock <= item.minStockThreshold;
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.sku}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{brand?.name || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                      {isLow && <AlertTriangle className="w-3.5 h-3.5" />}
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(item.costPrice)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(item.sellPrice)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setTransactionSheet({ itemId: item.id, type: 'IN' })}
                        className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> In
                      </button>
                      <button
                        onClick={() => setTransactionSheet({ itemId: item.id, type: 'OUT' })}
                        className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" /> Out
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Tidak ada item ditemukan</p>
          </div>
        )}
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden space-y-2">
        {filteredItems.map(item => {
          const brand = brands.find(b => b.id === item.brandId);
          const isLow = item.currentStock <= item.minStockThreshold;
          return (
            <div key={item.id} className={`bg-white border rounded-xl p-4 ${isLow ? 'border-orange-200' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.sku} • {brand?.name}</p>
                </div>
                {isLow && (
                  <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Low
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className={`text-xl font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{item.currentStock}</p>
                  <p className="text-xs text-gray-500">stok tersedia</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTransactionSheet({ itemId: item.id, type: 'IN' })}
                    className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4" /> In
                  </button>
                  <button
                    onClick={() => setTransactionSheet({ itemId: item.id, type: 'OUT' })}
                    className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Minus className="w-4 h-4" /> Out
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Tidak ada item ditemukan</p>
          </div>
        )}
      </div>

      {/* Transaction Bottom Sheet (Mobile) / Dialog (Desktop) */}
      {transactionSheet && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTransactionSheet(null)} />
          <div className="relative bg-white w-full md:max-w-sm md:rounded-xl rounded-t-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Stok {transactionSheet.type === 'IN' ? 'Masuk' : 'Keluar'}
              </h3>
              <button onClick={() => setTransactionSheet(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {items.find(i => i.id === transactionSheet.itemId)?.name}
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Jumlah</label>
              <input
                type="number"
                value={txQuantity}
                onChange={e => setTxQuantity(e.target.value)}
                placeholder="Masukkan jumlah"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                min="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Catatan (opsional)</label>
              <input
                type="text"
                value={txNotes}
                onChange={e => setTxNotes(e.target.value)}
                placeholder="Catatan transaksi"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleTransaction}
              disabled={!txQuantity || Number(txQuantity) <= 0}
              className={`w-full py-3 rounded-lg font-medium text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                transactionSheet.type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Simpan {transactionSheet.type === 'IN' ? 'Stok Masuk' : 'Stok Keluar'}
            </button>
          </div>
        </div>
      )}

      {/* Add Item Sheet */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddItem(false)} />
          <div className="relative bg-white w-full md:max-w-md md:rounded-xl rounded-t-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Item Baru</h3>
              <button onClick={() => setShowAddItem(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Brand *</label>
                <select
                  value={newItem.brandId}
                  onChange={e => setNewItem(prev => ({ ...prev, brandId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih brand</option>
                  {userBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">SKU *</label>
                <input
                  type="text"
                  value={newItem.sku}
                  onChange={e => setNewItem(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Contoh: KK-006"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nama Produk *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nama produk"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Harga Beli</label>
                  <input
                    type="number"
                    value={newItem.costPrice || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, costPrice: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Harga Jual</label>
                  <input
                    type="number"
                    value={newItem.sellPrice || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, sellPrice: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Min. Stok (Threshold)</label>
                <input
                  type="number"
                  value={newItem.minStockThreshold}
                  onChange={e => setNewItem(prev => ({ ...prev, minStockThreshold: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleAddItem}
              disabled={!newItem.brandId || !newItem.sku || !newItem.name}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Simpan Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
