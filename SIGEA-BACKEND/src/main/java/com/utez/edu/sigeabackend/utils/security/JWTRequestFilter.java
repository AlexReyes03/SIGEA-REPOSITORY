package com.utez.edu.sigeabackend.utils.security;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JWTRequestFilter extends OncePerRequestFilter {

    @Autowired
    private CustomUserDetailsService userDetailsService;
    @Autowired
    private JWTUtil jwtUtil;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }
        
        final String authHeader = request.getHeader("Authorization");
        String username = null, jwt = null;

        System.out.println("=== JWT FILTER DEBUG ===");
        System.out.println("Auth Header: " + (authHeader != null ? "PRESENT (" + authHeader.length() + " chars)" : "NULL"));

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            System.out.println("JWT Token: " + (!jwt.isEmpty() ? "EXTRACTED (" + jwt.length() + " chars)" : "EMPTY"));
            try {
                username = jwtUtil.extractUsername(jwt);
                System.out.println("Username extracted: " + username);
            } catch (ExpiredJwtException ex) {
                System.out.println("JWT EXPIRED: " + ex.getMessage());
            } catch (io.jsonwebtoken.security.SignatureException ex) {
                System.out.println("JWT SIGNATURE ERROR: " + ex.getMessage());
            } catch (Exception ex) {
                System.out.println("JWT OTHER ERROR: " + ex.getClass().getSimpleName() + " - " + ex.getMessage());
            }
        } else {
            System.out.println("No Bearer token found");
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            System.out.println("Attempting to authenticate user: " + username);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (jwtUtil.validateToken(jwt, userDetails)) {
                System.out.println("Token validation SUCCESS");
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities()
                        );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } else {
                System.out.println("Token validation FAILED");
            }
        }
        System.out.println("========================");
        chain.doFilter(request, response);
    }
}
