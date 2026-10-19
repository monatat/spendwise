
package com.spendwise.backend.controller;

import com.spendwise.backend.dto.AuthResponse;
import com.spendwise.backend.dto.LoginRequest;
import com.spendwise.backend.dto.LoginResponse;
import com.spendwise.backend.dto.RegisterRequest;
import com.spendwise.backend.model.User;
import com.spendwise.backend.service.AuthService;
import com.spendwise.backend.service.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(
            AuthService authService,
            JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@RequestBody RegisterRequest request) {
        User user = authService.register(
                request.getName(),
                request.getEmail(),
                request.getPassword()
        );

        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail()
        );
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        User user = authService.login(
                request.getEmail(),
                request.getPassword()
        );

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail()
        );

        return new LoginResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                token
        );
    }
}
