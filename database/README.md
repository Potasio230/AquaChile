# AquaChile — Módulo de Base de Datos PL/SQL
**Asignatura:** Taller de Base de Datos Aplicada III (`BDY1103`)  
**Proyecto:** Sistema de Gestión y Reclutamiento Psicolaboral — AquaChile S.A.  
**Equipo:** Benjamín, Raúl, Luis

---

## Descripción del Módulo

Este directorio contiene la implementación en **PL/SQL de Oracle Database** de la lógica transaccional y de auditoría para el ciclo de vida de postulaciones y evaluaciones del caso AquaChile.

El módulo cumple con los requerimientos técnicos de la asignatura mediante dos componentes esenciales:
1. **Trigger de Auditoría (`TRG_AUDITORIA_EVALUACION`):** Disparador a nivel de fila (`FOR EACH ROW`) que registra de forma inmutable todas las transiciones de estado de las evaluaciones.
2. **Paquete Almacenado (`PKG_GESTION_EVALUACIONES`):** Encapsulación de tipos compuestos (`RECORD`), colecciones en memoria (`VARRAY`), funciones de validación y procedimientos transaccionales con control estricto de excepciones.

---

## Estructura de Archivos

```
database/
├── README.md                              # Este documento explicativo
├── schema/
│   └── 01_esquema_tablas.sql             # Tablas DDL, claves foráneas y datos semilla
├── triggers/
│   └── trg_auditoria_evaluaciones.sql    # Trigger de auditoría (RN-005)
├── packages/
│   └── pkg_gestion_evaluaciones.sql      # Especificación y cuerpo del paquete PL/SQL
└── pruebas/
    └── 02_casos_de_prueba.sql            # Script de validación integral y casos de prueba
```

---

## Orden de Ejecución e Instalación

Para desplegar estos componentes en Oracle SQL Developer, SQLcl o consola SQL*Plus, ejecutar los scripts en el siguiente orden estricto:

```sql
-- 1. Crear tablas base y datos iniciales
@schema/01_esquema_tablas.sql

-- 2. Compilar el trigger de auditoria
@triggers/trg_auditoria_evaluaciones.sql

-- 3. Compilar especificacion y cuerpo del paquete
@packages/pkg_gestion_evaluaciones.sql

-- 4. Ejecutar bateria de pruebas
@pruebas/02_casos_de_prueba.sql
```

---

## Detalle del Trigger: `TRG_AUDITORIA_EVALUACION`

### 1. Propósito y Regla de Negocio
Implementa la **Regla de Negocio RN-005 (Auditoría Inmutable)**:
> *"Todo cambio de estado en la evaluación debe registrar fecha, hora exacta, usuario responsable, estado previo y estado resultante en una bitácora inalterable."*

### 2. Características Técnicas
- **Momento y Evento:** `AFTER INSERT OR UPDATE ON evaluacion FOR EACH ROW`.
- **Estructura disparada:** Opera a nivel de fila mediante los pseudorregistros `:NEW` y `:OLD`.
- **Captura de contexto:** Utiliza `SYS_CONTEXT('USERENV', 'SESSION_USER')` para obtener el usuario de la sesión de base de datos activa.

### 3. Lógica de Funcionamiento
- **Al Insertar (`INSERTING`):** Crea el primer registro de bitácora registrando la acción `'INSERT'` con el estado inicial (`'ASIGNADO'`).
- **Al Actualizar (`UPDATING`):** Evalúa si existió un cambio efectivo en la columna `estado` (`:OLD.estado != :NEW.estado`) o en el psicólogo asignado. Solo si hubo una transición real, se inserta una fila en `LOG_AUDITORIA_EVALUACION`.
- **Manejo de Errores:** En caso de falla en la inserción del log, eleva un `RAISE_APPLICATION_ERROR(-20050)` para abortar la transacción y evitar que la evaluación quede desincronizada de su trazabilidad.

---

## Detalle del Paquete: `PKG_GESTION_EVALUACIONES`

El paquete aplica el principio de **encapsulación y ocultamiento de información**, separando la interfaz pública (Specification) de la lógica interna (Body).

### 1. Especificación Pública (`PACKAGE SPECIFICATION`)

#### Tipos de Datos y Excepciones
- **`t_resumen_evaluacion` (`RECORD`):** Registro compuesto que consolida en una sola estructura los datos del candidato, cargo postulado, psicólogo asignado, estado actual y fecha de actualización.
- **Excepciones personalizadas:**
  - `e_estado_invalido` (`ORA-20010`): Se lanza cuando se intenta colocar un estado no contemplado en el flujo de negocio.
  - `e_evaluacion_no_encontrada` (`ORA-20011`): Se lanza cuando el identificador de evaluación no existe.
  - `e_psicologo_inactivo` (`ORA-20012`): Se lanza cuando se intenta asignar a un usuario no habilitado o sin rol de psicólogo.

#### Subprogramas Expuestos
| Subprograma | Tipo | Descripción |
|---|---|---|
| `fn_validar_estado(p_estado)` | `FUNCTION` | Retorna `TRUE` si el estado existe dentro de los permitidos; `FALSE` en caso contrario. |
| `fn_contar_pendientes_psicologo(p_id_psicologo)` | `FUNCTION` | Retorna el total de procesos en curso (no enviados ni cancelados) para un evaluador. |
| `fn_obtener_resumen(p_id_evaluacion)` | `FUNCTION` | Retorna el `RECORD` consolidado de la evaluación. |
| `sp_cambiar_estado(p_id_evaluacion, p_nuevo_estado, p_observacion)` | `PROCEDURE` | Valida el nuevo estado y actualiza la tabla `evaluacion`, disparando automáticamente el trigger de auditoría. |
| `sp_asignar_psicologo(p_id_evaluacion, p_id_psicologo)` | `PROCEDURE` | Asigna un psicólogo activo previa validación en la tabla `usuario`. |

### 2. Cuerpo del Paquete (`PACKAGE BODY`)
- **Colección Privada `VARRAY` (`g_estados_validos`):** Define en memoria PGA la lista finita y ordenada de estados autorizados:
  1. `ASIGNADO`
  2. `ENTREVISTADO`
  3. `GENERANDO_INFORME`
  4. `EN_REVISION`
  5. `ENVIADO`
- La función interna `fn_validar_estado` itera dicha colección para comprobar si la entrada es legal antes de permitir cualquier sentencia `UPDATE`.

---

## Casos de Prueba y Resultados Esperados

El script `pruebas/02_casos_de_prueba.sql` ejecuta los siguientes escenarios:

### Caso 1: Transición Exitosa y Disparo del Trigger
```sql
BEGIN
    pkg_gestion_evaluaciones.sp_cambiar_estado(1, 'ENTREVISTADO');
    pkg_gestion_evaluaciones.sp_cambiar_estado(1, 'GENERANDO_INFORME');
    COMMIT;
END;
```
**Resultado esperado:**  
Al consultar `log_auditoria_evaluacion`, deben aparecer los registros de auditoría generados automáticamente por `TRG_AUDITORIA_EVALUACION`:
- Evento 1: Transición `ASIGNADO` -> `ENTREVISTADO`.
- Evento 2: Transición `ENTREVISTADO` -> `GENERANDO_INFORME`.

### Caso 2: Manejo de Excepción por Estado No Permitido
```sql
BEGIN
    pkg_gestion_evaluaciones.sp_cambiar_estado(1, 'APROBADO_DIRECTO');
END;
```
**Resultado esperado:**  
El paquete intercepta la anomalía mediante `fn_validar_estado` y lanza el error:
```
ORA-20010: Estado "APROBADO_DIRECTO" no permitido. Debe ser uno de: ASIGNADO, ENTREVISTADO, GENERANDO_INFORME, EN_REVISION, ENVIADO.
```

---

## Integración con el Equipo
Este módulo se vincula con el repositorio central del proyecto:
- **Repositorio:** [https://github.com/Potasio230/AquaChile](https://github.com/Potasio230/AquaChile)
- **Rama de desarrollo:** `feature/plsql-modulos`
