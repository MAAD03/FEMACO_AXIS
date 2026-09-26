package com.femaco.main.Service.SucursalCotizacion;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.DTOs.CotizacionConDetallesDTO;
import com.femaco.main.DTOs.CotizacionCreateDTO;
import com.femaco.main.DTOs.CotizacionDetalleCreateDTO;
import com.femaco.main.Entity.Inventario.Articulo;
import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Entity.SucursalCotizacion.Cotizacion;
import com.femaco.main.Entity.SucursalCotizacion.DetalleCotizacion;
import com.femaco.main.Exception.BusinessException;
import com.femaco.main.Exception.ResourceNotFoundException;
import com.femaco.main.Exception.UnauthorizedException;
import com.femaco.main.Repository.Inventario.ArticuloRepository;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;
import com.femaco.main.Repository.SucursalCotizacion.CotizacionRepository;
import com.femaco.main.Repository.SucursalCotizacion.DetalleCotizacionRepository;

@Service
public class CotizacionService {

    private final CotizacionRepository cotizacionRepository;
    private final DetalleCotizacionRepository detalleCotizacionRepository;
    private final ArticuloRepository articuloRepository;
    private final UsuarioRepository usuarioRepository;

    public CotizacionService(CotizacionRepository cotizacionRepository,
                             DetalleCotizacionRepository detalleCotizacionRepository,
                             ArticuloRepository articuloRepository,
                             UsuarioRepository usuarioRepository) {
        this.cotizacionRepository = cotizacionRepository;
        this.detalleCotizacionRepository = detalleCotizacionRepository;
        this.articuloRepository = articuloRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public Page<Cotizacion> buscarTodosPaginado(Pageable pageable) {
        Pageable pageableOrdenado = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(
                        Sort.Order.desc("fechaCreacion"),
                        Sort.Order.desc("idCotizacion")));
        return cotizacionRepository.findAll(pageableOrdenado);
    }

    public Optional<Cotizacion> buscarPorNit(String nit) {
        return cotizacionRepository.findByNit(nit);
    }

    @Transactional(readOnly = true)
    public Optional<CotizacionConDetallesDTO> buscarPorIdConDetalles(Long idCotizacion) {
        return cotizacionRepository.findById(idCotizacion)
                .map(cotizacion -> {
                    CotizacionConDetallesDTO dto = new CotizacionConDetallesDTO();
                    dto.setCotizacion(cotizacion);
                    dto.setDetalles(detalleCotizacionRepository.findByIdCotizacion(idCotizacion));
                    return dto;
                });
    }

    @Transactional
    public Cotizacion crear(Cotizacion cotizacion) {
        LocalDateTime ahora = LocalDateTime.now();
        cotizacion.setIdCotizacion(null);
        cotizacion.setFechaCreacion(ahora);
        cotizacion.setFechaModif(ahora);
        cotizacion.setUsuarioModif(cotizacion.getUsuarioCreacion());
        return cotizacionRepository.save(cotizacion);
    }

        @Transactional
        public Cotizacion crearConDetalles(CotizacionCreateDTO dto) {
        if (dto == null || dto.getDetalles() == null || dto.getDetalles().isEmpty()) {
            throw new BusinessException("Debe incluir al menos un detalle en la cotizacion");
        }

        Usuario usuarioAutenticado = obtenerUsuarioAutenticado();
        int usuarioActual = usuarioAutenticado.getIdUsuario().intValue();
        boolean puedeAplicarDescuento = Boolean.TRUE.equals(usuarioAutenticado.getPuedeAplicarDescuento());
        LocalDateTime ahora = LocalDateTime.now();

        Cotizacion cotizacion = new Cotizacion();
        cotizacion.setNombre(dto.getNombre());
        cotizacion.setNit(dto.getNit());
        cotizacion.setFecha(ahora);
        cotizacion.setFechaCreacion(ahora);
        cotizacion.setUsuarioCreacion(usuarioActual);
        cotizacion.setFechaModif(ahora);
        cotizacion.setUsuarioModif(usuarioActual);
        cotizacion.setIdUsuario(usuarioAutenticado.getIdUsuario());

        List<DetalleCotizacion> detalles = new ArrayList<>();
        BigDecimal subtotalCotizacion = BigDecimal.ZERO;
        BigDecimal descuentoMayoristaTotal = BigDecimal.ZERO;
        BigDecimal descuentoManualTotal = BigDecimal.ZERO;

        for (CotizacionDetalleCreateDTO detalleDto : dto.getDetalles()) {
            if (detalleDto == null || detalleDto.getIdArticulo() == null || detalleDto.getCantidad() == null) {
            throw new BusinessException("Cada detalle de la cotizacion debe ser valido");
            }

            Long idArticulo = detalleDto.getIdArticulo();
            Articulo articulo = articuloRepository.findById(idArticulo)
                .orElseThrow(() -> new ResourceNotFoundException("Articulo no encontrado con ID: " + idArticulo));

            BigDecimal cantidad = detalleDto.getCantidad().setScale(2, RoundingMode.HALF_UP);
            BigDecimal precioCompra = articulo.getPrecioCompraUltimoProveedor() != null
                ? articulo.getPrecioCompraUltimoProveedor() : BigDecimal.ZERO;
            BigDecimal margenGanancia = articulo.getMargenGanancia() != null
                ? articulo.getMargenGanancia() : BigDecimal.ZERO;
            BigDecimal precioUnitario = precioCompra
                .add(precioCompra.multiply(margenGanancia)
                    .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP))
                .setScale(2, RoundingMode.HALF_UP);
            BigDecimal subtotalBruto = cantidad.multiply(precioUnitario).setScale(2, RoundingMode.HALF_UP);

            BigDecimal cantidadMinimaDescuento = articulo.getCantidadMinimaDescuento() != null
                ? articulo.getCantidadMinimaDescuento() : BigDecimal.ZERO;
            BigDecimal porcDescuentoMayorista = cantidadMinimaDescuento.compareTo(BigDecimal.ZERO) > 0
                && cantidad.compareTo(cantidadMinimaDescuento) >= 0
                    ? articulo.getDescuentoMayorista() != null
                        ? articulo.getDescuentoMayorista() : BigDecimal.ZERO
                    : BigDecimal.ZERO;
            BigDecimal montoDescuentoMayorista = subtotalBruto.multiply(porcDescuentoMayorista)
                .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);

            BigDecimal porcDescuentoManual = detalleDto.getPorcDescuentoManual() != null
                ? detalleDto.getPorcDescuentoManual() : BigDecimal.ZERO;
            if (porcDescuentoManual.compareTo(BigDecimal.ZERO) > 0 && !puedeAplicarDescuento) {
            throw new UnauthorizedException("El usuario no tiene permisos para aplicar descuentos manuales");
            }
            BigDecimal montoDescuentoManual = subtotalBruto.multiply(porcDescuentoManual)
                .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);
            BigDecimal subtotalDetalle = subtotalBruto.subtract(montoDescuentoMayorista)
                .subtract(montoDescuentoManual).setScale(2, RoundingMode.HALF_UP);

            DetalleCotizacion detalle = new DetalleCotizacion();
            detalle.setIdArticulo(idArticulo);
            detalle.setCantidad(cantidad);
            detalle.setPrecioUnitario(precioUnitario);
            detalle.setSubtotalBruto(subtotalBruto);
            detalle.setPorcDescuentoMayorista(porcDescuentoMayorista);
            detalle.setMontoDescuentoMayorista(montoDescuentoMayorista);
            detalle.setPorcDescuentoManual(porcDescuentoManual);
            detalle.setMontoDescuentoManual(montoDescuentoManual);
            detalle.setSubtotal(subtotalDetalle);
            detalle.setFechaCreacion(ahora);
            detalle.setUsuarioCreacion(usuarioActual);
            detalle.setFechaModif(ahora);
            detalle.setUsuarioModif(usuarioActual);
            detalles.add(detalle);

            subtotalCotizacion = subtotalCotizacion.add(subtotalBruto);
            descuentoMayoristaTotal = descuentoMayoristaTotal.add(montoDescuentoMayorista);
            descuentoManualTotal = descuentoManualTotal.add(montoDescuentoManual);
        }

        BigDecimal descuentoTotal = descuentoMayoristaTotal.add(descuentoManualTotal)
            .setScale(2, RoundingMode.HALF_UP);
        cotizacion.setSubtotal(subtotalCotizacion.setScale(2, RoundingMode.HALF_UP));
        cotizacion.setDescuentoMayoristaTotal(descuentoMayoristaTotal.setScale(2, RoundingMode.HALF_UP));
        cotizacion.setDescuentoManualTotal(descuentoManualTotal.setScale(2, RoundingMode.HALF_UP));
        cotizacion.setDescuentoTotal(descuentoTotal);
        cotizacion.setTotal(subtotalCotizacion.subtract(descuentoTotal).setScale(2, RoundingMode.HALF_UP));

        Cotizacion cotizacionGuardada = cotizacionRepository.save(cotizacion);
        for (DetalleCotizacion detalle : detalles) {
            detalle.setIdCotizacion(cotizacionGuardada.getIdCotizacion());
        }
        detalleCotizacionRepository.saveAll(detalles);
        return cotizacionGuardada;
        }

    @Transactional
    public Optional<Cotizacion> actualizar(Long idCotizacion, Cotizacion datosNuevos) {
        return cotizacionRepository.findById(idCotizacion).map(existente -> {
            existente.setFecha(datosNuevos.getFecha());
            existente.setNombre(datosNuevos.getNombre());
            existente.setNit(datosNuevos.getNit());
            existente.setSubtotal(datosNuevos.getSubtotal());
            existente.setDescuentoMayoristaTotal(datosNuevos.getDescuentoMayoristaTotal());
            existente.setDescuentoManualTotal(datosNuevos.getDescuentoManualTotal());
            existente.setDescuentoTotal(datosNuevos.getDescuentoTotal());
            existente.setTotal(datosNuevos.getTotal());
            existente.setIdUsuario(datosNuevos.getIdUsuario());

            existente.setUsuarioModif(datosNuevos.getUsuarioModif());
            existente.setFechaModif(LocalDateTime.now());
            return cotizacionRepository.save(existente);
        });
    }

    @Transactional
    public boolean eliminar(Long idCotizacion) {
        if (!cotizacionRepository.existsById(idCotizacion)) {
            return false;
        }
        cotizacionRepository.deleteById(idCotizacion);
        return true;
    }

    private Usuario obtenerUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal() == null
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new UnauthorizedException("Usuario no autenticado");
        }

        return usuarioRepository.findByCorreoElectronico(authentication.getName())
                .orElseThrow(() -> new UnauthorizedException("Usuario autenticado no encontrado"));
    }
    
}
