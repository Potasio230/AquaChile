<div align="center">

<img src="assets/logo.png" width="240" alt="Logo de AquaChile">

# Plataforma de Gestión y Evaluación Psicolaboral — AquaChile

**Plataforma web para apoyar la recepción y gestión de solicitudes de evaluación psicolaboral.**

![Plataforma](https://img.shields.io/badge/Plataforma-Web-0A6E83?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Oracle](https://img.shields.io/badge/Base%20de%20datos-Oracle-F80000?style=for-the-badge&logo=oracle&logoColor=white)
![Estado](https://img.shields.io/badge/Estado-Prototipo-yellow?style=for-the-badge)

</div>

---

## Descripción

**AquaChile** reúne en una interfaz web los antecedentes necesarios para iniciar una evaluación psicolaboral de postulantes operativos y técnicos en centros de cultivo, pisciculturas y plantas de proceso. El proyecto incluye una página de presentación, un formulario de solicitud y un asistente virtual con información sobre el proceso.

## Funcionalidades

- Página de inicio con navegación, video e información del proceso.
- Formulario para registrar antecedentes del candidato, cargo, centro, localidad, turno, analista y fecha requerida.
- Validación del currículum en PDF o Word, con un tamaño máximo de 10 MB.
- Datos ficticios precargables para probar visualmente el formulario.
- Asistente Salmón con preguntas frecuentes y conexión opcional al servicio de chat.
- Plantillas HTML de notificación para candidato y analista.
- Scripts PL/SQL para el esquema de evaluación, auditoría y gestión de estados.

## Vistas de la Plataforma

### 1. Portal de Inicio y Marca AquaChile

Portal público institucional con video de fondo, navegación corporativa y presentación de las etapas de postulación.

![Portal de Inicio](docs/screenshots/01_portal_inicio.png)

---

### 2. Formulario de Postulación de Candidatos

Captura de antecedentes personales, cargo, instalación (piscicultura/pontón), turno (ej. 14x14) y selección de currículum en PDF/Word. Incluye botones de prueba rápida para validación visual del flujo.

![Formulario de Postulación](docs/screenshots/02_formulario_postulacion.png)

---

### 3. Asistente Salmón (Chatbot Flotante)

Asistente virtual en la esquina inferior derecha, con avatar animado, efecto máquina de escribir (*typewriter*) y preguntas frecuentes sobre turnos 14x14, certificaciones y etapas del proceso. Si el servicio del chatbot no está disponible, entrega una respuesta alternativa.

![Asistente Virtual Salmón](docs/screenshots/03_chatbot_salmon.png)

---

### 4. Notificaciones por Correo Electrónico (HTML)

El repositorio incluye plantillas HTML para los mensajes previstos en el flujo:

- **Candidato:** comprobante de postulación recibida con código de seguimiento y resumen de etapas.
- **Analista de Selección:** notificación con la ficha técnica del nuevo postulante y fecha límite requerida.

![Comprobante por Correo](docs/screenshots/04_email_candidato.png)


## Tecnologías y Arquitectura

- **Frontend:** React 19, Vite, CSS moderno responsivo, Google Fonts (`PT Sans`).
- **Diseño responsivo:** Bootstrap 5 y estilos propios con identidad AquaChile.
- **Backend incluido:** FastAPI / Python, con MongoDB Atlas o SQLite local.
- **Notificaciones:** plantillas HTML en `templates/`; el envío SMTP no está conectado al backend incluido.
- **Documentos:** carga y descarga autenticada de CVs mediante GridFS en MongoDB.
- **Asistente:** interfaz de preguntas frecuentes; el servicio de IA externo no forma parte de la API incluida.

### Organización del frontend

```text
src/
├── components/   # Componentes reutilizables que reciben props
├── data/         # Opciones y datos ficticios de la demostración
├── hooks/        # Comportamientos reutilizables de React
├── layouts/      # Estructuras pública e interna
├── pages/        # Pantallas asociadas a las rutas
├── services/     # Comunicación con la API
└── utils/        # Validaciones independientes del formulario
```

`PublicLayout` contiene el portal, la postulación y el asistente. `InternalLayout`
contiene el acceso del equipo y la gestión de evaluaciones. Los componentes
`FormField`, `FormStatus`, `SummaryCard`, `StatusBadge` y `ApplicationTable`
demuestran reutilización mediante propiedades, mientras que las páginas manejan
los estados de carga, éxito, error y datos de formulario.

---

## Equipo y Distribución de Roles

| Integrante | Rol Principal | Responsabilidades |
|---|---|---|
| **Benjamín Agüero**  | **Backend, IA & Notificaciones** | Arquitectura del servidor (FastAPI), despacho automatizado de correos corporativos HTML (SMTP), lógica del asistente interactivo e integración con el motor de evaluación psicolaboral. |
| **Luis Fermín**  | **Formularios, API & Persistencia** | Modelamiento de captura de antecedentes, validaciones de formularios de postulación interna/externa, endpoints de solicitudes y estructuración de base de datos relacional. |
| **Raúl Ferrini**  | **Frontend & UI/UX** | Diseño de interfaz en React + Vite con identidad visual de AquaChile, experiencia de usuario responsiva, integración de video corporativo y layout de vistas principales. |


## Tareas Pendientes y Próximos Pasos

- [x] **Base de Datos MongoDB:** Persistencia de postulaciones, evaluaciones, auditoría y currículums mediante MongoDB Atlas y GridFS.
- [ ] **Bandeja de Gestión Interna (Dashboard RRHH):** Visualización tabular de candidatos con filtros avanzados por centro de cultivo, localidad, turno y analista asignado.
- [ ] **Pipeline de Estados:** Gestión del ciclo de vida del candidato (*Postulado → En Revisión → Citado → Evaluado → Apto/No Apto*).
- [ ] **Módulo Psicolaboral del Evaluador:** Conectar el pre-filtro de compatibilidad del CV con la cabina de entrevista del psicólogo.
- [ ] **Autenticación y Roles:** Control de acceso basado en roles (Candidato externo vs. Analista RRHH vs. Psicólogo evaluador).
- [ ] **Almacenamiento de Archivos en la Nube:** Migración de almacenamiento de CVs y grabaciones a un almacenamiento de objetos seguro (S3 / Azure Blob).

---

## Puesta en marcha local

Copia `.env.example` a `.env` y configura allí tu conexión privada de Atlas. Para probar sin Atlas, usa `AQUACHILE_DB_MODE=sqlite`. No publiques `.env`.

### Requisitos
- Node.js 22.12 o superior
- Python (v3.10+)

### 1. Iniciar el Frontend
```bash
npm install
npm run dev
```
La aplicación abrirá en: `http://localhost:5173/`

### 2. Iniciar el Backend & Servicios
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn api.app:app --host 127.0.0.1 --port 8000 --reload
```
API y documentación Swagger en: `http://127.0.0.1:8000/docs`

La configuración recomendada utiliza MongoDB Atlas. El modo SQLite se conserva
únicamente para que la demostración local funcione sin Internet. Consulta
`backend/README.md` para configurar la cadena privada de conexión.

### 3. Probar el flujo completo

1. Abre `http://localhost:5173/postulacion`, completa el formulario y adjunta un CV.
2. Entra a `http://localhost:5173/acceso-interno`.
3. Usa `rrhh@aquachile.demo` / `AquaChile2026`.
4. Revisa la postulación y registra el resultado de la evaluación.

### 4. Ejecutar pruebas frontend

```bash
npm test
npm run test:coverage
```

La suite incluye pruebas del layout compartido, navegación, formularios y validaciones con Vitest, React Testing Library y mocks de la API.
El alcance y los resultados esperados están documentados en
`docs/COBERTURA_TESTING.md`.

El directorio `database/` contiene la implementación PL/SQL de Oracle Database para la lógica transaccional y la auditoría del ciclo de vida de postulaciones y evaluaciones. Incluye el trigger de auditoría, el paquete de gestión de evaluaciones, el esquema y casos de prueba. La descripción detallada se mantiene en [`database/README.md`](database/README.md).


La API incluida usa MongoDB o SQLite. Los scripts Oracle se conservan como módulo académico independiente; no hay sincronización automática entre Oracle y MongoDB.
