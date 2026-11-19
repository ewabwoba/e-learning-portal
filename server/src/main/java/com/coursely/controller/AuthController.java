package com.coursely.controller;

import com.coursely.dto.Api.*;
import com.coursely.model.User;
import com.coursely.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED) public AuthResponse register(@Valid @RequestBody RegisterRequest r) { return auth.register(r); }
    @PostMapping("/login") public AuthResponse login(@Valid @RequestBody LoginRequest r) { return auth.login(r); }
    @GetMapping("/me") public UserView me(@AuthenticationPrincipal User u) { return auth.me(u.getId()); }
    @PutMapping("/me") public UserView update(@AuthenticationPrincipal User u, @Valid @RequestBody ProfileRequest r) { return auth.updateProfile(u.getId(), r); }
}
