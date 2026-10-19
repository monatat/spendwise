
package com.spendwise.backend.service;

import com.spendwise.backend.model.User;
import com.spendwise.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
}

    public User register(String name, String email, String password) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException(
                    "Password must contain at least 8 characters");
        }

        String normalizedEmail = email.trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException(
                    "An account with this email already exists");
        }

        User user = new User(
                name.trim(),
                normalizedEmail,
                passwordEncoder.encode(password)
        );

        return userRepository.save(user);
    }
    
public User login(String email, String password) {
    if (email == null || email.isBlank()
            || password == null || password.isBlank()) {
        throw new IllegalArgumentException(
                "Email and password are required");
    }

    String normalizedEmail = email.trim().toLowerCase();

    User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new IllegalArgumentException(
                    "Invalid email or password"));

    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
        throw new IllegalArgumentException(
                "Invalid email or password");
    }

    return user;
}

}
