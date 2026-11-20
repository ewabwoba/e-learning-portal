package com.coursely.security;

import com.coursely.model.Permission;
import com.coursely.model.UserStatus;
import com.coursely.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Reads "Authorization: Bearer <jwt>", reloads the user from the database on every request (so role changes and suspensions
 * take effect immediately, even for tokens already issued) and grants ROLE_x plus one authority per permission.
 * Suspended users are treated as anonymous.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final UserRepository users;

    public JwtAuthFilter(JwtService jwt, UserRepository users) { this.jwt = jwt; this.users = users; }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        String h = req.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ") && SecurityContextHolder.getContext().getAuthentication() == null) {
            jwt.verify(h.substring(7)).flatMap(users::findByEmailIgnoreCase).filter(u -> u.getStatus() == UserStatus.ACTIVE).ifPresent(u -> {
                List<GrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_" + u.getRole().name()));
                for (Permission p : Permission.of(u.getRole())) authorities.add(new SimpleGrantedAuthority(p.name()));
                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(u, null, authorities));
            });
        }
        chain.doFilter(req, res);
    }
}
