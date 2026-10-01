import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Package, ArrowLeftRight, Tag, Users, LogOut,
  Menu, X, Wifi, WifiOff, ChevronDown, Shield, User
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { currentUser, users, isOnline, offlineQueueCount, switchUser, brands, error, loading } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const pendingBrands = brands.filter(b => b.status === 'pending').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'brands', label: 'Brand', icon: Tag, badge: currentUser.role === 'manager' ? pendingBrands : undefined },
    { id: 'inventory', label: 'Inventaris', icon: Package },
    { id: 'transactions', label: 'Transaksi', icon: ArrowLeftRight },
    ...(currentUser.role === 'manager' ? [{ id: 'users', label: 'Kelola Staff', icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200 z-30">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">SmartInventory</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Role Switcher */}
        <div className="p-3 border-t border-gray-200">
          <div className="relative">
            <button
              onClick={() => !isSupabaseConfigured && setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentUser.role === 'manager' ? 'bg-purple-100' : 'bg-green-100'
              }`}>
                {currentUser.role === 'manager' ? <Shield className="w-4 h-4 text-purple-600" /> : <User className="w-4 h-4 text-green-600" />}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">{currentUser.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser.role === 'manager' ? 'Manager' : 'Staff Gudang'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {roleSwitcherOpen && !isSupabaseConfigured && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 max-h-64 overflow-y-auto">
                {(isSupabaseConfigured ? [] : users).map(user => (
                  <button
                    key={user.id}
                    onClick={() => { switchUser(user.id); setRoleSwitcherOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${user.id === currentUser.id ? 'bg-blue-50' : ''}`}
                  >
                    {user.role === 'manager'
                      ? <Shield className="w-4 h-4 text-purple-600" />
                      : <User className="w-4 h-4 text-green-600" />}
                    <span className="flex-1 truncate">{user.fullName}</span>
                    <span className="text-[10px] text-gray-400 uppercase">{user.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40 flex items-center px-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">SmartInventory</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!isOnline && (
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium">
              Offline {offlineQueueCount > 0 && `(${offlineQueueCount})`}
            </span>
          )}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
            currentUser.role === 'manager' ? 'bg-purple-100' : 'bg-green-100'
          }`}>
            {currentUser.role === 'manager' ? <Shield className="w-3.5 h-3.5 text-purple-600" /> : <User className="w-3.5 h-3.5 text-green-600" />}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <div className="flex items-center h-14 px-4 border-b border-gray-200">
              <span className="font-bold text-gray-900 flex-1">Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="px-3 py-4 space-y-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-gray-200 mt-auto">
              <p className="text-xs text-gray-500 px-3 mb-2">{isSupabaseConfigured ? currentUser.fullName : "Ganti User Aktif"}</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {(isSupabaseConfigured ? [] : users).map(user => (
                  <button
                    key={user.id}
                    onClick={() => { switchUser(user.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2 py-2 px-3 rounded-lg text-sm ${
                      user.id === currentUser.id ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {user.role === 'manager'
                      ? <Shield className="w-4 h-4 text-purple-600" />
                      : <User className="w-4 h-4 text-green-600" />}
                    <span className="flex-1 truncate text-left">{user.fullName}</span>
                    <span className="text-[10px] uppercase text-gray-400">{user.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isSupabaseConfigured && <button onClick={() => void supabase?.auth.signOut()} className="fixed top-3 right-4 z-40 bg-white border rounded-lg px-3 py-1.5 text-sm">Keluar</button>}
      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        <div className="pt-14 md:pt-0 pb-20 md:pb-0">
          {!isSupabaseConfigured && <div className="bg-amber-50 text-amber-800 px-6 py-3 text-sm">Mode demo — data disimpan di perangkat ini. Supabase belum terhubung.</div>}
          {error && <div role="alert" className="bg-red-50 text-red-700 px-6 py-3 text-sm">{error}</div>}
          {loading && <div className="px-6 py-3 text-sm text-gray-500">Memuat inventaris…</div>}
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around h-16">
          {navItems.slice(0, 4).map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg relative ${
                currentPage === item.id ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-0.5 right-0 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Online/Offline Indicator (Desktop) */}
      <div className="hidden md:flex fixed bottom-4 right-4 items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
        {isOnline ? (
          <>
            <Wifi className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-gray-600">{offlineQueueCount > 0 ? `${offlineQueueCount} transaksi menunggu sinkronisasi` : "Online"}</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs text-orange-600">Offline ({offlineQueueCount} pending)</span>
          </>
        )}
      </div>
    </div>
  );
}
