import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import './Clientes.css';

export default function Clientes() {
  const { clientes, ordenes, addCliente, updateCliente } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    nombre: '', telefono: '', rut: '', direccion: '', email: '',
  });

  const filtered = clientes.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.nombre.toLowerCase().includes(s) || c.telefono.includes(s) || (c.rut || '').includes(s);
  });

  // Memoize ordenes per client to avoid recalculating on every render
  const ordenesByCliente = useMemo(() => {
    const map = {};
    clientes.forEach(c => {
      map[c.id] = ordenes.filter(o =>
        o.clienteId === c.id || o.clienteNombre === c.nombre
      );
    });
    return map;
  }, [ordenes, clientes]);

  const getClienteOrdenes = (clienteId) => ordenesByCliente[clienteId] || [];

  const formatDate = (d) => new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

  const estadoLabel = { ingresada: 'Ingresada', en_proceso: 'En Proceso', terminada: 'Terminada' };
  const estadoIcon = { ingresada: '🔵', en_proceso: '🟡', terminada: '🟢' };

  const openNew = () => {
    setForm({ nombre: '', telefono: '', rut: '', direccion: '', email: '' });
    setEditItem(null);
    setShowModal(true);
  };

  const openEdit = (cliente) => {
    setForm({
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      rut: cliente.rut || '',
      direccion: cliente.direccion || '',
      email: cliente.email || '',
    });
    setEditItem(cliente);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.nombre.trim()) return;
    if (editItem) {
      updateCliente(editItem.id, form);
      // Update selectedCliente if it's the one being edited
      if (selectedCliente?.id === editItem.id) {
        setSelectedCliente({ ...selectedCliente, ...form });
      }
    } else {
      addCliente(form);
    }
    setShowModal(false);
  };

  return (
    <div className="clientes-view">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} clientes registrados</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          ➕ Nuevo Cliente
        </button>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          className="input"
          placeholder="Buscar por nombre, teléfono o RUT..."
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
              <p>Crea un cliente manualmente o se registra automáticamente al crear una O.T.</p>
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
                    {cliente.rut && <p className="cliente-rut">{cliente.rut}</p>}
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
              <div className="cliente-detail-info">
                <h2>{selectedCliente.nombre}</h2>
                <p className="text-secondary">📱 {selectedCliente.telefono || 'Sin teléfono'}</p>
                {selectedCliente.rut && <p className="text-sm text-tertiary">RUT: {selectedCliente.rut}</p>}
                {selectedCliente.email && <p className="text-sm text-tertiary">✉️ {selectedCliente.email}</p>}
                {selectedCliente.direccion && <p className="text-sm text-tertiary">📍 {selectedCliente.direccion}</p>}
                <p className="text-xs text-tertiary">Cliente desde {formatDate(selectedCliente.createdAt)}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(selectedCliente)}>
                ✏️ Editar
              </button>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Nombre / Razón Social *</label>
                <input className="input" placeholder="Ej: Transportes López SpA" value={form.nombre}
                  onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label">Teléfono (WhatsApp)</label>
                  <input className="input" placeholder="Ej: 56912345678" value={form.telefono}
                    onChange={e => setForm(p => ({ ...p, telefono: e.target.value.replace(/[^0-9+]/g, '') }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">RUT</label>
                  <input className="input" placeholder="Ej: 12.345.678-9" value={form.rut}
                    onChange={e => setForm(p => ({ ...p, rut: e.target.value }))} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" type="email" placeholder="Ej: contacto@empresa.cl" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Dirección</label>
                <input className="input" placeholder="Ej: Av. Industrial 1234, Temuco" value={form.direccion}
                  onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary btn-lg" onClick={handleSave}
                disabled={!form.nombre.trim()}>
                {editItem ? '💾 Guardar Cambios' : '➕ Registrar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
