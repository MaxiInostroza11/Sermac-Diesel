import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './Inventario.css';

export default function Inventario() {
  const { repuestos, addRepuesto, updateRepuesto, deleteRepuesto } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({ codigo: '', nombre: '', modelo: '', stock: 0, stockMinimo: 4 });

  const filtered = repuestos.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (r.codigo || '').includes(s) || r.nombre.toLowerCase().includes(s) || (r.modelo || '').toLowerCase().includes(s);
  });

  const openNew = () => {
    setForm({ codigo: '', nombre: '', modelo: '', stock: 0, stockMinimo: 4 });
    setEditItem(null);
    setShowModal(true);
  };

  const openEdit = (rep) => {
    setForm({
      codigo: rep.codigo || '',
      nombre: rep.nombre || '',
      modelo: rep.modelo || '',
      stock: rep.stock || 0,
      stockMinimo: rep.stockMinimo ?? rep.stock_minimo ?? 4
    });
    setEditItem(rep);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.nombre.trim() || !form.codigo.trim()) return;
    // Duplicate code validation (only for new items or if code changed)
    if (!editItem || editItem.codigo !== form.codigo) {
      const duplicate = repuestos.find(r => r.codigo === form.codigo && r.id !== editItem?.id);
      if (duplicate) {
        alert(`⚠️ Ya existe un repuesto con el código "${form.codigo}" (${duplicate.nombre})`);
        return;
      }
    }
    if (editItem) {
      updateRepuesto(editItem.id, form);
    } else {
      addRepuesto(form);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!editItem) return;
    deleteRepuesto(editItem.id);
    setShowDeleteConfirm(false);
    setShowModal(false);
  };

  return (
    <div className="inventario">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">{repuestos.length} repuestos registrados</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          ➕ Agregar Repuesto
        </button>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          className="input"
          placeholder="Buscar por código, nombre o modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="inv-grid">
        {filtered.map(rep => {
          const isLow = rep.stock <= rep.stockMinimo;
          return (
            <div key={rep.id} className={`inv-card card card-hover ${isLow ? 'inv-card-low' : ''}`} onClick={() => openEdit(rep)}>
              {isLow && <div className="inv-low-banner">🚨 STOCK BAJO</div>}
              <div className="inv-card-top">
                <span className="inv-codigo">#{rep.codigo}</span>
              </div>
              <h3 className="inv-nombre">{rep.nombre}</h3>
              <p className="inv-modelo">{rep.modelo}</p>
              <div className="inv-stock-row">
                <div className="inv-stock">
                  <span className={`inv-stock-value ${isLow ? 'inv-stock-danger' : ''}`}>{rep.stock}</span>
                  <span className="inv-stock-label">disponibles</span>
                </div>
                <div className="inv-stock-min">
                  <span className="text-xs text-tertiary">Mín: {rep.stockMinimo}</span>
                </div>
              </div>
              <div className="inv-stock-bar">
                <div
                  className={`inv-stock-fill ${isLow ? 'fill-danger' : 'fill-success'}`}
                  style={{ width: `${Math.min((rep.stock / (rep.stockMinimo * 5)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h3>No se encontraron repuestos</h3>
          <p>Intenta con otro término de búsqueda</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? 'Editar Repuesto' : 'Nuevo Repuesto'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label className="input-label">Código ID *</label>
                <input className="input" placeholder="Ej: 56789" value={form.codigo}
                  onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Nombre *</label>
                <input className="input" placeholder="Ej: Tobera Bosch" value={form.nombre}
                  onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Modelo / Código de Parte</label>
                <input className="input" placeholder="Ej: DLLA450 P 362" value={form.modelo}
                  onChange={e => setForm(p => ({ ...p, modelo: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label">Stock Actual</label>
                  <input className="input" type="number" min="0" value={form.stock}
                    onChange={e => setForm(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Stock Mínimo (Alarma)</label>
                  <input className="input" type="number" min="0" value={form.stockMinimo}
                    onChange={e => setForm(p => ({ ...p, stockMinimo: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {editItem && (
                <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteConfirm(true)}>
                  🗑️ Eliminar
                </button>
              )}
              <div style={{ flex: 1 }}></div>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary btn-lg" onClick={handleSave}
                disabled={!form.nombre.trim() || !form.codigo.trim()}>
                {editItem ? '💾 Guardar Cambios' : '➕ Agregar Repuesto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Confirmar eliminación</h2>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de eliminar <strong>{editItem?.nombre} ({editItem?.modelo})</strong> del inventario?</p>
              <p className="text-sm text-tertiary" style={{ marginTop: 'var(--space-2)' }}>Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              <button className="btn btn-danger btn-lg" onClick={handleDelete}>
                🗑️ Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
