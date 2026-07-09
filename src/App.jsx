import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import AdminLayout from './components/AdminLayout';
import Notifications from './components/Notifications';
import Dashboard from './views/Dashboard';
import NuevaOT from './views/NuevaOT';
import OrdenesAdmin from './views/OrdenesAdmin';
import Inventario from './views/Inventario';
import Clientes from './views/Clientes';
import MecanicoView from './views/MecanicoView';

function AppContent() {
  const { currentUser, loadingData } = useApp();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loadingData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--color-bg-primary)', color: 'white' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--color-primary-500)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', fontWeight: 'bold' }}>Cargando datos del servidor...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return <Login />;
  }

  // Mechanic view
  if (currentUser.rol === 'mecanico') {
    return <MecanicoView />;
  }

  // Admin view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />;
      case 'ordenes':
        return <OrdenesAdmin onNavigate={setCurrentView} />;
      case 'nueva-ot':
        return <NuevaOT onNavigate={setCurrentView} />;
      case 'inventario':
        return <Inventario />;
      case 'clientes':
        return <Clientes />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <AdminLayout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </AdminLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Notifications />
    </AppProvider>
  );
}
