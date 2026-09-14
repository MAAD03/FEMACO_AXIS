package com.femaco.main.Service.Suministro;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.DTOs.OrdenCompraCreateDTO;
import com.femaco.main.DTOs.OrdenCompraDetalleCreateDTO;
import com.femaco.main.Entity.Inventario.Articulo;
import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Entity.Suministro.OrdenCompra;
import com.femaco.main.Entity.Suministro.OrdenCompraDetalle;
import com.femaco.main.Entity.Suministro.Proveedor;
import com.femaco.main.Exception.BusinessException;
import com.femaco.main.Exception.ResourceNotFoundException;
import com.femaco.main.Exception.UnauthorizedException;
import com.femaco.main.Repository.Inventario.ArticuloRepository;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;
import com.femaco.main.Repository.Suministro.OrdenCompraDetalleRepository;
import com.femaco.main.Repository.Suministro.OrdenCompraRepository;
import com.femaco.main.Repository.Suministro.ProveedorRepository;

@Service
public class OrdenCompraService {

    private static final Long ESTADO_PENDIENTE = 1L;

    private final OrdenCompraRepository ordenCompraRepository;
    private final OrdenCompraDetalleRepository ordenCompraDetalleRepository;
    private final ProveedorRepository proveedorRepository;
    private final ArticuloRepository articuloRepository;
    private final UsuarioRepository usuarioRepository;

    public OrdenCompraService(OrdenCompraRepository ordenCompraRepository,
                             OrdenCompraDetalleRepository ordenCompraDetalleRepository,
                             ProveedorRepository proveedorRepository,
                             ArticuloRepository articuloRepository,
                             UsuarioRepository usuarioRepository) {
        this.ordenCompraRepository = ordenCompraRepository;
        this.ordenCompraDetalleRepository = ordenCompraDetalleRepository;
        this.proveedorRepository = proveedorRepository;
        this.articuloRepository = articuloRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<OrdenCompra> buscarTodos() {
        return ordenCompraRepository.findAll();
    }

    @Transactional
    public OrdenCompra crear(OrdenCompra ordenCompra) {
        LocalDateTime ahora = LocalDateTime.now();
        ordenCompra.setIdOrdenCompra(null);
        ordenCompra.setFechaCreacion(ahora);
        ordenCompra.setFechaModif(ahora);
        ordenCompra.setUsuarioModif(ordenCompra.getUsuarioCreacion());
        return ordenCompraRepository.save(ordenCompra);
    }

    @Transactional
    public OrdenCompra crearConDetalles(OrdenCompraCreateDTO dto) {
        if (dto == null) {
            throw new BusinessException("La solicitud no puede ser nula");
        }

        if (dto.getIdProveedor() == null) {
            throw new BusinessException("El campo idProveedor es obligatorio");
        }

        if (dto.getDetalles() == null || dto.getDetalles().isEmpty()) {
            throw new BusinessException("Debe incluir al menos un detalle en la orden de compra");
        }

        Usuario usuarioAutenticado = obtenerUsuarioAutenticado();

        Proveedor proveedor = proveedorRepository.findById(dto.getIdProveedor())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Proveedor no encontrado con ID: " + dto.getIdProveedor()));

        if (proveedor.getIdEstadoProveedor() == null || !ESTADO_PENDIENTE.equals(proveedor.getIdEstadoProveedor())) {
            throw new BusinessException("El proveedor no está activo");
        }

        LocalDateTime ahora = LocalDateTime.now();
        int usuarioActual = usuarioAutenticado.getIdUsuario().intValue();

        OrdenCompra ordenCompra = new OrdenCompra();
        ordenCompra.setIdProveedor(dto.getIdProveedor());
        ordenCompra.setNotas(dto.getNotas());
        ordenCompra.setIdEstadoOrdenCompra(ESTADO_PENDIENTE);
        ordenCompra.setIdUsuario(usuarioAutenticado.getIdUsuario());
        ordenCompra.setFechaCreacion(ahora);
        ordenCompra.setUsuarioCreacion(usuarioActual);
        ordenCompra.setFechaModif(ahora);
        ordenCompra.setUsuarioModif(usuarioActual);

        BigDecimal totalOrden = BigDecimal.ZERO;
        List<OrdenCompraDetalle> detalles = new ArrayList<>();

        for (OrdenCompraDetalleCreateDTO detalleDto : dto.getDetalles()) {
            if (detalleDto == null) {
                throw new BusinessException("Cada detalle de la orden debe ser válido");
            }

            Long idArticulo = detalleDto.getIdArticulo();
            if (idArticulo == null) {
                throw new BusinessException("El campo idArticulo es obligatorio en cada detalle");
            }

            Articulo articulo = articuloRepository.findById(idArticulo)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Artículo no encontrado con ID: " + idArticulo));

            if (articulo.getIdEstadoArticulo() == null || !ESTADO_PENDIENTE.equals(articulo.getIdEstadoArticulo())) {
                throw new BusinessException("El artículo con ID " + idArticulo + " no está activo");
            }

            BigDecimal cantidad = detalleDto.getCantidad();
            BigDecimal precioUnitario = detalleDto.getPrecioUnitario();

            if (cantidad == null || cantidad.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("La cantidad del artículo " + idArticulo + " debe ser mayor a 0");
            }
            if (precioUnitario == null || precioUnitario.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("El precio unitario del artículo " + idArticulo + " debe ser mayor a 0");
            }

            if (cantidad.signum() < 0 || precioUnitario.signum() < 0) {
                throw new BusinessException(
                        "Los valores de cantidad y precio unitario del artículo " + idArticulo + " no pueden ser negativos");
            }

            cantidad = cantidad.setScale(2, RoundingMode.HALF_UP);
            precioUnitario = precioUnitario.setScale(2, RoundingMode.HALF_UP);
            BigDecimal totalDetalle = cantidad.multiply(precioUnitario).setScale(2, RoundingMode.HALF_UP);

            OrdenCompraDetalle detalle = new OrdenCompraDetalle();
            detalle.setCantidad(cantidad);
            detalle.setPrecioUnitario(precioUnitario);
            detalle.setTotal(totalDetalle);
            detalle.setIdArticulo(idArticulo);
            detalle.setIdEstadoOrdenCompra(ESTADO_PENDIENTE);
            detalle.setFechaCreacion(ahora);
            detalle.setUsuarioCreacion(usuarioActual);
            detalle.setFechaModif(ahora);
            detalle.setUsuarioModif(usuarioActual);

            detalles.add(detalle);
            totalOrden = totalOrden.add(totalDetalle);
        }

        ordenCompra.setTotal(totalOrden.setScale(2, RoundingMode.HALF_UP));

        OrdenCompra ordenGuardada = ordenCompraRepository.save(ordenCompra);

        for (OrdenCompraDetalle detalle : detalles) {
            detalle.setIdOrdenCompra(ordenGuardada.getIdOrdenCompra());
        }

        ordenCompraDetalleRepository.saveAll(detalles);

        return ordenGuardada;
    }

    @Transactional
    public Optional<OrdenCompra> actualizar(Long idOrdenCompra, OrdenCompra datosNuevos) {
        return ordenCompraRepository.findById(idOrdenCompra).map(existente -> {
            existente.setTotal(datosNuevos.getTotal());
            existente.setNotas(datosNuevos.getNotas());
            existente.setIdProveedor(datosNuevos.getIdProveedor());
            existente.setIdEstadoOrdenCompra(datosNuevos.getIdEstadoOrdenCompra());
            existente.setIdUsuario(datosNuevos.getIdUsuario());

            existente.setUsuarioModif(datosNuevos.getUsuarioModif());
            existente.setFechaModif(LocalDateTime.now());
            return ordenCompraRepository.save(existente);
        });
    }

    @Transactional
    public boolean eliminar(Long idOrdenCompra) {
        if (!ordenCompraRepository.existsById(idOrdenCompra)) {
            return false;
        }
        ordenCompraRepository.deleteById(idOrdenCompra);
        return true;
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
