package com.coursely.controller;

import com.coursely.config.MpesaProperties;
import com.coursely.dto.Api.*;
import com.coursely.model.User;
import com.coursely.service.PaymentService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService payments;
    private final MpesaProperties props;
    public PaymentController(PaymentService payments, MpesaProperties props) { this.payments = payments; this.props = props; }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public PaymentView start(@AuthenticationPrincipal User u, @Valid @RequestBody PayRequest r) { return payments.start(u, r.courseId(), r.phone()); }

    @GetMapping("/{id}")
    public PaymentView status(@AuthenticationPrincipal User u, @PathVariable Long id) { return payments.status(u, id); }

    /** Called by Safaricom, not by a logged-in user. The secret in the URL is the only thing proving it is them. */
    @PostMapping("/mpesa/callback/{secret}")
    public Map<String, Object> callback(@PathVariable String secret, @RequestBody JsonNode body) {
        String expected = props.getCallbackSecret();
        if (expected == null || expected.isBlank() || !MessageDigest.isEqual(secret.getBytes(StandardCharsets.UTF_8), expected.getBytes(StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        payments.handleCallback(body);
        return Map.of("ResultCode", 0, "ResultDesc", "Accepted");
    }
}