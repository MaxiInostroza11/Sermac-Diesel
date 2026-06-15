import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SISTEMAS_OPTIONS } from '../data/mockData';
import './NuevaOT.css';

export default function NuevaOT({ onNavigate }) {
  const { getNextOtNumber, createOrden, clientes, mecanicos } = useApp();

  const nextNumber = getNextOtNumber();
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    marcaModelo: '',
    patenteVehiculo: '',
    observaciones: '',
    mecanicoId: '',
    mecanicoNombre: '',
    servicios: [{ sistema: 'inyector', cantidad: 4, especificar: '' }],
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const clienteRef = useRef(null);

  // Client autocomplete
  useEffect(() => {
    if (form.clienteNombre.length >= 2) {
      const filtered = clientes.filter(c =>
        c.nombre.toLowerCase().includes(form.clienteNombre.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [form.clienteNombre, clientes]);

  const selectClient = (client) => {
    setForm(prev => ({
      ...prev,
      clienteNombre: client.nombre,
      clienteTelefono: client.telefono,
    }));
    setShowSuggestions(false);
  };

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleMecanicoChange = (mecId) => {
    const mec = mecanicos.find(m => m.id === mecId);
    setForm(prev => ({
      ...prev,
      mecanicoId: mecId,
      mecanicoNombre: mec ? mec.nombre : '',
    }));
  };

  const updateServicio = (index, field, value) => {
    setForm(prev => {
      const servicios = [...prev.servicios];
      servicios[index] = { ...servicios[index], [field]: value };
      // Auto-fill default quantity when changing system type
      if (field === 'sistema') {
        const opt = SISTEMAS_OPTIONS.find(o => o.value === value);
        if (opt) servicios[index].cantidad = opt.defaultCantidad;
      }
      return { ...prev, servicios };
    });
  };

  const addServicio = () => {
    setForm(prev => ({
      ...prev,
      servicios: [...prev.servicios, { sistema: 'inyector', cantidad: 4, especificar: '' }],
    }));
  };

  const removeServicio = (index) => {
    if (form.servicios.length <= 1) return;
    setForm(prev => ({
      ...prev,
      servicios: prev.servicios.filter((_, i) => i !== index),
    }));
  };

  const isValid = form.clienteNombre.trim() && form.marcaModelo.trim() && form.servicios.length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    createOrden(form);
    // Reset form for next O.T.
    setForm({
      clienteNombre: '',
      clienteTelefono: '',
      marcaModelo: '',
      patenteVehiculo: '',
      observaciones: '',
      mecanicoId: '',
      mecanicoNombre: '',
      servicios: [{ sistema: 'inyector', cantidad: 4, especificar: '' }],
    });
    setShowPreview(false);
  };

  const getSistemaLabel = (value) => {
    return SISTEMAS_OPTIONS.find(s => s.value === value)?.label || value;
  };

  return (
    <div className="nueva-ot">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nueva Orden de Trabajo</h1>
          <p className="page-subtitle">Registro de nueva O.T. para el taller</p>
        </div>
        <div className="ot-number-badge">
          <span className="ot-number-label">O.T. Nº</span>
          <span className="ot-number-value">{String(nextNumber).padStart(3, '0')}</span>
        </div>
      </div>

      <div className="nueva-ot-grid">
        {/* Form */}
        <div className="ot-form-card card">
          <h2 className="form-section-title">📋 Datos del Cliente</h2>

          <div className="form-row">
            <div className="input-group" style={{ position: 'relative', flex: 2 }} ref={clienteRef}>
              <label className="input-label">Nombre / Razón Social *</label>
              <input
                type="text"
                className="input"
                placeholder="Ej: Transportes López"
                value={form.clienteNombre}
                onChange={(e) => updateField('clienteNombre', e.target.value)}
                onFocus={() => form.clienteNombre.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && (
                <div className="autocomplete-dropdown">
                  {suggestions.map(c => (
                    <button
                      key={c.id}
                      className="autocomplete-item"
                      onMouseDown={() => selectClient(c)}
                    >
                      <span className="autocomplete-name">{c.nombre}</span>
                      <span className="autocomplete-phone">📱 {c.telefono}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="input-group">
              <label className="input-label">Teléfono (WhatsApp)</label>
              <input
                type="tel"
                className="input"
                placeholder="Ej: 56912345678"
                value={form.clienteTelefono}
                onChange={(e) => updateField('clienteTelefono', e.target.value.replace(/[^0-9+]/g, ''))}
              />
            </div>
          </div>

          <h2 className="form-section-title" style={{ marginTop: 'var(--space-6)' }}>🚗 Vehículo</h2>

          <div className="form-row">
            <div className="input-group" style={{ flex: 2 }}>
              <label className="input-label">Marca / Modelo *</label>
              <input
                type="text"
                className="input"
                placeholder="Ej: Mazda BT-50 2020"
                value={form.marcaModelo}
                onChange={(e) => updateField('marcaModelo', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Patente</label>
              <input
                type="text"
                className="input"
                placeholder="Ej: ABCD12"
                value={form.patenteVehiculo}
                onChange={(e) => updateField('patenteVehiculo', e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>
          </div>

          <h2 className="form-section-title" style={{ marginTop: 'var(--space-6)' }}>🔧 Servicios</h2>

          <div className="servicios-list">
            {form.servicios.map((servicio, idx) => (
              <div key={idx} className="servicio-row">
                <div className="input-group" style={{ flex: 2 }}>
                  <label className="input-label">Sistema / Operación</label>
                  <select
                    className="input"
                    value={servicio.sistema}
                    onChange={(e) => updateServicio(idx, 'sistema', e.target.value)}
                  >
                    {SISTEMAS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {(servicio.sistema === 'otro' || servicio.sistema === 'vehiculo_completo') && (
                  <div className="input-group" style={{ flex: 2 }}>
                    <label className="input-label">
                      {servicio.sistema === 'vehiculo_completo' ? 'Tipo de vehículo (auto, jeep, furgón, tractor...)' : 'Especificar'}
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder={servicio.sistema === 'vehiculo_completo' ? 'Ej: Furgón, Tractor, Jeep...' : 'Detalle del servicio'}
                      value={servicio.especificar}
                      onChange={(e) => updateServicio(idx, 'especificar', e.target.value)}
                    />
                  </div>
                )}

                <div className="input-group" style={{ flex: 0, minWidth: '100px' }}>
                  <label className="input-label">Cantidad</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    value={servicio.cantidad}
                    onChange={(e) => updateServicio(idx, 'cantidad', parseInt(e.target.value) || 1)}
                  />
                </div>

                {form.servicios.length > 1 && (
                  <button
                    className="btn btn-ghost btn-sm servicio-remove"
                    onClick={() => removeServicio(idx)}
                    title="Eliminar servicio"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className="btn btn-ghost btn-sm" onClick={addServicio} style={{ alignSelf: 'flex-start' }}>
            ➕ Agregar otro servicio
          </button>

          <h2 className="form-section-title" style={{ marginTop: 'var(--space-6)' }}>👷 Asignación (opcional)</h2>

          <div className="input-group">
            <label className="input-label">Mecánico asignado</label>
            <select
              className="input"
              value={form.mecanicoId}
              onChange={(e) => handleMecanicoChange(e.target.value)}
            >
              <option value="">— Sin asignar (va a bandeja) —</option>
              {mecanicos.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Observaciones</label>
            <textarea
              className="input"
              placeholder="Ej: Humo negro, falta de potencia, ruido al acelerar..."
              value={form.observaciones}
              onChange={(e) => updateField('observaciones', e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary btn-lg"
              disabled={!isValid}
              onClick={() => setShowPreview(true)}
            >
              👁️ Vista Previa O.T.
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Vista Previa — O.T. Nº {String(nextNumber).padStart(3, '0')}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="preview-ot">
                <div className="preview-brand">
                  <h3>⚙️ Sermac Diesel Ltda</h3>
                  <p>Bosch Diesel Center</p>
                </div>

                <div className="preview-grid">
                  <div className="preview-field">
                    <span className="preview-label">O.T. Nº</span>
                    <span className="preview-value">{String(nextNumber).padStart(3, '0')}</span>
                  </div>
                  <div className="preview-field">
                    <span className="preview-label">Fecha</span>
                    <span className="preview-value">{new Date().toLocaleDateString('es-CL')}</span>
                  </div>
                  <div className="preview-field">
                    <span className="preview-label">Cliente</span>
                    <span className="preview-value">{form.clienteNombre}</span>
                  </div>
                  <div className="preview-field">
                    <span className="preview-label">Contacto</span>
                    <span className="preview-value">{form.clienteTelefono || '—'}</span>
                  </div>
                  <div className="preview-field">
                    <span className="preview-label">Vehículo</span>
                    <span className="preview-value">{form.marcaModelo}</span>
                  </div>
                  {form.patenteVehiculo && (
                    <div className="preview-field">
                      <span className="preview-label">Patente</span>
                      <span className="preview-value" style={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                        {form.patenteVehiculo}
                      </span>
                    </div>
                  )}
                  {form.mecanicoNombre && (
                    <div className="preview-field">
                      <span className="preview-label">Mecánico</span>
                      <span className="preview-value">{form.mecanicoNombre}</span>
                    </div>
                  )}
                </div>

                <div className="preview-section">
                  <span className="preview-label">Servicios</span>
                  <div className="preview-servicios">
                    {form.servicios.map((s, i) => (
                      <div key={i} className="preview-servicio-item">
                        <span className="badge badge-en-proceso">
                          {s.cantidad}x {getSistemaLabel(s.sistema)}
                          {(s.sistema === 'otro' || s.sistema === 'vehiculo_completo') && s.especificar ? ` — ${s.especificar}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {form.observaciones && (
                  <div className="preview-section">
                    <span className="preview-label">Observaciones</span>
                    <p className="preview-obs">{form.observaciones}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowPreview(false)}>
                ← Editar
              </button>
              <button className="btn btn-success btn-lg" onClick={handleSubmit}>
                ✅ Ingresar O.T.
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
