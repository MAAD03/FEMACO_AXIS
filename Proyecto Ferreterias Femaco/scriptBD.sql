CREATE SCHEMA IF NOT EXISTS `femacodb` DEFAULT CHARACTER SET utf8mb4;
USE `femacodb`;

-- -----------------------------------------------------
-- Tabla: bitacora
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bitacora` (
  `IdBitacora` INT NOT NULL AUTO_INCREMENT,
  `Operacion` VARCHAR(100) NULL,
  `DetalleOperacion` VARCHAR(200) NULL,
  `NombreTabla` VARCHAR(100) NULL,
  `DatosNuevos` TEXT NULL,
  `DatosAnterior` TEXT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdBitacora`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tabla: estado_usuario
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `estado_usuario` (
  `IdEstadoUsuario` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(45) NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdEstadoUsuario`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tabla: sucursal
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sucursal` (
  `IdSucursal` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(150) NOT NULL,
  `Direccion` VARCHAR(255) NULL,
  `Telefono` VARCHAR(45) NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdSucursal`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tablas de Seguridad y Menú
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `genero` (
  `IdGenero` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(50) NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdGenero`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `rol` (
  `IdRol` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(100) NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdRol`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `modulo` (
  `IdModulo` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(100) NOT NULL,
  `OrdenMenu` INT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdModulo`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `menu` (
  `IdMenu` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(100) NOT NULL,
  `OrdenMenu` INT NULL,
  `IdModulo` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdMenu`),
  CONSTRAINT `fk_menu_modulo` FOREIGN KEY (`IdModulo`) REFERENCES `modulo`(`IdModulo`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `opcion` (
  `IdOpcion` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(100) NOT NULL,
  `OrdenMenu` INT NULL,
  `Pagina` VARCHAR(150) NULL,
  `IdMenu` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdOpcion`),
  CONSTRAINT `fk_opcion_menu` FOREIGN KEY (`IdMenu`) REFERENCES `menu`(`IdMenu`)
) ENGINE = InnoDB;


CREATE TABLE IF NOT EXISTS `rol_opcion` (
  `IdRolOpcion` INT NOT NULL AUTO_INCREMENT,
  `IdRol` INT NOT NULL,
  `IdOpcion` INT NOT NULL,
  `Alta` TINYINT NOT NULL DEFAULT 0,
  `Baja` TINYINT NOT NULL DEFAULT 0,
  `Cambio` TINYINT NOT NULL DEFAULT 0,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdRolOpcion`),
  UNIQUE INDEX `IdRol_IdOpcion_UNIQUE` (`IdRol`, `IdOpcion`),
  CONSTRAINT `fk_roleop_rol` FOREIGN KEY (`IdRol`) REFERENCES `rol`(`IdRol`),
  CONSTRAINT `fk_roleop_opcion` FOREIGN KEY (`IdOpcion`) REFERENCES `opcion`(`IdOpcion`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tabla: usuario
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuario` (
  `IdUsuario` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(100) NOT NULL,
  `Apellido` VARCHAR(100) NOT NULL,
  `Password` VARCHAR(255) NOT NULL,
  `CorreoElectronico` VARCHAR(150) NOT NULL,
  `RequiereCambioPassword` TINYINT NOT NULL DEFAULT 1,
  `Pregunta` VARCHAR(150) NULL,
  `Respuesta` VARCHAR(150) NULL,
  `IdGenero` INT NOT NULL,
  `IdEstadoUsuario` INT NOT NULL,
  `IdSucursal` INT NOT NULL,
  `IdRol` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdUsuario`),
  UNIQUE INDEX `CorreoElectronico_UNIQUE` (`CorreoElectronico`),
  CONSTRAINT `fk_usuario_genero` FOREIGN KEY (`IdGenero`) REFERENCES `genero`(`IdGenero`),
  CONSTRAINT `fk_usuario_estado` FOREIGN KEY (`IdEstadoUsuario`) REFERENCES `estado_usuario`(`IdEstadoUsuario`),
  CONSTRAINT `fk_usuario_sucursal` FOREIGN KEY (`IdSucursal`) REFERENCES `sucursal`(`IdSucursal`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`IdRol`) REFERENCES `rol`(`IdRol`)
) ENGINE = InnoDB;



-- -----------------------------------------------------
-- Tablas de Artículos e Inventario
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `area_articulo` (
  `IdAreaArticulo` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(100) NOT NULL,
  `Descripcion` TEXT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdAreaArticulo`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `unidad_medida` (
  `IdUnidadMedida` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(100) NOT NULL,
  `Abreviatura` VARCHAR(20) NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdUnidadMedida`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `estado_articulo` (
  `IdEstadoArticulo` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(100) NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdEstadoArticulo`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `articulo` (
  `IdArticulo` INT NOT NULL AUTO_INCREMENT,
  `Codigo` VARCHAR(50) NOT NULL,
  `Nombre` VARCHAR(200) NOT NULL,
  `Descripcion` TEXT NULL,
  `StockActual` DECIMAL(12,2) NULL DEFAULT 0.00,
  `StockMinimo` DECIMAL(12,2) NULL DEFAULT 0.00,
  `PrecioCompraUltimoProveedor` DECIMAL(12,2) NULL,
  `MargenGanancia` DECIMAL(5,2) NULL,
  `CantidadMinimaDescuento` DECIMAL(12,2) NULL,
  `DescuentoMayorista` DECIMAL(5,2) NULL,
  `IdAreaArticulo` INT NOT NULL,
  `IdUnidadMedida` INT NOT NULL,
  `IdEstadoArticulo` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdArticulo`),
  CONSTRAINT `fk_art_area` FOREIGN KEY (`IdAreaArticulo`) REFERENCES `area_articulo`(`IdAreaArticulo`),
  CONSTRAINT `fk_art_unidad` FOREIGN KEY (`IdUnidadMedida`) REFERENCES `unidad_medida`(`IdUnidadMedida`),
  CONSTRAINT `fk_art_estado` FOREIGN KEY (`IdEstadoArticulo`) REFERENCES `estado_articulo`(`IdEstadoArticulo`),
  CONSTRAINT `chk_articulo_stock_no_negativo` CHECK (`StockActual` >= 0)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tablas de Proveedores
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `estado_proveedor` (
  `IdEstadoProveedor` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(45) NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdEstadoProveedor`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `proveedor` (
  `IdProveedor` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(150) NOT NULL,
  `Nit` VARCHAR(45) NULL,
  `Telefono` VARCHAR(45) NULL,
  `Direccion` TEXT NULL,
  `NombreContacto` VARCHAR(100) NULL,
  `IdEstadoProveedor` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdProveedor`),
  UNIQUE INDEX `Nit_UNIQUE` (`Nit`),
  CONSTRAINT `fk_prov_estado` FOREIGN KEY (`IdEstadoProveedor`) REFERENCES `estado_proveedor`(`IdEstadoProveedor`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tablas de Compras
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `estado_orden_compra` (
  `IdEstadoOrdenCompra` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(45) NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdEstadoOrdenCompra`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `orden_compra` (
  `IdOrdenCompra` INT NOT NULL AUTO_INCREMENT,
  `Total` DECIMAL(12,2) NULL,
  `Notas` TEXT NULL,
  `IdProveedor` INT NOT NULL,
  `IdEstadoOrdenCompra` INT NOT NULL,
  `IdUsuario` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdOrdenCompra`),
  CONSTRAINT `fk_oc_prov` FOREIGN KEY (`IdProveedor`) REFERENCES `proveedor`(`IdProveedor`),
  CONSTRAINT `fk_oc_estado` FOREIGN KEY (`IdEstadoOrdenCompra`) REFERENCES `estado_orden_compra`(`IdEstadoOrdenCompra`),
  CONSTRAINT `fk_oc_usuario` FOREIGN KEY (`IdUsuario`) REFERENCES `usuario`(`IdUsuario`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `orden_compra_detalle` (
  `IdOrdenCompraDetalle` INT NOT NULL AUTO_INCREMENT,
  `Cantidad` DECIMAL(12,2) NOT NULL,
  `PrecioUnitario` DECIMAL(12,2) NOT NULL,
  `Total` DECIMAL(12,2) NOT NULL,
  `IdOrdenCompra` INT NOT NULL,
  `IdArticulo` INT NOT NULL,
  `IdEstadoOrdenCompra` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdOrdenCompraDetalle`),
  CONSTRAINT `fk_ocd_oc` FOREIGN KEY (`IdOrdenCompra`) REFERENCES `orden_compra`(`IdOrdenCompra`),
  CONSTRAINT `fk_ocd_estado` FOREIGN KEY (`IdEstadoOrdenCompra`) REFERENCES `estado_orden_compra`(`IdEstadoOrdenCompra`),
  CONSTRAINT `fk_ocd_art` FOREIGN KEY (`IdArticulo`) REFERENCES `articulo`(`IdArticulo`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tablas de Clientes y Ventas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `estado_cliente` (
  `IdEstadoCliente` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(100) NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdEstadoCliente`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `cliente` (
  `IdCliente` INT NOT NULL AUTO_INCREMENT,
  `Nit` VARCHAR(45) NOT NULL,
  `Nombre` VARCHAR(150) NOT NULL,
  `Telefono` VARCHAR(45) NULL,
  `Correo` VARCHAR(100) NULL,
  `IdEstadoCliente` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdCliente`),
  CONSTRAINT `fk_cliente_estado` FOREIGN KEY (`IdEstadoCliente`) REFERENCES `estado_cliente`(`IdEstadoCliente`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `estado_venta` (
  `IdEstadoVenta` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(100) NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdEstadoVenta`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `venta` (
  `IdVenta` INT NOT NULL AUTO_INCREMENT,
  `Fecha` DATETIME NULL,
  `Subtotal` DECIMAL(12,2) NULL,
  `DescuentoTotal` DECIMAL(5,2) NULL,
  `Total` DECIMAL(12,2) NULL,
  `EsPedido` TINYINT NULL DEFAULT 0,
  `NumeroFactura` VARCHAR(45) NULL,
  `IdEstadoVenta` INT NOT NULL,
  `IdCliente` INT NOT NULL,
  `IdUsuario` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdVenta`),
  UNIQUE INDEX `NumeroFactura_UNIQUE` (`NumeroFactura`),
  CONSTRAINT `fk_venta_estado` FOREIGN KEY (`IdEstadoVenta`) REFERENCES `estado_venta`(`IdEstadoVenta`),
  CONSTRAINT `fk_venta_cliente` FOREIGN KEY (`IdCliente`) REFERENCES `cliente`(`IdCliente`),
  CONSTRAINT `fk_venta_usuario` FOREIGN KEY (`IdUsuario`) REFERENCES `usuario`(`IdUsuario`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `venta_detalle` (
  `IdVentaDetalle` INT NOT NULL AUTO_INCREMENT,
  `Cantidad` DECIMAL(12,2) NOT NULL,
  `PrecioUnitario` DECIMAL(12,2) NOT NULL,
  `DescuentoAplicado` DECIMAL(5,2) NULL DEFAULT 0.00,
  `Subtotal` DECIMAL(12,2) NOT NULL,
  `IdVenta` INT NOT NULL,
  `IdArticulo` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdVentaDetalle`),
  CONSTRAINT `fk_vd_venta` FOREIGN KEY (`IdVenta`) REFERENCES `venta`(`IdVenta`),
  CONSTRAINT `fk_vd_art` FOREIGN KEY (`IdArticulo`) REFERENCES `articulo`(`IdArticulo`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tablas de Pedidos y Movimientos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `estado_pedido` (
  `IdEstadoPedido` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(100) NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdEstadoPedido`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `pedido` (
  `IdPedido` INT NOT NULL AUTO_INCREMENT,
  `FechaEntrega` DATE NULL,
  `DireccionEntrega` TEXT NULL,
  `NotasEntrega` TEXT NULL,
  `NumeroEntrega` VARCHAR(50) NULL,
  `IdVenta` INT NOT NULL,
  `IdEstadoPedido` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdPedido`),
  CONSTRAINT `fk_pedido_venta` FOREIGN KEY (`IdVenta`) REFERENCES `venta`(`IdVenta`),
  CONSTRAINT `fk_pedido_estado` FOREIGN KEY (`IdEstadoPedido`) REFERENCES `estado_pedido`(`IdEstadoPedido`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `ajuste_inventario` (
  `IdAjusteInventario` INT NOT NULL AUTO_INCREMENT,
  `CantidadAjuste` DECIMAL(12,2) NOT NULL,
  `Motivo` TEXT NULL,
  `IdArticulo` INT NOT NULL,
  `IdUsuario` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdAjusteInventario`),
  CONSTRAINT `fk_ajuste_art` FOREIGN KEY (`IdArticulo`) REFERENCES `articulo`(`IdArticulo`),
  CONSTRAINT `fk_ajuste_usuario` FOREIGN KEY (`IdUsuario`) REFERENCES `usuario`(`IdUsuario`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `movimiento_inventario` (
  `IdMovimientoInventario` INT NOT NULL AUTO_INCREMENT,
  `TipoMovimiento` ENUM('entrada', 'salida', 'ajuste') NOT NULL,
  `Cantidad` DECIMAL(12,2) NOT NULL,
  `StockViejo` DECIMAL(12,2) NOT NULL,
  `StockNuevo` DECIMAL(12,2) NOT NULL,
  `Motivo` ENUM('venta', 'orden_compra', 'ajuste_manual', 'devolucion') NOT NULL,
  `IdArticulo` INT NOT NULL,
  `IdVenta` INT NULL,
  `IdOrdenCompra` INT NULL,
  `IdAjusteInventario` INT NULL,
  `IdUsuario` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdMovimientoInventario`),
  CONSTRAINT `fk_mov_art` FOREIGN KEY (`IdArticulo`) REFERENCES `articulo`(`IdArticulo`),
  CONSTRAINT `fk_mov_venta` FOREIGN KEY (`IdVenta`) REFERENCES `venta`(`IdVenta`),
  CONSTRAINT `fk_mov_oc` FOREIGN KEY (`IdOrdenCompra`) REFERENCES `orden_compra`(`IdOrdenCompra`),
  CONSTRAINT `fk_mov_ajuste` FOREIGN KEY (`IdAjusteInventario`) REFERENCES `ajuste_inventario`(`IdAjusteInventario`),
  CONSTRAINT `fk_mov_usuario` FOREIGN KEY (`IdUsuario`) REFERENCES `usuario`(`IdUsuario`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tablas de relación y cotizaciones
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cotizacion` (
  `IdCotizacion` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(100) NULL,
  `Nit` VARCHAR(25) NULL,
  `Subtotal` DECIMAL(12,2) NULL,
  `DescuentoTotal` DECIMAL(5,2) NULL,
  `Total` DECIMAL(12,2) NULL,
  `IdUsuario` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdCotizacion`),
  CONSTRAINT `fk_cot_usuario` FOREIGN KEY (`IdUsuario`) REFERENCES `usuario`(`IdUsuario`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `detalle_cotizacion` (
  `IdDetalleCotizacion` INT NOT NULL AUTO_INCREMENT,
  `Cantidad` DECIMAL(12,2) NULL,
  `PrecioUnitario` DECIMAL(12,2) NULL,
  `DescuentoAplicado` DECIMAL(5,2) NULL,
  `Subtotal` DECIMAL(12,2) NULL,
  `IdCotizacion` INT NOT NULL,
  `IdArticulo` INT NOT NULL,
  `FechaCreacion` DATETIME NOT NULL,
  `UsuarioCreacion` INT NOT NULL,
  `FechaModif` DATETIME NOT NULL,
  `UsuarioModif` INT NOT NULL,
  PRIMARY KEY (`IdDetalleCotizacion`),
  CONSTRAINT `fk_detalle_cot` FOREIGN KEY (`IdCotizacion`) REFERENCES `cotizacion`(`IdCotizacion`),
  CONSTRAINT `fk_detalle_art` FOREIGN KEY (`IdArticulo`) REFERENCES `articulo`(`IdArticulo`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- DATOS INICIALES - CATÁLOGOS Y ADMIN
-- -----------------------------------------------------

-- 1. estado_usuario
INSERT INTO `estado_usuario` 
(`IdEstadoUsuario`, `Nombre`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`) 
VALUES
(1, 'Activo', NOW(), 1, NOW(), 1),
(2, 'Inactivo', NOW(), 1, NOW(), 1),
(3, 'Bloqueado', NOW(), 1, NOW(), 1);

-- 3. genero
INSERT INTO `genero` 
(`IdGenero`, `Nombre`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`) 
VALUES
(1, 'Masculino', NOW(), 1, NOW(), 1),
(2, 'Femenino', NOW(), 1, NOW(), 1),
(3, 'Otro', NOW(), 1, NOW(), 1);

-- 4. estado_articulo
INSERT INTO `estado_articulo` 
(`IdEstadoArticulo`, `Nombre`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`) 
VALUES
(1, 'Activo', NOW(), 1, NOW(), 1),
(2, 'Inactivo', NOW(), 1, NOW(), 1),
(3, 'Descontinuado', NOW(), 1, NOW(), 1);

-- 5. estado_proveedor
INSERT INTO `estado_proveedor` 
(`IdEstadoProveedor`, `Nombre`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`) 
VALUES
(1, 'Activo', NOW(), 1, NOW(), 1),
(2, 'Inactivo', NOW(), 1, NOW(), 1);

-- 6. estado_orden_compra
INSERT INTO `estado_orden_compra` 
(`IdEstadoOrdenCompra`, `Nombre`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`) 
VALUES
(1, 'Pendiente', NOW(), 1, NOW(), 1),
(2, 'Completada', NOW(), 1, NOW(), 1),
(3, 'Parcialmente recibida', NOW(), 1, NOW(), 1),
(4, 'Cancelada', NOW(), 1, NOW(), 1),
(5, 'Entregado', NOW(), 1, NOW(), 1);

-- 7. estado_cliente
INSERT INTO `estado_cliente` 
(`IdEstadoCliente`, `Nombre`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`) 
VALUES
(1, 'Activo', NOW(), 1, NOW(), 1),
(2, 'Inactivo', NOW(), 1, NOW(), 1);

-- 8. estado_venta
INSERT INTO `estado_venta` 
(`IdEstadoVenta`, `Nombre`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`) 
VALUES
(1, 'Completada', NOW(), 1, NOW(), 1),
(2, 'Anulada', NOW(), 1, NOW(), 1);

-- 9. estado_pedido
INSERT INTO `estado_pedido` 
(`IdEstadoPedido`, `Nombre`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`) 
VALUES
(1, 'Pendiente', NOW(), 1, NOW(), 1),
(2, 'Entregado', NOW(), 1, NOW(), 1),
(3, 'Cancelado', NOW(), 1, NOW(), 1),
(4, 'Entrega Parcial', NOW(), 1, NOW(), 1);

-- 10. sucursal
INSERT INTO `sucursal` 
(`IdSucursal`, `Nombre`, `Direccion`, `Telefono`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`) 
VALUES
(1, 'Sucursal Femaco', 'Direccion 123', '1234-5678', NOW(), 1, NOW(), 1);

-- =====================================================
-- 11. INSERTS PARA SUPER USUARIO
-- =====================================================
-- 1. ROL
INSERT INTO `rol` (`IdRol`, `Nombre`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`)
VALUES
(1, 'Super Usuario', NOW(), 1, NOW(), 1);

-- 2. MÓDULOS
INSERT INTO `modulo` (`IdModulo`, `Nombre`, `OrdenMenu`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`)
VALUES
(1, 'Seguridad', 1, NOW(), 1, NOW(), 1),
(2, 'Catálogo', 2, NOW(), 1, NOW(), 1),
(3, 'Inventario', 3, NOW(), 1, NOW(), 1),
(4, 'Sucursales y Cotizaciones', 4, NOW(), 1, NOW(), 1),
(5, 'Suministro', 5, NOW(), 1, NOW(), 1),
(6, 'Ventas', 6, NOW(), 1, NOW(), 1);

-- 3. MENÚS
INSERT INTO `menu` (`IdMenu`, `Nombre`, `OrdenMenu`, `IdModulo`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`)
VALUES
-- Seguridad
(1, 'Dashboard', 1, 1, NOW(), 1, NOW(), 1),
(2, 'Configuración de Seguridad', 2, 1, NOW(), 1, NOW(), 1),
(3, 'Usuarios y Catálogos Seguridad', 3, 1, NOW(), 1, NOW(), 1),
-- Catálogo
(4, 'Catálogos Generales', 1, 2, NOW(), 1, NOW(), 1),
-- Inventario
(5, 'Artículos e Inventario', 1, 3, NOW(), 1, NOW(), 1),
-- Sucursales y Cotizaciones
(6, 'Sucursales y Cotizaciones', 1, 4, NOW(), 1, NOW(), 1),
-- Suministro
(7, 'Compras y Proveedores', 1, 5, NOW(), 1, NOW(), 1),
-- Ventas
(8, 'Clientes y Ventas', 1, 6, NOW(), 1, NOW(), 1);

-- 4. OPCIONES
INSERT INTO `opcion` (`IdOpcion`, `Nombre`, `OrdenMenu`, `Pagina`, `IdMenu`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`)
VALUES
-- Dashboard
(1, 'Dashboard', 1, 'dashboard', 1, NOW(), 1, NOW(), 1),
-- Configuración de Seguridad
(2, 'Módulos', 1, 'modulo', 2, NOW(), 1, NOW(), 1),
(3, 'Menús', 2, 'menu', 2, NOW(), 1, NOW(), 1),
(4, 'Opciones', 3, 'opcion', 2, NOW(), 1, NOW(), 1),
(5, 'Roles', 4, 'rol', 2, NOW(), 1, NOW(), 1),
(6, 'Roles - Opciones', 5, 'rol-opcion', 2, NOW(), 1, NOW(), 1),
-- Usuarios y Catálogos Seguridad
(7, 'Usuarios', 1, 'usuario', 3, NOW(), 1, NOW(), 1),
-- Catálogo
(9, 'Unidades de Medida', 1, 'unidad-medida', 4, NOW(), 1, NOW(), 1),
-- Inventario
(10, 'Artículos', 1, 'articulo', 5, NOW(), 1, NOW(), 1),
(11, 'Áreas de Artículo', 2, 'area-articulo', 5, NOW(), 1, NOW(), 1),
(12, 'Generar Ajuste de Inventario', 3, 'ajuste-inventario', 5, NOW(), 1, NOW(), 1),
(13, 'Movimientos de Inventario', 4, 'movimiento-inventario', 5, NOW(), 1, NOW(), 1),
(14, 'Lista Ajuste de Inventario', 5, 'lista-ajuste-inventario', 5, NOW(), 1, NOW(), 1),
-- Sucursales y Cotizaciones
(15, 'Sucursales', 1, 'sucursal', 6, NOW(), 1, NOW(), 1),
(16, 'Cotizaciones', 3, 'cotizacion', 6, NOW(), 1, NOW(), 1),
-- Suministro
(17, 'Proveedores', 1, 'proveedor', 7, NOW(), 1, NOW(), 1),
(18, 'Órdenes de Compra', 2, 'orden-compra', 7, NOW(), 1, NOW(), 1),
-- Ventas
(19, 'Clientes', 1, 'cliente', 8, NOW(), 1, NOW(), 1),
(20, 'Pedidos', 2, 'pedidos', 8, NOW(), 1, NOW(), 1),
(21, 'Ventas', 3, 'ventas', 8, NOW(), 1, NOW(), 1);

-- 5. ROL_OPCION (Super Usuario con TODOS los permisos)
INSERT INTO `rol_opcion` (`IdRol`, `IdOpcion`, `Alta`, `Baja`, `Cambio`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`)
VALUES
(1, 1, 1, 1, 1, NOW(), 1, NOW(), 1),   -- Dashboard
(1, 2, 1, 1, 1, NOW(), 1, NOW(), 1),   -- Módulos
(1, 3, 1, 1, 1, NOW(), 1, NOW(), 1),   -- Menús
(1, 4, 1, 1, 1, NOW(), 1, NOW(), 1),   -- Opciones
(1, 5, 1, 1, 1, NOW(), 1, NOW(), 1),   -- Roles
(1, 6, 1, 1, 1, NOW(), 1, NOW(), 1),   -- Roles - Opciones
(1, 7, 1, 1, 1, NOW(), 1, NOW(), 1),   -- Usuarios
(1, 9, 1, 1, 1, NOW(), 1, NOW(), 1),   -- Unidades de Medida
(1, 10, 1, 1, 1, NOW(), 1, NOW(), 1),  -- Artículos
(1, 11, 1, 1, 1, NOW(), 1, NOW(), 1),  -- Áreas de Artículo
(1, 12, 1, 1, 1, NOW(), 1, NOW(), 1),  -- Generar Ajuste de Inventario
(1, 13, 1, 1, 1, NOW(), 1, NOW(), 1),  -- Movimientos de Inventario
(1, 14, 1, 1, 1, NOW(), 1, NOW(), 1),  -- Lista Ajuste de Inventario
(1, 15, 1, 1, 1, NOW(), 1, NOW(), 1),  -- Sucursales
(1, 16, 1, 1, 1, NOW(), 1, NOW(), 1),  -- Cotizaciones
(1, 17, 1, 1, 1, NOW(), 1, NOW(), 1),  -- Proveedores
(1, 18, 1, 1, 1, NOW(), 1, NOW(), 1),  -- Órdenes de Compra
(1, 19, 1, 1, 1, NOW(), 1, NOW(), 1),  -- Clientes
(1, 20, 1, 1, 1, NOW(), 1, NOW(), 1),  -- Pedidos
(1, 21, 1, 1, 1, NOW(), 1, NOW(), 1);  -- Ventas

-- 6. USUARIO (Super Administrador) - password: Admin2026+
INSERT INTO `usuario` 
(`IdUsuario`, `Nombre`, `Apellido`, `Password`, `CorreoElectronico`, `RequiereCambioPassword`, 
 `Pregunta`, `Respuesta`, `IdGenero`, `IdEstadoUsuario`, `IdSucursal`, `IdRol`, 
 `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`) 
VALUES
(1, 'Admin', 'Sistema', '$2y$10$8MbTCB/6rl4VfDgfUEMa8OQmZ3PVhnZBtIRm0tj3DYCXXUyAzTi4e', 
 'administrador@femaco.com', 0, NULL, NULL, 1, 1, 1, 1, NOW(), 1, NOW(), 1);
-- =====================================================
-- 13. Datos de ejemplos para Articulos
-- =====================================================

-- 13.1 Áreas de artículo (15 registros)
INSERT INTO `area_articulo`
(`Nombre`, `Descripcion`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`)
VALUES
('Ferretería General', 'Artículos varios de uso general para ferretería', NOW(), 1, NOW(), 1),
('Plomería', 'Tuberías, accesorios y materiales para instalaciones hidráulicas', NOW(), 1, NOW(), 1),
('Electricidad', 'Cables, dispositivos y materiales para instalaciones eléctricas', NOW(), 1, NOW(), 1),
('Pintura y Acabados', 'Pinturas, esmaltes y accesorios para acabados', NOW(), 1, NOW(), 1),
('Herramientas Manuales', 'Herramientas de uso manual para construcción y mantenimiento', NOW(), 1, NOW(), 1),
('Herramientas Eléctricas', 'Herramientas eléctricas portátiles para construcción e industria', NOW(), 1, NOW(), 1),
('Tornillería y Fijaciones', 'Tornillos, clavos, tuercas, pernos y elementos de fijación', NOW(), 1, NOW(), 1),
('Construcción y Cemento', 'Materiales base para obra gris y construcción', NOW(), 1, NOW(), 1),
('Jardinería', 'Herramientas y accesorios para jardín y áreas verdes', NOW(), 1, NOW(), 1),
('Seguridad Industrial', 'Equipo de protección personal para trabajo e industria', NOW(), 1, NOW(), 1),
('Cerrajería', 'Candados, cerraduras, bisagras y accesorios de cerrajería', NOW(), 1, NOW(), 1),
('Adhesivos y Selladores', 'Pegamentos, siliconas y selladores de uso general', NOW(), 1, NOW(), 1),
('Iluminación', 'Bombillos, lámparas y accesorios de iluminación', NOW(), 1, NOW(), 1),
('Limpieza Industrial', 'Insumos y equipo para limpieza comercial e industrial', NOW(), 1, NOW(), 1),
('Ferretería Automotriz', 'Repuestos y consumibles básicos para vehículos', NOW(), 1, NOW(), 1);

-- 13.2 Unidades de medida (15 registros)
INSERT INTO `unidad_medida`
(`Nombre`, `Abreviatura`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`)
VALUES
('Unidad', 'UND', NOW(), 1, NOW(), 1),
('Caja', 'CJA', NOW(), 1, NOW(), 1),
('Docena', 'DOC', NOW(), 1, NOW(), 1),
('Metro', 'MT', NOW(), 1, NOW(), 1),
('Kilogramo', 'KG', NOW(), 1, NOW(), 1),
('Litro', 'LT', NOW(), 1, NOW(), 1),
('Galón', 'GAL', NOW(), 1, NOW(), 1),
('Rollo', 'ROL', NOW(), 1, NOW(), 1),
('Par', 'PAR', NOW(), 1, NOW(), 1),
('Juego', 'JGO', NOW(), 1, NOW(), 1),
('Bolsa', 'BOL', NOW(), 1, NOW(), 1),
('Paquete', 'PAQ', NOW(), 1, NOW(), 1),
('Pulgada', 'PLG', NOW(), 1, NOW(), 1),
('Libra', 'LB', NOW(), 1, NOW(), 1),
('Yarda', 'YDA', NOW(), 1, NOW(), 1);

-- 13.3 Artículos (60 registros)
INSERT INTO `articulo`
(`Codigo`, `Nombre`, `Descripcion`, `StockActual`, `StockMinimo`, `PrecioCompraUltimoProveedor`,
 `MargenGanancia`, `CantidadMinimaDescuento`, `DescuentoMayorista`, `IdAreaArticulo`, `IdUnidadMedida`,
 `IdEstadoArticulo`, `FechaCreacion`, `UsuarioCreacion`, `FechaModif`, `UsuarioModif`)
VALUES
('FER-0001', 'Cinta métrica de bolsillo 3m', 'Cinta métrica retráctil de 3 metros, uso general', 0.00, 10.00, 18.50, 35.00, 12.00, 8.00, 1, 1, 1, NOW(), 1, NOW(), 1),
('FER-0002', 'Set de llaves allen 9 piezas', 'Juego de llaves hexagonales allen de 9 piezas, milimétricas', 0.00, 8.00, 35.00, 30.00, 6.00, 10.00, 1, 10, 1, NOW(), 1, NOW(), 1),
('FER-0003', 'Linterna recargable LED', 'Linterna LED recargable de alta duración, uso rudo', 0.00, 10.00, 45.00, 32.00, 6.00, 10.00, 1, 1, 1, NOW(), 1, NOW(), 1),
('FER-0004', 'Caja de herramientas plástica 16 pulgadas', 'Caja organizadora plástica con compartimentos, 16 pulgadas', 0.00, 6.00, 55.00, 28.00, 4.00, 10.00, 1, 1, 1, NOW(), 1, NOW(), 1),
('FER-0005', 'Tubo PVC 1/2 pulgada x 6m', 'Tubo de PVC para agua potable, 1/2 pulgada, tramo de 6 metros', 0.00, 20.00, 22.00, 25.00, 20.00, 12.00, 2, 1, 1, NOW(), 1, NOW(), 1),
('FER-0006', 'Tubo PVC 3/4 pulgada x 6m', 'Tubo de PVC para agua potable, 3/4 pulgada, tramo de 6 metros', 0.00, 20.00, 28.00, 25.00, 20.00, 12.00, 2, 1, 1, NOW(), 1, NOW(), 1),
('FER-0007', 'Codo PVC 1/2 pulgada 90 grados', 'Codo de PVC de 90 grados para tubería de 1/2 pulgada', 0.00, 30.00, 2.50, 40.00, 25.00, 10.00, 2, 1, 1, NOW(), 1, NOW(), 1),
('FER-0008', 'Llave de paso 1/2 pulgada', 'Llave de paso de bronce para agua, 1/2 pulgada', 0.00, 15.00, 35.00, 30.00, 10.00, 10.00, 2, 1, 1, NOW(), 1, NOW(), 1),
('FER-0009', 'Cable eléctrico THHN #12 AWG', 'Cable de cobre THHN calibre 12 AWG, por metro', 0.00, 100.00, 4.20, 30.00, 50.00, 10.00, 3, 4, 1, NOW(), 1, NOW(), 1),
('FER-0010', 'Cable eléctrico THHN #14 AWG', 'Cable de cobre THHN calibre 14 AWG, por metro', 0.00, 100.00, 3.10, 30.00, 50.00, 10.00, 3, 4, 1, NOW(), 1, NOW(), 1),
('FER-0011', 'Interruptor sencillo', 'Interruptor sencillo para instalación eléctrica residencial', 0.00, 25.00, 8.50, 35.00, 15.00, 8.00, 3, 1, 1, NOW(), 1, NOW(), 1),
('FER-0012', 'Breaker termomagnético 20A', 'Breaker termomagnético de 20 amperios, uso residencial', 0.00, 15.00, 48.00, 28.00, 6.00, 10.00, 3, 1, 1, NOW(), 1, NOW(), 1),
('FER-0013', 'Pintura de aceite blanca', 'Pintura esmaltada de aceite color blanco, galón', 0.00, 12.00, 145.00, 25.00, 4.00, 12.00, 4, 7, 1, NOW(), 1, NOW(), 1),
('FER-0014', 'Esmalte sintético negro', 'Esmalte sintético color negro para metal y madera, galón', 0.00, 10.00, 150.00, 25.00, 4.00, 12.00, 4, 7, 1, NOW(), 1, NOW(), 1),
('FER-0015', 'Brocha de cerda 3 pulgadas', 'Brocha de cerda natural de 3 pulgadas', 0.00, 20.00, 15.00, 35.00, 12.00, 10.00, 4, 1, 1, NOW(), 1, NOW(), 1),
('FER-0016', 'Rodillo para pintura 9 pulgadas', 'Rodillo de espuma para pintura, 9 pulgadas con mango', 0.00, 20.00, 18.00, 35.00, 12.00, 10.00, 4, 1, 1, NOW(), 1, NOW(), 1),
('FER-0017', 'Martillo de uña 16oz', 'Martillo de uña con mango de fibra, 16 onzas', 0.00, 10.00, 55.00, 30.00, 6.00, 10.00, 5, 1, 1, NOW(), 1, NOW(), 1),
('FER-0018', 'Destornillador plano 1/4 x 6 pulgadas', 'Destornillador plano punta 1/4 pulgada, hoja de 6 pulgadas', 0.00, 15.00, 20.00, 35.00, 12.00, 10.00, 5, 1, 1, NOW(), 1, NOW(), 1),
('FER-0019', 'Alicate universal 8 pulgadas', 'Alicate universal profesional de 8 pulgadas', 0.00, 10.00, 42.00, 30.00, 8.00, 10.00, 5, 1, 1, NOW(), 1, NOW(), 1),
('FER-0020', 'Nivel de burbuja 24 pulgadas', 'Nivel de burbuja de aluminio, 24 pulgadas', 0.00, 8.00, 65.00, 28.00, 6.00, 10.00, 5, 1, 1, NOW(), 1, NOW(), 1),
('FER-0021', 'Taladro percutor 1/2 pulgada 750W', 'Taladro percutor eléctrico de 750W, mandril 1/2 pulgada', 0.00, 5.00, 650.00, 22.00, 2.00, 10.00, 6, 1, 1, NOW(), 1, NOW(), 1),
('FER-0022', 'Amoladora angular 4.5 pulgadas', 'Amoladora angular eléctrica de 4.5 pulgadas', 0.00, 5.00, 480.00, 22.00, 2.00, 10.00, 6, 1, 1, NOW(), 1, NOW(), 1),
('FER-0023', 'Sierra circular 7 1/4 pulgadas', 'Sierra circular eléctrica, disco de 7 1/4 pulgadas', 0.00, 4.00, 750.00, 22.00, 2.00, 10.00, 6, 1, 1, NOW(), 1, NOW(), 1),
('FER-0024', 'Rotomartillo SDS Plus', 'Rotomartillo eléctrico con sistema SDS Plus', 0.00, 4.00, 980.00, 20.00, 2.00, 10.00, 6, 1, 1, NOW(), 1, NOW(), 1),
('FER-0025', 'Tornillo autorroscante 1 x 8 caja 100u', 'Tornillo autorroscante para lámina, 1 pulgada, caja de 100 unidades', 0.00, 15.00, 28.00, 40.00, 10.00, 12.00, 7, 2, 1, NOW(), 1, NOW(), 1),
('FER-0026', 'Clavo de acero 2 pulgadas caja 1kg', 'Clavo de acero con cabeza, 2 pulgadas, caja de 1 kilogramo', 0.00, 15.00, 14.00, 35.00, 10.00, 12.00, 7, 2, 1, NOW(), 1, NOW(), 1),
('FER-0027', 'Tuerca hexagonal 1/4 pulgada bolsa 100u', 'Tuerca hexagonal de acero 1/4 pulgada, bolsa de 100 unidades', 0.00, 15.00, 18.00, 40.00, 10.00, 12.00, 7, 11, 1, NOW(), 1, NOW(), 1),
('FER-0028', 'Perno hexagonal 3/8 x 2 caja 50u', 'Perno hexagonal galvanizado 3/8 x 2 pulgadas, caja de 50 unidades', 0.00, 10.00, 32.00, 35.00, 8.00, 12.00, 7, 2, 1, NOW(), 1, NOW(), 1),
('FER-0029', 'Cemento gris bolsa 42.5kg', 'Cemento Portland gris, bolsa de 42.5 kilogramos', 0.00, 50.00, 68.00, 15.00, 50.00, 10.00, 8, 11, 1, NOW(), 1, NOW(), 1),
('FER-0030', 'Cal hidratada bolsa 25kg', 'Cal hidratada para construcción, bolsa de 25 kilogramos', 0.00, 30.00, 32.00, 18.00, 30.00, 10.00, 8, 11, 1, NOW(), 1, NOW(), 1),
('FER-0031', 'Varilla de hierro 3/8 x 6m', 'Varilla de hierro corrugado 3/8 pulgada, tramo de 6 metros', 0.00, 25.00, 38.00, 18.00, 20.00, 10.00, 8, 1, 1, NOW(), 1, NOW(), 1),
('FER-0032', 'Malla electrosoldada 6x2.15m', 'Malla electrosoldada para losa, lámina de 6 x 2.15 metros', 0.00, 10.00, 145.00, 18.00, 5.00, 10.00, 8, 1, 1, NOW(), 1, NOW(), 1),
('FER-0033', 'Manguera de jardín 15m', 'Manguera de jardín reforzada, tramo de 15 metros', 0.00, 10.00, 95.00, 30.00, 6.00, 10.00, 9, 1, 1, NOW(), 1, NOW(), 1),
('FER-0034', 'Tijera podadora', 'Tijera podadora manual para jardinería', 0.00, 10.00, 55.00, 32.00, 8.00, 10.00, 9, 1, 1, NOW(), 1, NOW(), 1),
('FER-0035', 'Pala de jardín', 'Pala de jardín con mango de madera', 0.00, 10.00, 48.00, 30.00, 8.00, 10.00, 9, 1, 1, NOW(), 1, NOW(), 1),
('FER-0036', 'Rastrillo metálico', 'Rastrillo metálico de jardín con mango largo', 0.00, 10.00, 42.00, 30.00, 8.00, 10.00, 9, 1, 1, NOW(), 1, NOW(), 1),
('FER-0037', 'Guantes de cuero para trabajo', 'Guantes de cuero reforzado para trabajo pesado, par', 0.00, 20.00, 25.00, 35.00, 12.00, 10.00, 10, 9, 1, NOW(), 1, NOW(), 1),
('FER-0038', 'Casco de seguridad', 'Casco de seguridad industrial ajustable', 0.00, 15.00, 45.00, 32.00, 10.00, 10.00, 10, 1, 1, NOW(), 1, NOW(), 1),
('FER-0039', 'Gafas de protección', 'Gafas de protección visual transparentes', 0.00, 20.00, 12.00, 40.00, 15.00, 10.00, 10, 1, 1, NOW(), 1, NOW(), 1),
('FER-0040', 'Mascarilla para polvo caja 50u', 'Mascarilla desechable para polvo, caja de 50 unidades', 0.00, 10.00, 55.00, 30.00, 6.00, 10.00, 10, 2, 1, NOW(), 1, NOW(), 1),
('FER-0041', 'Candado de seguridad 50mm', 'Candado de seguridad de acero, cuerpo de 50mm', 0.00, 15.00, 38.00, 32.00, 10.00, 10.00, 11, 1, 1, NOW(), 1, NOW(), 1),
('FER-0042', 'Cerradura de pomo', 'Cerradura de pomo para puerta interior, incluye llaves', 0.00, 10.00, 65.00, 28.00, 6.00, 10.00, 11, 10, 1, NOW(), 1, NOW(), 1),
('FER-0043', 'Bisagra de 3 pulgadas', 'Bisagra de acero 3 pulgadas, par', 0.00, 25.00, 10.00, 35.00, 15.00, 10.00, 11, 9, 1, NOW(), 1, NOW(), 1),
('FER-0044', 'Llave maestra tubular', 'Llave tubular de seguridad para candados y cerraduras', 0.00, 10.00, 22.00, 35.00, 10.00, 10.00, 11, 1, 1, NOW(), 1, NOW(), 1),
('FER-0045', 'Pegamento para PVC', 'Pegamento solvente para unión de tubería PVC', 0.00, 20.00, 18.00, 35.00, 12.00, 10.00, 12, 1, 1, NOW(), 1, NOW(), 1),
('FER-0046', 'Silicón transparente', 'Silicón transparente de uso general, cartucho', 0.00, 25.00, 22.00, 32.00, 12.00, 10.00, 12, 1, 1, NOW(), 1, NOW(), 1),
('FER-0047', 'Pegamento de contacto', 'Pegamento de contacto para madera y cuero, galón', 0.00, 10.00, 120.00, 25.00, 4.00, 12.00, 12, 7, 1, NOW(), 1, NOW(), 1),
('FER-0048', 'Cinta doble cara industrial', 'Cinta adhesiva doble cara de uso industrial, rollo', 0.00, 15.00, 25.00, 35.00, 10.00, 10.00, 12, 8, 1, NOW(), 1, NOW(), 1),
('FER-0049', 'Bombillo LED 9W luz cálida', 'Bombillo LED 9W, luz cálida, base E27', 0.00, 30.00, 15.00, 40.00, 20.00, 10.00, 13, 1, 1, NOW(), 1, NOW(), 1),
('FER-0050', 'Bombillo LED 12W luz fría', 'Bombillo LED 12W, luz fría, base E27', 0.00, 30.00, 18.00, 40.00, 20.00, 10.00, 13, 1, 1, NOW(), 1, NOW(), 1),
('FER-0051', 'Panel LED 24W para techo', 'Panel LED de 24W para techo, luz blanca', 0.00, 15.00, 65.00, 32.00, 10.00, 10.00, 13, 1, 1, NOW(), 1, NOW(), 1),
('FER-0052', 'Lámpara reflectora LED 50W', 'Lámpara reflectora LED de 50W para exteriores', 0.00, 10.00, 95.00, 30.00, 6.00, 10.00, 13, 1, 1, NOW(), 1, NOW(), 1),
('FER-0053', 'Escoba industrial', 'Escoba de cerdas plásticas para uso industrial', 0.00, 15.00, 28.00, 35.00, 10.00, 10.00, 14, 1, 1, NOW(), 1, NOW(), 1),
('FER-0054', 'Desengrasante industrial', 'Desengrasante multiusos de uso industrial, galón', 0.00, 10.00, 85.00, 28.00, 6.00, 10.00, 14, 7, 1, NOW(), 1, NOW(), 1),
('FER-0055', 'Trapeador industrial', 'Trapeador de algodón de uso industrial', 0.00, 15.00, 25.00, 35.00, 10.00, 10.00, 14, 1, 1, NOW(), 1, NOW(), 1),
('FER-0056', 'Guantes de látex para limpieza caja 100u', 'Guantes de látex desechables, caja de 100 unidades', 0.00, 10.00, 60.00, 30.00, 6.00, 10.00, 14, 2, 1, NOW(), 1, NOW(), 1),
('FER-0057', 'Aceite para motor 20W50', 'Aceite lubricante para motor, 20W50, galón', 0.00, 15.00, 95.00, 25.00, 6.00, 10.00, 15, 7, 1, NOW(), 1, NOW(), 1),
('FER-0058', 'Filtro de aceite universal', 'Filtro de aceite universal para automóvil', 0.00, 20.00, 28.00, 32.00, 10.00, 10.00, 15, 1, 1, NOW(), 1, NOW(), 1),
('FER-0059', 'Batería para automóvil 12V', 'Batería de 12V para automóvil, libre de mantenimiento', 0.00, 5.00, 450.00, 18.00, 2.00, 8.00, 15, 1, 1, NOW(), 1, NOW(), 1),
('FER-0060', 'Foco H4 para automóvil', 'Foco H4 halógeno para faro de automóvil', 0.00, 20.00, 22.00, 35.00, 12.00, 10.00, 15, 1, 1, NOW(), 1, NOW(), 1);