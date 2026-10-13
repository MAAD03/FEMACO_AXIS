package com.femaco.main.Repository.Dashboard;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.femaco.main.DTOs.Dashboard.RotacionFilaDTO;
import com.femaco.main.DTOs.Dashboard.StockBajoDTO;
import com.femaco.main.Entity.Inventario.Articulo;

public interface ArticuloDashboardRepository extends Repository<Articulo, Long> {

    boolean existsById(Long id);

    @Query("select new " + DashboardJpql.DTO + "StockBajoDTO("
            + "   a.idArticulo, a.codigo, a.nombre, a.stockActual, a.stockMinimo) "
            + "from Articulo a "
            + "where a.idEstadoArticulo = :estado "
            + "  and a.stockMinimo > 0 "
            + "  and (a.stockActual is null or a.stockActual <= a.stockMinimo)")
    List<StockBajoDTO> stockBajoMinimo(@Param("estado") Long estado);

    @Query("select new " + DashboardJpql.DTO + "RotacionFilaDTO("
            + "   a.idArticulo, a.codigo, a.nombre, a.stockActual, m.tipoMovimiento,"
            + "   count(m), sum(m.cantidad), sum(m.stockNuevo - m.stockViejo)) "
            + "from Articulo a "
            + "left join MovimientoInventario m "
            + "   on m.idArticulo = a.idArticulo "
            + "  and m.fechaCreacion >= :desde and m.fechaCreacion < :hasta "
            + "where a.idEstadoArticulo = :estado "
            + "group by a.idArticulo, a.codigo, a.nombre, a.stockActual, m.tipoMovimiento")
    List<RotacionFilaDTO> rotacion(@Param("estado") Long estado,
                                   @Param("desde") LocalDateTime desde,
                                   @Param("hasta") LocalDateTime hasta);
}
