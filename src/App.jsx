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
  const { currentUser } = useApp();
  const [currentView, setCurrentView] = useState('dashboard');

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
