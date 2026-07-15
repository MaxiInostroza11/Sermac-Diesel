import { useState, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ACTIVIDADES_RAPIDAS, NIVELES_COMBUSTIBLE } from '../data/mockData';
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
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [labDescripcion, setLabDescripcion] = useState('');
  const [repuestoForm, setRepuestoForm] = useState({ repuestoId: '', cantidad: '' });
  const [notaTexto, setNotaTexto] = useState('');
  const [historialFiltro, setHistorialFiltro] = useState('semana');
  const [takenJobId, setTakenJobId] = useState(null);
  const [deleteActConfirm, setDeleteActConfirm] = useState(null);
  const [previewOrden, setPreviewOrden] = useState(null); // OT para modal preview antes de tomar
  // Local edits para km/danos para evitar llamar Supabase en cada tecla
  const [localKm, setLocalKm] = useState({});
  const [localDanos, setLocalDanos] = useState({});
  const fotoInputRef = useRef(null);

  // Derive selectedOrden from live state (fixes stale reference bug)
  const selectedOrden = selectedOT ? ordenes.find(o => o.id === selectedOT) : null;

  const misTrabajos = ordenes.filter(o =>
    o.mecanicoId === currentUser?.id && o.estado !== 'terminada'
  );

  const trabajosDisponibles = ordenes.filter(o =>
    o.estado === 'ingresada' && !o.mecanicoId
  );

  const trabajosActivos = getTrabajosMecanico(currentUser?.id);
  // Sin límite de trabajos activos

  // Completed jobs with time filter
  const misCompletados = useMemo(() => {
    const now = new Date();
    const filtered = ordenes.filter(o =>
      o.mecanicoId === currentUser?.id && o.estado === 'terminada'
    );

    const cutoff = new Date();
    switch (historialFiltro) {
      case 'hoy':
        cutoff.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'mes':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'todos':
        return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      default:
        cutoff.setDate(now.getDate() - 7);
    }

    return filtered
      .filter(o => new Date(o.updatedAt) >= cutoff)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [ordenes, currentUser, historialFiltro]);

  const getSistemaLabel = (s) => {
    const labels = { inyector: 'Inyector', bomba: 'Bomba', turbo: 'Turbo', dpf: 'DPF', vehiculo_completo: 'Vehículo', otro: 'Otro' };
    return labels[s] || s;
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d) => new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const handleTomarTrabajo = async (ordenId) => {
    setPreviewOrden(null); // cerrar modal preview si está abierto
    const result = await tomarTrabajo(ordenId);
    if (result) {
      setTakenJobId(ordenId);
      // Esperamos que fetchData refresque los datos antes de abrir el detalle
      setTimeout(() => {
        setTakenJobId(null);
        setSelectedOT(ordenId);
      }, 1200);
    }
  };

  const handleCambiarEstado = (ordenId, nuevoEstado) => {
    if (nuevoEstado === 'terminada') {
      setShowFinishConfirm(true);
      return;
    }
    updateOrden(ordenId, { estado: nuevoEstado });
  };

  const handleConfirmFinish = () => {
    if (!selectedOrden) return;
    updateOrden(selectedOrden.id, { estado: 'terminada' });
    setShowFinishConfirm(false);
    setSelectedOT(null);
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
    const cantidad = parseInt(repuestoForm.cantidad) || 1;
    solicitarRepuesto(ordenId, repuestoForm.repuestoId, cantidad);
    setRepuestoForm({ repuestoId: '', cantidad: '' });
    setShowRepuestoModal(false);
  };

  const handleUpdateRecepcion = (ordenId, field, value) => {
    updateOrden(ordenId, { [field]: value });
  };

  // Guardar km solo al perder el foco (evita llamar Supabase en cada tecla en celular)
  const handleKmBlur = (ordenId) => {
    const val = localKm[ordenId];
    if (val !== undefined) {
      updateOrden(ordenId, { kilometraje: val });
    }
  };

  const handleDanosBlur = (ordenId) => {
    const val = localDanos[ordenId];
    if (val !== undefined) {
      updateOrden(ordenId, { danosExistentes: val });
    }
  };

  // Eliminar actividad (toggle desmarca sin dejar entrada de 'desmarcar' en bitacora)
  const handleEliminarActividad = (ordenId, tipo, label) => {
    setDeleteActConfirm({ ordenId, tipo, label });
  };

  const confirmEliminarActividad = () => {
    if (!deleteActConfirm) return;
    handleToggleActividad(deleteActConfirm.ordenId, deleteActConfirm.tipo);
    setDeleteActConfirm(null);
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
      {selectedOT && !selectedOrden ? (
        /* Orden tomada pero datos aún refrescando desde Supabase */
        <div className="mec-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
            <p style={{ color: 'var(--color-text-secondary)' }}>Cargando orden...</p>
          </div>
        </div>
      ) : !selectedOrden ? (
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
                    <div className="mec-job-client-row">
                      <span className="mec-job-client">👤 {orden.clienteNombre || '—'}</span>
                      {orden.patenteVehiculo && (
                        <span className="mec-job-patente">{orden.patenteVehiculo}</span>
                      )}
                    </div>
                    <p className="mec-job-service">
                      {(orden.servicios || []).map(s => `${s.cantidad}x ${getSistemaLabel(s.sistema)}`).join(', ')}
                    </p>
                    {orden.observaciones && (
                      <p className="mec-job-obs">💬 {orden.observaciones}</p>
                    )}
                    <div className="mec-job-footer">
                      <span className="mec-job-acts">{(orden.actividades || []).length} actividades</span>
                      {(orden.solicitudesRepuesto || []).some(s => s.estado === 'pendiente') && (
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
                  <div
                    key={orden.id}
                    className={`mec-inbox-item ${takenJobId === orden.id ? 'mec-inbox-taken' : ''}`}
                  >
                    <div className="mec-inbox-info">
                      <span className="mec-job-ot">
                        {orden.tipo === 'laboratorio_directo' ? '🔬 ' : ''}
                        O.T. {String(orden.numeroOt).padStart(3, '0')}
                      </span>
                      <span className="mec-job-vehicle">{orden.marcaModelo}</span>
                      {orden.clienteNombre && (
                        <span className="text-xs text-tertiary">👤 {orden.clienteNombre}</span>
                      )}
                      {orden.observaciones && (
                        <span className="text-xs text-tertiary" style={{ fontStyle: 'italic' }}>
                          {orden.observaciones.slice(0, 60)}{orden.observaciones.length > 60 ? '...' : ''}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                      <button
                        className="btn btn-ghost btn-touch"
                        onClick={() => setPreviewOrden(orden)}
                        title="Ver detalles"
                      >
                        👁️ Ver
                      </button>
                      <button
                        className="btn btn-accent btn-touch"
                        onClick={() => handleTomarTrabajo(orden.id)}
                      >
                        👋 TOMAR
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Historial Completados */}
          <section className="mec-section mec-section-historial">
            <div className="mec-historial-header">
              <h2 className="mec-section-title">
                ✅ Completados
                <span className="mec-count">{misCompletados.length}</span>
              </h2>
              <div className="mec-historial-filters">
                {[
                  { key: 'hoy', label: 'Hoy' },
                  { key: 'semana', label: 'Semana' },
                  { key: 'mes', label: 'Mes' },
                  { key: 'todos', label: 'Todos' },
                ].map(f => (
                  <button
                    key={f.key}
                    className={`mec-historial-filter ${historialFiltro === f.key ? 'active' : ''}`}
                    onClick={() => setHistorialFiltro(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {misCompletados.length === 0 ? (
              <p className="text-sm text-tertiary" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                Sin trabajos completados en este período
              </p>
            ) : (
              <div className="mec-historial-list">
                {misCompletados.map(orden => (
                  <div key={orden.id} className="mec-historial-item" onClick={() => setSelectedOT(orden.id)}>
                    <div className="mec-historial-item-left">
                      <span className="mec-job-ot">
                        {orden.tipo === 'interna' ? '🔬 ' : ''}OT-{String(orden.numeroOt).padStart(3, '0')}
                      </span>
                      <span className="mec-historial-vehicle">{orden.marcaModelo}</span>
                    </div>
                    <div className="mec-historial-item-right">
                      <span className="mec-historial-acts">{(orden.actividades || []).length} act.</span>
                      <span className="mec-historial-date">{formatDate(orden.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* O.T. Detail View */
        <div className="mec-detail">
          <button className="mec-back-btn" onClick={() => setSelectedOT(null)}>
            ← Volver a mis trabajos
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
                {(selectedOrden.servicios || []).map(s => `${s.cantidad}x ${getSistemaLabel(s.sistema)}`).join(' · ')}
              </p>
              {selectedOrden.clienteNombre && (
                <p className="mec-detail-client">👤 {selectedOrden.clienteNombre}
                  {selectedOrden.patenteVehiculo && <span className="mec-detail-patente"> · {selectedOrden.patenteVehiculo}</span>}
                </p>
              )}
            </div>
            {selectedOrden.estado !== 'terminada' && (
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
            )}
            {selectedOrden.estado === 'terminada' && (
              <span className="badge badge-terminada" style={{ padding: '8px 16px', fontSize: '14px' }}>🟢 Terminada</span>
            )}
          </div>

          {/* Preview Job Modal — antes de tomar un trabajo */}
          {previewOrden && (
            <div className="modal-overlay" onClick={() => setPreviewOrden(null)}>
              <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>
                    {previewOrden.tipo === 'laboratorio_directo' ? '🔬 ' : '🚗 '}
                    O.T. {String(previewOrden.numeroOt).padStart(3, '0')}
                  </h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPreviewOrden(null)}>✕</button>
                </div>
                <div className="modal-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                      <div>
                        <span className="text-xs text-tertiary">Cliente</span>
                        <p style={{ fontWeight: 600 }}>{previewOrden.clienteNombre || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-tertiary">Vehículo / Componente</span>
                        <p style={{ fontWeight: 600 }}>{previewOrden.marcaModelo}</p>
                      </div>
                      {previewOrden.patenteVehiculo && (
                        <div>
                          <span className="text-xs text-tertiary">Patente</span>
                          <p style={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                            {previewOrden.patenteVehiculo}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-tertiary">Tipo</span>
                        <p>{previewOrden.tipo === 'laboratorio_directo' ? '🔬 Laboratorio directo' : '🚗 Vehículo completo'}</p>
                      </div>
                    </div>

                    {(previewOrden.servicios || []).length > 0 && (
                      <div>
                        <span className="text-xs text-tertiary">Servicios</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                          {previewOrden.servicios.map((s, i) => (
                            <span key={i} className="badge badge-en-proceso">
                              {s.cantidad}x {getSistemaLabel(s.sistema)}{s.especificar ? ` — ${s.especificar}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {previewOrden.observaciones && (
                      <div>
                        <span className="text-xs text-tertiary">Observaciones del cliente</span>
                        <p style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                          "{previewOrden.observaciones}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={() => setPreviewOrden(null)}>Cerrar</button>
                  <button
                    className="btn btn-accent btn-lg"
                    onClick={() => handleTomarTrabajo(previewOrden.id)}
                  >
                    👋 TOMAR TRABAJO
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reception Data — SOLO para tipo 'cliente' (camioneta completa) */}
          {selectedOrden.tipo === 'cliente' && (
            <div className="mec-section-card">
              <h3 className="mec-card-title">🚗 Datos de Recepcin</h3>
              <div className="mec-recepcion-grid">
                <div className="input-group">
                  <label className="input-label">Kilometraje</label>
                  <input
                    type="text"
                    className="input input-lg"
                    placeholder="Ej: 85.230"
                    value={localKm[selectedOrden.id] ?? (selectedOrden.kilometraje ?? '')}
                    onChange={(e) => setLocalKm(p => ({ ...p, [selectedOrden.id]: e.target.value }))}
                    onBlur={() => handleKmBlur(selectedOrden.id)}
                    readOnly={selectedOrden.estado === 'terminada'}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Nivel Combustible</label>
                  <select
                    className="input input-lg"
                    value={selectedOrden.nivelCombustible ?? ''}
                    onChange={(e) => handleUpdateRecepcion(selectedOrden.id, 'nivelCombustible', e.target.value)}
                    disabled={selectedOrden.estado === 'terminada'}
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
                    value={localDanos[selectedOrden.id] ?? (selectedOrden.danosExistentes ?? '')}
                    onChange={(e) => setLocalDanos(p => ({ ...p, [selectedOrden.id]: e.target.value }))}
                    onBlur={() => handleDanosBlur(selectedOrden.id)}
                    rows={3}
                    readOnly={selectedOrden.estado === 'terminada'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actividades, Notas, Bitacora, Lab — SOLO para 'interna' (laboratorio) */}
          {selectedOrden.tipo === 'interna' && (
            <div className="mec-section-card">
              <h3 className="mec-card-title">📝 Actividades Realizadas</h3>
              <div className="mec-activities-grid">
                {ACTIVIDADES_RAPIDAS.map(act => {
                  const actReg = (selectedOrden.actividades || []).find(a => a.tipo === act.id);
                  const isDone = !!actReg;
                  return (
                    <button
                      key={act.id}
                      className={`mec-activity-btn ${isDone ? 'done' : ''}`}
                      onClick={() => isDone
                        ? handleEliminarActividad(selectedOrden.id, act.id, act.label)
                        : handleToggleActividad(selectedOrden.id, act.id)
                      }
                      disabled={selectedOrden.estado === 'terminada'}
                    >
                      <span className="mec-act-icon">{isDone ? '✅' : act.icon}</span>
                      <span className="mec-act-label">{act.label}</span>
                      {isDone && <span className="mec-act-delete">✕ quitar</span>}
                    </button>
                  );
                })}
              </div>

              {/* Free text note */}
              {selectedOrden.estado !== 'terminada' && (
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
              )}

              {/* Bitácora */}
              {(selectedOrden.bitacora || []).filter(e => e.accion !== 'desmarcar').length > 0 && (
                <div className="mec-bitacora">
                  <h4 className="mec-bitacora-title">📖 Bitácora</h4>
                  <div className="mec-bitacora-list">
                    {[...(selectedOrden.bitacora || [])]
                      .filter(e => e.accion !== 'desmarcar')
                      .reverse()
                      .map(entry => {
                        const rawDate = entry.created_at || entry.createdAt;
                        const timeStr = rawDate ? new Date(rawDate).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                        return (
                          <div key={entry.id} className={`mec-bitacora-item ${entry.accion}`}>
                            <span className="mec-bitacora-time">{timeStr}</span>
                            <span className="mec-bitacora-icon">
                              {entry.accion === 'marcar' && '✅'}
                              {entry.accion === 'nota' && '📝'}
                              {entry.accion === 'enviar_lab' && '🔬'}
                            </span>
                            <span className="mec-bitacora-text">
                              {entry.accion === 'marcar' && `${(entry.tipo || '').replace(/_/g, ' ')} marcado`}
                              {entry.accion === 'nota' && `Nota: ${entry.descripcion}`}
                              {entry.accion === 'enviar_lab' && entry.descripcion}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Repuestos — SOLO para laboratorio directo e interna */}
          {(selectedOrden.tipo === 'laboratorio_directo' || selectedOrden.tipo === 'interna') && (
            <div className="mec-section-card">
              <div className="mec-card-header">
                <h3 className="mec-card-title">📦 Repuestos</h3>
                {selectedOrden.estado !== 'terminada' && (
                  <button className="btn btn-accent btn-touch" onClick={() => setShowRepuestoModal(true)}>
                    ➕ Solicitar
                  </button>
                )}
              </div>

              {(selectedOrden.solicitudesRepuesto || []).length > 0 ? (
                <div className="mec-repuestos-list">
                  {(selectedOrden.solicitudesRepuesto || []).map(sol => (
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
          )}

          {/* Fotos — SOLO para tipo 'cliente' (camioneta completa) */}
          {selectedOrden.tipo === 'cliente' && (
            <div className="mec-section-card">
              <div className="mec-card-header">
                <h3 className="mec-card-title">📸 Fotos del Vehículo</h3>
                {selectedOrden.estado !== 'terminada' && (
                  <button
                    className="btn btn-primary btn-touch"
                    onClick={() => fotoInputRef.current?.click()}
                  >
                    📷 Tomar Foto
                  </button>
                )}
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
                  {(selectedOrden.fotos || []).map(foto => (
                    <div key={foto.id} className="mec-foto-item">
                      <img
                        src={foto.data_url || foto.dataUrl}
                        alt="Foto O.T."
                        onClick={() => window.open(foto.data_url || foto.dataUrl, '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                      {selectedOrden.estado !== 'terminada' && (
                        <button
                          className="mec-foto-delete"
                          onClick={() => eliminarFoto(selectedOrden.id, foto.id)}
                          title="Eliminar foto"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-tertiary">Sin fotos. Toma fotos del vehículo, daños, motor, etc.</p>
              )}
            </div>
          )}

          {/* Mark as Done */}
          {selectedOrden.estado !== 'terminada' && (
            <button
              className="btn btn-success btn-lg btn-block mec-finish-btn"
              onClick={() => setShowFinishConfirm(true)}
            >
              ✅ MARCAR COMO TERMINADA
            </button>
          )}
        </div>
      )}

      {/* Finish Confirmation Modal */}
      {showFinishConfirm && selectedOrden && (
        <div className="modal-overlay" onClick={() => setShowFinishConfirm(false)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✅ Confirmar finalización</h2>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de marcar la <strong>O.T. {String(selectedOrden.numeroOt).padStart(3, '0')}</strong> como terminada?</p>
              <p className="text-sm text-tertiary" style={{ marginTop: 'var(--space-2)' }}>
                {selectedOrden.marcaModelo} — {(selectedOrden.actividades || []).length} actividades realizadas
              </p>
              <p className="text-sm text-tertiary" style={{ marginTop: 'var(--space-1)' }}>
                Esta acción notificará al administrador y la O.T. pasará a tu historial.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowFinishConfirm(false)}>Cancelar</button>
              <button className="btn btn-success btn-lg" onClick={handleConfirmFinish}>
                ✅ Sí, finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repuesto Request Modal */}
      {showRepuestoModal && selectedOrden && (
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
                  inputMode="numeric"
                  min="1"
                  placeholder="Ej: 4"
                  value={repuestoForm.cantidad}
                  onChange={(e) => setRepuestoForm(p => ({ ...p, cantidad: e.target.value }))}
                  onFocus={(e) => e.target.select()}
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

      {/* Delete Activity Confirmation Modal */}
      {deleteActConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteActConfirm(null)}>
          <div className="modal" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Quitar actividad</h2>
            </div>
            <div className="modal-body">
              <p>¿Quitar <strong>{deleteActConfirm.label}</strong> de las actividades realizadas?</p>
              <p className="text-sm text-tertiary" style={{ marginTop: 'var(--space-2)' }}>Esto también la eliminará de la bitácora si fue registrada hoy.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteActConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger btn-lg" onClick={confirmEliminarActividad}>
                ✕ Sí, quitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Modal */}
      {showLabModal && selectedOrden && (
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
