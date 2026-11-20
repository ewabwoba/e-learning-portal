package com.coursely.service;

import com.coursely.dto.Api.*;
import com.coursely.model.Role;
import com.coursely.model.User;
import com.coursely.model.UserStatus;
import com.coursely.repository.UserRepository;
import com.coursely.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) { this.users = users; this.encoder = encoder; this.jwt = jwt; }

    public static UserView view(User u) { return new UserView(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.getHeadline(), u.getStatus().name(), u.getApproval().name(), u.getApprovalNote()); }

    @Transactional
    public AuthResponse register(RegisterRequest r) {
        if (users.existsByEmailIgnoreCase(r.email().trim()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        // Only STUDENT and INSTRUCTOR can be self-selected; ADMIN accounts are created by seeding, bootstrap or another admin.
        Role role = "INSTRUCTOR".equalsIgnoreCase(r.role()) ? Role.INSTRUCTOR : Role.STUDENT;
        User u = users.save(new User(r.name().trim(), r.email().trim(), encoder.encode(r.password()), role));
        return new AuthResponse(jwt.issue(u), view(u));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest r) {
        // Same message for unknown email and wrong password so accounts cannot be enumerated.
        User u = users.findByEmailIgnoreCase(r.email().trim())
            .filter(x -> encoder.matches(r.password(), x.getPasswordHash()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "That email and password do not match."));
        if (u.getStatus() == UserStatus.SUSPENDED) // checked after the password so it cannot be used to probe for accounts
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account has been suspended. Please contact support.");
        return new AuthResponse(jwt.issue(u), view(u));
    }

    @Transactional
    public UserView updateProfile(Long id, ProfileRequest r) {
        User u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to continue."));
        u.setName(r.name().trim()); u.setHeadline(r.headline());
        return view(u);
    }

    @Transactional(readOnly = true)
    public UserView me(Long id) {
        return view(users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to continue.")));
    }
}
