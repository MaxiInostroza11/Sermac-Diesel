import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './AdminLayout.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'ordenes', label: 'Órdenes de Trabajo', icon: '📝' },
  { id: 'nueva-ot', label: 'Nueva O.T.', icon: '➕' },
  { id: 'inventario', label: 'Inventario', icon: '📦' },
  { id: 'clientes', label: 'Clientes', icon: '👤' },
];

export default function AdminLayout({ currentView, onNavigate, children }) {
  const { currentUser, logout, pendingApprovals, lowStockItems } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const totalAlerts = pendingApprovals + lowStockItems.length;

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <header className="admin-mobile-header hide-desktop">
        <button className="admin-hamburger" onClick={() => setSidebarOpen(true)}>
          <span></span><span></span><span></span>
        </button>
        <div className="admin-mobile-brand">
          <span className="admin-brand-icon">⚙️</span>
          <span className="admin-brand-text">Sermac Diesel</span>
        </div>
        {totalAlerts > 0 && <span className="badge-count">{totalAlerts}</span>}
      </header>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="admin-brand-icon">⚙️</span>
          <div>
            <h2 className="admin-brand-text">Sermac Diesel</h2>
            <p className="admin-brand-sub">Bosch Diesel Center</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
              {item.id === 'inventario' && lowStockItems.length > 0 && (
                <span className="badge-count">{lowStockItems.length}</span>
              )}
              {item.id === 'ordenes' && pendingApprovals > 0 && (
                <span className="badge-count">{pendingApprovals}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {currentUser?.nombre?.charAt(0)}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{currentUser?.nombre}</p>
              <p className="sidebar-user-role">Administrador</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-block" onClick={logout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
