package com.femaco.main.Config;

import java.io.IOException;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.femaco.main.Entity.Seguridad.Usuario;
import com.femaco.main.Repository.Seguridad.ConjuntoMenuRepository;
import com.femaco.main.Repository.Seguridad.UsuarioRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;
    private final ConjuntoMenuRepository conjuntoMenuRepository;

    public JwtAuthenticationFilter(JwtUtil jwtUtil,
                                   UsuarioRepository usuarioRepository,
                                   ConjuntoMenuRepository conjuntoMenuRepository) {
        this.jwtUtil = jwtUtil;
        this.usuarioRepository = usuarioRepository;
        this.conjuntoMenuRepository = conjuntoMenuRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtUtil.isTokenValid(token)) {
                String correo = jwtUtil.extractCorreo(token);
                Set<SimpleGrantedAuthority> authorities = obtenerAuthorities(correo);

                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(correo, null, authorities);

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    private Set<SimpleGrantedAuthority> obtenerAuthorities(String correo) {
        return usuarioRepository.findByCorreoElectronico(correo)
                .map(Usuario::getIdUsuario)
                .map(conjuntoMenuRepository::findMenuByUsuario)
                .map(this::convertirAuthorities)
                .orElseGet(LinkedHashSet::new);
    }

    private Set<SimpleGrantedAuthority> convertirAuthorities(List<MenuUsuarioProjection> filas) {
        Set<SimpleGrantedAuthority> authorities = new LinkedHashSet<>();

        for (MenuUsuarioProjection fila : filas) {
            String pagina = normalizarPagina(fila.getPagina());
            authorities.add(new SimpleGrantedAuthority("PERMISO_" + pagina + "_ACCESO"));

            if (Byte.valueOf((byte) 1).equals(fila.getAlta())) {
                authorities.add(new SimpleGrantedAuthority("PERMISO_" + pagina + "_ALTA"));
            }
            if (Byte.valueOf((byte) 1).equals(fila.getBaja())) {
                authorities.add(new SimpleGrantedAuthority("PERMISO_" + pagina + "_BAJA"));
            }
            if (Byte.valueOf((byte) 1).equals(fila.getCambio())) {
                authorities.add(new SimpleGrantedAuthority("PERMISO_" + pagina + "_CAMBIO"));
            }
        }

        return authorities;
    }

    private String normalizarPagina(String pagina) {
        String normalizada = pagina == null ? "" : pagina.trim();
        while (normalizada.startsWith("/")) {
            normalizada = normalizada.substring(1);
        }
        return normalizada.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_");
    }
    
}
