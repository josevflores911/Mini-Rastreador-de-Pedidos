package com.clon.security.service;

import com.clon.security.config.CustomUserDetails;
import com.clon.security.entity.User;
import com.clon.security.repositories.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));

        String role = user.getRole();
        if (role == null || role.isBlank()) {
            role = "USER";
        }
        String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase();

        return new CustomUserDetails(user, Collections.singletonList(new SimpleGrantedAuthority(authority)));
    }
}