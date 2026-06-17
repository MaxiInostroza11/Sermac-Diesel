import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MAX_TRABAJOS_ACTIVOS, WHATSAPP_MESSAGE } from '../data/mockData';
import './Dashboard.css';

export default function Dashboard({ onNavigate }) {
  const {
    ordenes, repuestos, mecanicos, clientes, updateOrden,
    pendingApprovals, lowStockItems, aprobarSolicitud, rechazarSolicitud
  } = useApp();

  const [expandedPanel, setExpandedPanel] = useState(null);
  const [selectedMecanico, setSelectedMecanico] = useState(null);
  const [previewOrden, setPreviewOrden] = useState(null);

  // Stats
  const totalOT = ordenes.filter(o => o.tipo !== 'interna').length;
  const enProceso = ordenes.filter(o => o.estado === 'en_proceso').length;
  const terminadas = ordenes.filter(o => o.estado === 'terminada').length;
  const internas = ordenes.filter(o => o.tipo === 'interna').length;
  const sinNotificar = ordenes.filter(o => o.estado === 'terminada' && !o.clienteNotificado && o.tipo !== 'interna');

  // Pending solicitudes with full data
  const pendingSolicitudes = [];
  ordenes.forEach(o => {
    o.solicitudesRepuesto.filter(s => s.estado === 'pendiente').forEach(s => {
      pendingSolicitudes.push({ ...s, ordenId: o.id, ordenNumero: o.numeroOt, vehiculo: o.marcaModelo });
    });
  });

  // Mechanic stats
  const getMecanicoStats = (mecId) => {
    const trabajosActivos = ordenes.filter(o => o.mecanicoId === mecId && o.estado !== 'terminada');
    const trabajosCompletados = ordenes.filter(o => o.mecanicoId === mecId && o.estado === 'terminada');
    const trabajoActual = trabajosActivos[0];
    let tiempoTrabajando = null;
    if (trabajoActual) {
      const inicio = new Date(trabajoActual.updatedAt || trabajoActual.createdAt);
      const diff = Date.now() - inicio.getTime();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      tiempoTrabajando = `${hrs}h ${mins}m`;
    }
    const progreso = trabajoActual
      ? Math.min(Math.round((trabajoActual.actividades.length / 14) * 100), 100)
      : 0;
    return { trabajosActivos, trabajosCompletados, trabajoActual, tiempoTrabajando, progreso };
  };

  const getSistemaLabel = (s) => {
    const labels = { inyector: 'Inyector', bomba: 'Bomba', turbo: 'Turbo', dpf: 'DPF', vehiculo_completo: 'Vehículo', otro: 'Otro' };
    return labels[s] || s;
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  const sendWhatsApp = (orden) => {
    const message = WHATSAPP_MESSAGE(orden.numeroOt, orden.marcaModelo);
    const phone = (orden.clienteTelefono || '').replace(/\+/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    updateOrden(orden.id, { clienteNotificado: true });
  };

  const togglePanel = (panel) => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
    setSelectedMecanico(null);
  };

  return (
    <div className="dashboard-v2">
      {/* Stat Cards — Clickable */}
      <div className="dash-stats">
        <button className="dash-stat-card" onClick={() => onNavigate('ordenes')}>
          <div className="dash-stat-icon">📋</div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{totalOT}</span>
            <span className="dash-stat-label">Total O.T.</span>
          </div>
        </button>
        <button className="dash-stat-card accent" onClick={() => onNavigate('ordenes')}>
          <div className="dash-stat-icon">🔄</div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{enProceso}</span>
            <span className="dash-stat-label">En Proceso</span>
          </div>
        </button>
        <button className="dash-stat-card success" onClick={() => onNavigate('ordenes')}>
          <div className="dash-stat-icon">✅</div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{terminadas}</span>
            <span className="dash-stat-label">Terminadas</span>
          </div>
        </button>
        <button className="dash-stat-card purple" onClick={() => onNavigate('ordenes')}>
          <div className="dash-stat-icon">🔬</div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{internas}</span>
            <span className="dash-stat-label">Internas Lab</span>
          </div>
        </button>
      </div>

      {/* Live Workshop Monitor */}
      <section className="dash-section">
        <div className="dash-section-header" onClick={() => togglePanel('monitor')}>
          <h2 className="dash-section-title">
            <span className="live-dot"></span>
            Taller en Vivo
          </h2>
          <span className="dash-toggle">{expandedPanel === 'monitor' ? '▲' : '▼'}</span>
        </div>

        <div className="dash-monitor-grid">
          {mecanicos.map(mec => {
            const stats = getMecanicoStats(mec.id);
            const isMax = stats.trabajosActivos.length >= MAX_TRABAJOS_ACTIVOS;
            const isLibre = stats.trabajosActivos.length === 0;
            const isSelected = selectedMecanico === mec.id;

            return (
              <button
                key={mec.id}
                className={`monitor-card ${isLibre ? 'libre' : ''} ${isMax ? 'maximo' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedMecanico(isSelected ? null : mec.id)}
              >
                <div className="monitor-header">
                  <div className="monitor-avatar">{mec.nombre.charAt(0)}</div>
                  <div className="monitor-name-row">
                    <span className="monitor-name">{mec.nombre}</span>
                    <span className={`monitor-carga ${isMax ? 'max' : ''}`}>
                      {stats.trabajosActivos.length}/{MAX_TRABAJOS_ACTIVOS}
                    </span>
                  </div>
                </div>

                {isLibre ? (
                  <div className="monitor-libre">
                    <span className="monitor-libre-icon">✅</span>
                    <span>Disponible</span>
                  </div>
                ) : (
                  <>
                    {stats.trabajosActivos.map(t => (
                      <div key={t.id} className="monitor-job">
                        <span className="monitor-job-ot">
                          {t.tipo === 'interna' ? '🔬' : ''} OT-{String(t.numeroOt).padStart(3, '0')}
                        </span>
                        <span className="monitor-job-vehicle">{t.marcaModelo}</span>
                        <span className="monitor-job-service">
                          {t.servicios.map(s => `${s.cantidad}x ${getSistemaLabel(s.sistema)}`).join(', ')}
                        </span>
                      </div>
                    ))}
                    <div className="monitor-progress">
                      <div className="monitor-progress-bar">
                        <div className="monitor-progress-fill" style={{ width: `${stats.progreso}%` }}></div>
                      </div>
                      <span className="monitor-progress-text">{stats.progreso}%</span>
                    </div>
                    {stats.tiempoTrabajando && (
                      <span className="monitor-time">🕐 {stats.tiempoTrabajando}</span>
                    )}
                  </>
                )}

                <div className="monitor-completed">
                  {stats.trabajosCompletados.length} completados
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected mechanic detail */}
        {selectedMecanico && (
          <div className="monitor-detail card">
            <h3>📊 Historial — {mecanicos.find(m => m.id === selectedMecanico)?.nombre}</h3>
            <div className="monitor-detail-stats">
              <div className="monitor-detail-stat">
                <span className="monitor-detail-value">{getMecanicoStats(selectedMecanico).trabajosCompletados.length}</span>
                <span className="monitor-detail-label">Completados</span>
              </div>
              <div className="monitor-detail-stat">
                <span className="monitor-detail-value">{getMecanicoStats(selectedMecanico).trabajosActivos.length}</span>
                <span className="monitor-detail-label">Activos</span>
              </div>
            </div>
            <div className="monitor-detail-list">
              {ordenes.filter(o => o.mecanicoId === selectedMecanico).slice(0, 5).map(o => (
                <div key={o.id} className="monitor-detail-item" onClick={() => onNavigate('ordenes')}>
                  <span className="font-bold" style={{ color: 'var(--color-primary-400)' }}>
                    {o.tipo === 'interna' ? '🔬' : ''} OT-{String(o.numeroOt).padStart(3, '0')}
                  </span>
                  <span>{o.marcaModelo}</span>
                  <span className={`badge badge-${o.estado.replace('_', '-')}`}>
                    {o.estado === 'ingresada' ? '🔵' : o.estado === 'en_proceso' ? '🟡' : '🟢'} {o.estado.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Action Center */}
      <section className="dash-section">
        <h2 className="dash-section-title">⚡ Centro de Acción</h2>
        <div className="dash-actions-grid">
          {/* WhatsApp notifications */}
          <button
            className={`dash-action-card ${sinNotificar.length > 0 ? 'has-items' : ''}`}
            onClick={() => togglePanel('whatsapp')}
          >
            <span className="dash-action-icon">📲</span>
            <span className="dash-action-count">{sinNotificar.length}</span>
            <span className="dash-action-label">Listos para notificar</span>
          </button>

          {/* Pending approvals */}
          <button
            className={`dash-action-card ${pendingApprovals > 0 ? 'has-items warning' : ''}`}
            onClick={() => togglePanel('repuestos')}
          >
            <span className="dash-action-icon">📦</span>
            <span className="dash-action-count">{pendingApprovals}</span>
            <span className="dash-action-label">Repuestos pendientes</span>
          </button>

          {/* Low stock */}
          <button
            className={`dash-action-card ${lowStockItems.length > 0 ? 'has-items danger' : ''}`}
            onClick={() => togglePanel('stock')}
          >
            <span className="dash-action-icon">🚨</span>
            <span className="dash-action-count">{lowStockItems.length}</span>
            <span className="dash-action-label">Stock bajo</span>
          </button>

          {/* Quick access */}
          <button className="dash-action-card new-ot" onClick={() => onNavigate('nueva-ot')}>
            <span className="dash-action-icon">➕</span>
            <span className="dash-action-count" style={{ opacity: 0 }}>0</span>
            <span className="dash-action-label">Nueva O.T.</span>
          </button>
        </div>

        {/* Expanded panels */}
        {expandedPanel === 'whatsapp' && (
          <div className="dash-expanded-panel card">
            <h3>📲 Trabajos listos — Notificar cliente</h3>
            {sinNotificar.length === 0 ? (
              <p className="text-sm text-tertiary">Todos los clientes han sido notificados ✅</p>
            ) : (
              <div className="dash-panel-list">
                {sinNotificar.map(o => (
                  <div key={o.id} className="dash-panel-item">
                    <div
                      className="dash-panel-item-clickable"
                      onClick={() => setPreviewOrden(o)}
                    >
                      <span className="font-bold" style={{ color: 'var(--color-primary-400)' }}>
                        OT-{String(o.numeroOt).padStart(3, '0')}
                      </span>
                      <span className="text-sm"> — {o.clienteNombre} — {o.marcaModelo}</span>
                    </div>
                    <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); sendWhatsApp(o); }}>
                      📲 WhatsApp
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {expandedPanel === 'repuestos' && (
          <div className="dash-expanded-panel card">
            <h3>📦 Solicitudes de repuestos pendientes</h3>
            {pendingSolicitudes.length === 0 ? (
              <p className="text-sm text-tertiary">Sin solicitudes pendientes ✅</p>
            ) : (
              <div className="dash-panel-list">
                {pendingSolicitudes.map(s => {
                  const fullOrden = ordenes.find(o => o.id === s.ordenId);
                  return (
                    <div key={s.id} className="dash-panel-item">
                      <div
                        className="dash-panel-item-clickable"
                        onClick={() => fullOrden && setPreviewOrden(fullOrden)}
                      >
                        <span className="font-bold" style={{ color: 'var(--color-primary-400)' }}>
                          OT-{String(s.ordenNumero).padStart(3, '0')}
                        </span>
                        <span className="text-sm"> — {s.cantidad}x {s.repuestoNombre}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); aprobarSolicitud(s.ordenId, s.id); }}>
                          ✅
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); rechazarSolicitud(s.ordenId, s.id); }}>
                          ❌
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {expandedPanel === 'stock' && (
          <div className="dash-expanded-panel card">
            <h3>🚨 Repuestos con stock bajo</h3>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-tertiary">Todos los stocks están OK ✅</p>
            ) : (
              <div className="dash-panel-list">
                {lowStockItems.map(r => (
                  <div key={r.id} className="dash-panel-item" onClick={() => onNavigate('inventario')}>
                    <div>
                      <span className="font-bold">{r.nombre}</span>
                      <span className="text-sm text-tertiary"> — {r.modelo}</span>
                    </div>
                    <span className="badge badge-pendiente">
                      {r.stock} / mín {r.stockMinimo}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Recent Activity — Clickable */}
      <section className="dash-section">
        <h2 className="dash-section-title">🕒 Actividad Reciente</h2>
        <div className="dash-recent-list">
          {[...ordenes]
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 8)
            .map(o => (
              <button key={o.id} className="dash-recent-item" onClick={() => onNavigate('ordenes')}>
                <div className="dash-recent-left">
                  <span className={`dash-recent-dot ${o.estado}`}></span>
                  <span className="dash-recent-ot">
                    {o.tipo === 'interna' ? '🔬 ' : ''}OT-{String(o.numeroOt).padStart(3, '0')}
                  </span>
                  <span className="dash-recent-vehicle">{o.marcaModelo}</span>
                </div>
                <div className="dash-recent-right">
                  <span className="dash-recent-mec">{o.mecanicoNombre || 'Sin asignar'}</span>
                  <span className="dash-recent-time">{formatDate(o.updatedAt)}</span>
                </div>
              </button>
            ))}
        </div>
      </section>

      {/* OT Preview Modal */}
      {previewOrden && (
        <div className="modal-overlay" onClick={() => setPreviewOrden(null)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {previewOrden.tipo === 'interna' ? '🔬 ' : ''}O.T. {String(previewOrden.numeroOt).padStart(3, '0')}
                <span className={`badge badge-${previewOrden.estado.replace('_', '-')}`} style={{ marginLeft: '12px' }}>
                  {previewOrden.estado === 'ingresada' ? '🔵' : previewOrden.estado === 'en_proceso' ? '🟡' : '🟢'} {previewOrden.estado.replace('_', ' ')}
                </span>
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreviewOrden(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="preview-detail-grid">
                <div>
                  <span className="text-xs text-tertiary">Cliente</span>
                  <p className="font-medium">{previewOrden.clienteNombre || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-tertiary">Teléfono</span>
                  <p className="font-medium">{previewOrden.clienteTelefono || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-tertiary">Vehículo</span>
                  <p className="font-medium">{previewOrden.marcaModelo}</p>
                </div>
                {previewOrden.patenteVehiculo && (
                  <div>
                    <span className="text-xs text-tertiary">Patente</span>
                    <p className="font-medium" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{previewOrden.patenteVehiculo}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-tertiary">Mecánico</span>
                  <p className="font-medium">{previewOrden.mecanicoNombre || 'Sin asignar'}</p>
                </div>
                <div>
                  <span className="text-xs text-tertiary">Servicios</span>
                  <p className="font-medium">
                    {previewOrden.servicios.map(s => `${s.cantidad}x ${getSistemaLabel(s.sistema)}`).join(', ')}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-tertiary">Fecha ingreso</span>
                  <p className="font-medium">{formatDate(previewOrden.createdAt)}</p>
                </div>
                <div>
                  <span className="text-xs text-tertiary">Última actualización</span>
                  <p className="font-medium">{formatDate(previewOrden.updatedAt)}</p>
                </div>
              </div>

              {previewOrden.observaciones && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <span className="text-xs text-tertiary">💬 Observaciones</span>
                  <p className="font-medium" style={{ marginTop: 'var(--space-1)' }}>{previewOrden.observaciones}</p>
                </div>
              )}

              {previewOrden.actividades.length > 0 && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <span className="text-xs text-tertiary">📝 Actividades ({previewOrden.actividades.length})</span>
                  <div className="activities-chips" style={{ marginTop: 'var(--space-2)' }}>
                    {previewOrden.actividades.map(act => (
                      <span key={act.id} className="badge badge-terminada">
                        ✅ {act.tipo.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {previewOrden.solicitudesRepuesto.length > 0 && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <span className="text-xs text-tertiary">📦 Repuestos ({previewOrden.solicitudesRepuesto.length})</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    {previewOrden.solicitudesRepuesto.map(sol => (
                      <div key={sol.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <span className="font-medium text-sm">{sol.cantidad}x {sol.repuestoNombre}</span>
                        <span className={`badge badge-${sol.estado === 'aprobada' ? 'terminada' : sol.estado === 'rechazada' ? 'pendiente' : 'en-proceso'}`}>
                          {sol.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(previewOrden.bitacora || []).length > 0 && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <span className="text-xs text-tertiary">📖 Bitácora (últimas 5)</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    {[...previewOrden.bitacora].reverse().slice(0, 5).map(entry => (
                      <div key={entry.id} style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                        {entry.accion === 'marcar' && '✅ '}
                        {entry.accion === 'desmarcar' && '❌ '}
                        {entry.accion === 'nota' && '📝 '}
                        {entry.accion === 'enviar_lab' && '🔬 '}
                        {entry.descripcion || entry.tipo?.replace(/_/g, ' ')}
                        <span className="text-xs text-tertiary" style={{ marginLeft: '8px' }}>{formatDate(entry.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPreviewOrden(null)}>Cerrar</button>
              <button className="btn btn-primary" onClick={() => { setPreviewOrden(null); onNavigate('ordenes'); }}>
                📋 Ver en Órdenes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
