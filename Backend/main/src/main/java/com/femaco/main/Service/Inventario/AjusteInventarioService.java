package com.femaco.main.Service.Inventario;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.DTOs.AjusteInventarioFiltroDTO;
import com.femaco.main.DTOs.AjusteInventarioRequestDTO;
import com.femaco.main.Entity.Inventario.AjusteInventario;
import com.femaco.main.Entity.Inventario.Articulo;
import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Exception.BusinessException;
import com.femaco.main.Exception.ResourceNotFoundException;
import com.femaco.main.Exception.UnauthorizedException;
import com.femaco.main.Repository.Inventario.AjusteInventarioRepository;
import com.femaco.main.Repository.Inventario.ArticuloRepository;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;

@Service
public class AjusteInventarioService {

    private final AjusteInventarioRepository ajusteInventarioRepository;
    private final ArticuloRepository articuloRepository;
    private final UsuarioRepository usuarioRepository;

    public AjusteInventarioService(AjusteInventarioRepository ajusteInventarioRepository,
                                  ArticuloRepository articuloRepository,
                                  UsuarioRepository usuarioRepository) {
        this.ajusteInventarioRepository = ajusteInventarioRepository;
        this.articuloRepository = articuloRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<AjusteInventario> buscarTodos() {
        return ajusteInventarioRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<AjusteInventario> buscarConFiltros(AjusteInventarioFiltroDTO filtro, Pageable pageable) {
        return ajusteInventarioRepository.findAll(
            AjusteInventarioSpecification.conFiltros(filtro),
            pageable
        );
    }

    @Transactional
    public AjusteInventario crear(AjusteInventarioRequestDTO dto) {
        if (dto == null) {
            throw new BusinessException("La solicitud no puede ser nula.");
        }

        if (dto.getCantidad() == null || dto.getCantidad().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El campo cantidad debe ser mayor que cero.");
        }

        if (dto.getIdArticulo() == null) {
            throw new BusinessException("El campo idArticulo es obligatorio.");
        }

        boolean agregar = Boolean.TRUE.equals(dto.getAgregar());
        boolean quitar = Boolean.TRUE.equals(dto.getQuitar());

        if (agregar && quitar) {
            throw new BusinessException("Los campos agregar y quitar no pueden estar activos al mismo tiempo.");
        }

        if (!agregar && !quitar) {
            throw new BusinessException("Debe indicar si es un ajuste de agregar o quitar.");
        }

        Usuario usuarioAutenticado = obtenerUsuarioAutenticado();

        Articulo articulo = articuloRepository.findById(dto.getIdArticulo())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe el artículo con idArticulo " + dto.getIdArticulo() + "."));

        if (articulo.getIdEstadoArticulo() == null || !Long.valueOf(1L).equals(articulo.getIdEstadoArticulo())) {
            throw new BusinessException(
                    "No se puede realizar el ajuste porque el artículo con idArticulo " + dto.getIdArticulo()
                            + " no está activo."
            );
        }

        BigDecimal cantidadAbs = dto.getCantidad().abs();

        if (quitar && articulo.getStockActual().compareTo(cantidadAbs) < 0) {
            throw new BusinessException(
                    "No se puede quitar " + cantidadAbs + " del artículo " + dto.getIdArticulo()
                            + " porque el stock actual es " + articulo.getStockActual() + "."
            );
        }

        BigDecimal cantidadAjuste = agregar ? cantidadAbs : cantidadAbs.negate();

        LocalDateTime ahora = LocalDateTime.now();
        int usuarioActual = usuarioAutenticado.getIdUsuario().intValue();

        AjusteInventario ajusteInventario = new AjusteInventario();
        ajusteInventario.setIdAjusteInventario(null);
        ajusteInventario.setCantidadAjuste(cantidadAjuste);
        ajusteInventario.setMotivo(dto.getMotivo());
        ajusteInventario.setFechaCreacion(ahora);
        ajusteInventario.setFechaModif(ahora);
        ajusteInventario.setUsuarioCreacion(usuarioActual);
        ajusteInventario.setUsuarioModif(usuarioActual);
        ajusteInventario.setIdArticulo(dto.getIdArticulo());
        ajusteInventario.setIdUsuario(usuarioAutenticado.getIdUsuario());

        articulo.setStockActual(agregar
                ? articulo.getStockActual().add(cantidadAbs)
                : articulo.getStockActual().subtract(cantidadAbs));
        articulo.setFechaModif(ahora);
        articulo.setUsuarioModif(usuarioActual);

        articuloRepository.save(articulo);
        return ajusteInventarioRepository.save(ajusteInventario);
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
/* 
    @Transactional
    public Optional<AjusteInventario> actualizar(Long idAjusteInventario, AjusteInventario datosNuevos) {
        return ajusteInventarioRepository.findById(idAjusteInventario).map(existente -> {
            existente.setCantidadAjuste(datosNuevos.getCantidadAjuste());
            existente.setMotivo(datosNuevos.getMotivo());
            existente.setIdArticulo(datosNuevos.getIdArticulo());
            existente.setIdUsuario(datosNuevos.getIdUsuario());

            existente.setUsuarioModif(datosNuevos.getUsuarioModif());
            existente.setFechaModif(LocalDateTime.now());
            return ajusteInventarioRepository.save(existente);
        });
    }

    @Transactional
    public boolean eliminar(Long idAjusteInventario) {
        if (!ajusteInventarioRepository.existsById(idAjusteInventario)) {
            return false;
        }
        ajusteInventarioRepository.deleteById(idAjusteInventario);
        return true;
    }
    */
}
