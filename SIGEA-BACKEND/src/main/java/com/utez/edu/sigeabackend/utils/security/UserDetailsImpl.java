package com.utez.edu.sigeabackend.utils.security;

import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UserDetailsImpl implements UserDetails {

    private final Long id;
    private final String username;
    private final String password;
    private final boolean active;
    private final List<GrantedAuthority> authorities;

    public UserDetailsImpl(UserEntity user) {
        this.id         = user.getId();
        this.username   = user.getEmail();
        this.password   = user.getPassword();
        this.active     = user.getStatus() == UserEntity.Status.ACTIVE;
        this.authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().getRoleName())
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override public String getPassword()     { return password; }
    @Override public String getUsername()     { return username; }
    @Override public boolean isAccountNonExpired()    { return active; }
    @Override public boolean isAccountNonLocked()     { return active; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
    @Override public boolean isEnabled()              { return active; }

    public Long getId() { return id; }
}