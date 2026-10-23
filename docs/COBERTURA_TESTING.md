# Documento de cobertura de testing frontend

## Objetivo

Validar con Vitest y React Testing Library la lógica principal del MVP frontend:
validaciones, propiedades, estados, manipulación del DOM, navegación protegida,
postulación e inicio de sesión. Las respuestas del backend se simulan mediante
`vi.mock`, por lo que las pruebas no requieren Oracle ni FastAPI en ejecución.

## Herramientas

- Vitest y entorno `jsdom`.
- React Testing Library.
- `@testing-library/user-event` para interacción de usuario.
- `@testing-library/jest-dom` para verificaciones del DOM.
- Cobertura V8 con reporte de consola y HTML.

## Casos implementados

| N° | Caso | Tipo | Resultado esperado |
|---:|---|---|---|
| 1 | RUT válido e inválido | Lógica | Distingue correctamente el dígito verificador |
| 2 | Teléfono válido e inválido | Lógica | Exige al menos nueve dígitos |
| 3 | Archivo de currículum | Lógica | Acepta PDF/Word y rechaza ausencia o extensión inválida |
| 4 | Campo reutilizable | Componente | Aplica props de etiqueta, ayuda y obligatoriedad |
| 5 | Mensaje de estado | Componente | Muestra éxito y oculta el estado vacío |
| 6 | Etiqueta de proceso | Componente | Convierte `EN_REVISION` en “En revisión” |
| 7 | Página de inicio | DOM/navegación | Renderiza contenido y enlace de postulación |
| 8 | Ruta protegida | Navegación | Redirige al login cuando no existe sesión |
| 9 | Postulación externa | Integración frontend | Usa una API simulada y muestra código de seguimiento |
| 10 | Inicio de sesión | Integración frontend | Usa una API simulada, guarda el token y navega a gestión |

## Alcance de cobertura

Resultado verificado de la ejecución actual:

| Métrica | Cobertura |
|---|---:|
| Sentencias | 85,55% |
| Ramas de decisión | 70,21% |
| Funciones | 84,61% |
| Líneas | 90% |

La medición incluye los módulos ejercitados por estos casos:

- Validaciones del formulario.
- `FormField`, `FormStatus`, `StatusBadge` y `ProtectedRoute`.
- `HomePage`, `PostulacionPage` y `LoginPage`.

Se excluyen del porcentaje los elementos exclusivamente visuales y de integración
manual, como videos, estilos, chatbot, layouts y conexión real con el backend.
Estos elementos se validan mediante compilación y revisión responsiva en navegador.

## Uso de mocks

El módulo `services/api.js` se reemplaza en las pruebas de páginas con funciones
simuladas. De esta manera se controlan las respuestas de login y postulación, se
evitan datos reales y se comprueba únicamente el comportamiento del frontend.

## Incidencia detectada durante las pruebas

La primera ejecución descubrió que el formulario intentaba usar
`event.currentTarget` después de una operación asíncrona. La referencia podía ser
nula al finalizar la petición. Se corrigió guardando el elemento antes del `await`.

## Comandos

```bash
npm test
npm run test:coverage
```

El reporte visual se genera localmente en `coverage/index.html`. La carpeta
`coverage/` se excluye de Git porque es un resultado generado automáticamente.

