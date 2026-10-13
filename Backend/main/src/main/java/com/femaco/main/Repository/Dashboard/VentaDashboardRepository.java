package com.femaco.main.Repository.Dashboard;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.femaco.main.DTOs.Dashboard.TotalesVentaDTO;
import com.femaco.main.DTOs.Dashboard.VentaClienteDTO;
import com.femaco.main.DTOs.Dashboard.VentaVendedorDTO;
import com.femaco.main.DTOs.Dashboard.VentasPeriodoDTO;
import com.femaco.main.Entity.Ventas.Venta;

public interface VentaDashboardRepository extends Repository<Venta, Long> {

    @Query("select new " + DashboardJpql.DTO + "VentasPeriodoDTO("
            + "   cast(v.fecha as LocalDate), count(v), sum(v.subtotal),"
            + "   sum(v.descuentoMayoristaTotal), sum(v.descuentoManualTotal),"
            + "   sum(v.descuentoTotal), sum(v.total)) "
            + "from Venta v "
            + "where v.idEstadoVenta = :estado "
            + "  and v.fecha >= :desde and v.fecha < :hasta "
            + "group by cast(v.fecha as LocalDate) "
            + "order by cast(v.fecha as LocalDate)")
    List<VentasPeriodoDTO> ventasPorDia(@Param("estado") Long estado,
                                        @Param("desde") LocalDateTime desde,
                                        @Param("hasta") LocalDateTime hasta);

    @Query("select new " + DashboardJpql.DTO + "TotalesVentaDTO("
            + "   count(v), sum(v.total), sum(v.descuentoTotal)) "
            + "from Venta v "
            + "where v.idEstadoVenta = :estado "
            + "  and v.fecha >= :desde and v.fecha < :hasta")
    TotalesVentaDTO totales(@Param("estado") Long estado,
                            @Param("desde") LocalDateTime desde,
                            @Param("hasta") LocalDateTime hasta);

    @Query("select new " + DashboardJpql.DTO + "VentaClienteDTO("
            + "   c.idCliente, c.nombre, c.nit, count(v), sum(v.total), sum(v.descuentoTotal)) "
            + "from Venta v "
            + "join Cliente c on c.idCliente = v.idCliente "
            + "where v.idEstadoVenta = :estado "
            + "  and v.fecha >= :desde and v.fecha < :hasta "
            + "group by c.idCliente, c.nombre, c.nit "
            + "order by sum(v.total) desc")
    List<VentaClienteDTO> ventasPorCliente(@Param("estado") Long estado,
                                           @Param("desde") LocalDateTime desde,
                                           @Param("hasta") LocalDateTime hasta,
                                           Pageable pageable);

    @Query("select new " + DashboardJpql.DTO + "VentaVendedorDTO("
            + "   u.idUsuario, concat(u.nombre, ' ', u.apellido), count(v),"
            + "   sum(v.total), sum(v.descuentoTotal)) "
            + "from Venta v "
            + "join Usuario u on u.idUsuario = v.idUsuario "
            + "where v.idEstadoVenta = :estado "
            + "  and v.fecha >= :desde and v.fecha < :hasta "
            + "group by u.idUsuario, u.nombre, u.apellido "
            + "order by sum(v.total) desc")
    List<VentaVendedorDTO> ventasPorVendedor(@Param("estado") Long estado,
                                             @Param("desde") LocalDateTime desde,
                                             @Param("hasta") LocalDateTime hasta);
}
