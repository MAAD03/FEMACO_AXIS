package com.femaco.main.Service.Seguridad;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.femaco.main.Config.MenuUsuarioProjection;
import com.femaco.main.DTOs.MenuDto;
import com.femaco.main.DTOs.ModuloMenuDto;
import com.femaco.main.DTOs.OpcionDto;
import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Repository.Seguridad.ConjuntoMenuRepository;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ConjuntoMenuService {
    private final ConjuntoMenuRepository conjuntoMenuRepository;
    private final UsuarioRepository usuarioRepository;
    
    public List<ModuloMenuDto> obtenerMenuDelUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() 
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }

        String correo = authentication.getName();

        Usuario usuario = usuarioRepository.findByCorreoElectronico(correo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        List<MenuUsuarioProjection> filas = conjuntoMenuRepository.findMenuByUsuario(usuario.getIdUsuario());

        return construirEstructura(filas);
    }

    private List<ModuloMenuDto> construirEstructura(List<MenuUsuarioProjection> filas) {
        Map<Integer, ModuloMenuDto> modulosMap = new LinkedHashMap<>();

        for (MenuUsuarioProjection fila : filas) {
            ModuloMenuDto modulo = modulosMap.computeIfAbsent(fila.getIdModulo(), id -> {
                ModuloMenuDto m = new ModuloMenuDto();
                m.setIdModulo(fila.getIdModulo());
                m.setNombre(fila.getNombreModulo());
                m.setOrdenMenu(fila.getOrdenModulo());
                return m;
            });

            MenuDto menu = modulo.getMenus().stream()
                    .filter(m -> m.getIdMenu().equals(fila.getIdMenu()))
                    .findFirst()
                    .orElseGet(() -> {
                        MenuDto nuevo = new MenuDto();
                        nuevo.setIdMenu(fila.getIdMenu());
                        nuevo.setNombre(fila.getNombreMenu());
                        nuevo.setOrdenMenu(fila.getOrdenMenu());
                        modulo.getMenus().add(nuevo);
                        return nuevo;
                    });

            OpcionDto opcion = new OpcionDto();
            opcion.setIdOpcion(fila.getIdOpcion());
            opcion.setNombre(fila.getNombreOpcion());
            opcion.setOrdenMenu(fila.getOrdenOpcion());
            opcion.setPagina(fila.getPagina());
            opcion.setAlta(fila.getAlta() != null && fila.getAlta() == 1);
            opcion.setBaja(fila.getBaja() != null && fila.getBaja() == 1);
            opcion.setCambio(fila.getCambio() != null && fila.getCambio() == 1);
            menu.getOpciones().add(opcion);
        }

        return new ArrayList<>(modulosMap.values());
    }
}
