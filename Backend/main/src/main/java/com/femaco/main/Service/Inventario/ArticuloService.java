package com.femaco.main.Service.Inventario;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.DTOs.ArticuloFiltroDTO;
import com.femaco.main.Entity.Inventario.Articulo;
import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Exception.UnauthorizedException;
import com.femaco.main.Repository.Inventario.ArticuloRepository;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;



@Service
public class ArticuloService {

    private final ArticuloRepository articuloRepository;
    private final UsuarioRepository usuarioRepository;

    public ArticuloService(ArticuloRepository articuloRepository, UsuarioRepository usuarioRepository) {
        this.articuloRepository = articuloRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<Articulo> buscarTodos() {
        return articuloRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<Articulo> buscarConFiltros(ArticuloFiltroDTO filtro, Pageable pageable) {
        return articuloRepository.findAll(
            ArticuloSpecification.conFiltros(filtro),
            pageable
        );
    }

    @Transactional
    public Articulo crear(Articulo articulo) {
        Usuario usuarioAutenticado = obtenerUsuarioAutenticado();
        LocalDateTime ahora = LocalDateTime.now();
        int usuarioActual = usuarioAutenticado.getIdUsuario().intValue();

        articulo.setIdArticulo(null);
        articulo.setStockActual(BigDecimal.ZERO);
        articulo.setFechaCreacion(ahora);
        articulo.setFechaModif(ahora);
        articulo.setUsuarioCreacion(usuarioActual);
        articulo.setUsuarioModif(usuarioActual);
        return articuloRepository.save(articulo);
    }

    @Transactional
    public Optional<Articulo> actualizar(Long idArticulo, Articulo datosNuevos) {
        Usuario usuarioAutenticado = obtenerUsuarioAutenticado();

        return articuloRepository.findById(idArticulo).map(existente -> {
            existente.setCodigo(datosNuevos.getCodigo());
            existente.setNombre(datosNuevos.getNombre());
            existente.setDescripcion(datosNuevos.getDescripcion());
            existente.setStockMinimo(datosNuevos.getStockMinimo());
            existente.setPrecioCompraUltimoProveedor(datosNuevos.getPrecioCompraUltimoProveedor());
            existente.setMargenGanancia(datosNuevos.getMargenGanancia());
            existente.setCantidadMinimaDescuento(datosNuevos.getCantidadMinimaDescuento());
            existente.setDescuentoMayorista(datosNuevos.getDescuentoMayorista());
            existente.setIdAreaArticulo(datosNuevos.getIdAreaArticulo());
            existente.setIdUnidadMedida(datosNuevos.getIdUnidadMedida());
            existente.setIdEstadoArticulo(datosNuevos.getIdEstadoArticulo());

            existente.setUsuarioModif(usuarioAutenticado.getIdUsuario().intValue());
            existente.setFechaModif(LocalDateTime.now());
            return articuloRepository.save(existente);
        });
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

    @Transactional
    public boolean eliminar(Long idArticulo) {
        if (!articuloRepository.existsById(idArticulo)) {
            return false;
        }
        articuloRepository.deleteById(idArticulo);
        return true;
    }
    
}
