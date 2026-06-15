import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './Clientes.css';

export default function Clientes() {
  const { clientes, ordenes } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);

  const filtered = clientes.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.nombre.toLowerCase().includes(s) || c.telefono.includes(s);
  });

  const getClienteOrdenes = (clienteId) => {
    return ordenes.filter(o => o.clienteId === clienteId || o.clienteNombre === clientes.find(c => c.id === clienteId)?.nombre);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

  const estadoLabel = { ingresada: 'Ingresada', en_proceso: 'En Proceso', terminada: 'Terminada' };
  const estadoIcon = { ingresada: '🔵', en_proceso: '🟡', terminada: '🟢' };

  return (
    <div className="clientes-view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} clientes registrados</p>
        </div>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          className="input"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="clientes-grid">
        <div className="clientes-list-panel">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👤</span>
              <h3>No se encontraron clientes</h3>
              <p>Los clientes se registran automáticamente al crear una O.T.</p>
            </div>
          ) : (
            filtered.map(cliente => {
              const clienteOrdenes = getClienteOrdenes(cliente.id);
              const isSelected = selectedCliente?.id === cliente.id;
              return (
                <div
                  key={cliente.id}
                  className={`cliente-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCliente(isSelected ? null : cliente)}
                >
                  <div className="cliente-avatar">
                    {cliente.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="cliente-info">
                    <h3 className="cliente-nombre">{cliente.nombre}</h3>
                    <p className="cliente-phone">📱 {cliente.telefono || 'Sin teléfono'}</p>
                  </div>
                  <div className="cliente-meta">
                    <span className="cliente-ot-count">{clienteOrdenes.length} O.T.</span>
                    <span className="text-xs text-tertiary">Desde {formatDate(cliente.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        {selectedCliente && (
          <div className="cliente-detail-panel card">
            <div className="cliente-detail-header">
              <div className="cliente-detail-avatar">
                {selectedCliente.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2>{selectedCliente.nombre}</h2>
                <p className="text-secondary">📱 {selectedCliente.telefono || 'Sin teléfono'}</p>
                <p className="text-xs text-tertiary">Cliente desde {formatDate(selectedCliente.createdAt)}</p>
              </div>
            </div>

            <div className="cliente-historial">
              <h3 className="font-semibold">📋 Historial de Órdenes</h3>
              <div className="cliente-ordenes-list">
                {getClienteOrdenes(selectedCliente.id).length === 0 ? (
                  <p className="text-sm text-tertiary">Sin órdenes registradas</p>
                ) : (
                  getClienteOrdenes(selectedCliente.id)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map(orden => (
                      <div key={orden.id} className="cliente-orden-item">
                        <span className="font-bold" style={{ color: 'var(--color-primary-400)' }}>
                          O.T. {String(orden.numeroOt).padStart(3, '0')}
                        </span>
                        <span className="text-sm">{orden.marcaModelo}</span>
                        <span className={`badge badge-${orden.estado.replace('_', '-')}`}>
                          {estadoIcon[orden.estado]} {estadoLabel[orden.estado]}
                        </span>
                        <span className="text-xs text-tertiary">{formatDate(orden.createdAt)}</span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
