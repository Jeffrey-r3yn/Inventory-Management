import { useState } from 'react';
import AuthGate from './components/AuthGate';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BrandsPage from './pages/BrandsPage';
import InventoryPage from './pages/InventoryPage';
import TransactionsPage from './pages/TransactionsPage';
import UsersPage from './pages/UsersPage';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'brands': return <BrandsPage />;
      case 'inventory': return <InventoryPage />;
      case 'transactions': return <TransactionsPage />;
      case 'users': return <UsersPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthGate>{profile => <AppProvider key={profile?.id ?? "demo"} profile={profile}>
      <AppContent />
    </AppProvider>}</AuthGate>
  );
}
