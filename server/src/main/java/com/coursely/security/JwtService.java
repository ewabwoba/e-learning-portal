package com.coursely.security;

import com.coursely.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {
    private final SecretKey key;
    private final Duration ttl;

    public JwtService(@Value("${coursely.jwt.secret}") String secret, @Value("${coursely.jwt.ttl-minutes:120}") long ttlMinutes) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) throw new IllegalStateException("coursely.jwt.secret must be at least 32 characters (set JWT_SECRET).");
        this.key = Keys.hmacShaKeyFor(bytes);
        this.ttl = Duration.ofMinutes(ttlMinutes);
    }

    public String issue(User user) {
        Date now = new Date();
        return Jwts.builder().subject(user.getEmail()).claim("uid", user.getId()).claim("role", user.getRole().name())
                .issuedAt(now).expiration(new Date(now.getTime() + ttl.toMillis())).signWith(key).compact();
    }

    /** Returns the subject (email) of a valid, unexpired token. */
    public Optional<String> verify(String token) {
        try {
            Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return Optional.ofNullable(c.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
