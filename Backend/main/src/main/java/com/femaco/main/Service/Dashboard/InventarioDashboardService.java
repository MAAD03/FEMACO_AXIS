package com.femaco.main.Service.Dashboard;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Config.DashboardProperties;
import com.femaco.main.DTOs.Dashboard.Agrupacion;
import com.femaco.main.DTOs.Dashboard.HistorialMovimientoDTO;
import com.femaco.main.DTOs.Dashboard.Montos;
import com.femaco.main.DTOs.Dashboard.MovimientoPeriodoDTO;
import com.femaco.main.DTOs.Dashboard.OrdenRotacion;
import com.femaco.main.DTOs.Dashboard.PaginaDTO;
import com.femaco.main.DTOs.Dashboard.RotacionDTO;
import com.femaco.main.DTOs.Dashboard.StockBajoDTO;
import com.femaco.main.Exception.BusinessException;
import com.femaco.main.Exception.ResourceNotFoundException;
import com.femaco.main.Repository.Dashboard.ArticuloDashboardRepository;
import com.femaco.main.Repository.Dashboard.MovimientoInventarioDashboardRepository;

@Service
@Transactional(readOnly = true)
public class InventarioDashboardService {

    private static final int TAMANIO_PAGINA_POR_DEFECTO = 20;

    private final ArticuloDashboardRepository articuloRepository;
    private final MovimientoInventarioDashboardRepository movimientoRepository;
    private final DashboardProperties props;
    private final Clock clock;

    public InventarioDashboardService(ArticuloDashboardRepository articuloRepository,
                                      MovimientoInventarioDashboardRepository movimientoRepository,
                                      DashboardProperties props,
                                      Clock clock) {
        this.articuloRepository = articuloRepository;
        this.movimientoRepository = movimientoRepository;
        this.props = props;
        this.clock = clock;
    }

    /** #6 Stock bajo mínimo, de mayor a menor faltante. */
    public List<StockBajoDTO> stockBajoMinimo() {
        return articuloRepository.stockBajoMinimo(props.estadoArticuloActivoId()).stream()
                .sorted(Comparator.comparing(StockBajoDTO::faltante).reversed()
                        .thenComparing(StockBajoDTO::nombre, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    /** #7 Movimientos por período, tipo y motivo. */
    public List<MovimientoPeriodoDTO> movimientosPorPeriodo(LocalDate desde, LocalDate hasta,
                                                            Agrupacion agrupacion) {
        RangoFechas rango = rango(desde, hasta);
        Agrupacion ag = agrupacion != null ? agrupacion : Agrupacion.DIA;

        record Clave(LocalDate periodo, String tipo, String motivo) { }

        Map<Clave, MovimientoPeriodoDTO> acumulado = new LinkedHashMap<>();
        for (MovimientoPeriodoDTO dia : movimientoRepository.movimientosPorDia(rango.inicio(), rango.finExclusivo())) {
            LocalDate periodo = ag.inicioDePeriodo(dia.periodo());
            acumulado.merge(new Clave(periodo, dia.tipoMovimiento(), dia.motivo()),
                    dia.conPeriodo(periodo), MovimientoPeriodoDTO::sumar);
        }
        Comparator<String> texto = Comparator.nullsLast(Comparator.naturalOrder());
        return acumulado.values().stream()
                .sorted(Comparator.comparing(MovimientoPeriodoDTO::periodo)
                        .thenComparing(MovimientoPeriodoDTO::tipoMovimiento, texto)
                        .thenComparing(MovimientoPeriodoDTO::motivo, texto))
                .toList();
    }

    /** #8 Historial paginado de un artículo. */
    public PaginaDTO<HistorialMovimientoDTO> historialArticulo(Long idArticulo, Integer pagina, Integer tamanio) {
        if (!articuloRepository.existsById(idArticulo)) {
            throw new ResourceNotFoundException("Artículo no encontrado con ID: " + idArticulo);
        }
        int numeroPagina = pagina == null ? 0 : pagina;
        if (numeroPagina < 0) {
            throw new BusinessException("El número de página no puede ser negativo");
        }
        int size = Montos.limitar(tamanio, TAMANIO_PAGINA_POR_DEFECTO, props.limiteMaximo());
        // sin Sort: el orden ya está en el JPQL
        return PaginaDTO.de(movimientoRepository.historialPorArticulo(idArticulo, PageRequest.of(numeroPagina, size)));
    }

    /** #9 Rotación: artículos más o menos movidos (por salidas) en el rango. */
    public List<RotacionDTO> rotacion(LocalDate desde, LocalDate hasta, OrdenRotacion orden, Integer limite) {
        RangoFechas rango = rango(desde, hasta);

        // pivotear: varias filas (artículo, tipo) → un RotacionDTO por artículo
        Map<Long, RotacionDTO> porArticulo = new LinkedHashMap<>();
        articuloRepository.rotacion(props.estadoArticuloActivoId(), rango.inicio(), rango.finExclusivo())
                .forEach(fila -> porArticulo.merge(fila.idArticulo(), RotacionDTO.de(fila), RotacionDTO::sumar));

        Comparator<RotacionDTO> porSalidas = Comparator.comparing(RotacionDTO::totalSalidas);
        if (orden != OrdenRotacion.MENOS_MOVIDOS) {
            porSalidas = porSalidas.reversed();
        }
        return porArticulo.values().stream()
                .sorted(porSalidas.thenComparing(RotacionDTO::nombre, Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(Montos.limitar(limite, props.limitePorDefecto(), props.limiteMaximo()))
                .toList();
    }

    private RangoFechas rango(LocalDate desde, LocalDate hasta) {
        return RangoFechas.resolver(desde, hasta, LocalDate.now(clock),
                props.diasPorDefecto(), props.maxDiasRango());
    }
}
