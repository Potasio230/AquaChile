-- =============================================================================
-- TRIGGER: TRG_AUDITORIA_EVALUACION
-- Proposito: Implementa la Regla de Negocio RN-005 (Auditoria Inmutable).
-- Registra automaticamente en LOG_AUDITORIA_EVALUACION cualquier cambio
-- de estado o creacion de registro en la tabla EVALUACION.
-- Tabla objetivo: EVALUACION
-- Momento de ejecucion: AFTER INSERT OR UPDATE ON EVALUACION FOR EACH ROW
-- =============================================================================

CREATE OR REPLACE TRIGGER trg_auditoria_evaluacion
AFTER INSERT OR UPDATE ON evaluacion
FOR EACH ROW
DECLARE
    v_usuario VARCHAR2(100);
    v_accion  VARCHAR2(20);
    v_detalle VARCHAR2(255);
BEGIN
    -- Capturar usuario de sesion de Oracle Database
    v_usuario := NVL(SYS_CONTEXT('USERENV', 'SESSION_USER'), USER);

    IF INSERTING THEN
        v_accion  := 'INSERT';
        v_detalle := 'Evaluacion creada con estado inicial: ' || :NEW.estado;

        INSERT INTO log_auditoria_evaluacion (
            id_evaluacion,
            accion,
            estado_anterior,
            estado_nuevo,
            usuario_responsable,
            fecha_evento,
            detalle
        ) VALUES (
            :NEW.id_evaluacion,
            v_accion,
            NULL,
            :NEW.estado,
            v_usuario,
            SYSTIMESTAMP,
            v_detalle
        );

    ELSIF UPDATING THEN
        -- Registrar unicamente si hubo transicion de estado o cambio de psicologo asignado
        IF (:OLD.estado != :NEW.estado) OR (:OLD.id_psicologo IS NULL AND :NEW.id_psicologo IS NOT NULL) OR (:OLD.id_psicologo != :NEW.id_psicologo) THEN
            v_accion  := 'UPDATE';
            v_detalle := 'Transicion de estado: ' || :OLD.estado || ' -> ' || :NEW.estado;

            IF NVL(:OLD.id_psicologo, -1) != NVL(:NEW.id_psicologo, -1) THEN
                v_detalle := v_detalle || ' | Cambio de psicologo asignado ID: ' || NVL(TO_CHAR(:NEW.id_psicologo), 'NINGUNO');
            END IF;

            INSERT INTO log_auditoria_evaluacion (
                id_evaluacion,
                accion,
                estado_anterior,
                estado_nuevo,
                usuario_responsable,
                fecha_evento,
                detalle
            ) VALUES (
                :NEW.id_evaluacion,
                v_accion,
                :OLD.estado,
                :NEW.estado,
                v_usuario,
                SYSTIMESTAMP,
                v_detalle
            );
        END IF;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Loguear fallo critico de integridad
        RAISE_APPLICATION_ERROR(
            -20050,
            'Error critico en TRG_AUDITORIA_EVALUACION: ' || SQLERRM
        );
END trg_auditoria_evaluacion;
/
