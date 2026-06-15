// Mock data for development - will be replaced with Supabase later

export const MOCK_USERS = [
  { id: '1', rut: '123456789', nombre: 'JC Martínez', rol: 'admin', password: 'admin123' },
  { id: '2', rut: '987654321', nombre: 'Secretaria Ana', rol: 'admin', password: 'admin123' },
  { id: '3', rut: '111222333', nombre: 'Pedro Soto', rol: 'mecanico', password: 'mec123' },
  { id: '4', rut: '444555666', nombre: 'Carlos Ruiz', rol: 'mecanico', password: 'mec123' },
  { id: '5', rut: '777888999', nombre: 'Diego Muñoz', rol: 'mecanico', password: 'mec123' },
  { id: '6', rut: '112233445', nombre: 'Felipe Lagos', rol: 'mecanico', password: 'mec123' },
];

export const MOCK_CLIENTES = [
  { id: 'c1', nombre: 'Transportes López', telefono: '56912345678', createdAt: '2025-11-15' },
  { id: 'c2', nombre: 'Agrícola del Sur', telefono: '56987654321', createdAt: '2025-12-01' },
  { id: 'c3', nombre: 'Minera Atacama SpA', telefono: '56911112222', createdAt: '2026-01-10' },
  { id: 'c4', nombre: 'Juan Pérez', telefono: '56933334444', createdAt: '2026-02-20' },
  { id: 'c5', nombre: 'Constructora Pacífico', telefono: '56955556666', createdAt: '2026-03-05' },
];

export const MOCK_REPUESTOS = [
  { id: 'r1', codigo: '56789', nombre: 'Tobera Bosch', modelo: 'DLLA450 P 362', stock: 17, stockMinimo: 4 },
  { id: 'r2', codigo: '56790', nombre: 'Tobera Bosch', modelo: 'DLLA148 P 1688', stock: 8, stockMinimo: 3 },
  { id: 'r3', codigo: '56791', nombre: 'Filtro Combustible', modelo: 'FC-1108', stock: 12, stockMinimo: 5 },
  { id: 'r4', codigo: '56792', nombre: 'Junta Inyector', modelo: 'JI-2204', stock: 25, stockMinimo: 8 },
  { id: 'r5', codigo: '56793', nombre: 'Kit Reparación Bomba', modelo: 'KRB-VE', stock: 3, stockMinimo: 2 },
  { id: 'r6', codigo: '56794', nombre: 'Válvula Reguladora', modelo: 'VR-0281', stock: 5, stockMinimo: 3 },
  { id: 'r7', codigo: '56795', nombre: 'Sensor Rail', modelo: 'SR-0281', stock: 4, stockMinimo: 4 },
  { id: 'r8', codigo: '56796', nombre: 'Arandela Cobre Inyector', modelo: 'ACI-14x20', stock: 50, stockMinimo: 15 },
];

export const MAX_TRABAJOS_ACTIVOS = 2;

export const SISTEMAS_OPTIONS = [
  { value: 'inyector', label: 'Inyector', defaultCantidad: 4 },
  { value: 'bomba', label: 'Bomba', defaultCantidad: 1 },
  { value: 'turbo', label: 'Turbo', defaultCantidad: 1 },
  { value: 'dpf', label: 'DPF / Filtro Partículas', defaultCantidad: 1 },
  { value: 'vehiculo_completo', label: 'Vehículo completo (especificar)', defaultCantidad: 1 },
  { value: 'otro', label: 'Otro (especificar)', defaultCantidad: 1 },
];

export const ACTIVIDADES_RAPIDAS = [
  { id: 'scanner', label: 'Scanner', icon: '🔍' },
  { id: 'sacar_inyectores', label: 'Sacar Inyectores', icon: '🔧' },
  { id: 'colocar_inyectores', label: 'Colocar Inyectores', icon: '🔩' },
  { id: 'sacar_turbo', label: 'Sacar Turbo', icon: '⚙️' },
  { id: 'colocar_turbo', label: 'Colocar Turbo', icon: '⚙️' },
  { id: 'sacar_dpf', label: 'Sacar DPF', icon: '🛡️' },
  { id: 'colocar_dpf', label: 'Colocar DPF', icon: '🛡️' },
  { id: 'sacar_estanque', label: 'Sacar Estanque', icon: '⛽' },
  { id: 'cambiar_filtro', label: 'Cambiar Filtro', icon: '🔄' },
  { id: 'desmontar_bomba', label: 'Desmontar Bomba', icon: '🔧' },
  { id: 'montar_bomba', label: 'Montar Bomba', icon: '🔩' },
  { id: 'prueba_banco', label: 'Prueba en Banco', icon: '📊' },
  { id: 'calibracion', label: 'Calibración', icon: '🎯' },
  { id: 'limpieza_ultrasonido', label: 'Limpieza Ultrasonido', icon: '🧹' },
];

export const NIVELES_COMBUSTIBLE = [
  { value: 'vacio', label: 'Vacío' },
  { value: '1/4', label: '1/4' },
  { value: '1/2', label: '1/2' },
  { value: '3/4', label: '3/4' },
  { value: 'lleno', label: 'Lleno' },
];

// Initial mock O.T.
export const MOCK_ORDENES = [
  {
    id: 'ot1',
    numeroOt: 1,
    clienteId: 'c1',
    clienteNombre: 'Transportes López',
    clienteTelefono: '56912345678',
    servicios: [
      { sistema: 'inyector', cantidad: 4, especificar: '' }
    ],
    marcaModelo: 'Mazda BT-50 2020',
    patenteVehiculo: 'ABCD12',
    observaciones: 'Humo negro, falta de potencia',
    tipo: 'cliente',
    ordenPadreId: null,
    estado: 'en_proceso',
    mecanicoId: '3',
    mecanicoNombre: 'Pedro Soto',
    kilometraje: '85.230',
    nivelCombustible: '1/2',
    danosExistentes: 'Abolladura en parachoque trasero lado derecho',
    clienteNotificado: false,
    actividades: [
      { id: 'a1', tipo: 'scanner', descripcion: '', mecanicoId: '3', createdAt: '2026-06-01T10:30:00' },
      { id: 'a2', tipo: 'sacar_inyectores', descripcion: 'Inyectores con alta carbonización', mecanicoId: '3', createdAt: '2026-06-01T11:15:00' },
    ],
    solicitudesRepuesto: [],
    bitacora: [],
    fotos: [],
    createdAt: '2026-06-01T09:00:00',
    updatedAt: '2026-06-01T11:15:00',
  },
  {
    id: 'ot2',
    numeroOt: 2,
    clienteId: 'c2',
    clienteNombre: 'Agrícola del Sur',
    clienteTelefono: '56987654321',
    servicios: [
      { sistema: 'bomba', cantidad: 1, especificar: '' }
    ],
    marcaModelo: 'Toyota Hilux 2019',
    patenteVehiculo: 'EFGH34',
    observaciones: 'Motor se apaga a altas RPM',
    tipo: 'cliente',
    ordenPadreId: null,
    estado: 'ingresada',
    mecanicoId: null,
    mecanicoNombre: null,
    kilometraje: '',
    nivelCombustible: '',
    danosExistentes: '',
    clienteNotificado: false,
    actividades: [],
    solicitudesRepuesto: [],
    bitacora: [],
    fotos: [],
    createdAt: '2026-06-02T08:30:00',
    updatedAt: '2026-06-02T08:30:00',
  },
  {
    id: 'ot3',
    numeroOt: 3,
    clienteId: 'c3',
    clienteNombre: 'Minera Atacama SpA',
    clienteTelefono: '56911112222',
    servicios: [
      { sistema: 'inyector', cantidad: 6, especificar: '' },
      { sistema: 'bomba', cantidad: 1, especificar: '' },
    ],
    marcaModelo: 'Hyundai H100 2018',
    patenteVehiculo: 'IJKL56',
    observaciones: 'Revisión completa del sistema de inyección',
    tipo: 'cliente',
    ordenPadreId: null,
    estado: 'en_proceso',
    mecanicoId: '4',
    mecanicoNombre: 'Carlos Ruiz',
    kilometraje: '120.500',
    nivelCombustible: '3/4',
    danosExistentes: '',
    clienteNotificado: false,
    actividades: [
      { id: 'a3', tipo: 'scanner', descripcion: '', mecanicoId: '4', createdAt: '2026-06-02T09:00:00' },
    ],
    solicitudesRepuesto: [
      { id: 'sr1', repuestoId: 'r1', repuestoNombre: 'Tobera Bosch DLLA450 P 362', cantidad: 6, estado: 'pendiente', mecanicoId: '4', createdAt: '2026-06-02T10:00:00' },
    ],
    bitacora: [],
    fotos: [],
    createdAt: '2026-06-02T08:45:00',
    updatedAt: '2026-06-02T10:00:00',
  },
  {
    id: 'ot4',
    numeroOt: 4,
    clienteId: 'c4',
    clienteNombre: 'Juan Pérez',
    clienteTelefono: '56933334444',
    servicios: [
      { sistema: 'turbo', cantidad: 1, especificar: '' }
    ],
    marcaModelo: 'Mitsubishi L200 2017',
    patenteVehiculo: 'MNOP78',
    observaciones: 'Turbo con juego axial, ruido al acelerar',
    tipo: 'cliente',
    ordenPadreId: null,
    estado: 'terminada',
    mecanicoId: '5',
    mecanicoNombre: 'Diego Muñoz',
    kilometraje: '156.000',
    nivelCombustible: '1/4',
    danosExistentes: 'Rayas en puerta conductor',
    clienteNotificado: false,
    actividades: [
      { id: 'a4', tipo: 'scanner', descripcion: '', mecanicoId: '5', createdAt: '2026-05-30T09:00:00' },
      { id: 'a5', tipo: 'sacar_turbo', descripcion: 'Turbo con daño en eje', mecanicoId: '5', createdAt: '2026-05-30T10:30:00' },
      { id: 'a6', tipo: 'colocar_turbo', descripcion: 'Turbo nuevo instalado', mecanicoId: '5', createdAt: '2026-05-31T15:00:00' },
    ],
    solicitudesRepuesto: [
      { id: 'sr2', repuestoId: 'r6', repuestoNombre: 'Válvula Reguladora VR-0281', cantidad: 1, estado: 'aprobada', mecanicoId: '5', aprobadoPor: '1', createdAt: '2026-05-30T11:00:00' },
    ],
    bitacora: [],
    fotos: [],
    createdAt: '2026-05-30T08:00:00',
    updatedAt: '2026-05-31T15:00:00',
  },
];

export const WHATSAPP_MESSAGE = (numeroOt, marcaModelo) => 
  `Estimado/a cliente, le informamos que su trabajo (O.T. Nº ${String(numeroOt).padStart(3, '0')}) para su vehículo ${marcaModelo} ya está listo para retiro.

Horarios de atención:
Lunes a Jueves: 08:30 - 13:00 / 14:30 - 18:30
Viernes: 08:30 - 13:00 / 14:30 - 18:00

¡Gracias por confiar en nosotros!
— Sermac Diesel Ltda · Bosch Diesel Center`;
