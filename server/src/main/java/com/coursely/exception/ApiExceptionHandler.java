package com.coursely.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import java.util.LinkedHashMap;
import java.util.Map;

/** One consistent JSON error shape: {status, message, fields?}. The React client reads `message` and `fields`. */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, Object>> status(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("status", e.getStatusCode().value(), "message", e.getReason() == null ? "Request failed." : e.getReason()));
    }

    /** Thrown by @PreAuthorize checks. Without this the catch-all below would turn a permission failure into a 500. */
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Map<String, Object>> denied(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("status", 403, "message", "You do not have access to this area."));
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<Map<String, Object>> unauthenticated(AuthenticationException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("status", 401, "message", "Please sign in to continue."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> invalid(MethodArgumentNotValidException e) {
        Map<String, String> fields = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("status", 400, "message", "Please check the highlighted fields.", "fields", fields));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> unexpected(Exception e) {
        // Framework errors (malformed JSON, unknown route, wrong method) keep their own 4xx status.
        if (e instanceof org.springframework.web.ErrorResponse er)
            return ResponseEntity.status(er.getStatusCode()).body(Map.of("status", er.getStatusCode().value(), "message", "The request could not be processed."));
        if (e instanceof org.springframework.http.converter.HttpMessageNotReadableException)
            return ResponseEntity.badRequest().body(Map.of("status", 400, "message", "The request body is not valid."));
        // Details are intentionally not leaked to the client.
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("status", 500, "message", "Something went wrong. Please try again."));
    }
}
