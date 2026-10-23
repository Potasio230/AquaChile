-- =============================================================================
-- AQUACHILE — SUITE DE PRUEBAS DE PAQUETE Y TRIGGER
-- Ejecutar en Oracle SQL Developer / SQLcl / SQL*Plus
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;

PROMPT =========================================================================
PROMPT PRUEBA 1: CAMBIO DE ESTADO VALIDO VIA PAQUETE Y DISPARO DE TRIGGER
PROMPT =========================================================================

DECLARE
    v_resumen pkg_gestion_evaluaciones.t_resumen_evaluacion;
BEGIN
    DBMS_OUTPUT.PUT_LINE('1. Transicionando Evaluacion 1 a ENTREVISTADO...');
    pkg_gestion_evaluaciones.sp_cambiar_estado(
        p_id_evaluacion => 1,
        p_nuevo_estado  => 'ENTREVISTADO'
    );

    DBMS_OUTPUT.PUT_LINE('2. Transicionando Evaluacion 1 a GENERANDO_INFORME...');
    pkg_gestion_evaluaciones.sp_cambiar_estado(
        p_id_evaluacion => 1,
        p_nuevo_estado  => 'GENERANDO_INFORME'
    );

    COMMIT;

    -- Consultar resumen a traves de la funcion del paquete
    v_resumen := pkg_gestion_evaluaciones.fn_obtener_resumen(1);
    DBMS_OUTPUT.PUT_LINE('Candidato: ' || v_resumen.candidato || ' | Estado Actual: ' || v_resumen.estado);
END;
/

PROMPT
PROMPT =========================================================================
PROMPT VERIFICACION DE AUDITORIA (TRIGGER TRG_AUDITORIA_EVALUACION)
PROMPT =========================================================================

SELECT id_log,
       id_evaluacion,
       accion,
       estado_anterior,
       estado_nuevo,
       usuario_responsable,
       TO_CHAR(fecha_evento, 'YYYY-MM-DD HH24:MI:SS') AS fecha,
       detalle
  FROM log_auditoria_evaluacion
 WHERE id_evaluacion = 1
 ORDER BY id_log;

PROMPT
PROMPT =========================================================================
PROMPT PRUEBA 2: PRUEBA DE ERROR (ESTADO INVALIDO)
PROMPT =========================================================================

DECLARE
BEGIN
    DBMS_OUTPUT.PUT_LINE('Intentando asignar estado no permitido: APROBADO_DIRECTO...');
    pkg_gestion_evaluaciones.sp_cambiar_estado(
        p_id_evaluacion => 1,
        p_nuevo_estado  => 'APROBADO_DIRECTO'
    );
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Excepcion capturada exitosamente: ' || SQLERRM);
END;
/

PROMPT
PROMPT =========================================================================
PROMPT PRUEBA 3: FUNCIONES DE METRICAS DEL PAQUETE
PROMPT =========================================================================

DECLARE
    v_pendientes NUMBER;
BEGIN
    v_pendientes := pkg_gestion_evaluaciones.fn_contar_pendientes_psicologo(p_id_psicologo => 1);
    DBMS_OUTPUT.PUT_LINE('Evaluaciones pendientes para el Psicologo ID 1: ' || v_pendientes);
END;
/
