package com.femaco.main.Service.Ventas;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Entity.Ventas.Pedido;
import com.femaco.main.Exception.BusinessException;
import com.femaco.main.Exception.UnauthorizedException;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;
import com.femaco.main.Repository.Ventas.PedidoRepository;

@Service
public class PedidoService {

    private static final Long ESTADO_PENDIENTE = 1L;

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;

    public PedidoService(PedidoRepository pedidoRepository, UsuarioRepository usuarioRepository) {
        this.pedidoRepository = pedidoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public Page<Pedido> buscarTodos(Pageable pageable) {
        return pedidoRepository.findAll(pageable);
    }

    @Transactional
    public Pedido crear(Pedido pedido) {
        if (pedido.getFechaEntrega() == null) {
            throw new BusinessException("La fecha de entrega es obligatoria");
        }
        if (!pedido.getFechaEntrega().isAfter(LocalDate.now())) {
            throw new BusinessException("La fecha de entrega debe ser posterior a la fecha actual");
        }

        Usuario usuarioAutenticado = obtenerUsuarioAutenticado();
        int usuarioActual = usuarioAutenticado.getIdUsuario().intValue();
        LocalDateTime ahora = LocalDateTime.now();
        pedido.setIdPedido(null);
        pedido.setIdEstadoPedido(ESTADO_PENDIENTE);
        pedido.setFechaCreacion(ahora);
        pedido.setUsuarioCreacion(usuarioActual);
        pedido.setFechaModif(ahora);
        pedido.setUsuarioModif(usuarioActual);
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Optional<Pedido> actualizar(Long idPedido, Pedido datosNuevos) {
        return pedidoRepository.findById(idPedido).map(existente -> {
            existente.setFechaEntrega(datosNuevos.getFechaEntrega());
            existente.setDireccionEntrega(datosNuevos.getDireccionEntrega());
            existente.setNotasEntrega(datosNuevos.getNotasEntrega());
            existente.setNumeroEntrega(datosNuevos.getNumeroEntrega());
            existente.setIdVenta(datosNuevos.getIdVenta());
            existente.setIdEstadoPedido(datosNuevos.getIdEstadoPedido());

            existente.setUsuarioModif(datosNuevos.getUsuarioModif());
            existente.setFechaModif(LocalDateTime.now());
            return pedidoRepository.save(existente);
        });
    }

    @Transactional
    public boolean eliminar(Long idPedido) {
        if (!pedidoRepository.existsById(idPedido)) {
            return false;
        }
        pedidoRepository.deleteById(idPedido);
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
