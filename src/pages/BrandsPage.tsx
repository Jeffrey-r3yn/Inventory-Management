import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Tag, Check, Clock, Plus, Users, ChevronRight, X } from 'lucide-react';

export default function BrandsPage() {
  const { currentUser, brands, users, approveBrand, requestBrand, assignStaffToBrand } = useApp();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  const staffUsers = users.filter(u => u.role === 'staff');
  const activeBrands = brands.filter(b => b.status === 'active');
  const pendingBrands = brands.filter(b => b.status === 'pending');

  const handleRequestBrand = () => {
    if (newBrandName.trim()) {
      requestBrand(newBrandName.trim());
      setNewBrandName('');
      setShowRequestForm(false);
    }
  };

  const handleApprove = (brandId: string) => {
    approveBrand(brandId);
  };

  const handleOpenAssign = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    setSelectedStaff(brand?.assignedStaff || []);
    setAssignModal(brandId);
  };

  const handleSaveAssign = () => {
    if (assignModal) {
      assignStaffToBrand(assignModal, selectedStaff);
      setAssignModal(null);
    }
  };

  const toggleStaff = (staffId: string) => {
    setSelectedStaff(prev => prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Manajemen Brand</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola brand dan hak akses staff</p>
        </div>
        <button
          onClick={() => setShowRequestForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Ajukan Brand</span>
        </button>
      </div>

      {/* Pending Brands */}
      {pendingBrands.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Menunggu Persetujuan ({pendingBrands.length})
          </h2>
          <div className="space-y-2">
            {pendingBrands.map(brand => (
              <div key={brand.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{brand.name}</p>
                  <p className="text-xs text-gray-500">
                    Diajukan oleh {users.find(u => u.id === brand.createdBy)?.fullName || 'Unknown'} • {new Date(brand.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
                {currentUser.role === 'manager' && (
                  <button
                    onClick={() => handleApprove(brand.id)}
                    className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                )}
                {currentUser.role === 'staff' && (
                  <span className="text-xs text-orange-600 font-medium bg-orange-100 px-3 py-1.5 rounded-full">Pending</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Brands */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          Brand Aktif ({activeBrands.length})
        </h2>

        {/* Desktop: Table View */}
        <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Brand</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Staff Terassign</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Dibuat</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeBrands.map(brand => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{brand.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Active
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {brand.assignedStaff.slice(0, 3).map(staffId => (
                        <span key={staffId} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {users.find(u => u.id === staffId)?.fullName.split(' ')[0]}
                        </span>
                      ))}
                      {brand.assignedStaff.length > 3 && (
                        <span className="text-xs text-gray-500">+{brand.assignedStaff.length - 3}</span>
                      )}
                      {brand.assignedStaff.length === 0 && <span className="text-xs text-gray-400">Belum ada</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(brand.createdAt).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-right">
                    {currentUser.role === 'manager' && (
                      <button
                        onClick={() => handleOpenAssign(brand.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 ml-auto"
                      >
                        <Users className="w-4 h-4" /> Assign Staff
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Card View */}
        <div className="md:hidden space-y-2">
          {activeBrands.map(brand => (
            <div key={brand.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{brand.name}</p>
                  <p className="text-xs text-gray-500">{brand.assignedStaff.length} staff terassign</p>
                </div>
                <button onClick={() => setSelectedBrand(selectedBrand === brand.id ? null : brand.id)} className="p-2">
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${selectedBrand === brand.id ? 'rotate-90' : ''}`} />
                </button>
              </div>
              {selectedBrand === brand.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Staff yang ditugaskan:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brand.assignedStaff.map(staffId => (
                      <span key={staffId} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                        {users.find(u => u.id === staffId)?.fullName}
                      </span>
                    ))}
                    {brand.assignedStaff.length === 0 && <span className="text-xs text-gray-400">Belum ada staff</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Request Brand Bottom Sheet / Dialog */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRequestForm(false)} />
          <div className="relative bg-white w-full md:max-w-md md:rounded-xl rounded-t-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Ajukan Brand Baru</h3>
              <button onClick={() => setShowRequestForm(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500">Brand yang diajukan akan menunggu persetujuan Manager.</p>
            <input
              type="text"
              value={newBrandName}
              onChange={e => setNewBrandName(e.target.value)}
              placeholder="Nama brand (contoh: Kopi Kenangan)"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={handleRequestBrand}
              disabled={!newBrandName.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Ajukan Brand
            </button>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAssignModal(null)} />
          <div className="relative bg-white w-full max-w-md rounded-xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Assign Staff</h3>
              <button onClick={() => setAssignModal(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Pilih staff yang boleh mengelola brand <strong>{brands.find(b => b.id === assignModal)?.name}</strong>
            </p>
            <div className="space-y-2">
              {staffUsers.map(staff => (
                <label key={staff.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedStaff.includes(staff.id)}
                    onChange={() => toggleStaff(staff.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{staff.fullName}</p>
                    <p className="text-xs text-gray-500">Staff Gudang</p>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={handleSaveAssign}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Simpan Assignment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
