package com.femaco.main.Service.Ventas;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.DTOs.VentaConDetallesDTO;
import com.femaco.main.DTOs.VentaCreateDTO;
import com.femaco.main.DTOs.VentaDetalleCreateDTO;
import com.femaco.main.DTOs.VentaFiltroDTO;
import com.femaco.main.Entity.Inventario.Articulo;
import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Entity.Ventas.Cliente;
import com.femaco.main.Entity.Ventas.Venta;
import com.femaco.main.Entity.Ventas.VentaDetalle;
import com.femaco.main.Exception.BusinessException;
import com.femaco.main.Exception.ResourceNotFoundException;
import com.femaco.main.Exception.UnauthorizedException;
import com.femaco.main.Repository.Inventario.ArticuloRepository;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;
import com.femaco.main.Repository.Ventas.ClienteRepository;
import com.femaco.main.Repository.Ventas.VentaDetalleRepository;
import com.femaco.main.Repository.Ventas.VentaFelRepository;
import com.femaco.main.Repository.Ventas.VentaRepository;

@Service
public class VentaService {

    private static final Long ESTADO_ACTIVO = 1L;
    private static final Long ESTADO_ANULADA = 2L;
    private static final Long CONSUMIDOR_FINAL_ID_CLIENTE = 1L;
    private static final BigDecimal LIMITE_CONSUMIDOR_FINAL = BigDecimal.valueOf(2500);
    private static final DateTimeFormatter FORMATO_FACTURA = DateTimeFormatter.ofPattern("ddMMyyyy");

    private final VentaRepository ventaRepository;
    private final VentaDetalleRepository ventaDetalleRepository;
    private final ClienteRepository clienteRepository;
    private final ArticuloRepository articuloRepository;
    private final UsuarioRepository usuarioRepository;
    private final VentaFelRepository ventaFelRepository;

    public VentaService(VentaRepository ventaRepository,
                         VentaDetalleRepository ventaDetalleRepository,
                         ClienteRepository clienteRepository,
                         ArticuloRepository articuloRepository,
                         UsuarioRepository usuarioRepository,
                         VentaFelRepository ventaFelRepository) {
        this.ventaRepository = ventaRepository;
        this.ventaDetalleRepository = ventaDetalleRepository;
        this.clienteRepository = clienteRepository;
        this.articuloRepository = articuloRepository;
        this.usuarioRepository = usuarioRepository;
        this.ventaFelRepository = ventaFelRepository;
    }

    public List<Venta> buscarTodos() {
        return ventaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<VentaConDetallesDTO> buscarPorIdConDetalles(Long idVenta) {
        return ventaRepository.findById(idVenta)
                .map(venta -> {
                    VentaConDetallesDTO dto = new VentaConDetallesDTO();
                    dto.setVenta(venta);
                    dto.setDetalles(ventaDetalleRepository.findByIdVenta(idVenta));
                    ventaFelRepository.findByIdVenta(idVenta)
                            .ifPresentOrElse(
                                    ventaFel -> dto.setEstadoDocumento(ventaFel.getEstadoDocumento()),
                                    () -> dto.setEstadoDocumento("No Creado"));
                    return dto;
                });
    }

    @Transactional(readOnly = true)
    public Page<Venta> buscarConFiltros(VentaFiltroDTO filtro, Pageable pageable) {
        return ventaRepository.findAll(VentaSpecification.conFiltros(filtro), pageable);
    }

    
    @Transactional
    public Optional<Venta> anular(Long idVenta) {
        Usuario usuarioAutenticado = obtenerUsuarioAutenticado();
        return ventaRepository.findById(idVenta).map(existente -> {
            if (ESTADO_ANULADA.equals(existente.getIdEstadoVenta())) {
                throw new BusinessException("La venta ya está anulada");
            }
            existente.setFechaModif(LocalDateTime.now());
            existente.setUsuarioModif(usuarioAutenticado.getIdUsuario().intValue());
            existente.setIdEstadoVenta(ESTADO_ANULADA);
            return ventaRepository.save(existente);
        });
    }
/*
    @Transactional
    public Venta crear(Venta venta) {
            LocalDateTime ahora = LocalDateTime.now();
            venta.setIdVenta(null);
            venta.setFechaCreacion(ahora);
            venta.setFechaModif(ahora);
            venta.setUsuarioModif(venta.getUsuarioCreacion());
            return ventaRepository.save(venta);
    }

    @Transactional
    public boolean eliminar(Long idVenta) {
        if (!ventaRepository.existsById(idVenta)) {
            return false;
        }
        ventaRepository.deleteById(idVenta);
        return true;
    }
 */
    @Transactional
    public Venta crearConDetalles(VentaCreateDTO dto) {
        if (dto == null) {
            throw new BusinessException("La solicitud no puede ser nula");
        }

        if (dto.getDetalles() == null || dto.getDetalles().isEmpty()) {
            throw new BusinessException("Debe incluir al menos un detalle en la venta");
        }

        Usuario usuarioAutenticado = obtenerUsuarioAutenticado();
        int usuarioActual = usuarioAutenticado.getIdUsuario().intValue();
        boolean puedeAplicarDescuento = Boolean.TRUE.equals(usuarioAutenticado.getPuedeAplicarDescuento());

        Long idCliente = dto.isConsumidorFinal() ? CONSUMIDOR_FINAL_ID_CLIENTE : dto.getIdCliente();
        if (idCliente == null) {
            throw new BusinessException("El campo idCliente es obligatorio cuando no es consumidor final");
        }

        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + idCliente));

        if (cliente.getIdEstadoCliente() == null || !ESTADO_ACTIVO.equals(cliente.getIdEstadoCliente())) {
            throw new BusinessException("El cliente no está activo");
        }

        LocalDateTime ahora = LocalDateTime.now();

        Venta venta = new Venta();
        venta.setFecha(ahora);
        venta.setIdEstadoVenta(ESTADO_ACTIVO);
        venta.setIdCliente(idCliente);
        venta.setIdUsuario(usuarioAutenticado.getIdUsuario());
        venta.setFechaCreacion(ahora);
        venta.setUsuarioCreacion(usuarioActual);
        venta.setFechaModif(ahora);
        venta.setUsuarioModif(usuarioActual);

        List<VentaDetalle> detalles = new ArrayList<>();
        BigDecimal subtotalVenta = BigDecimal.ZERO;
        BigDecimal descuentoMayoristaTotal = BigDecimal.ZERO;
        BigDecimal descuentoManualTotal = BigDecimal.ZERO;

        for (VentaDetalleCreateDTO detalleDto : dto.getDetalles()) {
            if (detalleDto == null) {
                throw new BusinessException("Cada detalle de la venta debe ser válido");
            }

            Long idArticulo = detalleDto.getIdArticulo();
            Articulo articulo = articuloRepository.findById(idArticulo)
                    .orElseThrow(() -> new ResourceNotFoundException("Artículo no encontrado con ID: " + idArticulo));

            if (articulo.getIdEstadoArticulo() == null || !ESTADO_ACTIVO.equals(articulo.getIdEstadoArticulo())) {
                throw new BusinessException("El artículo con ID " + idArticulo + " no está activo");
            }

            BigDecimal cantidad = detalleDto.getCantidad();
            if (cantidad == null || cantidad.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("La cantidad del artículo " + idArticulo + " debe ser mayor a 0");
            }

            BigDecimal stockActual = articulo.getStockActual() != null ? articulo.getStockActual() : BigDecimal.ZERO;
            if (cantidad.compareTo(stockActual) > 0) {
                throw new BusinessException(
                        "La cantidad del artículo " + idArticulo + " supera el stock disponible");
            }

            cantidad = cantidad.setScale(2, RoundingMode.HALF_UP);

            BigDecimal margenGanancia = articulo.getMargenGanancia() != null ? articulo.getMargenGanancia() : BigDecimal.ZERO;
            BigDecimal precioCompra = articulo.getPrecioCompraUltimoProveedor() != null
                    ? articulo.getPrecioCompraUltimoProveedor()
                    : BigDecimal.ZERO;
            BigDecimal precioUnitario = precioCompra
                    .add(precioCompra.multiply(margenGanancia).divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP))
                    .setScale(2, RoundingMode.HALF_UP);
            if (precioUnitario.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException("El precio unitario del artículo " + idArticulo + " no puede ser negativo");
            }

            BigDecimal subtotalBruto = cantidad.multiply(precioUnitario).setScale(2, RoundingMode.HALF_UP);
            if (subtotalBruto.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException("El subtotal bruto del artículo " + idArticulo + " no puede ser negativo");
            }

            BigDecimal cantidadMinimaDescuento = articulo.getCantidadMinimaDescuento() != null
                    ? articulo.getCantidadMinimaDescuento()
                    : BigDecimal.ZERO;
            BigDecimal porcDescuentoMayorista = cantidadMinimaDescuento.compareTo(BigDecimal.ZERO) > 0
                    && cantidad.compareTo(cantidadMinimaDescuento) >= 0
                            ? articulo.getDescuentoMayorista() != null ? articulo.getDescuentoMayorista() : BigDecimal.ZERO
                            : BigDecimal.ZERO;

            BigDecimal montoDescuentoMayorista = subtotalBruto
                    .multiply(porcDescuentoMayorista)
                    .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                    .setScale(2, RoundingMode.HALF_UP);
            if (montoDescuentoMayorista.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException("El descuento mayorista del artículo " + idArticulo + " no puede ser negativo");
            }

            BigDecimal porcDescuentoManual = detalleDto.getPorcDescuentoManual();
            if (porcDescuentoManual != null && porcDescuentoManual.compareTo(BigDecimal.ZERO) > 0) {
                if (!puedeAplicarDescuento) {
                    throw new UnauthorizedException(
                            "El usuario no tiene permisos para aplicar descuentos manuales");
                }
            } else {
                porcDescuentoManual = BigDecimal.ZERO;
            }

            BigDecimal montoDescuentoManual = subtotalBruto
                    .multiply(porcDescuentoManual)
                    .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                    .setScale(2, RoundingMode.HALF_UP);
            if (montoDescuentoManual.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException("El descuento manual del artículo " + idArticulo + " no puede ser negativo");
            }

            BigDecimal subtotalDetalle = subtotalBruto.subtract(montoDescuentoMayorista).subtract(montoDescuentoManual)
                    .setScale(2, RoundingMode.HALF_UP);
            if (subtotalDetalle.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException("El subtotal del artículo " + idArticulo + " no puede ser negativo");
            }

            VentaDetalle detalle = new VentaDetalle();
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

            subtotalVenta = subtotalVenta.add(subtotalBruto);
            descuentoMayoristaTotal = descuentoMayoristaTotal.add(montoDescuentoMayorista);
            descuentoManualTotal = descuentoManualTotal.add(montoDescuentoManual);
        }

        BigDecimal descuentoTotal = descuentoMayoristaTotal.add(descuentoManualTotal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalVenta = subtotalVenta.subtract(descuentoTotal).setScale(2, RoundingMode.HALF_UP);

        if (CONSUMIDOR_FINAL_ID_CLIENTE.equals(idCliente)
            && totalVenta.compareTo(LIMITE_CONSUMIDOR_FINAL) >= 0) {
            throw new BusinessException(
                "Esta venta supera Q2,500.00; debe facturarse con el NIT del cliente, no como Consumidor Final");
        }

        venta.setSubtotal(subtotalVenta.setScale(2, RoundingMode.HALF_UP));
        venta.setDescuentoMayoristaTotal(descuentoMayoristaTotal.setScale(2, RoundingMode.HALF_UP));
        venta.setDescuentoManualTotal(descuentoManualTotal.setScale(2, RoundingMode.HALF_UP));
        venta.setDescuentoTotal(descuentoTotal);
        venta.setTotal(totalVenta);

        Venta ventaGuardada = ventaRepository.save(venta);

        ventaGuardada.setNumeroFactura(ventaGuardada.getIdVenta() + "-" + ahora.format(FORMATO_FACTURA));
        ventaGuardada = ventaRepository.save(ventaGuardada);

        for (VentaDetalle detalle : detalles) {
            detalle.setIdVenta(ventaGuardada.getIdVenta());
        }

        ventaDetalleRepository.saveAll(detalles);

        return ventaGuardada;
    }

    private Usuario obtenerUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal() == null
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new UnauthorizedException("Usuario no autenticado");
        }

        String correo = authentication.getName();

        return usuarioRepository.findByCorreoElectronico(correo)
                .orElseThrow(() -> new UnauthorizedException("Usuario autenticado no encontrado"));
    }

}
