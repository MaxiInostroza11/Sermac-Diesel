import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ACTIVIDADES_RAPIDAS, NIVELES_COMBUSTIBLE, MAX_TRABAJOS_ACTIVOS } from '../data/mockData';
import './MecanicoView.css';

export default function MecanicoView() {
  const {
    currentUser, logout, ordenes, repuestos,
    tomarTrabajo, updateOrden, toggleActividad, agregarActividad,
    solicitarRepuesto, agregarFoto, eliminarFoto, crearOTInterna,
    getTrabajosMecanico
  } = useApp();

  const [selectedOT, setSelectedOT] = useState(null);
  const [showRepuestoModal, setShowRepuestoModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [labDescripcion, setLabDescripcion] = useState('');
  const [repuestoForm, setRepuestoForm] = useState({ repuestoId: '', cantidad: 1 });
  const [notaTexto, setNotaTexto] = useState('');
  const fotoInputRef = useRef(null);

  const misTrabajos = ordenes.filter(o =>
    o.mecanicoId === currentUser?.id && o.estado !== 'terminada'
  );

  const trabajosDisponibles = ordenes.filter(o =>
    o.estado === 'ingresada' && !o.mecanicoId
  );

  const trabajosActivos = getTrabajosMecanico(currentUser?.id);
  const alMaximo = trabajosActivos.length >= MAX_TRABAJOS_ACTIVOS;

  const getSistemaLabel = (s) => {
    const labels = { inyector: 'Inyector', bomba: 'Bomba', turbo: 'Turbo', dpf: 'DPF', vehiculo_completo: 'Vehículo', otro: 'Otro' };
    return labels[s] || s;
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  const handleTomarTrabajo = (ordenId) => {
    tomarTrabajo(ordenId);
  };

  const handleCambiarEstado = (ordenId, nuevoEstado) => {
    updateOrden(ordenId, { estado: nuevoEstado });
    if (nuevoEstado === 'terminada') {
      setSelectedOT(null);
    }
  };

  const handleToggleActividad = (ordenId, tipo) => {
    toggleActividad(ordenId, tipo);
  };

  const handleAgregarNota = (ordenId) => {
    if (!notaTexto.trim()) return;
    agregarActividad(ordenId, { tipo: 'nota', descripcion: notaTexto.trim() });
    setNotaTexto('');
  };

  const handleSolicitarRepuesto = (ordenId) => {
    if (!repuestoForm.repuestoId) return;
    solicitarRepuesto(ordenId, repuestoForm.repuestoId, repuestoForm.cantidad);
    setRepuestoForm({ repuestoId: '', cantidad: 1 });
    setShowRepuestoModal(false);
  };

  const handleUpdateRecepcion = (ordenId, field, value) => {
    updateOrden(ordenId, { [field]: value });
  };

  const handleFotoCapture = (e, ordenId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      agregarFoto(ordenId, reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleEnviarLab = (ordenId) => {
    crearOTInterna(ordenId, labDescripcion || 'Revisión de componentes');
    setLabDescripcion('');
    setShowLabModal(false);
  };

  const selectedOrden = selectedOT ? ordenes.find(o => o.id === selectedOT) : null;

  return (
    <div className="mecanico-view">
      {/* Header */}
      <header className="mec-header">
        <div className="mec-header-left">
          <span className="mec-brand-icon">⚙️</span>
          <span className="mec-brand">Sermac Diesel</span>
        </div>
        <div className="mec-header-right">
          <div className="mec-user-badge">
            <div className="mec-user-avatar">{currentUser?.nombre?.charAt(0)}</div>
            <span className="mec-user-name">{currentUser?.nombre}</span>
            <span className={`mec-carga-badge ${alMaximo ? 'carga-max' : ''}`}>
              {trabajosActivos.length}/{MAX_TRABAJOS_ACTIVOS}
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>🚪</button>
        </div>
      </header>

      {/* Main Content */}
      {!selectedOrden ? (
        <div className="mec-content">
          {/* Mis Trabajos Activos */}
          <section className="mec-section mec-section-main">
            <h2 className="mec-section-title">
              🔧 Mis Trabajos Activos
              <span className="mec-count">{misTrabajos.length}</span>
              {alMaximo && <span className="badge badge-pendiente" style={{ marginLeft: '8px' }}>MÁXIMO</span>}
            </h2>

            {misTrabajos.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <span className="empty-icon">🛠️</span>
                <h3>Sin trabajos activos</h3>
                <p>Toma un trabajo de la bandeja de entrada</p>
              </div>
            ) : (
              <div className="mec-jobs-grid">
                {misTrabajos.map(orden => (
                  <button
                    key={orden.id}
                    className="mec-job-card"
                    onClick={() => setSelectedOT(orden.id)}
                  >
                    <div className="mec-job-top">
                      <span className="mec-job-ot">
                        {orden.tipo === 'interna' ? '🔬' : ''} O.T. {String(orden.numeroOt).padStart(3, '0')}
                      </span>
                      <span className={`badge badge-${orden.estado.replace('_', '-')}`}>
                        {orden.estado === 'en_proceso' ? '🟡 En Proceso' : '🔵 Ingresada'}
                      </span>
                    </div>
                    <p className="mec-job-vehicle">{orden.marcaModelo}</p>
                    <p className="mec-job-service">
                      {orden.servicios.map(s => `${s.cantidad}x ${getSistemaLabel(s.sistema)}`).join(', ')}
                    </p>
                    {orden.observaciones && (
                      <p className="mec-job-obs">💬 {orden.observaciones}</p>
                    )}
                    <div className="mec-job-footer">
                      <span className="mec-job-acts">{orden.actividades.length} actividades</span>
                      {orden.solicitudesRepuesto.some(s => s.estado === 'pendiente') && (
                        <span className="badge badge-pendiente">⏳ Rep. pendiente</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Bandeja de Entrada */}
          <section className="mec-section mec-section-inbox">
            <h2 className="mec-section-title">
              📥 Trabajos Disponibles
              <span className="mec-count">{trabajosDisponibles.length}</span>
            </h2>

            {trabajosDisponibles.length === 0 ? (
              <p className="text-sm text-secondary" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                No hay trabajos disponibles por el momento
              </p>
            ) : (
              <div className="mec-inbox-list">
                {trabajosDisponibles.map(orden => (
                  <div key={orden.id} className="mec-inbox-item">
                    <div className="mec-inbox-info">
                      <span className="mec-job-ot">O.T. {String(orden.numeroOt).padStart(3, '0')}</span>
                      <span className="mec-job-vehicle">{orden.marcaModelo}</span>
                      <span className="text-xs text-tertiary">
                        {orden.servicios.map(s => `${s.cantidad}x ${getSistemaLabel(s.sistema)}`).join(', ')}
                      </span>
                    </div>
                    <button
                      className={`btn btn-touch ${alMaximo ? 'btn-ghost' : 'btn-accent'}`}
                      onClick={() => handleTomarTrabajo(orden.id)}
                      disabled={alMaximo}
                    >
                      {alMaximo ? `🔒 ${MAX_TRABAJOS_ACTIVOS}/${MAX_TRABAJOS_ACTIVOS}` : '👋 TOMAR'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* O.T. Detail View */
        <div className="mec-detail">
          <button className="btn btn-ghost mec-back-btn" onClick={() => setSelectedOT(null)}>
            ← Volver
          </button>

          <div className="mec-detail-header">
            <div>
              <h2 className="mec-detail-ot">
                {selectedOrden.tipo === 'interna' ? '🔬 ' : ''}O.T. {String(selectedOrden.numeroOt).padStart(3, '0')}
              </h2>
              {selectedOrden.tipo === 'interna' && (
                <span className="badge badge-en-proceso" style={{ marginBottom: '4px' }}>O.T. INTERNA — Laboratorio</span>
              )}
              <p className="mec-detail-vehicle">{selectedOrden.marcaModelo}</p>
              <p className="mec-detail-service">
                {selectedOrden.servicios.map(s => `${s.cantidad}x ${getSistemaLabel(s.sistema)}`).join(' · ')}
              </p>
            </div>
            <div className="mec-estado-selector">
              <label className="input-label">Estado</label>
              <select
                className="input input-lg"
                value={selectedOrden.estado}
                onChange={(e) => handleCambiarEstado(selectedOrden.id, e.target.value)}
              >
                <option value="ingresada">🔵 Ingresada</option>
                <option value="en_proceso">🟡 En Proceso</option>
                <option value="terminada">🟢 Terminada</option>
              </select>
            </div>
          </div>

          {selectedOrden.observaciones && (
            <div className="mec-obs-banner">
              💬 {selectedOrden.observaciones}
            </div>
          )}

          {/* Reception Data */}
          <div className="mec-section-card">
            <h3 className="mec-card-title">🚗 Datos de Recepción</h3>
            <div className="mec-recepcion-grid">
              <div className="input-group">
                <label className="input-label">Kilometraje</label>
                <input
                  type="text"
                  className="input input-lg"
                  placeholder="Ej: 85.230"
                  value={selectedOrden.kilometraje}
                  onChange={(e) => handleUpdateRecepcion(selectedOrden.id, 'kilometraje', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Nivel Combustible</label>
                <select
                  className="input input-lg"
                  value={selectedOrden.nivelCombustible}
                  onChange={(e) => handleUpdateRecepcion(selectedOrden.id, 'nivelCombustible', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {NIVELES_COMBUSTIBLE.map(n => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </div>
              <div className="input-group full-width">
                <label className="input-label">Daños Existentes</label>
                <textarea
                  className="input"
                  placeholder="Ej: Abolladura en parachoque trasero..."
                  value={selectedOrden.danosExistentes}
                  onChange={(e) => handleUpdateRecepcion(selectedOrden.id, 'danosExistentes', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Quick Activities — Toggle */}
          <div className="mec-section-card">
            <h3 className="mec-card-title">📝 Actividades Realizadas</h3>
            <div className="mec-activities-grid">
              {ACTIVIDADES_RAPIDAS.map(act => {
                const isDone = selectedOrden.actividades.some(a => a.tipo === act.id);
                return (
                  <button
                    key={act.id}
                    className={`mec-activity-btn ${isDone ? 'done' : ''}`}
                    onClick={() => handleToggleActividad(selectedOrden.id, act.id)}
                  >
                    <span className="mec-act-icon">{isDone ? '✅' : act.icon}</span>
                    <span className="mec-act-label">{act.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Free text note */}
            <div className="mec-note-input">
              <input
                type="text"
                className="input input-lg"
                placeholder="Agregar nota libre..."
                value={notaTexto}
                onChange={(e) => setNotaTexto(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAgregarNota(selectedOrden.id)}
              />
              <button
                className="btn btn-primary btn-touch"
                onClick={() => handleAgregarNota(selectedOrden.id)}
                disabled={!notaTexto.trim()}
              >
                ➕
              </button>
            </div>

            {/* Bitácora */}
            {(selectedOrden.bitacora || []).length > 0 && (
              <div className="mec-bitacora">
                <h4 className="mec-bitacora-title">📖 Bitácora</h4>
                <div className="mec-bitacora-list">
                  {[...(selectedOrden.bitacora || [])].reverse().map(entry => (
                    <div key={entry.id} className={`mec-bitacora-item ${entry.accion}`}>
                      <span className="mec-bitacora-time">{formatTime(entry.createdAt)}</span>
                      <span className="mec-bitacora-icon">
                        {entry.accion === 'marcar' && '✅'}
                        {entry.accion === 'desmarcar' && '❌'}
                        {entry.accion === 'nota' && '📝'}
                        {entry.accion === 'enviar_lab' && '🔬'}
                      </span>
                      <span className="mec-bitacora-text">
                        {entry.accion === 'marcar' && `${entry.tipo.replace(/_/g, ' ')} marcado`}
                        {entry.accion === 'desmarcar' && `${entry.tipo.replace(/_/g, ' ')} desmarcado`}
                        {entry.accion === 'nota' && `Nota: ${entry.descripcion}`}
                        {entry.accion === 'enviar_lab' && entry.descripcion}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Send to Lab */}
          {selectedOrden.tipo !== 'interna' && (
            <div className="mec-section-card">
              <div className="mec-card-header">
                <h3 className="mec-card-title">🔬 Laboratorio</h3>
                <button className="btn btn-accent btn-touch" onClick={() => setShowLabModal(true)}>
                  🔬 Enviar a Lab
                </button>
              </div>
              <p className="text-sm text-tertiary">Envía inyectores/bomba al laboratorio como O.T. interna</p>
            </div>
          )}

          {/* Parts Request */}
          <div className="mec-section-card">
            <div className="mec-card-header">
              <h3 className="mec-card-title">📦 Repuestos</h3>
              <button className="btn btn-accent btn-touch" onClick={() => setShowRepuestoModal(true)}>
                ➕ Solicitar
              </button>
            </div>

            {selectedOrden.solicitudesRepuesto.length > 0 ? (
              <div className="mec-repuestos-list">
                {selectedOrden.solicitudesRepuesto.map(sol => (
                  <div key={sol.id} className="mec-repuesto-item">
                    <span>{sol.cantidad}x {sol.repuestoNombre}</span>
                    <span className={`badge badge-${sol.estado === 'aprobada' ? 'terminada' : sol.estado === 'rechazada' ? 'pendiente' : 'en-proceso'}`}>
                      {sol.estado === 'pendiente' && '⏳ Esperando'}
                      {sol.estado === 'aprobada' && '✅ Aprobado'}
                      {sol.estado === 'rechazada' && '❌ Rechazado'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-tertiary">Sin repuestos solicitados</p>
            )}
          </div>

          {/* Photos */}
          <div className="mec-section-card">
            <div className="mec-card-header">
              <h3 className="mec-card-title">📸 Fotos del Vehículo</h3>
              <button
                className="btn btn-primary btn-touch"
                onClick={() => fotoInputRef.current?.click()}
              >
                📷 Tomar Foto
              </button>
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => handleFotoCapture(e, selectedOrden.id)}
              />
            </div>

            {(selectedOrden.fotos || []).length > 0 ? (
              <div className="mec-fotos-grid">
                {selectedOrden.fotos.map(foto => (
                  <div key={foto.id} className="mec-foto-item">
                    <img src={foto.dataUrl} alt="Foto O.T." />
                    <button
                      className="mec-foto-delete"
                      onClick={() => eliminarFoto(selectedOrden.id, foto.id)}
                      title="Eliminar foto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-tertiary">Sin fotos. Toma fotos del vehículo, daños, motor, etc.</p>
            )}
          </div>

          {/* Mark as Done */}
          {selectedOrden.estado !== 'terminada' && (
            <button
              className="btn btn-success btn-lg btn-block mec-finish-btn"
              onClick={() => handleCambiarEstado(selectedOrden.id, 'terminada')}
            >
              ✅ MARCAR COMO TERMINADA
            </button>
          )}
        </div>
      )}

      {/* Repuesto Request Modal */}
      {showRepuestoModal && (
        <div className="modal-overlay" onClick={() => setShowRepuestoModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Solicitar Repuesto</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRepuestoModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Repuesto</label>
                <select
                  className="input input-lg"
                  value={repuestoForm.repuestoId}
                  onChange={(e) => setRepuestoForm(p => ({ ...p, repuestoId: e.target.value }))}
                >
                  <option value="">Seleccionar repuesto...</option>
                  {repuestos.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} {r.modelo} (Stock: {r.stock})
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="input-label">Cantidad</label>
                <input
                  type="number"
                  className="input input-lg"
                  min="1"
                  value={repuestoForm.cantidad}
                  onChange={(e) => setRepuestoForm(p => ({ ...p, cantidad: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowRepuestoModal(false)}>Cancelar</button>
              <button
                className="btn btn-accent btn-lg"
                disabled={!repuestoForm.repuestoId}
                onClick={() => handleSolicitarRepuesto(selectedOrden.id)}
              >
                📦 Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Modal */}
      {showLabModal && (
        <div className="modal-overlay" onClick={() => setShowLabModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔬 Enviar a Laboratorio</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLabModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-4)' }}>
                Se creará una O.T. interna vinculada a la O.T. {String(selectedOrden.numeroOt).padStart(3, '0')} para revisión en el laboratorio.
              </p>
              <div className="input-group">
                <label className="input-label">Descripción del trabajo de laboratorio</label>
                <textarea
                  className="input input-lg"
                  placeholder="Ej: Revisión y calibración de 4 inyectores..."
                  value={labDescripcion}
                  onChange={(e) => setLabDescripcion(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowLabModal(false)}>Cancelar</button>
              <button className="btn btn-accent btn-lg" onClick={() => handleEnviarLab(selectedOrden.id)}>
                🔬 Crear O.T. Interna
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
