package com.femaco.main.Service.SucursalCotizacion;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Entity.SucursalCotizacion.Sucursal;
import com.femaco.main.Exception.UnauthorizedException;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;
import com.femaco.main.Repository.SucursalCotizacion.SucursalRepository;

@Service
public class SucursalService {

    private final SucursalRepository sucursalRepository;
    private final UsuarioRepository usuarioRepository;

    public SucursalService(SucursalRepository sucursalRepository, UsuarioRepository usuarioRepository) {
        this.sucursalRepository = sucursalRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<Sucursal> buscarTodos() {
        return sucursalRepository.findAll();
    }

    @Transactional
    public Sucursal crear(Sucursal sucursal) {
        Usuario usuarioAutenticado = obtenerUsuarioAutenticado();
        LocalDateTime ahora = LocalDateTime.now();
        int usuarioActual = usuarioAutenticado.getIdUsuario().intValue();

        sucursal.setIdSucursal(null);
        sucursal.setFechaCreacion(ahora);
        sucursal.setFechaModif(ahora);
        sucursal.setUsuarioCreacion(usuarioActual);
        sucursal.setUsuarioModif(usuarioActual);
        return sucursalRepository.save(sucursal);
    }

    @Transactional
    public Optional<Sucursal> actualizar(Long idSucursal, Sucursal datosNuevos) {
        Usuario usuarioAutenticado = obtenerUsuarioAutenticado();

        return sucursalRepository.findById(idSucursal).map(existente -> {
            existente.setNombre(datosNuevos.getNombre());
            existente.setDireccion(datosNuevos.getDireccion());
            existente.setTelefono(datosNuevos.getTelefono());
            existente.setFelNitEmisor(datosNuevos.getFelNitEmisor());
            existente.setFelNombreEmisor(datosNuevos.getFelNombreEmisor());
            existente.setFelNombreComercial(datosNuevos.getFelNombreComercial());
            existente.setFelCorreoEmisor(datosNuevos.getFelCorreoEmisor());
            existente.setFelCodigoEstablecimiento(datosNuevos.getFelCodigoEstablecimiento());
            existente.setFelAfiliacionIva(datosNuevos.getFelAfiliacionIva());
            existente.setFelDireccion(datosNuevos.getFelDireccion());
            existente.setFelCodigoPostal(datosNuevos.getFelCodigoPostal());
            existente.setFelMunicipio(datosNuevos.getFelMunicipio());
            existente.setFelDepartamento(datosNuevos.getFelDepartamento());
            existente.setFelPais(datosNuevos.getFelPais());
            existente.setFelTipoFrase(datosNuevos.getFelTipoFrase());
            existente.setFelCodigoEscenario(datosNuevos.getFelCodigoEscenario());

            existente.setUsuarioModif(usuarioAutenticado.getIdUsuario().intValue());
            existente.setFechaModif(LocalDateTime.now());
            return sucursalRepository.save(existente);
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
    public boolean eliminar(Long idSucursal) {
        if (!sucursalRepository.existsById(idSucursal)) {
            return false;
        }
        sucursalRepository.deleteById(idSucursal);
        return true;
    }
    
}
