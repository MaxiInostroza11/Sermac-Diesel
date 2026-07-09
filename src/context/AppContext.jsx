import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { MAX_TRABAJOS_ACTIVOS } from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Auth state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sermac_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Data state
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Fetch Data
  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoadingData(true);
    try {
      const [
        { data: dbUsuarios },
        { data: dbClientes },
        { data: dbRepuestos },
        { data: dbOrdenes }
      ] = await Promise.all([
        supabase.from('usuarios').select('*'),
        supabase.from('clientes').select('*'),
        supabase.from('repuestos').select('*'),
        supabase.from('ordenes').select('*, cliente:clientes(*), mecanico:usuarios(*), servicios(*), actividades(*), solicitudes_repuesto(*), bitacora(*), fotos(*)')
      ]);

      setUsuarios(dbUsuarios || []);
      setClientes(dbClientes || []);
      setRepuestos(dbRepuestos || []);

      // Mapear ordenes al formato del frontend
      const mappedOrdenes = (dbOrdenes || []).map(o => ({
        ...o,
        numeroOt: o.numero_ot,
        clienteNombre: o.cliente?.nombre,
        clienteTelefono: o.cliente?.telefono,
        mecanicoNombre: o.mecanico?.nombre,
        patenteVehiculo: o.patente_vehiculo,
        marcaModelo: o.marca_modelo,
        danosExistentes: o.danos_existentes,
        nivelCombustible: o.nivel_combustible,
        ordenPadreId: o.orden_padre_id,
        clienteNotificado: o.cliente_notificado,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        solicitudesRepuesto: (o.solicitudes_repuesto || []).map(sr => ({
          ...sr,
          repuestoNombre: (dbRepuestos || []).find(r => r.id === sr.repuesto_id)?.nombre + ' ' + (dbRepuestos || []).find(r => r.id === sr.repuesto_id)?.modelo
        }))
      }));

      // Ordenar por fecha (más recientes primero)
      mappedOrdenes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrdenes(mappedOrdenes);
    } catch (error) {
      console.error('Error fetching Supabase data:', error);
    } finally {
      if (showLoader) setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // --- Notificaciones ---
  const addNotification = useCallback((type, message) => {
    const notif = { id: Date.now(), type, message };
    setNotifications(prev => [...prev, notif]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    }, 4000);
  }, []);

  // --- Auth ---
  const login = useCallback(async (rut, password) => {
    const user = usuarios.find(u => u.rut === rut && u.password === password);
    if (user) {
      const userData = { id: user.id, rut: user.rut, nombre: user.nombre, rol: user.rol };
      setCurrentUser(userData);
      localStorage.setItem('sermac_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, error: 'RUT o contraseña incorrectos' };
  }, [usuarios]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('sermac_user');
  }, []);

  const isAdmin = currentUser?.rol === 'admin';

  // --- O.T. ---
  const getNextOtNumber = useCallback(() => {
    if (ordenes.length === 0) return 1;
    return Math.max(...ordenes.map(o => o.numeroOt)) + 1;
  }, [ordenes]);

  const createOrden = useCallback(async (ordenData) => {
    let clienteId = null;

    // Buscar o crear cliente
    if (ordenData.tipo !== 'interna' && ordenData.clienteNombre) {
      let cliente = clientes.find(c => c.nombre.toLowerCase() === ordenData.clienteNombre.toLowerCase());
      if (!cliente) {
        const { data: newCliente } = await supabase.from('clientes').insert({
          nombre: ordenData.clienteNombre,
          telefono: ordenData.clienteTelefono || null
        }).select().single();
        cliente = newCliente;
      }
      clienteId = cliente?.id;
    }

    // Insertar Orden
    const { data: newOrden, error } = await supabase.from('ordenes').insert({
      cliente_id: clienteId,
      marca_modelo: ordenData.marcaModelo || '',
      patente_vehiculo: ordenData.patenteVehiculo || null,
      observaciones: ordenData.observaciones || null,
      tipo: ordenData.tipo || 'cliente',
      orden_padre_id: ordenData.ordenPadreId || null,
      estado: 'ingresada',
      mecanico_id: ordenData.mecanicoId || null,
      kilometraje: ordenData.kilometraje || null,
      nivel_combustible: ordenData.nivelCombustible || null,
      danos_existentes: ordenData.danosExistentes || null,
    }).select().single();

    if (error) {
      addNotification('danger', 'Error al crear la O.T.');
      return null;
    }

    // Insertar Servicios
    if (ordenData.servicios && ordenData.servicios.length > 0) {
      await supabase.from('servicios').insert(
        ordenData.servicios.map(s => ({
          orden_id: newOrden.id,
          sistema: s.sistema,
          cantidad: s.cantidad,
          especificar: s.especificar || null
        }))
      );
    }

    const label = newOrden.tipo === 'interna' ? 'O.T. Interna' : 'O.T.';
    addNotification('success', `${label} Nº ${String(newOrden.numero_ot).padStart(3, '0')} creada`);
    fetchData(false); // Refrescar en background sin pantalla de carga
    return newOrden;
  }, [clientes, fetchData, addNotification]);

  const updateOrden = useCallback(async (ordenId, updates) => {
    // Mapear camelCase a snake_case
    const dbUpdates = {};
    if (updates.estado) dbUpdates.estado = updates.estado;
    if (updates.kilometraje) dbUpdates.kilometraje = updates.kilometraje;
    if (updates.nivelCombustible) dbUpdates.nivel_combustible = updates.nivelCombustible;
    if (updates.danosExistentes) dbUpdates.danos_existentes = updates.danosExistentes;
    if (updates.clienteNotificado !== undefined) dbUpdates.cliente_notificado = updates.clienteNotificado;
    if (updates.mecanicoId) dbUpdates.mecanico_id = updates.mecanicoId;

    await supabase.from('ordenes').update(dbUpdates).eq('id', ordenId);
    fetchData(false);
  }, [fetchData]);

  const asignarMecanico = useCallback(async (ordenId, mecanicoId) => {
    await updateOrden(ordenId, { mecanicoId, estado: 'en_proceso' });
    addNotification('success', `O.T. asignada al mecánico`);
  }, [updateOrden, addNotification]);

  const getTrabajosMecanico = useCallback((mecanicoId) => {
    return ordenes.filter(o => o.mecanicoId === mecanicoId && o.estado !== 'terminada');
  }, [ordenes]);

  const tomarTrabajo = useCallback(async (ordenId) => {
    if (!currentUser) return false;
    const activos = getTrabajosMecanico(currentUser.id);
    if (activos.length >= MAX_TRABAJOS_ACTIVOS) {
      addNotification('warning', `⚠️ Máximo ${MAX_TRABAJOS_ACTIVOS} trabajos activos.`);
      return false;
    }
    await updateOrden(ordenId, { mecanicoId: currentUser.id, estado: 'en_proceso' });
    addNotification('success', 'Trabajo asignado correctamente');
    return true;
  }, [currentUser, getTrabajosMecanico, updateOrden, addNotification]);

  // --- Actividades ---
  const toggleActividad = useCallback(async (ordenId, tipo) => {
    const orden = ordenes.find(o => o.id === ordenId);
    if (!orden) return;

    const actividadExistente = orden.actividades.find(a => a.tipo === tipo);

    if (actividadExistente) {
      // Eliminar actividad
      await supabase.from('actividades').delete().eq('id', actividadExistente.id);
      await supabase.from('bitacora').insert({ orden_id: ordenId, accion: 'desmarcar', tipo, mecanico_id: currentUser?.id });
    } else {
      // Agregar actividad
      await supabase.from('actividades').insert({ orden_id: ordenId, tipo, mecanico_id: currentUser?.id });
      await supabase.from('bitacora').insert({ orden_id: ordenId, accion: 'marcar', tipo, mecanico_id: currentUser?.id });
    }
    fetchData(false);
  }, [ordenes, currentUser, fetchData]);

  const agregarActividad = useCallback(async (ordenId, actividad) => {
    await supabase.from('actividades').insert({
      orden_id: ordenId,
      tipo: actividad.tipo,
      descripcion: actividad.descripcion,
      mecanico_id: currentUser?.id
    });
    await supabase.from('bitacora').insert({
      orden_id: ordenId,
      accion: 'nota',
      tipo: actividad.tipo,
      descripcion: actividad.descripcion,
      mecanico_id: currentUser?.id
    });
    fetchData(false);
  }, [currentUser, fetchData]);

  // --- O.T. Interna ---
  const crearOTInterna = useCallback(async (ordenPadreId, descripcion) => {
    const padre = ordenes.find(o => o.id === ordenPadreId);
    if (!padre) return null;

    // Crear orden interna
    const internaData = {
      tipo: 'interna',
      ordenPadreId,
      clienteNombre: padre.clienteNombre,
      clienteTelefono: padre.clienteTelefono,
      servicios: padre.servicios,
      marcaModelo: padre.marcaModelo,
      observaciones: `🔬 Lab: ${descripcion || 'Revisión de componentes'} (desde O.T. ${String(padre.numeroOt).padStart(3, '0')})`
    };

    const newInterna = await createOrden(internaData);

    // Bitácora en el padre
    if (newInterna) {
      await supabase.from('bitacora').insert({
        orden_id: ordenPadreId,
        accion: 'enviar_lab',
        tipo: 'laboratorio',
        descripcion: `Enviado a laboratorio → O.T. Interna`,
        mecanico_id: currentUser?.id
      });
      fetchData(false);
    }
    return newInterna;
  }, [ordenes, createOrden, currentUser, fetchData]);

  // --- Repuestos ---
  const solicitarRepuesto = useCallback(async (ordenId, repuestoId, cantidad) => {
    await supabase.from('solicitudes_repuesto').insert({
      orden_id: ordenId,
      repuesto_id: repuestoId,
      cantidad,
      estado: 'pendiente',
      mecanico_id: currentUser?.id
    });
    addNotification('info', `Solicitud de repuesto enviada`);
    fetchData(false);
  }, [currentUser, fetchData, addNotification]);

  const aprobarSolicitud = useCallback(async (ordenId, solicitudId) => {
    const orden = ordenes.find(o => o.id === ordenId);
    const sol = orden?.solicitudesRepuesto.find(s => s.id === solicitudId);
    if (!sol) return;

    // Actualizar stock del repuesto real
    const repuesto = repuestos.find(r => r.id === sol.repuesto_id);
    if (repuesto) {
      const newStock = repuesto.stock - sol.cantidad;
      await supabase.from('repuestos').update({ stock: newStock }).eq('id', repuesto.id);
      
      if (newStock <= repuesto.stock_minimo) {
        addNotification('warning', `⚠️ ALARMA: ${repuesto.nombre} — Stock bajo: ${newStock}`);
      }
    }

    // Aprobar solicitud
    await supabase.from('solicitudes_repuesto')
      .update({ estado: 'aprobada', aprobado_por: currentUser?.id })
      .eq('id', solicitudId);

    addNotification('success', 'Solicitud aprobada — stock descontado');
    fetchData(false);
  }, [ordenes, repuestos, currentUser, fetchData, addNotification]);

  const rechazarSolicitud = useCallback(async (ordenId, solicitudId) => {
    await supabase.from('solicitudes_repuesto')
      .update({ estado: 'rechazada' })
      .eq('id', solicitudId);
    addNotification('info', 'Solicitud rechazada');
    fetchData(false);
  }, [fetchData, addNotification]);

  const addRepuesto = useCallback(async (repuestoData) => {
    const { data, error } = await supabase.from('repuestos').insert({
      codigo: repuestoData.codigo,
      nombre: repuestoData.nombre,
      modelo: repuestoData.modelo || null,
      stock: repuestoData.stock,
      stock_minimo: repuestoData.stockMinimo
    }).select().single();

    if (!error) {
      addNotification('success', `Repuesto "${data.nombre}" agregado al inventario`);
      fetchData(false);
    }
  }, [fetchData, addNotification]);

  // --- Fotos ---
  const agregarFoto = useCallback(async (ordenId, fotoData) => {
    await supabase.from('fotos').insert({
      orden_id: ordenId,
      data_url: fotoData
    });
    addNotification('success', '📸 Foto agregada');
    fetchData(false);
  }, [fetchData, addNotification]);

  const eliminarFoto = useCallback(async (ordenId, fotoId) => {
    await supabase.from('fotos').delete().eq('id', fotoId);
    fetchData(false);
  }, [fetchData]);

  // --- Computed ---
  const pendingApprovals = ordenes.reduce((count, o) => {
    return count + (o.solicitudesRepuesto || []).filter(s => s.estado === 'pendiente').length;
  }, 0);

  const lowStockItems = repuestos.filter(r => r.stock <= r.stock_minimo);
  const mecanicos = usuarios.filter(u => u.rol === 'mecanico');

  const value = {
    loadingData,
    currentUser,
    login,
    logout,
    isAdmin,
    ordenes,
    clientes,
    repuestos,
    usuarios,
    mecanicos,
    createOrden,
    updateOrden,
    tomarTrabajo,
    asignarMecanico,
    getTrabajosMecanico,
    toggleActividad,
    agregarActividad,
    crearOTInterna,
    agregarFoto,
    eliminarFoto,
    solicitarRepuesto,
    aprobarSolicitud,
    rechazarSolicitud,
    addRepuesto,
    notifications,
    addNotification,
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
