-- =============================================================================
-- CREACIÓN DE USUARIO Y ASIGNACIÓN DE PERMISOS PARA FEMACO_APP
-- Base de datos: femacodb
-- =============================================================================

-- 1. Creación del usuario
CREATE USER IF NOT EXISTS 'femaco_app'@'%' IDENTIFIED BY '!W958oIT{/1';

-- 2. Permiso de LECTURA GLOBAL (SELECT) en todas las tablas del esquema
GRANT SELECT ON `femacodb`.* TO 'femaco_app'@'%';

-- 3. Tablas con ESCRITURA COMPLETA (INSERT, UPDATE, DELETE)
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`sucursal` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`genero` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`rol` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`modulo` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`menu` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`opcion` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`rol_opcion` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`usuario` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`area_articulo` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`unidad_medida` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`articulo` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`proveedor` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`orden_compra` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`cliente` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`venta` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`pedido` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`cotizacion` TO 'femaco_app'@'%';
GRANT INSERT, UPDATE, DELETE ON `femacodb`.`detalle_cotizacion` TO 'femaco_app'@'%';

-- 4. Tablas con EDICIÓN PARCIAL (INSERT, UPDATE - Sin DELETE)
GRANT INSERT, UPDATE ON `femacodb`.`orden_compra_detalle` TO 'femaco_app'@'%';

-- 5. Tablas de SOLO INSERCIÓN (INSERT - Sin UPDATE, Sin DELETE)
GRANT INSERT ON `femacodb`.`ajuste_inventario` TO 'femaco_app'@'%';
GRANT INSERT ON `femacodb`.`venta_detalle` TO 'femaco_app'@'%';

-- =============================================================================
-- Las siguientes tablas se quedan EXCLUSIVAMENTE con permiso de LECTURA (SELECT)
--  - bitacora
--  - estado_usuario
--  - estado_articulo
--  - estado_proveedor
--  - estado_orden_compra
--  - estado_cliente
--  - estado_venta
--  - estado_pedido
--  - movimiento_inventario
-- =============================================================================