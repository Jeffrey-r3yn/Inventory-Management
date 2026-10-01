import { useApp } from '../context/AppContext';
import { Package, AlertTriangle, ArrowLeftRight, Tag, WifiOff } from 'lucide-react';

export default function Dashboard() {
  const { brands, items, transactions, getLowStockItems, currentUser, isOnline, offlineQueueCount } = useApp();
  const lowStock = getLowStockItems();
  const activeBrands = brands.filter(b => b.status === 'active');
  const pendingBrands = brands.filter(b => b.status === 'pending');
  const recentTx = transactions.slice(0, 5);

  const stats = [
    { label: 'Brand Aktif', value: activeBrands.length, icon: Tag, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Item', value: items.length, icon: Package, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Stok Menipis', value: lowStock.length, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
    { label: 'Transaksi', value: transactions.length, icon: ArrowLeftRight, color: 'text-violet-600 bg-violet-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Selamat datang, {currentUser.fullName} ({currentUser.role})</p>
      </div>

      {!isOnline && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <WifiOff size={16} />
          Mode offline — {offlineQueueCount} transaksi menunggu disinkronkan.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${s.color}`}>
              <s.icon size={20} />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" /> Stok Menipis
          </h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-400">Semua stok aman.</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.slice(0, 6).map(i => (
                <li key={i.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{i.name}</span>
                  <span className="font-semibold text-red-600">{i.currentStock} / min {i.minStockThreshold}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-violet-500" /> Transaksi Terbaru
          </h2>
          {recentTx.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada transaksi.</p>
          ) : (
            <ul className="space-y-2">
              {recentTx.map(t => {
                const item = items.find(i => i.id === t.itemId);
                return (
                  <li key={t.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item?.name ?? t.itemId}</span>
                    <span className={t.type === 'IN' ? 'text-emerald-600 font-semibold' : t.type === 'OUT' ? 'text-red-600 font-semibold' : 'text-amber-600 font-semibold'}>
                      {t.type === 'IN' ? '+' : t.type === 'OUT' ? '-' : ''}{Math.abs(t.quantity)}{!t.synced && ' (pending)'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {currentUser.role === 'manager' && pendingBrands.length > 0 && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
          <p className="text-sm text-blue-800">
            Ada <b>{pendingBrands.length}</b> pengajuan brand menunggu persetujuan Anda. Buka halaman Brands untuk menyetujui.
          </p>
        </div>
      )}
    </div>
  );
}
