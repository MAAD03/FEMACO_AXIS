package com.femaco.main.Service.Dashboard;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Config.DashboardProperties;
import com.femaco.main.DTOs.Dashboard.Agrupacion;
import com.femaco.main.DTOs.Dashboard.Montos;
import com.femaco.main.DTOs.Dashboard.OrdenTopProductos;
import com.femaco.main.DTOs.Dashboard.PeriodoResumenDTO;
import com.femaco.main.DTOs.Dashboard.ResumenVentasDTO;
import com.femaco.main.DTOs.Dashboard.TopProductoDTO;
import com.femaco.main.DTOs.Dashboard.VentaClienteDTO;
import com.femaco.main.DTOs.Dashboard.VentaVendedorDTO;
import com.femaco.main.DTOs.Dashboard.VentasPeriodoDTO;
import com.femaco.main.Repository.Dashboard.VentaDashboardRepository;
import com.femaco.main.Repository.Dashboard.VentaDetalleDashboardRepository;

@Service
@Transactional(readOnly = true)
public class VentasDashboardService {

    private final VentaDashboardRepository ventaRepository;
    private final VentaDetalleDashboardRepository ventaDetalleRepository;
    private final DashboardProperties props;
    private final Clock clock;

    public VentasDashboardService(VentaDashboardRepository ventaRepository,
                                  VentaDetalleDashboardRepository ventaDetalleRepository,
                                  DashboardProperties props,
                                  Clock clock) {
        this.ventaRepository = ventaRepository;
        this.ventaDetalleRepository = ventaDetalleRepository;
        this.props = props;
        this.clock = clock;
    }

    /** #1 Ventas por período, con los períodos sin ventas en 0 . */
    public List<VentasPeriodoDTO> ventasPorPeriodo(LocalDate desde, LocalDate hasta, Agrupacion agrupacion) {
        RangoFechas rango = rango(desde, hasta);
        Agrupacion ag = agrupacion != null ? agrupacion : Agrupacion.DIA;

        List<VentasPeriodoDTO> diarias = ventaRepository.ventasPorDia(
                props.estadoVentaActivaId(), rango.inicio(), rango.finExclusivo());

        Map<LocalDate, VentasPeriodoDTO> porPeriodo = new TreeMap<>();
        for (LocalDate p = ag.inicioDePeriodo(rango.desde()); !p.isAfter(rango.hasta()); p = ag.siguiente(p)) {
            porPeriodo.put(p, VentasPeriodoDTO.vacio(p));
        }
        for (VentasPeriodoDTO dia : diarias) {
            LocalDate clave = ag.inicioDePeriodo(dia.periodo());
            porPeriodo.merge(clave, dia.conPeriodo(clave), VentasPeriodoDTO::sumar);
        }
        return new ArrayList<>(porPeriodo.values());
    }

    /** #2 Resumen: hoy vs ayer y mes actual vs el mismo tramo del mes anterior. */
    public ResumenVentasDTO resumen() {
        LocalDate hoy = LocalDate.now(clock);
        LocalDate inicioMes = hoy.withDayOfMonth(1);
        LocalDate inicioMesAnterior = inicioMes.minusMonths(1);

        PeriodoResumenDTO hoyDto = periodo(hoy, hoy);
        PeriodoResumenDTO ayerDto = periodo(hoy.minusDays(1), hoy.minusDays(1));
        PeriodoResumenDTO mesActual = periodo(inicioMes, hoy);
        // hoy.minusMonths(1) ajusta solo los meses cortos (31 de marzo → 28/29 de febrero)
        PeriodoResumenDTO mesAnteriorMismoPeriodo = periodo(inicioMesAnterior, hoy.minusMonths(1));
        PeriodoResumenDTO mesAnteriorCompleto = periodo(inicioMesAnterior, inicioMes.minusDays(1));

        return new ResumenVentasDTO(
                hoy, hoyDto, ayerDto, mesActual, mesAnteriorMismoPeriodo, mesAnteriorCompleto,
                Montos.variacionPorcentual(hoyDto.total(), ayerDto.total()),
                Montos.variacionPorcentual(mesActual.total(), mesAnteriorMismoPeriodo.total()));
    }

    /** #3 Top productos por unidades o por monto vendido. */
    public List<TopProductoDTO> topProductos(LocalDate desde, LocalDate hasta,
                                             OrdenTopProductos orden, Integer limite) {
        RangoFechas rango = rango(desde, hasta);
        PageRequest top = PageRequest.of(0, limite(limite)); // sin Sort: el orden va en el JPQL
        Long estado = props.estadoVentaActivaId();

        return orden == OrdenTopProductos.MONTO
                ? ventaDetalleRepository.topPorMonto(estado, rango.inicio(), rango.finExclusivo(), top)
                : ventaDetalleRepository.topPorUnidades(estado, rango.inicio(), rango.finExclusivo(), top);
    }

    /** #4 Top clientes por monto comprado. */
    public List<VentaClienteDTO> ventasPorCliente(LocalDate desde, LocalDate hasta, Integer limite) {
        RangoFechas rango = rango(desde, hasta);
        return ventaRepository.ventasPorCliente(props.estadoVentaActivaId(),
                rango.inicio(), rango.finExclusivo(), PageRequest.of(0, limite(limite)));
    }

    /** #5 Ventas por vendedor. */
    public List<VentaVendedorDTO> ventasPorVendedor(LocalDate desde, LocalDate hasta) {
        RangoFechas rango = rango(desde, hasta);
        return ventaRepository.ventasPorVendedor(props.estadoVentaActivaId(),
                rango.inicio(), rango.finExclusivo());
    }

    private PeriodoResumenDTO periodo(LocalDate desde, LocalDate hasta) {
        RangoFechas r = new RangoFechas(desde, hasta);
        return PeriodoResumenDTO.de(desde, hasta,
                ventaRepository.totales(props.estadoVentaActivaId(), r.inicio(), r.finExclusivo()));
    }

    private RangoFechas rango(LocalDate desde, LocalDate hasta) {
        return RangoFechas.resolver(desde, hasta, LocalDate.now(clock),
                props.diasPorDefecto(), props.maxDiasRango());
    }

    private int limite(Integer limite) {
        return Montos.limitar(limite, props.limitePorDefecto(), props.limiteMaximo());
    }
}
