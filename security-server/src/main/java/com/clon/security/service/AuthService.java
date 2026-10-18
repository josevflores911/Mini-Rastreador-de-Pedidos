package com.clon.security.service;

import com.clon.security.config.JwtTokenProvider;
import com.clon.security.entity.User;
import com.clon.security.entity.dto.LoginRequest;
import com.clon.security.entity.dto.LoginResponse;
import com.clon.security.entity.dto.RegisterRequest;
import com.clon.security.entity.dto.VerifyResponse;
import com.clon.security.exception.UnauthorizedException;
import com.clon.security.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public LoginResponse login(LoginRequest request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            throw new UnauthorizedException("Credenciais inválidas.");
        }

        String username = request.getUsername().trim().toLowerCase();
        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new UnauthorizedException("Credenciais inválidas."));

        if (!user.isEnabled() || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Credenciais inválidas.");
        }

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "USER";
        String token = jwtTokenProvider.generateToken(user.getUsername(), role);

        return LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(role)
                .expiresIn(jwtTokenProvider.getExpirationSeconds())
                .build();
    }

    public User register(RegisterRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String username = request.getUsername() != null && !request.getUsername().isBlank()
                ? request.getUsername().trim().toLowerCase()
                : email;

        if (email.isBlank() || request.getPassword() == null || request.getPassword().length() < 8) {
            throw new IllegalArgumentException("Dados de cadastro inválidos.");
        }

        if (userRepository.existsByUsername(username) || userRepository.existsByEmail(email)) {
            throw new IllegalStateException("Não foi possível concluir o cadastro.");
        }

        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        user.setEnabled(true);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        return userRepository.save(user);
    }

    public VerifyResponse verify(String username, String role) {
        return new VerifyResponse(username, role);
    }
}