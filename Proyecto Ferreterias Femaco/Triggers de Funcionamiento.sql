-- =====================================================================
-- TRIGGERS DE CONTROL DE INVENTARIO - femacodb
-- =====================================================================
-- ARQUITECTURA:
--   1) ajuste_inventario (AFTER INSERT)        -> inserta en movimiento_inventario
--   2) venta_detalle (AFTER INSERT)            -> inserta en movimiento_inventario
--   3) orden_compra_detalle (AFTER UPDATE)     -> inserta en movimiento_inventario
--      SOLO cuando IdEstadoOrdenCompra cambia hacia 'Entregado'
--      Y ADEMÁS actualiza articulo.UltimoPrecioProveedor con el
--      PrecioUnitario de esa línea de compra (NUEVO)
--   4) movimiento_inventario (BEFORE/AFTER INSERT) -> valida stock no-negativo
--      y actualiza articulo.StockActual
--
--  Movimiento_inventario es un libro contable. No se puede editar.
--   - No se puede insertar directamente desde la aplicación
--     (el usuario de la app NO tiene privilegio INSERT sobre esta tabla)
--   - No se puede UPDATE ni DELETE nunca
--   - venta_detalle y ajuste_inventario tampoco se pueden UPDATE/DELETE
--     una vez creados (usar un nuevo ajuste_inventario para corregir)
--   - orden_compra_detalle no se puede modificar/eliminar una vez Entregado
-- =====================================================================

USE `femacodb`;

DELIMITER $$

-- ---------------------------------------------------------------------
-- Función auxiliar: obtiene el Id del estado "Entregado" por nombre
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS `fn_id_estado_oc_entregado`$$
CREATE FUNCTION `fn_id_estado_oc_entregado`()
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_id INT;
    SELECT `IdEstadoOrdenCompra` INTO v_id
    FROM `estado_orden_compra`
    WHERE `Nombre` = 'Entregado'
    LIMIT 1;
    RETURN v_id;
END$$

-- =======================================================================
-- 1) AJUSTE_INVENTARIO
-- =======================================================================
DROP TRIGGER IF EXISTS `trg_ajuste_inventario_after_insert`$$
CREATE TRIGGER `trg_ajuste_inventario_after_insert`
AFTER INSERT ON `ajuste_inventario`
FOR EACH ROW
BEGIN
    DECLARE v_StockViejo DECIMAL(12,2);
    DECLARE v_StockNuevo DECIMAL(12,2);

    SELECT COALESCE(`StockActual`, 0) INTO v_StockViejo
    FROM `articulo`
    WHERE `IdArticulo` = NEW.`IdArticulo`
    FOR UPDATE;

    SET v_StockNuevo = v_StockViejo + NEW.`CantidadAjuste`;

    IF v_StockNuevo < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El ajuste dejaría el stock del artículo en negativo';
    END IF;
    INSERT INTO `movimiento_inventario` (
        `TipoMovimiento`, `Cantidad`, `StockViejo`, `StockNuevo`, `Motivo`,
        `IdArticulo`, `IdVenta`, `IdOrdenCompra`, `IdAjusteInventario`, `IdUsuario`,
        `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`
    ) VALUES (
        'ajuste', NEW.`CantidadAjuste`, v_StockViejo, v_StockNuevo, 'ajuste_manual',
        NEW.`IdArticulo`, NULL, NULL, NEW.`IdAjusteInventario`, NEW.`IdUsuario`,
        NOW(), NEW.`UsuarioCreacion`, NOW(), NEW.`UsuarioModif`
    );
END$$

-- Un ajuste ya registrado no se toca: si se equivocaron, se crea otro ajuste
DROP TRIGGER IF EXISTS `trg_ajuste_inventario_no_update`$$
CREATE TRIGGER `trg_ajuste_inventario_no_update`
BEFORE UPDATE ON `ajuste_inventario`
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'No se permite modificar un ajuste_inventario ya registrado; cree un nuevo ajuste de corrección';
END$$

DROP TRIGGER IF EXISTS `trg_ajuste_inventario_no_delete`$$
CREATE TRIGGER `trg_ajuste_inventario_no_delete`
BEFORE DELETE ON `ajuste_inventario`
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'No se permite eliminar un ajuste_inventario ya registrado; cree un nuevo ajuste de corrección';
END$$

-- =======================================================================
-- 2) VENTA_DETALLE
-- =======================================================================
DROP TRIGGER IF EXISTS `trg_venta_detalle_after_insert`$$
CREATE TRIGGER `trg_venta_detalle_after_insert`
AFTER INSERT ON `venta_detalle`
FOR EACH ROW
BEGIN
    DECLARE v_StockViejo DECIMAL(12,2);
    DECLARE v_StockNuevo DECIMAL(12,2);
    DECLARE v_IdUsuario  INT;

    SELECT COALESCE(`StockActual`, 0) INTO v_StockViejo
    FROM `articulo`
    WHERE `IdArticulo` = NEW.`IdArticulo`
    FOR UPDATE;

    SET v_StockNuevo = v_StockViejo - NEW.`Cantidad`;

    IF v_StockNuevo < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Stock insuficiente para completar la venta';
    END IF;

    SELECT `IdUsuario` INTO v_IdUsuario
    FROM `venta`
    WHERE `IdVenta` = NEW.`IdVenta`;

    INSERT INTO `movimiento_inventario` (
        `TipoMovimiento`, `Cantidad`, `StockViejo`, `StockNuevo`, `Motivo`,
        `IdArticulo`, `IdVenta`, `IdOrdenCompra`, `IdAjusteInventario`, `IdUsuario`,
        `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`
    ) VALUES (
        'salida', NEW.`Cantidad`, v_StockViejo, v_StockNuevo, 'venta',
        NEW.`IdArticulo`, NEW.`IdVenta`, NULL, NULL, v_IdUsuario,
        NOW(), NEW.`UsuarioCreacion`, NOW(), NEW.`UsuarioModif`
    );
END$$

-- Una línea de venta ya facturada no se edita/borra
DROP TRIGGER IF EXISTS `trg_venta_detalle_no_update`$$
CREATE TRIGGER `trg_venta_detalle_no_update`
BEFORE UPDATE ON `venta_detalle`
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'No se permite modificar venta_detalle una vez creada; anule la venta y use un ajuste de inventario';
END$$

DROP TRIGGER IF EXISTS `trg_venta_detalle_no_delete`$$
CREATE TRIGGER `trg_venta_detalle_no_delete`
BEFORE DELETE ON `venta_detalle`
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'No se permite eliminar venta_detalle; anule la venta y use un ajuste de inventario';
END$$

-- =======================================================================
-- 3) ORDEN_COMPRA_DETALLE
-- =======================================================================
-- Solo genera movimiento cuando el estado del DETALLE cambia hacia 'Entregado'.
-- NUEVO: además de registrar la entrada de inventario, actualiza
-- articulo.UltimoPrecioProveedor con el PrecioUnitario de esta línea.
DROP TRIGGER IF EXISTS `trg_orden_compra_detalle_after_update`$$
CREATE TRIGGER `trg_orden_compra_detalle_after_update`
AFTER UPDATE ON `orden_compra_detalle`
FOR EACH ROW
BEGIN
    DECLARE v_StockViejo DECIMAL(12,2);
    DECLARE v_StockNuevo DECIMAL(12,2);
    DECLARE v_IdUsuario  INT;
    DECLARE v_IdEntregado INT;

    SET v_IdEntregado = fn_id_estado_oc_entregado();

    IF NEW.`IdEstadoOrdenCompra` = v_IdEntregado
       AND OLD.`IdEstadoOrdenCompra` <> v_IdEntregado THEN

        SELECT COALESCE(`StockActual`, 0) INTO v_StockViejo
        FROM `articulo`
        WHERE `IdArticulo` = NEW.`IdArticulo`
        FOR UPDATE;

        SET v_StockNuevo = v_StockViejo + NEW.`Cantidad`;

        SELECT `IdUsuario` INTO v_IdUsuario
        FROM `orden_compra`
        WHERE `IdOrdenCompra` = NEW.`IdOrdenCompra`;

        -- Registra la entrada de inventario (esto dispara en cascada
        -- trg_movimiento_inventario_after_insert, que ya actualiza
        -- articulo.StockActual, FechaModif y UsuarioModif)
        INSERT INTO `movimiento_inventario` (
            `TipoMovimiento`, `Cantidad`, `StockViejo`, `StockNuevo`, `Motivo`,
            `IdArticulo`, `IdVenta`, `IdOrdenCompra`, `IdAjusteInventario`, `IdUsuario`,
            `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`
        ) VALUES (
            'entrada', NEW.`Cantidad`, v_StockViejo, v_StockNuevo, 'orden_compra',
            NEW.`IdArticulo`, NULL, NEW.`IdOrdenCompra`, NULL, v_IdUsuario,
            NOW(), NEW.`UsuarioCreacion`, NOW(), NEW.`UsuarioModif`
        );

        -- NUEVO: actualiza el último precio de proveedor del artículo
        -- según el precio unitario pactado en esta línea de compra.
        -- (PrecioUnitario > 0 ya fue validado en trg_orden_compra_detalle_before_update)
        UPDATE `articulo`
        SET `UltimoPrecioProveedor` = NEW.`PrecioUnitario`,
            `FechaModif`            = NOW(),
            `UsuarioModif`          = NEW.`UsuarioModif`
        WHERE `IdArticulo` = NEW.`IdArticulo`;
    END IF;
END$$

-- Una vez Entregado, no se puede cambiar Cantidad/Articulo ni revertir el estado.
-- Además: no se permite marcar como Entregado con un PrecioUnitario <= 0
-- (evita precios negativos o en cero que dañarían UltimoPrecioProveedor).
DROP TRIGGER IF EXISTS `trg_orden_compra_detalle_before_update`$$
CREATE TRIGGER `trg_orden_compra_detalle_before_update`
BEFORE UPDATE ON `orden_compra_detalle`
FOR EACH ROW
BEGIN
    DECLARE v_IdEntregado INT;
    SET v_IdEntregado = fn_id_estado_oc_entregado();

    IF OLD.`IdEstadoOrdenCompra` = v_IdEntregado THEN
        IF NEW.`Cantidad` <> OLD.`Cantidad` OR NEW.`IdArticulo` <> OLD.`IdArticulo` THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No se puede modificar Cantidad/Artículo de un detalle ya Entregado; use un ajuste de inventario';
        END IF;

        IF NEW.`IdEstadoOrdenCompra` <> OLD.`IdEstadoOrdenCompra` THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No se puede revertir el estado de un detalle ya Entregado; use un ajuste de inventario';
        END IF;
    END IF;

    -- NUEVO: al transicionar hacia 'Entregado', el PrecioUnitario debe ser > 0
    IF NEW.`IdEstadoOrdenCompra` = v_IdEntregado
       AND OLD.`IdEstadoOrdenCompra` <> v_IdEntregado THEN
        IF NEW.`PrecioUnitario` IS NULL OR NEW.`PrecioUnitario` <= 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'PrecioUnitario debe ser mayor a 0 para marcar el detalle como Entregado';
        END IF;
    END IF;
END$$

DROP TRIGGER IF EXISTS `trg_orden_compra_detalle_no_delete_entregado`$$
CREATE TRIGGER `trg_orden_compra_detalle_no_delete_entregado`
BEFORE DELETE ON `orden_compra_detalle`
FOR EACH ROW
BEGIN
    DECLARE v_IdEntregado INT;
    SET v_IdEntregado = fn_id_estado_oc_entregado();

    IF OLD.`IdEstadoOrdenCompra` = v_IdEntregado THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se puede eliminar un detalle de orden ya Entregado; use un ajuste de inventario';
    END IF;
END$$

-- =======================================================================
-- 4) MOVIMIENTO_INVENTARIO (núcleo: valida stock y actualiza articulo)
-- =======================================================================
-- Solo validación de stock negativo
DROP TRIGGER IF EXISTS `trg_movimiento_inventario_before_insert`$$
CREATE TRIGGER `trg_movimiento_inventario_before_insert`
BEFORE INSERT ON `movimiento_inventario`
FOR EACH ROW
BEGIN
    IF NEW.`StockNuevo` < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'movimiento_inventario: StockNuevo no puede ser negativo';
    END IF;
END$$

DROP TRIGGER IF EXISTS `trg_movimiento_inventario_after_insert`$$
CREATE TRIGGER `trg_movimiento_inventario_after_insert`
AFTER INSERT ON `movimiento_inventario`
FOR EACH ROW
BEGIN
    UPDATE `articulo`
    SET `StockActual`  = NEW.`StockNuevo`,
        `FechaModif`   = NOW(),
        `UsuarioModif` = NEW.`IdUsuario`
    WHERE `IdArticulo` = NEW.`IdArticulo`;
END$$

DROP TRIGGER IF EXISTS `trg_movimiento_inventario_no_update`$$
CREATE TRIGGER `trg_movimiento_inventario_no_update`
BEFORE UPDATE ON `movimiento_inventario`
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'movimiento_inventario es un registro histórico inmutable; no se permiten UPDATE';
END$$

DROP TRIGGER IF EXISTS `trg_movimiento_inventario_no_delete`$$
CREATE TRIGGER `trg_movimiento_inventario_no_delete`
BEFORE DELETE ON `movimiento_inventario`
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'movimiento_inventario es un registro histórico inmutable; no se permiten DELETE';
END$$

DELIMITER ;