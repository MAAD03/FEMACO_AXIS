package com.femaco.main.Repository.Dashboard;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.femaco.main.DTOs.Dashboard.HistorialMovimientoDTO;
import com.femaco.main.DTOs.Dashboard.MovimientoPeriodoDTO;
import com.femaco.main.Entity.Inventario.MovimientoInventario;

public interface MovimientoInventarioDashboardRepository extends Repository<MovimientoInventario, Long> {

    @Query("select new " + DashboardJpql.DTO + "MovimientoPeriodoDTO("
            + "   cast(m.fechaCreacion as LocalDate), m.tipoMovimiento, m.motivo,"
            + "   count(m), sum(m.cantidad), sum(m.stockNuevo - m.stockViejo)) "
            + "from MovimientoInventario m "
            + "where m.fechaCreacion >= :desde and m.fechaCreacion < :hasta "
            + "group by cast(m.fechaCreacion as LocalDate), m.tipoMovimiento, m.motivo "
            + "order by cast(m.fechaCreacion as LocalDate), m.tipoMovimiento, m.motivo")
    List<MovimientoPeriodoDTO> movimientosPorDia(@Param("desde") LocalDateTime desde,
                                                 @Param("hasta") LocalDateTime hasta);

    @Query(value = "select new " + DashboardJpql.DTO + "HistorialMovimientoDTO("
            + "   m.idMovimientoInventario, m.tipoMovimiento, m.motivo, m.cantidad,"
            + "   m.stockViejo, m.stockNuevo, m.fechaCreacion,"
            + "   coalesce(concat(u.nombre, ' ', u.apellido), 'Sin usuario')) "
            + "from MovimientoInventario m "
            + "left join Usuario u on u.idUsuario = m.idUsuario "
            + "where m.idArticulo = :idArticulo "
            + "order by m.fechaCreacion desc, m.idMovimientoInventario desc",
           countQuery = "select count(m) from MovimientoInventario m "
            + "where m.idArticulo = :idArticulo")
    Page<HistorialMovimientoDTO> historialPorArticulo(@Param("idArticulo") Long idArticulo,
                                                      Pageable pageable);
}
