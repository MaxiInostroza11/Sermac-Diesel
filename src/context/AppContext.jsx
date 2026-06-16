import { createContext, useContext, useState, useCallback } from 'react';
import { MOCK_USERS, MOCK_CLIENTES, MOCK_REPUESTOS, MOCK_ORDENES, MAX_TRABAJOS_ACTIVOS } from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Auth state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sermac_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Data state
  const [ordenes, setOrdenes] = useState(MOCK_ORDENES);
  const [clientes, setClientes] = useState(MOCK_CLIENTES);
  const [repuestos, setRepuestos] = useState(MOCK_REPUESTOS);
  const [usuarios] = useState(MOCK_USERS);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // --- Auth ---
  const login = useCallback((rut, password) => {
    const user = MOCK_USERS.find(u => u.rut === rut && u.password === password);
    if (user) {
      const userData = { id: user.id, rut: user.rut, nombre: user.nombre, rol: user.rol };
      setCurrentUser(userData);
      localStorage.setItem('sermac_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, error: 'RUT o contraseña incorrectos' };
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('sermac_user');
  }, []);

  const isAdmin = currentUser?.rol === 'admin';

  // --- Ordenes ---
  const getNextOtNumber = useCallback(() => {
    if (ordenes.length === 0) return 1;
    return Math.max(...ordenes.map(o => o.numeroOt)) + 1;
  }, [ordenes]);

  const createOrden = useCallback((ordenData) => {
    const newOrden = {
      ...ordenData,
      id: `ot_${Date.now()}`,
      numeroOt: getNextOtNumber(),
      tipo: ordenData.tipo || 'cliente',
      ordenPadreId: ordenData.ordenPadreId || null,
      estado: 'ingresada',
      mecanicoId: ordenData.mecanicoId || null,
      mecanicoNombre: ordenData.mecanicoNombre || null,
      kilometraje: ordenData.kilometraje || '',
      nivelCombustible: ordenData.nivelCombustible || '',
      danosExistentes: ordenData.danosExistentes || '',
      patenteVehiculo: ordenData.patenteVehiculo || '',
      clienteNotificado: false,
      actividades: [],
      bitacora: [],
      solicitudesRepuesto: [],
      fotos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOrdenes(prev => [newOrden, ...prev]);

    // Auto-register client if new (only for client OTs)
    if (newOrden.tipo === 'cliente') {
      const existingClient = clientes.find(c => c.nombre === ordenData.clienteNombre);
      if (!existingClient && ordenData.clienteNombre) {
        const newClient = {
          id: `c_${Date.now()}`,
          nombre: ordenData.clienteNombre,
          telefono: ordenData.clienteTelefono || '',
          createdAt: new Date().toISOString().split('T')[0],
        };
        setClientes(prev => [...prev, newClient]);
      }
    }

    const label = newOrden.tipo === 'interna' ? 'O.T. Interna' : 'O.T.';
    addNotification('success', `${label} Nº ${String(newOrden.numeroOt).padStart(3, '0')} creada exitosamente`);
    return newOrden;
  }, [getNextOtNumber, clientes]);

  const updateOrden = useCallback((ordenId, updates) => {
    setOrdenes(prev => prev.map(o =>
      o.id === ordenId
        ? { ...o, ...updates, updatedAt: new Date().toISOString() }
        : o
    ));
  }, []);

  // --- Asignar mecánico (admin) ---
  const asignarMecanico = useCallback((ordenId, mecanicoId) => {
    const mec = usuarios.find(u => u.id === mecanicoId);
    if (!mec) return;
    setOrdenes(prev => prev.map(o =>
      o.id === ordenId
        ? {
            ...o,
            mecanicoId: mec.id,
            mecanicoNombre: mec.nombre,
            estado: o.estado === 'ingresada' ? 'en_proceso' : o.estado,
            updatedAt: new Date().toISOString(),
          }
        : o
    ));
    addNotification('success', `O.T. asignada a ${mec.nombre}`);
  }, [usuarios]);

  // --- Tomar trabajo con límite ---
  const getTrabajosMecanico = useCallback((mecanicoId) => {
    return ordenes.filter(o => o.mecanicoId === mecanicoId && o.estado !== 'terminada');
  }, [ordenes]);

  const tomarTrabajo = useCallback((ordenId) => {
    if (!currentUser) return false;
    const activos = getTrabajosMecanico(currentUser.id);
    if (activos.length >= MAX_TRABAJOS_ACTIVOS) {
      addNotification('warning', `⚠️ Máximo ${MAX_TRABAJOS_ACTIVOS} trabajos activos. Termina uno antes de tomar otro.`);
      return false;
    }
    setOrdenes(prev => prev.map(o =>
      o.id === ordenId
        ? {
            ...o,
            mecanicoId: currentUser.id,
            mecanicoNombre: currentUser.nombre,
            estado: o.estado === 'ingresada' ? 'en_proceso' : o.estado,
            updatedAt: new Date().toISOString(),
          }
        : o
    ));
    addNotification('success', 'Trabajo asignado correctamente');
    return true;
  }, [currentUser, getTrabajosMecanico]);

  // --- Actividades toggle + bitácora ---
  const toggleActividad = useCallback((ordenId, tipo) => {
    setOrdenes(prev => prev.map(o => {
      if (o.id !== ordenId) return o;
      const yaExiste = o.actividades.some(a => a.tipo === tipo);
      const now = new Date().toISOString();
      const bitacoraEntry = {
        id: `bit_${Date.now()}`,
        accion: yaExiste ? 'desmarcar' : 'marcar',
        tipo,
        mecanicoId: currentUser?.id,
        mecanicoNombre: currentUser?.nombre,
        createdAt: now,
      };
      return {
        ...o,
        actividades: yaExiste
          ? o.actividades.filter(a => a.tipo !== tipo)
          : [...o.actividades, { id: `act_${Date.now()}`, tipo, descripcion: '', mecanicoId: currentUser?.id, createdAt: now }],
        bitacora: [...(o.bitacora || []), bitacoraEntry],
        updatedAt: now,
      };
    }));
  }, [currentUser]);

  const agregarActividad = useCallback((ordenId, actividad) => {
    const now = new Date().toISOString();
    setOrdenes(prev => prev.map(o => {
      if (o.id !== ordenId) return o;
      const bitacoraEntry = {
        id: `bit_${Date.now()}`,
        accion: 'nota',
        tipo: actividad.tipo,
        descripcion: actividad.descripcion,
        mecanicoId: currentUser?.id,
        mecanicoNombre: currentUser?.nombre,
        createdAt: now,
      };
      return {
        ...o,
        actividades: [...o.actividades, {
          id: `act_${Date.now()}`,
          ...actividad,
          mecanicoId: currentUser?.id,
          createdAt: now,
        }],
        bitacora: [...(o.bitacora || []), bitacoraEntry],
        updatedAt: now,
      };
    }));
  }, [currentUser]);

  // --- O.T. Internas (Laboratorio) ---
  const crearOTInterna = useCallback((ordenPadreId, descripcion) => {
    const padre = ordenes.find(o => o.id === ordenPadreId);
    if (!padre) return null;
    const interna = createOrden({
      tipo: 'interna',
      ordenPadreId,
      clienteNombre: padre.clienteNombre,
      clienteTelefono: padre.clienteTelefono,
      servicios: padre.servicios,
      marcaModelo: padre.marcaModelo,
      observaciones: `🔬 Lab: ${descripcion || 'Revisión de componentes'} (desde O.T. ${String(padre.numeroOt).padStart(3, '0')})`,
    });
    // Add bitacora to parent
    setOrdenes(prev => prev.map(o => {
      if (o.id !== ordenPadreId) return o;
      return {
        ...o,
        bitacora: [...(o.bitacora || []), {
          id: `bit_${Date.now()}`,
          accion: 'enviar_lab',
          tipo: 'laboratorio',
          descripcion: `Enviado a laboratorio → O.T. Interna Nº ${String(interna.numeroOt).padStart(3, '0')}`,
          mecanicoId: currentUser?.id,
          mecanicoNombre: currentUser?.nombre,
          createdAt: new Date().toISOString(),
        }],
        updatedAt: new Date().toISOString(),
      };
    }));
    return interna;
  }, [ordenes, createOrden, currentUser]);

  // --- Repuestos / Solicitudes ---
  const solicitarRepuesto = useCallback((ordenId, repuestoId, cantidad) => {
    const repuesto = repuestos.find(r => r.id === repuestoId);
    if (!repuesto) return;

    const solicitud = {
      id: `sr_${Date.now()}`,
      repuestoId,
      repuestoNombre: `${repuesto.nombre} ${repuesto.modelo}`,
      cantidad,
      estado: 'pendiente',
      mecanicoId: currentUser?.id,
      createdAt: new Date().toISOString(),
    };

    setOrdenes(prev => prev.map(o => {
      if (o.id !== ordenId) return o;
      return {
        ...o,
        solicitudesRepuesto: [...o.solicitudesRepuesto, solicitud],
        updatedAt: new Date().toISOString(),
      };
    }));

    addNotification('info', `Solicitud de ${cantidad}x ${repuesto.nombre} enviada para aprobación`);
  }, [repuestos, currentUser]);

  const aprobarSolicitud = useCallback((ordenId, solicitudId) => {
    setOrdenes(prev => prev.map(o => {
      if (o.id !== ordenId) return o;
      const updatedSolicitudes = o.solicitudesRepuesto.map(s => {
        if (s.id !== solicitudId) return s;
        return { ...s, estado: 'aprobada', aprobadoPor: currentUser?.id };
      });
      return { ...o, solicitudesRepuesto: updatedSolicitudes, updatedAt: new Date().toISOString() };
    }));

    // Deduct from inventory
    const orden = ordenes.find(o => o.id === ordenId);
    const solicitud = orden?.solicitudesRepuesto.find(s => s.id === solicitudId);
    if (solicitud) {
      setRepuestos(prev => prev.map(r => {
        if (r.id !== solicitud.repuestoId) return r;
        const newStock = r.stock - solicitud.cantidad;
        if (newStock <= r.stockMinimo) {
          addNotification('warning', `⚠️ ALARMA: ${r.nombre} ${r.modelo} — Stock bajo: ${newStock} unidades`);
        }
        return { ...r, stock: newStock };
      }));
    }

    addNotification('success', 'Solicitud aprobada — stock descontado');
  }, [ordenes, currentUser]);

  const rechazarSolicitud = useCallback((ordenId, solicitudId) => {
    setOrdenes(prev => prev.map(o => {
      if (o.id !== ordenId) return o;
      const updatedSolicitudes = o.solicitudesRepuesto.map(s => {
        if (s.id !== solicitudId) return s;
        return { ...s, estado: 'rechazada' };
      });
      return { ...o, solicitudesRepuesto: updatedSolicitudes, updatedAt: new Date().toISOString() };
    }));
    addNotification('info', 'Solicitud rechazada');
  }, []);

  // --- Inventory ---
  const addRepuesto = useCallback((repuestoData) => {
    const newRepuesto = {
      ...repuestoData,
      id: `r_${Date.now()}`,
    };
    setRepuestos(prev => [...prev, newRepuesto]);
    addNotification('success', `Repuesto "${repuestoData.nombre}" agregado al inventario`);
    return newRepuesto;
  }, []);

  const updateRepuesto = useCallback((repuestoId, updates) => {
    setRepuestos(prev => prev.map(r =>
      r.id === repuestoId ? { ...r, ...updates } : r
    ));
  }, []);

  const deleteRepuesto = useCallback((repuestoId) => {
    setRepuestos(prev => prev.filter(r => r.id !== repuestoId));
    addNotification('info', 'Repuesto eliminado del inventario');
  }, []);

  // --- Clientes CRUD ---
  const addCliente = useCallback((clienteData) => {
    const newCliente = {
      ...clienteData,
      id: `c_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setClientes(prev => [...prev, newCliente]);
    addNotification('success', `Cliente "${clienteData.nombre}" registrado`);
    return newCliente;
  }, []);

  const updateCliente = useCallback((clienteId, updates) => {
    setClientes(prev => prev.map(c =>
      c.id === clienteId ? { ...c, ...updates } : c
    ));
    addNotification('success', 'Datos del cliente actualizados');
  }, []);

  // --- Fotos ---
  const agregarFoto = useCallback((ordenId, fotoData) => {
    setOrdenes(prev => prev.map(o => {
      if (o.id !== ordenId) return o;
      const fotos = o.fotos || [];
      return {
        ...o,
        fotos: [...fotos, {
          id: `foto_${Date.now()}`,
          dataUrl: fotoData,
          mecanicoId: currentUser?.id,
          createdAt: new Date().toISOString(),
        }],
        updatedAt: new Date().toISOString(),
      };
    }));
    addNotification('success', '📸 Foto agregada a la O.T.');
  }, [currentUser]);

  const eliminarFoto = useCallback((ordenId, fotoId) => {
    setOrdenes(prev => prev.map(o => {
      if (o.id !== ordenId) return o;
      return {
        ...o,
        fotos: (o.fotos || []).filter(f => f.id !== fotoId),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  // --- Notifications ---
  const addNotification = useCallback((type, message) => {
    const notif = { id: Date.now(), type, message };
    setNotifications(prev => [...prev, notif]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    }, 4000);
  }, []);

  // --- Computed ---
  const pendingApprovals = ordenes.reduce((count, o) => {
    return count + o.solicitudesRepuesto.filter(s => s.estado === 'pendiente').length;
  }, 0);

  const lowStockItems = repuestos.filter(r => r.stock <= r.stockMinimo);

  const mecanicos = usuarios.filter(u => u.rol === 'mecanico');

  const value = {
    // Auth
    currentUser,
    login,
    logout,
    isAdmin,
    // Data
    ordenes,
    clientes,
    repuestos,
    usuarios,
    mecanicos,
    // O.T. actions
    getNextOtNumber,
    createOrden,
    updateOrden,
    tomarTrabajo,
    asignarMecanico,
    getTrabajosMecanico,
    // Activity actions
    toggleActividad,
    agregarActividad,
    // O.T. Interna
    crearOTInterna,
    // Foto actions
    agregarFoto,
    eliminarFoto,
    // Repuesto actions
    solicitarRepuesto,
    aprobarSolicitud,
    rechazarSolicitud,
    addRepuesto,
    updateRepuesto,
    deleteRepuesto,
    // Cliente actions
    addCliente,
    updateCliente,
    // Notifications
    notifications,
    addNotification,
    // Computed
    pendingApprovals,
    lowStockItems,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
