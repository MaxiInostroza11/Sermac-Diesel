import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WHATSAPP_MESSAGE } from '../data/mockData';
import './OrdenesAdmin.css';

export default function OrdenesAdmin({ onNavigate }) {
  const { ordenes, mecanicos, updateOrden, aprobarSolicitud, rechazarSolicitud, asignarMecanico } = useApp();
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [search, setSearch] = useState('');

  const filteredOrdenes = ordenes.filter(o => {
    // Tipo filter
    if (filterEstado === 'interna') {
      if (o.tipo !== 'interna') return false;
    } else if (filterEstado !== 'todos') {
      if (o.estado !== filterEstado) return false;
    }
    // Search filter (applied on top of estado filter)
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        String(o.numeroOt).padStart(3, '0').includes(search) ||
        (o.clienteNombre || '').toLowerCase().includes(searchLower) ||
        (o.marcaModelo || '').toLowerCase().includes(searchLower) ||
        (o.patenteVehiculo || '').toLowerCase().includes(searchLower) ||
        (o.mecanicoNombre || '').toLowerCase().includes(searchLower)
      );
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const estadoLabel = { ingresada: 'Ingresada', en_proceso: 'En Proceso', terminada: 'Terminada' };
  const estadoIcon = { ingresada: '🔵', en_proceso: '🟡', terminada: '🟢' };

  const formatDate = (d) => new Date(d).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const sendWhatsApp = (orden) => {
    const message = WHATSAPP_MESSAGE(orden.numeroOt, orden.marcaModelo);
    const phone = (orden.clienteTelefono || '').replace(/\+/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    updateOrden(orden.id, { clienteNotificado: true });
  };

  const getSistemaLabel = (s) => {
    const labels = { inyector: 'Inyector', bomba: 'Bomba', turbo: 'Turbo', dpf: 'DPF', vehiculo_completo: 'Vehículo', otro: 'Otro' };
    return labels[s] || s;
  };

  const internasCount = ordenes.filter(o => o.tipo === 'interna').length;

  const handleCardClick = (orden) => {
    setSelectedOrden(selectedOrden?.id === orden.id ? null : orden);
  };

  const handleEstadoChange = (ordenId, estado) => {
    updateOrden(ordenId, { estado });
    // Update the selectedOrden reference
    setSelectedOrden(prev => prev?.id === ordenId ? { ...prev, estado } : prev);
  };

  const handleAsignarMecanico = (ordenId, mecId) => {
    asignarMecanico(ordenId, mecId);
    const mec = mecanicos.find(m => m.id === mecId);
    setSelectedOrden(prev => prev?.id === ordenId
      ? { ...prev, mecanicoId: mecId, mecanicoNombre: mec?.nombre || null }
      : prev
    );
  };

  return (
    <div className="ordenes-admin">
      <div className="page-header">
        <div>
          <h1 className="page-title">Órdenes de Trabajo</h1>
          <p className="page-subtitle">{filteredOrdenes.length} orden{filteredOrdenes.length !== 1 ? 'es' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('nueva-ot')}>
          ➕ Nueva O.T.
        </button>
      </div>

      {/* Filters */}
      <div className="ordenes-filters">
        <div className="search-bar" style={{ flex: 1 }}>
          <span className="search-icon">🔍</span>
          <input
            className="input"
            placeholder="Buscar por Nº, cliente, patente, vehículo o mecánico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {[
            { key: 'todos', label: '📋 Todas', count: ordenes.length },
            { key: 'ingresada', label: `${estadoIcon.ingresada} Ingresada`, count: ordenes.filter(o => o.estado === 'ingresada' && o.tipo !== 'interna').length },
            { key: 'en_proceso', label: `${estadoIcon.en_proceso} En Proceso`, count: ordenes.filter(o => o.estado === 'en_proceso').length },
            { key: 'terminada', label: `${estadoIcon.terminada} Terminada`, count: ordenes.filter(o => o.estado === 'terminada').length },
            { key: 'interna', label: '🔬 Internas', count: internasCount },
          ].map(tab => (
            <button
              key={tab.key}
              className={`filter-tab ${filterEstado === tab.key ? 'active' : ''}`}
              onClick={() => setFilterEstado(tab.key)}
            >
              {tab.label}
              <span className="filter-count">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="ordenes-list">
        {filteredOrdenes.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No se encontraron órdenes</h3>
            <p>Intenta con otro filtro o crea una nueva O.T.</p>
          </div>
        ) : (
          filteredOrdenes.map(orden => (
            <div
              key={orden.id}
              className={`orden-card card ${selectedOrden?.id === orden.id ? 'orden-selected' : ''}`}
              onClick={() => handleCardClick(orden)}
            >
              <div className="orden-card-header">
                <div className="orden-card-left">
                  <span className="orden-number">
                    {orden.tipo === 'interna' ? '🔬 ' : ''}O.T. {String(orden.numeroOt).padStart(3, '0')}
                  </span>
                  <span className={`badge badge-${orden.estado.replace('_', '-')}`}>
                    {estadoIcon[orden.estado]} {estadoLabel[orden.estado]}
                  </span>
                  {orden.solicitudesRepuesto.some(s => s.estado === 'pendiente') && (
                    <span className="badge badge-pendiente">📦 Rep. Pendiente</span>
                  )}
                  {orden.estado === 'terminada' && !orden.clienteNotificado && orden.tipo !== 'interna' && (
                    <span className="badge badge-ingresada">📲 Sin notificar</span>
                  )}
                </div>
                <div className="orden-card-right">
                  {orden.patenteVehiculo && (
                    <span className="orden-patente">{orden.patenteVehiculo}</span>
                  )}
                  <span className="orden-date">{formatDate(orden.createdAt)}</span>
                </div>
              </div>

              <div className="orden-card-body">
                <div className="orden-info-grid">
                  <div>
                    <span className="text-xs text-tertiary">Cliente</span>
                    <p className="font-medium">{orden.clienteNombre || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-tertiary">Vehículo</span>
                    <p className="font-medium">{orden.marcaModelo}</p>
                  </div>
                  <div>
                    <span className="text-xs text-tertiary">Servicio</span>
                    <p className="font-medium">
                      {orden.servicios.map(s => `${s.cantidad}x ${getSistemaLabel(s.sistema)}`).join(', ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-tertiary">Mecánico</span>
                    <p className="font-medium">{orden.mecanicoNombre || '— Sin asignar —'}</p>
                  </div>
                </div>

                {orden.observaciones && (
                  <p className="orden-obs">💬 {orden.observaciones}</p>
                )}
              </div>

              {/* Expanded Detail */}
              {selectedOrden?.id === orden.id && (
                <div className="orden-expanded" onClick={e => e.stopPropagation()}>

                  {/* Admin Controls — Estado + Mecánico */}
                  <div className="orden-detail-section orden-controls-grid">
                    <div className="input-group">
                      <label className="input-label">Estado de la O.T.</label>
                      <select
                        className="input"
                        value={orden.estado}
                        onChange={(e) => handleEstadoChange(orden.id, e.target.value)}
                      >
                        <option value="ingresada">🔵 Ingresada</option>
                        <option value="en_proceso">🟡 En Proceso</option>
                        <option value="terminada">🟢 Terminada</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Asignar Mecánico</label>
                      <select
                        className="input"
                        value={orden.mecanicoId || ''}
                        onChange={(e) => handleAsignarMecanico(orden.id, e.target.value)}
                      >
                        <option value="">— Sin asignar —</option>
                        {mecanicos.map(m => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Contact */}
                  {orden.clienteTelefono && (
                    <div className="orden-detail-section">
                      <h4>📱 Contacto</h4>
                      <p>{orden.clienteTelefono}</p>
                    </div>
                  )}

                  {/* Reception Details */}
                  {(orden.kilometraje || orden.nivelCombustible || orden.danosExistentes || orden.patenteVehiculo) && (
                    <div className="orden-detail-section">
                      <h4>🚗 Datos de Recepción</h4>
                      <div className="detail-grid">
                        {orden.patenteVehiculo && (
                          <div>
                            <span className="text-xs text-tertiary">Patente</span>
                            <p style={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                              {orden.patenteVehiculo}
                            </p>
                          </div>
                        )}
                        {orden.kilometraje && <div><span className="text-xs text-tertiary">Km</span><p>{orden.kilometraje}</p></div>}
                        {orden.nivelCombustible && <div><span className="text-xs text-tertiary">Combustible</span><p>{orden.nivelCombustible}</p></div>}
                        {orden.danosExistentes && <div className="full-width"><span className="text-xs text-tertiary">Daños</span><p>{orden.danosExistentes}</p></div>}
                      </div>
                    </div>
                  )}

                  {/* Bitácora */}
                  {(orden.bitacora || []).length > 0 && (
                    <div className="orden-detail-section">
                      <h4>📖 Bitácora ({orden.bitacora.length})</h4>
                      <div className="activities-timeline">
                        {[...orden.bitacora].reverse().slice(0, 8).map(entry => (
                          <div key={entry.id} className="timeline-item">
                            <div className={`timeline-dot ${entry.accion}`}></div>
                            <div className="timeline-content">
                              <span className="timeline-action">
                                {entry.accion === 'marcar' && '✅ '}
                                {entry.accion === 'desmarcar' && '❌ '}
                                {entry.accion === 'nota' && '📝 '}
                                {entry.accion === 'enviar_lab' && '🔬 '}
                                {entry.accion === 'marcar' && `${entry.tipo?.replace(/_/g, ' ')} marcado`}
                                {entry.accion === 'desmarcar' && `${entry.tipo?.replace(/_/g, ' ')} desmarcado`}
                                {entry.accion === 'nota' && entry.descripcion}
                                {entry.accion === 'enviar_lab' && entry.descripcion}
                              </span>
                              <span className="timeline-time">{formatDate(entry.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities */}
                  {orden.actividades.length > 0 && (
                    <div className="orden-detail-section">
                      <h4>📝 Actividades ({orden.actividades.length})</h4>
                      <div className="activities-chips">
                        {orden.actividades.map(act => (
                          <span key={act.id} className="badge badge-terminada">
                            ✅ {act.tipo.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parts Requests */}
                  {orden.solicitudesRepuesto.length > 0 && (
                    <div className="orden-detail-section">
                      <h4>📦 Solicitudes de Repuestos</h4>
                      <div className="solicitudes-list">
                        {orden.solicitudesRepuesto.map(sol => (
                          <div key={sol.id} className="solicitud-item">
                            <div className="solicitud-info">
                              <span className="font-medium">{sol.cantidad}x {sol.repuestoNombre}</span>
                              <span className={`badge badge-${sol.estado === 'aprobada' ? 'terminada' : sol.estado === 'rechazada' ? 'pendiente' : 'en-proceso'}`}>
                                {sol.estado === 'pendiente' && '⏳'} {sol.estado === 'aprobada' && '✅'} {sol.estado === 'rechazada' && '❌'} {sol.estado}
                              </span>
                            </div>
                            {sol.estado === 'pendiente' && (
                              <div className="solicitud-actions">
                                <button className="btn btn-success btn-sm" onClick={() => aprobarSolicitud(orden.id, sol.id)}>
                                  ✅ Aprobar
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => rechazarSolicitud(orden.id, sol.id)}>
                                  ❌ Rechazar
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photos */}
                  {(orden.fotos || []).length > 0 && (
                    <div className="orden-detail-section">
                      <h4>📸 Fotos ({orden.fotos.length})</h4>
                      <div className="orden-fotos-grid">
                        {orden.fotos.map(foto => (
                          <div key={foto.id} className="orden-foto-thumb">
                            <img src={foto.dataUrl} alt="Foto O.T." />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="orden-actions">
                    {orden.estado === 'terminada' && !orden.clienteNotificado && orden.tipo !== 'interna' && (
                      <button className="btn btn-success btn-lg" onClick={() => sendWhatsApp(orden)}>
                        📲 Avisar Cliente por WhatsApp
                      </button>
                    )}
                    {orden.estado === 'terminada' && orden.clienteNotificado && (
                      <span className="badge badge-terminada" style={{ padding: '8px 16px', fontSize: '14px' }}>
                        ✅ Cliente notificado
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
