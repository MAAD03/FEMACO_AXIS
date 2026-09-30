-- =============================================================================
-- TRIGGERS DE BITÁCORA - femacodb
-- Reglas:
--   INSERT -> DatosNuevos con el registro completo, usuario = UsuarioCreacion
--   UPDATE -> solo los campos que cambiaron, usuario = UsuarioModif
--   DELETE -> DatosAnterior con el registro completo, usuario = último UsuarioModif
-- =============================================================================

USE `femacodb`;
DELIMITER $$

-- =============================================================================
-- usuario  (INSERT, UPDATE, DELETE)
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_usuario_ai`$$
DROP TRIGGER IF EXISTS `trg_usuario_au`$$
DROP TRIGGER IF EXISTS `trg_usuario_ad`$$

CREATE TRIGGER `trg_usuario_ai` AFTER INSERT ON `usuario`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('INSERT', 'Registro creado', 'usuario', NEW.`IdUsuario`,
          NULL,
          JSON_OBJECT(
            'Nombre', NEW.`Nombre`,
            'Apellido', NEW.`Apellido`,
            'CorreoElectronico', NEW.`CorreoElectronico`,
            'RequiereCambioPassword', NEW.`RequiereCambioPassword`,
            'PuedeAplicarDescuento', NEW.`PuedeAplicarDescuento`,
            'IdGenero', NEW.`IdGenero`,
            'IdEstadoUsuario', NEW.`IdEstadoUsuario`,
            'IdSucursal', NEW.`IdSucursal`,
            'IdRol', NEW.`IdRol`
          ),
          NOW(), NEW.`UsuarioCreacion`);
END$$

CREATE TRIGGER `trg_usuario_au` AFTER UPDATE ON `usuario`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`Nombre` <=> NEW.`Nombre`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Nombre', OLD.`Nombre`);
    SET v_new = JSON_SET(v_new, '$.Nombre', NEW.`Nombre`);
  END IF;
  IF NOT (OLD.`Apellido` <=> NEW.`Apellido`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Apellido', OLD.`Apellido`);
    SET v_new = JSON_SET(v_new, '$.Apellido', NEW.`Apellido`);
  END IF;
  IF NOT (OLD.`CorreoElectronico` <=> NEW.`CorreoElectronico`) THEN
    SET v_ant = JSON_SET(v_ant, '$.CorreoElectronico', OLD.`CorreoElectronico`);
    SET v_new = JSON_SET(v_new, '$.CorreoElectronico', NEW.`CorreoElectronico`);
  END IF;
  IF NOT (OLD.`RequiereCambioPassword` <=> NEW.`RequiereCambioPassword`) THEN
    SET v_ant = JSON_SET(v_ant, '$.RequiereCambioPassword', OLD.`RequiereCambioPassword`);
    SET v_new = JSON_SET(v_new, '$.RequiereCambioPassword', NEW.`RequiereCambioPassword`);
  END IF;
  IF NOT (OLD.`PuedeAplicarDescuento` <=> NEW.`PuedeAplicarDescuento`) THEN
    SET v_ant = JSON_SET(v_ant, '$.PuedeAplicarDescuento', OLD.`PuedeAplicarDescuento`);
    SET v_new = JSON_SET(v_new, '$.PuedeAplicarDescuento', NEW.`PuedeAplicarDescuento`);
  END IF;
  IF NOT (OLD.`IdGenero` <=> NEW.`IdGenero`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdGenero', OLD.`IdGenero`);
    SET v_new = JSON_SET(v_new, '$.IdGenero', NEW.`IdGenero`);
  END IF;
  IF NOT (OLD.`IdEstadoUsuario` <=> NEW.`IdEstadoUsuario`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdEstadoUsuario', OLD.`IdEstadoUsuario`);
    SET v_new = JSON_SET(v_new, '$.IdEstadoUsuario', NEW.`IdEstadoUsuario`);
  END IF;
  IF NOT (OLD.`IdSucursal` <=> NEW.`IdSucursal`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdSucursal', OLD.`IdSucursal`);
    SET v_new = JSON_SET(v_new, '$.IdSucursal', NEW.`IdSucursal`);
  END IF;
  IF NOT (OLD.`IdRol` <=> NEW.`IdRol`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdRol', OLD.`IdRol`);
    SET v_new = JSON_SET(v_new, '$.IdRol', NEW.`IdRol`);
  END IF;
  -- Password: nunca se guarda el valor ni el hash, solo que cambió
  IF NOT (OLD.`Password` <=> NEW.`Password`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Password', '(oculto)');
    SET v_new = JSON_SET(v_new, '$.Password', '(cambiado)');
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'usuario', NEW.`IdUsuario`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

CREATE TRIGGER `trg_usuario_ad` AFTER DELETE ON `usuario`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('DELETE', 'Registro eliminado', 'usuario', OLD.`IdUsuario`,
          JSON_OBJECT(
            'Nombre', OLD.`Nombre`,
            'Apellido', OLD.`Apellido`,
            'CorreoElectronico', OLD.`CorreoElectronico`,
            'RequiereCambioPassword', OLD.`RequiereCambioPassword`,
            'PuedeAplicarDescuento', OLD.`PuedeAplicarDescuento`,
            'IdGenero', OLD.`IdGenero`,
            'IdEstadoUsuario', OLD.`IdEstadoUsuario`,
            'IdSucursal', OLD.`IdSucursal`,
            'IdRol', OLD.`IdRol`
          ),
          NULL,
          NOW(), OLD.`UsuarioModif`);
END$$


-- =============================================================================
-- rol_opcion  (INSERT, UPDATE, DELETE)
-- =============================================================================

DROP TRIGGER IF EXISTS `trg_rol_opcion_ai`$$
DROP TRIGGER IF EXISTS `trg_rol_opcion_au`$$
DROP TRIGGER IF EXISTS `trg_rol_opcion_ad`$$

CREATE TRIGGER `trg_rol_opcion_ai` AFTER INSERT ON `rol_opcion`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('INSERT', 'Registro creado', 'rol_opcion', NEW.`IdRolOpcion`,
          NULL,
          JSON_OBJECT(
            'IdRol', NEW.`IdRol`,
            'IdOpcion', NEW.`IdOpcion`,
            'Alta', NEW.`Alta`,
            'Baja', NEW.`Baja`,
            'Cambio', NEW.`Cambio`
          ),
          NOW(), NEW.`UsuarioCreacion`);
END$$

CREATE TRIGGER `trg_rol_opcion_au` AFTER UPDATE ON `rol_opcion`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`IdRol` <=> NEW.`IdRol`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdRol', OLD.`IdRol`);
    SET v_new = JSON_SET(v_new, '$.IdRol', NEW.`IdRol`);
  END IF;
  IF NOT (OLD.`IdOpcion` <=> NEW.`IdOpcion`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdOpcion', OLD.`IdOpcion`);
    SET v_new = JSON_SET(v_new, '$.IdOpcion', NEW.`IdOpcion`);
  END IF;
  IF NOT (OLD.`Alta` <=> NEW.`Alta`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Alta', OLD.`Alta`);
    SET v_new = JSON_SET(v_new, '$.Alta', NEW.`Alta`);
  END IF;
  IF NOT (OLD.`Baja` <=> NEW.`Baja`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Baja', OLD.`Baja`);
    SET v_new = JSON_SET(v_new, '$.Baja', NEW.`Baja`);
  END IF;
  IF NOT (OLD.`Cambio` <=> NEW.`Cambio`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Cambio', OLD.`Cambio`);
    SET v_new = JSON_SET(v_new, '$.Cambio', NEW.`Cambio`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'rol_opcion', NEW.`IdRolOpcion`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

CREATE TRIGGER `trg_rol_opcion_ad` AFTER DELETE ON `rol_opcion`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('DELETE', 'Registro eliminado', 'rol_opcion', OLD.`IdRolOpcion`,
          JSON_OBJECT(
            'IdRol', OLD.`IdRol`,
            'IdOpcion', OLD.`IdOpcion`,
            'Alta', OLD.`Alta`,
            'Baja', OLD.`Baja`,
            'Cambio', OLD.`Cambio`
          ),
          NULL,
          NOW(), OLD.`UsuarioModif`);
END$$



-- =============================================================================
-- rol  (INSERT, UPDATE, DELETE)
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_rol_ai`$$
DROP TRIGGER IF EXISTS `trg_rol_au`$$
DROP TRIGGER IF EXISTS `trg_rol_ad`$$

CREATE TRIGGER `trg_rol_ai` AFTER INSERT ON `rol`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('INSERT', 'Registro creado', 'rol', NEW.`IdRol`,
          NULL,
          JSON_OBJECT(
            'Nombre', NEW.`Nombre`
          ),
          NOW(), NEW.`UsuarioCreacion`);
END$$

CREATE TRIGGER `trg_rol_au` AFTER UPDATE ON `rol`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`Nombre` <=> NEW.`Nombre`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Nombre', OLD.`Nombre`);
    SET v_new = JSON_SET(v_new, '$.Nombre', NEW.`Nombre`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'rol', NEW.`IdRol`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

CREATE TRIGGER `trg_rol_ad` AFTER DELETE ON `rol`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('DELETE', 'Registro eliminado', 'rol', OLD.`IdRol`,
          JSON_OBJECT(
            'Nombre', OLD.`Nombre`
          ),
          NULL,
          NOW(), OLD.`UsuarioModif`);
END$$



-- =============================================================================
-- modulo  (INSERT, UPDATE, DELETE)
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_modulo_ai`$$
DROP TRIGGER IF EXISTS `trg_modulo_au`$$
DROP TRIGGER IF EXISTS `trg_modulo_ad`$$

CREATE TRIGGER `trg_modulo_ai` AFTER INSERT ON `modulo`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('INSERT', 'Registro creado', 'modulo', NEW.`IdModulo`,
          NULL,
          JSON_OBJECT(
            'Nombre', NEW.`Nombre`,
            'OrdenMenu', NEW.`OrdenMenu`
          ),
          NOW(), NEW.`UsuarioCreacion`);
END$$

CREATE TRIGGER `trg_modulo_au` AFTER UPDATE ON `modulo`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`Nombre` <=> NEW.`Nombre`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Nombre', OLD.`Nombre`);
    SET v_new = JSON_SET(v_new, '$.Nombre', NEW.`Nombre`);
  END IF;
  IF NOT (OLD.`OrdenMenu` <=> NEW.`OrdenMenu`) THEN
    SET v_ant = JSON_SET(v_ant, '$.OrdenMenu', OLD.`OrdenMenu`);
    SET v_new = JSON_SET(v_new, '$.OrdenMenu', NEW.`OrdenMenu`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'modulo', NEW.`IdModulo`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

CREATE TRIGGER `trg_modulo_ad` AFTER DELETE ON `modulo`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('DELETE', 'Registro eliminado', 'modulo', OLD.`IdModulo`,
          JSON_OBJECT(
            'Nombre', OLD.`Nombre`,
            'OrdenMenu', OLD.`OrdenMenu`
          ),
          NULL,
          NOW(), OLD.`UsuarioModif`);
END$$


-- =============================================================================
-- menu  (INSERT, UPDATE, DELETE)
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_menu_ai`$$
DROP TRIGGER IF EXISTS `trg_menu_au`$$
DROP TRIGGER IF EXISTS `trg_menu_ad`$$

CREATE TRIGGER `trg_menu_ai` AFTER INSERT ON `menu`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('INSERT', 'Registro creado', 'menu', NEW.`IdMenu`,
          NULL,
          JSON_OBJECT(
            'Nombre', NEW.`Nombre`,
            'OrdenMenu', NEW.`OrdenMenu`,
            'IdModulo', NEW.`IdModulo`
          ),
          NOW(), NEW.`UsuarioCreacion`);
END$$

CREATE TRIGGER `trg_menu_au` AFTER UPDATE ON `menu`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`Nombre` <=> NEW.`Nombre`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Nombre', OLD.`Nombre`);
    SET v_new = JSON_SET(v_new, '$.Nombre', NEW.`Nombre`);
  END IF;
  IF NOT (OLD.`OrdenMenu` <=> NEW.`OrdenMenu`) THEN
    SET v_ant = JSON_SET(v_ant, '$.OrdenMenu', OLD.`OrdenMenu`);
    SET v_new = JSON_SET(v_new, '$.OrdenMenu', NEW.`OrdenMenu`);
  END IF;
  IF NOT (OLD.`IdModulo` <=> NEW.`IdModulo`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdModulo', OLD.`IdModulo`);
    SET v_new = JSON_SET(v_new, '$.IdModulo', NEW.`IdModulo`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'menu', NEW.`IdMenu`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

CREATE TRIGGER `trg_menu_ad` AFTER DELETE ON `menu`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('DELETE', 'Registro eliminado', 'menu', OLD.`IdMenu`,
          JSON_OBJECT(
            'Nombre', OLD.`Nombre`,
            'OrdenMenu', OLD.`OrdenMenu`,
            'IdModulo', OLD.`IdModulo`
          ),
          NULL,
          NOW(), OLD.`UsuarioModif`);
END$$

-- =============================================================================
-- opcion  (INSERT, UPDATE, DELETE)
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_opcion_ai`$$
DROP TRIGGER IF EXISTS `trg_opcion_au`$$
DROP TRIGGER IF EXISTS `trg_opcion_ad`$$

CREATE TRIGGER `trg_opcion_ai` AFTER INSERT ON `opcion`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('INSERT', 'Registro creado', 'opcion', NEW.`IdOpcion`,
          NULL,
          JSON_OBJECT(
            'Nombre', NEW.`Nombre`,
            'OrdenMenu', NEW.`OrdenMenu`,
            'Pagina', NEW.`Pagina`,
            'IdMenu', NEW.`IdMenu`
          ),
          NOW(), NEW.`UsuarioCreacion`);
END$$

CREATE TRIGGER `trg_opcion_au` AFTER UPDATE ON `opcion`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`Nombre` <=> NEW.`Nombre`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Nombre', OLD.`Nombre`);
    SET v_new = JSON_SET(v_new, '$.Nombre', NEW.`Nombre`);
  END IF;
  IF NOT (OLD.`OrdenMenu` <=> NEW.`OrdenMenu`) THEN
    SET v_ant = JSON_SET(v_ant, '$.OrdenMenu', OLD.`OrdenMenu`);
    SET v_new = JSON_SET(v_new, '$.OrdenMenu', NEW.`OrdenMenu`);
  END IF;
  IF NOT (OLD.`Pagina` <=> NEW.`Pagina`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Pagina', OLD.`Pagina`);
    SET v_new = JSON_SET(v_new, '$.Pagina', NEW.`Pagina`);
  END IF;
  IF NOT (OLD.`IdMenu` <=> NEW.`IdMenu`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdMenu', OLD.`IdMenu`);
    SET v_new = JSON_SET(v_new, '$.IdMenu', NEW.`IdMenu`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'opcion', NEW.`IdOpcion`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

CREATE TRIGGER `trg_opcion_ad` AFTER DELETE ON `opcion`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('DELETE', 'Registro eliminado', 'opcion', OLD.`IdOpcion`,
          JSON_OBJECT(
            'Nombre', OLD.`Nombre`,
            'OrdenMenu', OLD.`OrdenMenu`,
            'Pagina', OLD.`Pagina`,
            'IdMenu', OLD.`IdMenu`
          ),
          NULL,
          NOW(), OLD.`UsuarioModif`);
END$$



-- =============================================================================
-- sucursal  (INSERT, UPDATE, DELETE)
-- =============================================================================

DROP TRIGGER IF EXISTS `trg_sucursal_ai`$$
DROP TRIGGER IF EXISTS `trg_sucursal_au`$$
DROP TRIGGER IF EXISTS `trg_sucursal_ad`$$

CREATE TRIGGER `trg_sucursal_ai` AFTER INSERT ON `sucursal`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('INSERT', 'Registro creado', 'sucursal', NEW.`IdSucursal`,
          NULL,
          JSON_OBJECT(
            'Nombre', NEW.`Nombre`,
            'Direccion', NEW.`Direccion`,
            'Telefono', NEW.`Telefono`,
            'FelNitEmisor', NEW.`FelNitEmisor`,
            'FelNombreEmisor', NEW.`FelNombreEmisor`,
            'FelNombreComercial', NEW.`FelNombreComercial`,
            'FelCorreoEmisor', NEW.`FelCorreoEmisor`,
            'FelCodigoEstablecimiento', NEW.`FelCodigoEstablecimiento`,
            'FelAfiliacionIva', NEW.`FelAfiliacionIva`,
            'FelDireccion', NEW.`FelDireccion`,
            'FelCodigoPostal', NEW.`FelCodigoPostal`,
            'FelMunicipio', NEW.`FelMunicipio`,
            'FelDepartamento', NEW.`FelDepartamento`,
            'FelPais', NEW.`FelPais`,
            'FelTipoFrase', NEW.`FelTipoFrase`,
            'FelCodigoEscenario', NEW.`FelCodigoEscenario`
          ),
          NOW(), NEW.`UsuarioCreacion`);
END$$

CREATE TRIGGER `trg_sucursal_au` AFTER UPDATE ON `sucursal`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`Nombre` <=> NEW.`Nombre`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Nombre', OLD.`Nombre`);
    SET v_new = JSON_SET(v_new, '$.Nombre', NEW.`Nombre`);
  END IF;
  IF NOT (OLD.`Direccion` <=> NEW.`Direccion`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Direccion', OLD.`Direccion`);
    SET v_new = JSON_SET(v_new, '$.Direccion', NEW.`Direccion`);
  END IF;
  IF NOT (OLD.`Telefono` <=> NEW.`Telefono`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Telefono', OLD.`Telefono`);
    SET v_new = JSON_SET(v_new, '$.Telefono', NEW.`Telefono`);
  END IF;
  IF NOT (OLD.`FelNitEmisor` <=> NEW.`FelNitEmisor`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FelNitEmisor', OLD.`FelNitEmisor`);
    SET v_new = JSON_SET(v_new, '$.FelNitEmisor', NEW.`FelNitEmisor`);
  END IF;
  IF NOT (OLD.`FelNombreEmisor` <=> NEW.`FelNombreEmisor`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FelNombreEmisor', OLD.`FelNombreEmisor`);
    SET v_new = JSON_SET(v_new, '$.FelNombreEmisor', NEW.`FelNombreEmisor`);
  END IF;
  IF NOT (OLD.`FelNombreComercial` <=> NEW.`FelNombreComercial`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FelNombreComercial', OLD.`FelNombreComercial`);
    SET v_new = JSON_SET(v_new, '$.FelNombreComercial', NEW.`FelNombreComercial`);
  END IF;
  IF NOT (OLD.`FelCorreoEmisor` <=> NEW.`FelCorreoEmisor`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FelCorreoEmisor', OLD.`FelCorreoEmisor`);
    SET v_new = JSON_SET(v_new, '$.FelCorreoEmisor', NEW.`FelCorreoEmisor`);
  END IF;
  IF NOT (OLD.`FelCodigoEstablecimiento` <=> NEW.`FelCodigoEstablecimiento`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FelCodigoEstablecimiento', OLD.`FelCodigoEstablecimiento`);
    SET v_new = JSON_SET(v_new, '$.FelCodigoEstablecimiento', NEW.`FelCodigoEstablecimiento`);
  END IF;
  IF NOT (OLD.`FelAfiliacionIva` <=> NEW.`FelAfiliacionIva`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FelAfiliacionIva', OLD.`FelAfiliacionIva`);
    SET v_new = JSON_SET(v_new, '$.FelAfiliacionIva', NEW.`FelAfiliacionIva`);
  END IF;
  IF NOT (OLD.`FelDireccion` <=> NEW.`FelDireccion`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FelDireccion', OLD.`FelDireccion`);
    SET v_new = JSON_SET(v_new, '$.FelDireccion', NEW.`FelDireccion`);
  END IF;
  IF NOT (OLD.`FelCodigoPostal` <=> NEW.`FelCodigoPostal`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FelCodigoPostal', OLD.`FelCodigoPostal`);
    SET v_new = JSON_SET(v_new, '$.FelCodigoPostal', NEW.`FelCodigoPostal`);
  END IF;
  IF NOT (OLD.`FelMunicipio` <=> NEW.`FelMunicipio`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FelMunicipio', OLD.`FelMunicipio`);
    SET v_new = JSON_SET(v_new, '$.FelMunicipio', NEW.`FelMunicipio`);
  END IF;
  IF NOT (OLD.`FelDepartamento` <=> NEW.`FelDepartamento`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FelDepartamento', OLD.`FelDepartamento`);
    SET v_new = JSON_SET(v_new, '$.FelDepartamento', NEW.`FelDepartamento`);
  END IF;
  IF NOT (OLD.`FelPais` <=> NEW.`FelPais`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FelPais', OLD.`FelPais`);
    SET v_new = JSON_SET(v_new, '$.FelPais', NEW.`FelPais`);
  END IF;
  IF NOT (OLD.`FelTipoFrase` <=> NEW.`FelTipoFrase`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FelTipoFrase', OLD.`FelTipoFrase`);
    SET v_new = JSON_SET(v_new, '$.FelTipoFrase', NEW.`FelTipoFrase`);
  END IF;
  IF NOT (OLD.`FelCodigoEscenario` <=> NEW.`FelCodigoEscenario`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FelCodigoEscenario', OLD.`FelCodigoEscenario`);
    SET v_new = JSON_SET(v_new, '$.FelCodigoEscenario', NEW.`FelCodigoEscenario`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'sucursal', NEW.`IdSucursal`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

CREATE TRIGGER `trg_sucursal_ad` AFTER DELETE ON `sucursal`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('DELETE', 'Registro eliminado', 'sucursal', OLD.`IdSucursal`,
          JSON_OBJECT(
            'Nombre', OLD.`Nombre`,
            'Direccion', OLD.`Direccion`,
            'Telefono', OLD.`Telefono`,
            'FelNitEmisor', OLD.`FelNitEmisor`,
            'FelNombreEmisor', OLD.`FelNombreEmisor`,
            'FelNombreComercial', OLD.`FelNombreComercial`,
            'FelCorreoEmisor', OLD.`FelCorreoEmisor`,
            'FelCodigoEstablecimiento', OLD.`FelCodigoEstablecimiento`,
            'FelAfiliacionIva', OLD.`FelAfiliacionIva`,
            'FelDireccion', OLD.`FelDireccion`,
            'FelCodigoPostal', OLD.`FelCodigoPostal`,
            'FelMunicipio', OLD.`FelMunicipio`,
            'FelDepartamento', OLD.`FelDepartamento`,
            'FelPais', OLD.`FelPais`,
            'FelTipoFrase', OLD.`FelTipoFrase`,
            'FelCodigoEscenario', OLD.`FelCodigoEscenario`
          ),
          NULL,
          NOW(), OLD.`UsuarioModif`);
END$$

-- =============================================================================
-- articulo  (UPDATE, DELETE)
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_articulo_au`$$
DROP TRIGGER IF EXISTS `trg_articulo_ad`$$

CREATE TRIGGER `trg_articulo_au` AFTER UPDATE ON `articulo`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`Codigo` <=> NEW.`Codigo`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Codigo', OLD.`Codigo`);
    SET v_new = JSON_SET(v_new, '$.Codigo', NEW.`Codigo`);
  END IF;
  IF NOT (OLD.`Nombre` <=> NEW.`Nombre`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Nombre', OLD.`Nombre`);
    SET v_new = JSON_SET(v_new, '$.Nombre', NEW.`Nombre`);
  END IF;
  IF NOT (OLD.`Descripcion` <=> NEW.`Descripcion`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Descripcion', OLD.`Descripcion`);
    SET v_new = JSON_SET(v_new, '$.Descripcion', NEW.`Descripcion`);
  END IF;
  IF NOT (OLD.`StockMinimo` <=> NEW.`StockMinimo`) THEN
    SET v_ant = JSON_SET(v_ant, '$.StockMinimo', OLD.`StockMinimo`);
    SET v_new = JSON_SET(v_new, '$.StockMinimo', NEW.`StockMinimo`);
  END IF;
  IF NOT (OLD.`PrecioCompraUltimoProveedor` <=> NEW.`PrecioCompraUltimoProveedor`) THEN
    SET v_ant = JSON_SET(v_ant, '$.PrecioCompraUltimoProveedor', OLD.`PrecioCompraUltimoProveedor`);
    SET v_new = JSON_SET(v_new, '$.PrecioCompraUltimoProveedor', NEW.`PrecioCompraUltimoProveedor`);
  END IF;
  IF NOT (OLD.`MargenGanancia` <=> NEW.`MargenGanancia`) THEN
    SET v_ant = JSON_SET(v_ant, '$.MargenGanancia', OLD.`MargenGanancia`);
    SET v_new = JSON_SET(v_new, '$.MargenGanancia', NEW.`MargenGanancia`);
  END IF;
  IF NOT (OLD.`CantidadMinimaDescuento` <=> NEW.`CantidadMinimaDescuento`) THEN
    SET v_ant = JSON_SET(v_ant, '$.CantidadMinimaDescuento', OLD.`CantidadMinimaDescuento`);
    SET v_new = JSON_SET(v_new, '$.CantidadMinimaDescuento', NEW.`CantidadMinimaDescuento`);
  END IF;
  IF NOT (OLD.`DescuentoMayorista` <=> NEW.`DescuentoMayorista`) THEN
    SET v_ant = JSON_SET(v_ant, '$.DescuentoMayorista', OLD.`DescuentoMayorista`);
    SET v_new = JSON_SET(v_new, '$.DescuentoMayorista', NEW.`DescuentoMayorista`);
  END IF;
  IF NOT (OLD.`IdAreaArticulo` <=> NEW.`IdAreaArticulo`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdAreaArticulo', OLD.`IdAreaArticulo`);
    SET v_new = JSON_SET(v_new, '$.IdAreaArticulo', NEW.`IdAreaArticulo`);
  END IF;
  IF NOT (OLD.`IdUnidadMedida` <=> NEW.`IdUnidadMedida`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdUnidadMedida', OLD.`IdUnidadMedida`);
    SET v_new = JSON_SET(v_new, '$.IdUnidadMedida', NEW.`IdUnidadMedida`);
  END IF;
  IF NOT (OLD.`IdEstadoArticulo` <=> NEW.`IdEstadoArticulo`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdEstadoArticulo', OLD.`IdEstadoArticulo`);
    SET v_new = JSON_SET(v_new, '$.IdEstadoArticulo', NEW.`IdEstadoArticulo`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'articulo', NEW.`IdArticulo`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

CREATE TRIGGER `trg_articulo_ad` AFTER DELETE ON `articulo`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('DELETE', 'Registro eliminado', 'articulo', OLD.`IdArticulo`,
          JSON_OBJECT(
            'Codigo', OLD.`Codigo`,
            'Nombre', OLD.`Nombre`,
            'Descripcion', OLD.`Descripcion`,
            'StockMinimo', OLD.`StockMinimo`,
            'PrecioCompraUltimoProveedor', OLD.`PrecioCompraUltimoProveedor`,
            'MargenGanancia', OLD.`MargenGanancia`,
            'CantidadMinimaDescuento', OLD.`CantidadMinimaDescuento`,
            'DescuentoMayorista', OLD.`DescuentoMayorista`,
            'IdAreaArticulo', OLD.`IdAreaArticulo`,
            'IdUnidadMedida', OLD.`IdUnidadMedida`,
            'IdEstadoArticulo', OLD.`IdEstadoArticulo`,
            'StockActual', OLD.`StockActual`
          ),
          NULL,
          NOW(), OLD.`UsuarioModif`);
END$$

-- =============================================================================
-- cliente  (UPDATE, DELETE)
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_cliente_au`$$
DROP TRIGGER IF EXISTS `trg_cliente_ad`$$

CREATE TRIGGER `trg_cliente_au` AFTER UPDATE ON `cliente`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`Nit` <=> NEW.`Nit`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Nit', OLD.`Nit`);
    SET v_new = JSON_SET(v_new, '$.Nit', NEW.`Nit`);
  END IF;
  IF NOT (OLD.`Nombre` <=> NEW.`Nombre`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Nombre', OLD.`Nombre`);
    SET v_new = JSON_SET(v_new, '$.Nombre', NEW.`Nombre`);
  END IF;
  IF NOT (OLD.`Telefono` <=> NEW.`Telefono`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Telefono', OLD.`Telefono`);
    SET v_new = JSON_SET(v_new, '$.Telefono', NEW.`Telefono`);
  END IF;
  IF NOT (OLD.`Correo` <=> NEW.`Correo`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Correo', OLD.`Correo`);
    SET v_new = JSON_SET(v_new, '$.Correo', NEW.`Correo`);
  END IF;
  IF NOT (OLD.`Direccion` <=> NEW.`Direccion`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Direccion', OLD.`Direccion`);
    SET v_new = JSON_SET(v_new, '$.Direccion', NEW.`Direccion`);
  END IF;
  IF NOT (OLD.`IdEstadoCliente` <=> NEW.`IdEstadoCliente`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdEstadoCliente', OLD.`IdEstadoCliente`);
    SET v_new = JSON_SET(v_new, '$.IdEstadoCliente', NEW.`IdEstadoCliente`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'cliente', NEW.`IdCliente`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

CREATE TRIGGER `trg_cliente_ad` AFTER DELETE ON `cliente`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('DELETE', 'Registro eliminado', 'cliente', OLD.`IdCliente`,
          JSON_OBJECT(
            'Nit', OLD.`Nit`,
            'Nombre', OLD.`Nombre`,
            'Telefono', OLD.`Telefono`,
            'Correo', OLD.`Correo`,
            'Direccion', OLD.`Direccion`,
            'IdEstadoCliente', OLD.`IdEstadoCliente`
          ),
          NULL,
          NOW(), OLD.`UsuarioModif`);
END$$

-- =============================================================================
-- proveedor  (UPDATE, DELETE)
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_proveedor_au`$$
DROP TRIGGER IF EXISTS `trg_proveedor_ad`$$

CREATE TRIGGER `trg_proveedor_au` AFTER UPDATE ON `proveedor`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`Nombre` <=> NEW.`Nombre`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Nombre', OLD.`Nombre`);
    SET v_new = JSON_SET(v_new, '$.Nombre', NEW.`Nombre`);
  END IF;
  IF NOT (OLD.`Nit` <=> NEW.`Nit`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Nit', OLD.`Nit`);
    SET v_new = JSON_SET(v_new, '$.Nit', NEW.`Nit`);
  END IF;
  IF NOT (OLD.`Telefono` <=> NEW.`Telefono`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Telefono', OLD.`Telefono`);
    SET v_new = JSON_SET(v_new, '$.Telefono', NEW.`Telefono`);
  END IF;
  IF NOT (OLD.`Direccion` <=> NEW.`Direccion`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Direccion', OLD.`Direccion`);
    SET v_new = JSON_SET(v_new, '$.Direccion', NEW.`Direccion`);
  END IF;
  IF NOT (OLD.`NombreContacto` <=> NEW.`NombreContacto`) THEN
    SET v_ant = JSON_SET(v_ant, '$.NombreContacto', OLD.`NombreContacto`);
    SET v_new = JSON_SET(v_new, '$.NombreContacto', NEW.`NombreContacto`);
  END IF;
  IF NOT (OLD.`IdEstadoProveedor` <=> NEW.`IdEstadoProveedor`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdEstadoProveedor', OLD.`IdEstadoProveedor`);
    SET v_new = JSON_SET(v_new, '$.IdEstadoProveedor', NEW.`IdEstadoProveedor`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'proveedor', NEW.`IdProveedor`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

CREATE TRIGGER `trg_proveedor_ad` AFTER DELETE ON `proveedor`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('DELETE', 'Registro eliminado', 'proveedor', OLD.`IdProveedor`,
          JSON_OBJECT(
            'Nombre', OLD.`Nombre`,
            'Nit', OLD.`Nit`,
            'Telefono', OLD.`Telefono`,
            'Direccion', OLD.`Direccion`,
            'NombreContacto', OLD.`NombreContacto`,
            'IdEstadoProveedor', OLD.`IdEstadoProveedor`
          ),
          NULL,
          NOW(), OLD.`UsuarioModif`);
END$$

-- =============================================================================
-- venta  (UPDATE, DELETE)
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_venta_au`$$
DROP TRIGGER IF EXISTS `trg_venta_ad`$$

CREATE TRIGGER `trg_venta_au` AFTER UPDATE ON `venta`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`Fecha` <=> NEW.`Fecha`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Fecha', OLD.`Fecha`);
    SET v_new = JSON_SET(v_new, '$.Fecha', NEW.`Fecha`);
  END IF;
  IF NOT (OLD.`Subtotal` <=> NEW.`Subtotal`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Subtotal', OLD.`Subtotal`);
    SET v_new = JSON_SET(v_new, '$.Subtotal', NEW.`Subtotal`);
  END IF;
  IF NOT (OLD.`DescuentoMayoristaTotal` <=> NEW.`DescuentoMayoristaTotal`) THEN
    SET v_ant = JSON_SET(v_ant, '$.DescuentoMayoristaTotal', OLD.`DescuentoMayoristaTotal`);
    SET v_new = JSON_SET(v_new, '$.DescuentoMayoristaTotal', NEW.`DescuentoMayoristaTotal`);
  END IF;
  IF NOT (OLD.`DescuentoManualTotal` <=> NEW.`DescuentoManualTotal`) THEN
    SET v_ant = JSON_SET(v_ant, '$.DescuentoManualTotal', OLD.`DescuentoManualTotal`);
    SET v_new = JSON_SET(v_new, '$.DescuentoManualTotal', NEW.`DescuentoManualTotal`);
  END IF;
  IF NOT (OLD.`DescuentoTotal` <=> NEW.`DescuentoTotal`) THEN
    SET v_ant = JSON_SET(v_ant, '$.DescuentoTotal', OLD.`DescuentoTotal`);
    SET v_new = JSON_SET(v_new, '$.DescuentoTotal', NEW.`DescuentoTotal`);
  END IF;
  IF NOT (OLD.`Total` <=> NEW.`Total`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Total', OLD.`Total`);
    SET v_new = JSON_SET(v_new, '$.Total', NEW.`Total`);
  END IF;
  IF NOT (OLD.`NumeroFactura` <=> NEW.`NumeroFactura`) THEN
    SET v_ant = JSON_SET(v_ant, '$.NumeroFactura', OLD.`NumeroFactura`);
    SET v_new = JSON_SET(v_new, '$.NumeroFactura', NEW.`NumeroFactura`);
  END IF;
  IF NOT (OLD.`IdEstadoVenta` <=> NEW.`IdEstadoVenta`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdEstadoVenta', OLD.`IdEstadoVenta`);
    SET v_new = JSON_SET(v_new, '$.IdEstadoVenta', NEW.`IdEstadoVenta`);
  END IF;
  IF NOT (OLD.`IdCliente` <=> NEW.`IdCliente`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdCliente', OLD.`IdCliente`);
    SET v_new = JSON_SET(v_new, '$.IdCliente', NEW.`IdCliente`);
  END IF;
  IF NOT (OLD.`IdUsuario` <=> NEW.`IdUsuario`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdUsuario', OLD.`IdUsuario`);
    SET v_new = JSON_SET(v_new, '$.IdUsuario', NEW.`IdUsuario`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'venta', NEW.`IdVenta`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

CREATE TRIGGER `trg_venta_ad` AFTER DELETE ON `venta`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('DELETE', 'Registro eliminado', 'venta', OLD.`IdVenta`,
          JSON_OBJECT(
            'Fecha', OLD.`Fecha`,
            'Subtotal', OLD.`Subtotal`,
            'DescuentoMayoristaTotal', OLD.`DescuentoMayoristaTotal`,
            'DescuentoManualTotal', OLD.`DescuentoManualTotal`,
            'DescuentoTotal', OLD.`DescuentoTotal`,
            'Total', OLD.`Total`,
            'NumeroFactura', OLD.`NumeroFactura`,
            'IdEstadoVenta', OLD.`IdEstadoVenta`,
            'IdCliente', OLD.`IdCliente`,
            'IdUsuario', OLD.`IdUsuario`
          ),
          NULL,
          NOW(), OLD.`UsuarioModif`);
END$$

-- =============================================================================
-- venta_fel  (UPDATE)
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_venta_fel_au`$$

CREATE TRIGGER `trg_venta_fel_au` AFTER UPDATE ON `venta_fel`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`IdVenta` <=> NEW.`IdVenta`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdVenta', OLD.`IdVenta`);
    SET v_new = JSON_SET(v_new, '$.IdVenta', NEW.`IdVenta`);
  END IF;
  IF NOT (OLD.`TipoDte` <=> NEW.`TipoDte`) THEN
    SET v_ant = JSON_SET(v_ant, '$.TipoDte', OLD.`TipoDte`);
    SET v_new = JSON_SET(v_new, '$.TipoDte', NEW.`TipoDte`);
  END IF;
  IF NOT (OLD.`NumeroAutorizacion` <=> NEW.`NumeroAutorizacion`) THEN
    SET v_ant = JSON_SET(v_ant, '$.NumeroAutorizacion', OLD.`NumeroAutorizacion`);
    SET v_new = JSON_SET(v_new, '$.NumeroAutorizacion', NEW.`NumeroAutorizacion`);
  END IF;
  IF NOT (OLD.`SerieDocumento` <=> NEW.`SerieDocumento`) THEN
    SET v_ant = JSON_SET(v_ant, '$.SerieDocumento', OLD.`SerieDocumento`);
    SET v_new = JSON_SET(v_new, '$.SerieDocumento', NEW.`SerieDocumento`);
  END IF;
  IF NOT (OLD.`NumeroDocumento` <=> NEW.`NumeroDocumento`) THEN
    SET v_ant = JSON_SET(v_ant, '$.NumeroDocumento', OLD.`NumeroDocumento`);
    SET v_new = JSON_SET(v_new, '$.NumeroDocumento', NEW.`NumeroDocumento`);
  END IF;
  IF NOT (OLD.`FechaHoraEmision` <=> NEW.`FechaHoraEmision`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FechaHoraEmision', OLD.`FechaHoraEmision`);
    SET v_new = JSON_SET(v_new, '$.FechaHoraEmision', NEW.`FechaHoraEmision`);
  END IF;
  IF NOT (OLD.`FechaHoraCertificacion` <=> NEW.`FechaHoraCertificacion`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FechaHoraCertificacion', OLD.`FechaHoraCertificacion`);
    SET v_new = JSON_SET(v_new, '$.FechaHoraCertificacion', NEW.`FechaHoraCertificacion`);
  END IF;
  IF NOT (OLD.`NitCertificador` <=> NEW.`NitCertificador`) THEN
    SET v_ant = JSON_SET(v_ant, '$.NitCertificador', OLD.`NitCertificador`);
    SET v_new = JSON_SET(v_new, '$.NitCertificador', NEW.`NitCertificador`);
  END IF;
  IF NOT (OLD.`NombreCertificador` <=> NEW.`NombreCertificador`) THEN
    SET v_ant = JSON_SET(v_ant, '$.NombreCertificador', OLD.`NombreCertificador`);
    SET v_new = JSON_SET(v_new, '$.NombreCertificador', NEW.`NombreCertificador`);
  END IF;
  IF NOT (OLD.`MontoGravable` <=> NEW.`MontoGravable`) THEN
    SET v_ant = JSON_SET(v_ant, '$.MontoGravable', OLD.`MontoGravable`);
    SET v_new = JSON_SET(v_new, '$.MontoGravable', NEW.`MontoGravable`);
  END IF;
  IF NOT (OLD.`MontoImpuestoIva` <=> NEW.`MontoImpuestoIva`) THEN
    SET v_ant = JSON_SET(v_ant, '$.MontoImpuestoIva', OLD.`MontoImpuestoIva`);
    SET v_new = JSON_SET(v_new, '$.MontoImpuestoIva', NEW.`MontoImpuestoIva`);
  END IF;
  IF NOT (OLD.`GranTotal` <=> NEW.`GranTotal`) THEN
    SET v_ant = JSON_SET(v_ant, '$.GranTotal', OLD.`GranTotal`);
    SET v_new = JSON_SET(v_new, '$.GranTotal', NEW.`GranTotal`);
  END IF;
  IF NOT (OLD.`EstadoDocumento` <=> NEW.`EstadoDocumento`) THEN
    SET v_ant = JSON_SET(v_ant, '$.EstadoDocumento', OLD.`EstadoDocumento`);
    SET v_new = JSON_SET(v_new, '$.EstadoDocumento', NEW.`EstadoDocumento`);
  END IF;
  IF NOT (OLD.`CodigoErrorCertificacion` <=> NEW.`CodigoErrorCertificacion`) THEN
    SET v_ant = JSON_SET(v_ant, '$.CodigoErrorCertificacion', OLD.`CodigoErrorCertificacion`);
    SET v_new = JSON_SET(v_new, '$.CodigoErrorCertificacion', NEW.`CodigoErrorCertificacion`);
  END IF;
  IF NOT (OLD.`MensajeErrorCertificacion` <=> NEW.`MensajeErrorCertificacion`) THEN
    SET v_ant = JSON_SET(v_ant, '$.MensajeErrorCertificacion', OLD.`MensajeErrorCertificacion`);
    SET v_new = JSON_SET(v_new, '$.MensajeErrorCertificacion', NEW.`MensajeErrorCertificacion`);
  END IF;
  IF NOT (OLD.`FechaHoraAnulacion` <=> NEW.`FechaHoraAnulacion`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FechaHoraAnulacion', OLD.`FechaHoraAnulacion`);
    SET v_new = JSON_SET(v_new, '$.FechaHoraAnulacion', NEW.`FechaHoraAnulacion`);
  END IF;
  IF NOT (OLD.`MotivoAnulacion` <=> NEW.`MotivoAnulacion`) THEN
    SET v_ant = JSON_SET(v_ant, '$.MotivoAnulacion', OLD.`MotivoAnulacion`);
    SET v_new = JSON_SET(v_new, '$.MotivoAnulacion', NEW.`MotivoAnulacion`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'venta_fel', NEW.`IdVentaFel`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

-- =============================================================================
-- orden_compra  (UPDATE, DELETE)
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_orden_compra_au`$$
DROP TRIGGER IF EXISTS `trg_orden_compra_ad`$$

CREATE TRIGGER `trg_orden_compra_au` AFTER UPDATE ON `orden_compra`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`Total` <=> NEW.`Total`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Total', OLD.`Total`);
    SET v_new = JSON_SET(v_new, '$.Total', NEW.`Total`);
  END IF;
  IF NOT (OLD.`Notas` <=> NEW.`Notas`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Notas', OLD.`Notas`);
    SET v_new = JSON_SET(v_new, '$.Notas', NEW.`Notas`);
  END IF;
  IF NOT (OLD.`IdProveedor` <=> NEW.`IdProveedor`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdProveedor', OLD.`IdProveedor`);
    SET v_new = JSON_SET(v_new, '$.IdProveedor', NEW.`IdProveedor`);
  END IF;
  IF NOT (OLD.`IdEstadoOrdenCompra` <=> NEW.`IdEstadoOrdenCompra`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdEstadoOrdenCompra', OLD.`IdEstadoOrdenCompra`);
    SET v_new = JSON_SET(v_new, '$.IdEstadoOrdenCompra', NEW.`IdEstadoOrdenCompra`);
  END IF;
  IF NOT (OLD.`IdUsuario` <=> NEW.`IdUsuario`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdUsuario', OLD.`IdUsuario`);
    SET v_new = JSON_SET(v_new, '$.IdUsuario', NEW.`IdUsuario`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'orden_compra', NEW.`IdOrdenCompra`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

CREATE TRIGGER `trg_orden_compra_ad` AFTER DELETE ON `orden_compra`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('DELETE', 'Registro eliminado', 'orden_compra', OLD.`IdOrdenCompra`,
          JSON_OBJECT(
            'Total', OLD.`Total`,
            'Notas', OLD.`Notas`,
            'IdProveedor', OLD.`IdProveedor`,
            'IdEstadoOrdenCompra', OLD.`IdEstadoOrdenCompra`,
            'IdUsuario', OLD.`IdUsuario`
          ),
          NULL,
          NOW(), OLD.`UsuarioModif`);
END$$

-- =============================================================================
-- orden_compra_detalle  (UPDATE)
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_orden_compra_detalle_au`$$

CREATE TRIGGER `trg_orden_compra_detalle_au` AFTER UPDATE ON `orden_compra_detalle`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`Cantidad` <=> NEW.`Cantidad`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Cantidad', OLD.`Cantidad`);
    SET v_new = JSON_SET(v_new, '$.Cantidad', NEW.`Cantidad`);
  END IF;
  IF NOT (OLD.`PrecioUnitario` <=> NEW.`PrecioUnitario`) THEN
    SET v_ant = JSON_SET(v_ant, '$.PrecioUnitario', OLD.`PrecioUnitario`);
    SET v_new = JSON_SET(v_new, '$.PrecioUnitario', NEW.`PrecioUnitario`);
  END IF;
  IF NOT (OLD.`Total` <=> NEW.`Total`) THEN
    SET v_ant = JSON_SET(v_ant, '$.Total', OLD.`Total`);
    SET v_new = JSON_SET(v_new, '$.Total', NEW.`Total`);
  END IF;
  IF NOT (OLD.`IdOrdenCompra` <=> NEW.`IdOrdenCompra`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdOrdenCompra', OLD.`IdOrdenCompra`);
    SET v_new = JSON_SET(v_new, '$.IdOrdenCompra', NEW.`IdOrdenCompra`);
  END IF;
  IF NOT (OLD.`IdArticulo` <=> NEW.`IdArticulo`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdArticulo', OLD.`IdArticulo`);
    SET v_new = JSON_SET(v_new, '$.IdArticulo', NEW.`IdArticulo`);
  END IF;
  IF NOT (OLD.`IdEstadoOrdenCompra` <=> NEW.`IdEstadoOrdenCompra`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdEstadoOrdenCompra', OLD.`IdEstadoOrdenCompra`);
    SET v_new = JSON_SET(v_new, '$.IdEstadoOrdenCompra', NEW.`IdEstadoOrdenCompra`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'orden_compra_detalle', NEW.`IdOrdenCompraDetalle`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$


-- =============================================================================
-- pedido  (UPDATE, DELETE)
-- =============================================================================
DROP TRIGGER IF EXISTS `trg_pedido_au`$$
DROP TRIGGER IF EXISTS `trg_pedido_ad`$$

CREATE TRIGGER `trg_pedido_au` AFTER UPDATE ON `pedido`
FOR EACH ROW
BEGIN
  DECLARE v_ant JSON DEFAULT JSON_OBJECT();
  DECLARE v_new JSON DEFAULT JSON_OBJECT();

  IF NOT (OLD.`FechaEntrega` <=> NEW.`FechaEntrega`) THEN
    SET v_ant = JSON_SET(v_ant, '$.FechaEntrega', OLD.`FechaEntrega`);
    SET v_new = JSON_SET(v_new, '$.FechaEntrega', NEW.`FechaEntrega`);
  END IF;
  IF NOT (OLD.`DireccionEntrega` <=> NEW.`DireccionEntrega`) THEN
    SET v_ant = JSON_SET(v_ant, '$.DireccionEntrega', OLD.`DireccionEntrega`);
    SET v_new = JSON_SET(v_new, '$.DireccionEntrega', NEW.`DireccionEntrega`);
  END IF;
  IF NOT (OLD.`NotasEntrega` <=> NEW.`NotasEntrega`) THEN
    SET v_ant = JSON_SET(v_ant, '$.NotasEntrega', OLD.`NotasEntrega`);
    SET v_new = JSON_SET(v_new, '$.NotasEntrega', NEW.`NotasEntrega`);
  END IF;
  IF NOT (OLD.`NumeroEntrega` <=> NEW.`NumeroEntrega`) THEN
    SET v_ant = JSON_SET(v_ant, '$.NumeroEntrega', OLD.`NumeroEntrega`);
    SET v_new = JSON_SET(v_new, '$.NumeroEntrega', NEW.`NumeroEntrega`);
  END IF;
  IF NOT (OLD.`IdVenta` <=> NEW.`IdVenta`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdVenta', OLD.`IdVenta`);
    SET v_new = JSON_SET(v_new, '$.IdVenta', NEW.`IdVenta`);
  END IF;
  IF NOT (OLD.`IdEstadoPedido` <=> NEW.`IdEstadoPedido`) THEN
    SET v_ant = JSON_SET(v_ant, '$.IdEstadoPedido', OLD.`IdEstadoPedido`);
    SET v_new = JSON_SET(v_new, '$.IdEstadoPedido', NEW.`IdEstadoPedido`);
  END IF;

  IF JSON_LENGTH(v_new) > 0 THEN
    INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                            DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
    VALUES ('UPDATE',
            LEFT(CONCAT('Campos modificados: ',
                 REPLACE(REPLACE(REPLACE(JSON_KEYS(v_new), '[', ''), ']', ''), '"', '')), 200),
            'pedido', NEW.`IdPedido`, v_ant, v_new, NOW(), NEW.`UsuarioModif`);
  END IF;
END$$

CREATE TRIGGER `trg_pedido_ad` AFTER DELETE ON `pedido`
FOR EACH ROW
BEGIN
  INSERT INTO `bitacora` (Operacion, DetalleOperacion, NombreTabla, IdRegistro,
                          DatosAnterior, DatosNuevos, FechaModif, UsuarioModif)
  VALUES ('DELETE', 'Registro eliminado', 'pedido', OLD.`IdPedido`,
          JSON_OBJECT(
            'FechaEntrega', OLD.`FechaEntrega`,
            'DireccionEntrega', OLD.`DireccionEntrega`,
            'NotasEntrega', OLD.`NotasEntrega`,
            'NumeroEntrega', OLD.`NumeroEntrega`,
            'IdVenta', OLD.`IdVenta`,
            'IdEstadoPedido', OLD.`IdEstadoPedido`
          ),
          NULL,
          NOW(), OLD.`UsuarioModif`);
END$$
DELIMITER ;