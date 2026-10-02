# Automatización del Proceso de Evaluación Psicolaboral

## Descripción

La finalidad de este proyecto tiene como objetivo automatizar el proceso de evaluación psicolaboral dentro del área de Reclutamiento y Selección.

El objetivo principal es reducir tareas repetitivas, manuales, tiempos operativos y posibles errores mediante la integración de herramientas como **Microsoft Forms, Power Automate, OneDrive/SharePoint y Copilot**.

## Objetivo

Automatizar el flujo de evaluación psicolaboral desde la solicitud inicial hasta la generación del informe, optimizando los tiempos y mejorando la eficiencia del proceso.

## Etapas del proyecto

El proyecto contempla inicialmente las siguientes etapas:

* [ ] Automatización de la creación de carpetas y documentos.
* [ ] Automatización del traspaso de información al informe psicolaboral.
* [ ] Desarrollo de un asistente inteligente para entrevistas.

Estas etapas podrán modificarse o ampliarse durante el desarrollo del proyecto.

## Tecnologías y herramientas

- React
- Vite
- CSS responsivo
- API REST con Express
- Carga de archivos con Multer
- Almacenamiento local en JSON

## Ejecución local

```bash
npm install
npm run dev:all
```

Este comando inicia el frontend en `http://localhost:5173` y la API en `http://localhost:3000`. La página incluye un formulario externo para candidatos y otro formulario interno para analistas. Al enviar cualquiera de ellos, la API crea una carpeta segura en `server/solicitudes/` con `datos.json` y el currículum adjunto.

### Flujos disponibles

- `#postulacion`: formulario público del candidato.
- `/login`: inicio de sesión interno de demostración.
- `/dashboard`: panel principal privado del analista.
- `/evaluacion`: solicitud interna de evaluación psicolaboral.
- `POST /api/postulaciones`: recepción de postulaciones externas.
- `POST /api/evaluaciones`: recepción de solicitudes internas.

Acceso interno de demostración: `analista@aquachile.cl` / `Demo2026!`. Este acceso solo sirve para mostrar la navegación; debe sustituirse por autenticación respaldada por Oracle antes de utilizar el sistema con datos reales.

También se pueden ejecutar por separado:

```bash
npm run dev       # Solo frontend
npm run server    # Solo backend
npm test          # Pruebas automatizadas
npm run build     # Compilación de producción
```

Para utilizar otra API, copia `.env.example` como `.env` y cambia `VITE_API_URL`.


## Estructura del proyecto

```text
src/
├── App.jsx       # Página y formulario de evaluación
├── main.jsx      # Inicio de React
└── styles.css    # Diseño responsivo
server/
├── app.js        # API, validación y almacenamiento
├── index.js      # Inicio del servidor
└── solicitudes/  # Datos generados localmente (ignorados por Git)
test/
└── api.test.js   # Pruebas de integración
assets/           # Logo, video e imágenes
```


## Estado del proyecto

**En desarrollo.**


## Equipo

| Nombre | GitHub |
|--------|--------|
| Benjamín Aguero | @yountek14 |
| Luis Fermín     | @Lguille99 |
| Raúl Ferrini    | @Potasio230 |

##  Notas

Este README será actualizado durante el desarrollo del proyecto para documentar las nuevas funcionalidades, tecnologías, cambios y avances realizados.

Cualquier detalle que el equipo deba estar al tanto será comentado.
