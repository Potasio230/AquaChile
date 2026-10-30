export const familias = ['Operativo', 'Técnico', 'Profesional', 'Supervisión o jefatura', 'Administrativo']
export const areas = ['Centro de cultivo', 'Piscicultura', 'Planta de proceso', 'Mantención', 'Calidad', 'Logística', 'Administración', 'Otra']
export const turnos = ['Jornada ordinaria', 'Sistema de turnos', '7x7', '10x10', '14x14', 'Otro']
export const cargos = ['Operario de Centro de Cultivo', 'Operador de Pontón', 'Buzo Acuicultor', 'Técnico en Acuicultura', 'Jefe de Centro de Cultivo', 'Supervisor de Producción', 'Operario de Planta de Proceso', 'Operador de Sala de Despiece', 'Técnico en Mantención', 'Electricista', 'Mecánico', 'Analista de Calidad', 'Encargado de Logística', 'Administrativo']
export const centros = ['Centro Melinka 04', 'Centro de Cultivo Punta Johnson', 'Centro de Cultivo Puqueldón', 'Piscicultura Calbuco', 'Piscicultura Río Pescado', 'Piscicultura Hollenberg', 'Planta de Proceso Puerto Montt', 'Planta de Proceso Natales', 'Oficina Corporativa Puerto Montt']
export const localidades = ['Calbuco', 'Chiloé', 'Melinka', 'Puerto Aysén', 'Puerto Montt', 'Puerto Natales', 'Punta Arenas', 'Temuco', 'Valdivia']

export const initialApplicationForm = {
  nombre: '', identificador: '', email: '', telefono: '', cargo: '', centroTrabajo: '', localidad: '',
  analista: '', correoAnalista: '', familiaCargo: '', area: '', turno: '', fechaInforme: '', observaciones: '', cv: null,
}

export const demoCandidates = [
  {
    label: 'Candidato 1 (Carlos · Operario 14x14)',
    values: {
      ...initialApplicationForm,
      nombre: 'Carlos Mendoza Silva', identificador: '18.456.789-K', email: 'carlos.mendoza@correo.demo',
      telefono: '+56 9 8765 4321', cargo: 'Operario de Centro de Cultivo', centroTrabajo: 'Centro Melinka 04',
      localidad: 'Melinka', analista: 'Benjamín Reclutador', correoAnalista: 'seleccion@aquachile.demo',
      familiaCargo: 'Operativo', area: 'Centro de cultivo', turno: '14x14', fechaInforme: '2026-11-15',
      observaciones: 'Experiencia previa de 3 años en pontón marítimo y alimentación de salmones.',
    },
  },
  {
    label: 'Candidato 2 (Camila · Jefa Centro)',
    values: {
      ...initialApplicationForm,
      nombre: 'Camila Soto Navarrete', identificador: '16.782.341-6', email: 'camila.soto@correo.demo',
      telefono: '+56 9 7654 3210', cargo: 'Jefe de Centro de Cultivo', centroTrabajo: 'Piscicultura Calbuco',
      localidad: 'Calbuco', analista: 'Benjamín Reclutador', correoAnalista: 'seleccion@aquachile.demo',
      familiaCargo: 'Supervisión o jefatura', area: 'Piscicultura', turno: '14x14', fechaInforme: '2026-11-18',
      observaciones: 'Ingeniera en Acuicultura, 5 años liderando faenas de biomasa y estándares sanitarios.',
    },
  },
]

