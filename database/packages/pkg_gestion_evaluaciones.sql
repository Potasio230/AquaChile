-- =============================================================================
-- PAQUETE PL/SQL: PKG_GESTION_EVALUACIONES
-- Proyecto: AquaChile — Taller de Bases de Datos Aplicada III
-- Proposito: Encapsula la logica de negocio, validaciones de transicion
-- y control del ciclo de vida de evaluaciones psicolaborales.
-- =============================================================================

-- =============================================================================
-- 1. ESPECIFICACION DEL PAQUETE (Package Specification)
-- =============================================================================
CREATE OR REPLACE PACKAGE pkg_gestion_evaluaciones AS

    -- Tipos compuestos (RECORD)
    TYPE t_resumen_evaluacion IS RECORD (
        id_evaluacion      evaluacion.id_evaluacion%TYPE,
        rut_candidato      candidato.rut%TYPE,
        candidato          candidato.nombre_completo%TYPE,
        cargo              cargo.nombre%TYPE,
        psicologo          usuario.nombre%TYPE,
        estado             evaluacion.estado%TYPE,
        fecha_actualizacion evaluacion.fecha_actualizacion%TYPE
    );

    -- Excepciones publicas del paquete
    e_estado_invalido           EXCEPTION;
    e_evaluacion_no_encontrada  EXCEPTION;
    e_psicologo_inactivo        EXCEPTION;

    PRAGMA EXCEPTION_INIT(e_estado_invalido, -20010);
    PRAGMA EXCEPTION_INIT(e_evaluacion_no_encontrada, -20011);
    PRAGMA EXCEPTION_INIT(e_psicologo_inactivo, -20012);

    -- Valida si un estado pertenece a la lista autorizada en el ciclo de evaluacion
    FUNCTION fn_validar_estado(
        p_estado IN VARCHAR2
    ) RETURN BOOLEAN;

    -- Cuenta la cantidad de evaluaciones pendientes (no enviadas ni canceladas) asignadas a un psicologo
    FUNCTION fn_contar_pendientes_psicologo(
        p_id_psicologo IN NUMBER
    ) RETURN NUMBER;

    -- Obtiene la ficha consolidada de una evaluacion
    FUNCTION fn_obtener_resumen(
        p_id_evaluacion IN NUMBER
    ) RETURN t_resumen_evaluacion;

    -- Procesa la transicion de estado de una evaluacion
    PROCEDURE sp_cambiar_estado(
        p_id_evaluacion IN NUMBER,
        p_nuevo_estado  IN VARCHAR2,
        p_observacion   IN VARCHAR2 DEFAULT NULL
    );

    -- Asigna o reasigna un psicologo activo a una evaluacion
    PROCEDURE sp_asignar_psicologo(
        p_id_evaluacion IN NUMBER,
        p_id_psicologo  IN NUMBER
    );

END pkg_gestion_evaluaciones;
/

-- =============================================================================
-- 2. CUERPO DEL PAQUETE (Package Body)
-- =============================================================================
CREATE OR REPLACE PACKAGE BODY pkg_gestion_evaluaciones AS

    -- Variable privada del paquete: Coleccion VARRAY de estados validos en memoria PGA
    TYPE t_estados_validos IS VARRAY(5) OF VARCHAR2(30);
    g_estados_validos t_estados_validos := t_estados_validos(
        'ASIGNADO', 'ENTREVISTADO', 'GENERANDO_INFORME', 'EN_REVISION', 'ENVIADO'
    );

    -- -------------------------------------------------------------------------
    -- FUNCION: fn_validar_estado
    -- -------------------------------------------------------------------------
    FUNCTION fn_validar_estado(
        p_estado IN VARCHAR2
    ) RETURN BOOLEAN IS
    BEGIN
        IF p_estado IS NULL THEN
            RETURN FALSE;
        END IF;

        FOR i IN 1..g_estados_validos.COUNT LOOP
            IF UPPER(p_estado) = g_estados_validos(i) THEN
                RETURN TRUE;
            END IF;
        END LOOP;

        RETURN FALSE;
    END fn_validar_estado;

    -- -------------------------------------------------------------------------
    -- FUNCION: fn_contar_pendientes_psicologo
    -- -------------------------------------------------------------------------
    FUNCTION fn_contar_pendientes_psicologo(
        p_id_psicologo IN NUMBER
    ) RETURN NUMBER IS
        v_total NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
          INTO v_total
          FROM evaluacion
         WHERE id_psicologo = p_id_psicologo
           AND estado NOT IN ('ENVIADO', 'CANCELADO');

        RETURN v_total;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 0;
    END fn_contar_pendientes_psicologo;

    -- -------------------------------------------------------------------------
    -- FUNCION: fn_obtener_resumen
    -- -------------------------------------------------------------------------
    FUNCTION fn_obtener_resumen(
        p_id_evaluacion IN NUMBER
    ) RETURN t_resumen_evaluacion IS
        r_salida t_resumen_evaluacion;
    BEGIN
        SELECT e.id_evaluacion,
               c.rut,
               c.nombre_completo,
               cr.nombre,
               NVL(u.nombre, 'SIN ASIGNAR'),
               e.estado,
               e.fecha_actualizacion
          INTO r_salida.id_evaluacion,
               r_salida.rut_candidato,
               r_salida.candidato,
               r_salida.cargo,
               r_salida.psicologo,
               r_salida.estado,
               r_salida.fecha_actualizacion
          FROM evaluacion e
          INNER JOIN solicitud_evaluacion s ON e.id_solicitud = s.id_solicitud
          INNER JOIN candidato c ON s.id_candidato = c.id_candidato
          INNER JOIN cargo cr ON s.id_cargo = cr.id_cargo
          LEFT JOIN usuario u ON e.id_psicologo = u.id_usuario
         WHERE e.id_evaluacion = p_id_evaluacion;

        RETURN r_salida;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20011, 'Evaluacion ID ' || p_id_evaluacion || ' no existe en el sistema.');
    END fn_obtener_resumen;

    -- -------------------------------------------------------------------------
    -- PROCEDIMIENTO: sp_cambiar_estado
    -- -------------------------------------------------------------------------
    PROCEDURE sp_cambiar_estado(
        p_id_evaluacion IN NUMBER,
        p_nuevo_estado  IN VARCHAR2,
        p_observacion   IN VARCHAR2 DEFAULT NULL
    ) IS
        v_existe NUMBER := 0;
        v_estado_normalizado VARCHAR2(30);
    BEGIN
        v_estado_normalizado := UPPER(TRIM(p_nuevo_estado));

        -- Validacion mediante la funcion interna
        IF NOT fn_validar_estado(v_estado_normalizado) THEN
            RAISE_APPLICATION_ERROR(
                -20010,
                'Estado "' || p_nuevo_estado || '" no permitido. Debe ser uno de: ASIGNADO, ENTREVISTADO, GENERANDO_INFORME, EN_REVISION, ENVIADO.'
            );
        END IF;

        -- Actualizacion transaccional
        UPDATE evaluacion
           SET estado = v_estado_normalizado,
               fecha_actualizacion = SYSDATE
         WHERE id_evaluacion = p_id_evaluacion;

        IF SQL%NOTFOUND THEN
            RAISE_APPLICATION_ERROR(
                -20011,
                'No se pudo actualizar: Evaluacion ID ' || p_id_evaluacion || ' no encontrada.'
            );
        END IF;

    END sp_cambiar_estado;

    -- -------------------------------------------------------------------------
    -- PROCEDIMIENTO: sp_asignar_psicologo
    -- -------------------------------------------------------------------------
    PROCEDURE sp_asignar_psicologo(
        p_id_evaluacion IN NUMBER,
        p_id_psicologo  IN NUMBER
    ) IS
        v_activo CHAR(1);
    BEGIN
        -- Validar psicologo existente y activo
        SELECT activo
          INTO v_activo
          FROM usuario
         WHERE id_usuario = p_id_psicologo
           AND rol IN ('PSICOLOGO', 'ADMIN');

        IF v_activo <> 'S' THEN
            RAISE_APPLICATION_ERROR(-20012, 'El psicologo seleccionado se encuentra inactivo.');
        END IF;

        UPDATE evaluacion
           SET id_psicologo = p_id_psicologo,
               fecha_actualizacion = SYSDATE
         WHERE id_evaluacion = p_id_evaluacion;

        IF SQL%NOTFOUND THEN
            RAISE_APPLICATION_ERROR(-20011, 'Evaluacion ID ' || p_id_evaluacion || ' no existe.');
        END IF;

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20012, 'El psicologo ID ' || p_id_psicologo || ' no existe o no tiene rol habilitado.');
    END sp_asignar_psicologo;

END pkg_gestion_evaluaciones;
/
