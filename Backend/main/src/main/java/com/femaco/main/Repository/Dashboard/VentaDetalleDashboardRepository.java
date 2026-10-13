package com.femaco.main.Repository.Dashboard;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.femaco.main.DTOs.Dashboard.TopProductoDTO;
import com.femaco.main.Entity.Ventas.VentaDetalle;

public interface VentaDetalleDashboardRepository extends Repository<VentaDetalle, Long> {

    String TOP_PRODUCTOS_BASE = "select new " + DashboardJpql.DTO + "TopProductoDTO("
            + "   a.idArticulo, a.codigo, a.nombre,"
            + "   sum(vd.cantidad), sum(vd.subtotalBruto),"
            + "   sum(vd.montoDescuentoMayorista + vd.montoDescuentoManual),"
            + "   sum(vd.subtotal)) "
            + "from VentaDetalle vd "
            + "join Venta v on v.idVenta = vd.idVenta "
            + "join Articulo a on a.idArticulo = vd.idArticulo "
            + "where v.idEstadoVenta = :estado "
            + "  and v.fecha >= :desde and v.fecha < :hasta "
            + "group by a.idArticulo, a.codigo, a.nombre ";

    @Query(TOP_PRODUCTOS_BASE + "order by sum(vd.cantidad) desc")
    List<TopProductoDTO> topPorUnidades(@Param("estado") Long estado,
                                        @Param("desde") LocalDateTime desde,
                                        @Param("hasta") LocalDateTime hasta,
                                        Pageable pageable);

    @Query(TOP_PRODUCTOS_BASE + "order by sum(vd.subtotal) desc")
    List<TopProductoDTO> topPorMonto(@Param("estado") Long estado,
                                     @Param("desde") LocalDateTime desde,
                                     @Param("hasta") LocalDateTime hasta,
                                     Pageable pageable);
}
