import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeftRight, TrendingUp, TrendingDown, RefreshCw, Search, Filter } from 'lucide-react';

export default function TransactionsPage() {
  const { transactions, items, brands, users, currentUser } = useApp();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const sortedTransactions = useMemo(() => {
    let result = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    if (currentUser.role === 'staff') {
      const staffBrandIds = brands.filter(b => b.assignedStaff.includes(currentUser.id)).map(b => b.id);
      const staffItemIds = items.filter(i => staffBrandIds.includes(i.brandId)).map(i => i.id);
      result = result.filter(t => staffItemIds.includes(t.itemId));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => {
        const item = items.find(i => i.id === t.itemId);
        return item?.name.toLowerCase().includes(q) || item?.sku.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q);
      });
    }

    return result;
  }, [transactions, filterType, searchQuery, currentUser, brands, items]);

  const totalIn = transactions.filter(t => t.type === 'IN').reduce((s, t) => s + t.quantity, 0);
  const totalOut = transactions.filter(t => t.type === 'OUT').reduce((s, t) => s + t.quantity, 0);
  const totalAdjust = transactions.filter(t => t.type === 'ADJUST').reduce((s, t) => s + Math.abs(t.quantity), 0);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
        <p className="text-sm text-gray-500 mt-1">Catatan mutasi stok masuk, keluar, dan penyesuaian</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-green-700">+{totalIn}</p>
          <p className="text-xs text-green-600">Stok Masuk</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <TrendingDown className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-red-700">-{totalOut}</p>
          <p className="text-xs text-red-600">Stok Keluar</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
          <RefreshCw className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-yellow-700">{totalAdjust}</p>
          <p className="text-xs text-yellow-600">Adjust</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Tipe</option>
            <option value="IN">Stok Masuk</option>
            <option value="OUT">Stok Keluar</option>
            <option value="ADJUST">Adjust</option>
          </select>
        </div>
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Produk</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Tipe</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Qty</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Catatan</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedTransactions.map(tx => {
              const item = items.find(i => i.id === tx.itemId);
              const user = users.find(u => u.id === tx.userId);
              return (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <span className="text-xs text-gray-400 ml-1">{new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{item?.name || '-'}</p>
                    <p className="text-xs text-gray-500">{item?.sku}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                      tx.type === 'IN' ? 'bg-green-100 text-green-700' :
                      tx.type === 'OUT' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {tx.type === 'IN' ? <TrendingUp className="w-3 h-3" /> :
                       tx.type === 'OUT' ? <TrendingDown className="w-3 h-3" /> :
                       <RefreshCw className="w-3 h-3" />}
                      {tx.type === 'IN' ? 'Masuk' : tx.type === 'OUT' ? 'Keluar' : 'Adjust'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right text-sm font-bold ${
                    tx.type === 'IN' ? 'text-green-600' : tx.type === 'OUT' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : ''}{tx.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user?.fullName || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{tx.notes}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.synced ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {tx.synced ? '✓ Synced' : '⏳ Pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sortedTransactions.length === 0 && (
          <div className="text-center py-12">
            <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada transaksi</p>
          </div>
        )}
      </div>

      {/* Mobile: Card List */}
      <div className="md:hidden space-y-2">
        {sortedTransactions.map(tx => {
          const item = items.find(i => i.id === tx.itemId);
          const user = users.find(u => u.id === tx.userId);
          return (
            <div key={tx.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    tx.type === 'IN' ? 'bg-green-100' : tx.type === 'OUT' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {tx.type === 'IN' ? <TrendingUp className="w-4 h-4 text-green-600" /> :
                     tx.type === 'OUT' ? <TrendingDown className="w-4 h-4 text-red-600" /> :
                     <RefreshCw className="w-4 h-4 text-yellow-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item?.name || '-'}</p>
                    <p className="text-xs text-gray-500">{user?.fullName} • {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    tx.type === 'IN' ? 'text-green-600' : tx.type === 'OUT' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : ''}{tx.quantity}
                  </p>
                  {!tx.synced && <span className="text-[10px] text-orange-500">Pending sync</span>}
                </div>
              </div>
              {tx.notes && (
                <p className="text-xs text-gray-500 mt-2 pl-12">{tx.notes}</p>
              )}
            </div>
          );
        })}
        {sortedTransactions.length === 0 && (
          <div className="text-center py-12">
            <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada transaksi</p>
          </div>
        )}
      </div>
    </div>
  );
}
