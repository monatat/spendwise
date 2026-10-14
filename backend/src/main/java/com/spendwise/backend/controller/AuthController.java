
package com.spendwise.backend.controller;

import com.spendwise.backend.dto.AuthResponse;
import com.spendwise.backend.dto.RegisterRequest;
import com.spendwise.backend.model.User;
import com.spendwise.backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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
}
